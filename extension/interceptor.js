(function () {
    console.log("🛡️ AI Sanitizer Interceptor v3.2 загружается...");

    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    let requestIdCounter = 0;
    const pendingRequests = new Map();

    /**
     * Показывает диалог пользователю и ждет его решения
     */
    async function askUserPermission(fileName, fileContent, findings) {
        return new Promise((resolve) => {
            const requestId = `req_${requestIdCounter++}`;

            pendingRequests.set(requestId, resolve);

            const resultHandler = (event) => {
                if (event.detail.requestId === requestId) {
                    window.removeEventListener('sanitizer:dialogResult', resultHandler);
                    pendingRequests.delete(requestId);
                    resolve(event.detail.result);
                }
            };

            window.addEventListener('sanitizer:dialogResult', resultHandler);

            const readyHandler = (event) => {
                if (event.detail.requestId === requestId) {
                    window.removeEventListener('sanitizer:showDialogReady', readyHandler);

                    if (window.SanitizerDialog) {
                        window.SanitizerDialog.show(fileName, fileContent, findings)
                            .then(result => {
                                const resultEvent = new CustomEvent('sanitizer:dialogResult', {
                                    detail: { requestId, result }
                                });
                                window.dispatchEvent(resultEvent);
                            })
                            .catch(error => {
                                console.error('Ошибка диалога:', error);
                                const resultEvent = new CustomEvent('sanitizer:dialogResult', {
                                    detail: { requestId, result: { action: 'cancel' } }
                                });
                                window.dispatchEvent(resultEvent);
                            });
                    }
                }
            };

            window.addEventListener('sanitizer:showDialogReady', readyHandler);

            const showEvent = new CustomEvent('sanitizer:showDialog', {
                detail: { requestId, fileName, fileContent, findings }
            });
            window.dispatchEvent(showEvent);

            setTimeout(() => {
                if (pendingRequests.has(requestId)) {
                    console.warn('🛡️ Таймаут ожидания ответа пользователя');
                    window.removeEventListener('sanitizer:dialogResult', resultHandler);
                    window.removeEventListener('sanitizer:showDialogReady', readyHandler);
                    pendingRequests.delete(requestId);
                    resolve({ action: 'cancel' });
                }
            }, 60000);
        });
    }

    /**
     * Обрабатывает файл и запрашивает разрешение пользователя
     */
    async function processFile(file) {
        const fileName = file.name || "неизвестный файл";

        console.log(`🛡️ 🔍 Проверка файла: "${fileName}", размер: ${file.size} байт, тип: ${file.type}`);

        try {
            const fileContent = await file.text();
            console.log(`🛡️ ✓ Содержимое прочитано, длина: ${fileContent.length} символов`);

            if (!window.SensitiveDataDetector) {
                console.warn('🛡️ ⚠️ Детектор не загружен, пропускаем файл');
                return file;
            }

            const findings = window.SensitiveDataDetector.analyze(fileContent);
            console.log(`🛡️ 📊 Анализ завершен, найдено элементов: ${findings.length}`);

            if (findings.length === 0) {
                console.log(`🛡️ ✅ Файл "${fileName}" чист - нет чувствительных данных`);
                return file;
            }

            console.warn(`🛡️ ⚠️ В файле "${fileName}" найдено ${findings.length} потенциально чувствительных элементов!`, findings);

            const userDecision = await askUserPermission(fileName, fileContent, findings);
            console.log('🛡️ 👤 Решение пользователя:', userDecision.action);

            switch (userDecision.action) {
                case 'cancel':
                    console.log('🛡️ ❌ Загрузка ОТМЕНЕНА пользователем');
                    throw new Error('Загрузка файла отменена пользователем');

                case 'proceed':
                    console.warn('🛡️ ⚡ Файл загружается БЕЗ ИЗМЕНЕНИЙ (пользователь разрешил)');
                    return file;

                case 'replace':
                    const cleanedContent = window.SensitiveDataDetector.replace(
                        fileContent,
                        userDecision.replacements,
                        userDecision.findings
                    );

                    console.log('🛡️ ✅ Чувствительные данные ЗАМЕНЕНЫ');
                    return new File([cleanedContent], fileName, { type: file.type });

                default:
                    console.warn('🛡️ ⚠️ Неизвестное действие:', userDecision.action);
                    return file;
            }

        } catch (error) {
            if (error.message.includes('отменена пользователем')) {
                throw error;
            }

            console.error('🛡️ ❌ Ошибка при обработке файла:', error);
            return file;
        }
    }

    /**
     * Обрабатывает FormData и проверяет файлы
     */
    async function processFormData(formData) {
        console.log('🛡️ 📦 Обнаружен FormData, проверяем содержимое...');

        const newFormData = new FormData();
        let hasFiles = false;
        let fileCount = 0;

        for (const [key, value] of formData.entries()) {
            console.log(`🛡️   - элемент: ключ="${key}", тип=${value.constructor.name}`);

            if (value instanceof File) {
                hasFiles = true;
                fileCount++;
                console.log(`🛡️   📄 Найден File: "${value.name}"`);

                try {
                    const processedFile = await processFile(value);
                    newFormData.append(key, processedFile);
                } catch (error) {
                    if (error.message.includes('отменена пользователем')) {
                        throw error;
                    }
                    console.warn('🛡️ ⚠️ Ошибка обработки, используем оригинал');
                    newFormData.append(key, value);
                }
            } else if (value instanceof Blob) {
                hasFiles = true;
                fileCount++;
                console.log(`🛡️   📄 Найден Blob, размер: ${value.size}`);

                try {
                    const tempFile = new File([value], 'blob', { type: value.type });
                    const processedFile = await processFile(tempFile);
                    newFormData.append(key, processedFile);
                } catch (error) {
                    if (error.message.includes('отменена пользователем')) {
                        throw error;
                    }
                    newFormData.append(key, value);
                }
            } else {
                newFormData.append(key, value);
            }
        }

        console.log(`🛡️ 📊 Обработано файлов: ${fileCount}`);
        return { newFormData, hasFiles };
    }

    /**
     * Перехват FETCH
     */
    window.fetch = async function (...args) {
        let [resource, config] = args;

        console.log('🛡️ 🌐 fetch() перехвачен:', resource);

        if (config && config.body && config.body instanceof FormData) {
            console.log('🛡️ 📦 fetch с FormData обнаружен!');

            try {
                const { newFormData, hasFiles } = await processFormData(config.body);

                if (hasFiles) {
                    config.body = newFormData;

                    if (config.headers) {
                        if (config.headers instanceof Headers) {
                            config.headers.delete('content-type');
                            config.headers.delete('Content-Type');
                        } else if (typeof config.headers === 'object') {
                            delete config.headers['content-type'];
                            delete config.headers['Content-Type'];
                        }
                    }
                }
            } catch (error) {
                if (error.message.includes('отменена пользователем')) {
                    console.log('🛡️ ❌ fetch запрос ОТМЕНЕН пользователем');
                    return Promise.reject(error);
                }
                console.warn('🛡️ ⚠️ Ошибка обработки FormData, продолжаем с оригиналом');
            }
        }

        return originalFetch(resource, config);
    };

    /**
     * Перехват XMLHttpRequest (используется многими AI-сайтами!)
     */
    XMLHttpRequest.prototype.open = function (...args) {
        console.log('🛡️ 🌐 XHR.open() перехвачен:', args[0], args[1]);
        this._sanitizer_method = args[0];
        this._sanitizer_url = args[1];
        return originalXHROpen.apply(this, args);
    };

    XMLHttpRequest.prototype.send = function (body) {
        console.log('🛡️ 📤 XHR.send() перехвачен, тип body:', body ? body.constructor.name : 'null');

        // Обработка FormData (DeepSeek)
        if (body && body instanceof FormData) {
            console.log('🛡️ 📦 XHR с FormData обнаружен!');

            processFormData(body).then(({ newFormData, hasFiles }) => {
                if (hasFiles) {
                    console.log('🛡️ ✓ Отправляем обработанный FormData через XHR');
                    originalXHRSend.call(this, newFormData);
                } else {
                    originalXHRSend.call(this, body);
                }
            }).catch(error => {
                if (error.message.includes('отменена пользователем')) {
                    console.log('🛡️ ❌ XHR запрос ОТМЕНЕН пользователем');
                    this.abort();
                } else {
                    console.warn('🛡️ ⚠️ Ошибка обработки, отправляем оригинал');
                    originalXHRSend.call(this, body);
                }
            });

            return;
        }

        // Обработка File (ChatGPT отправляет файлы напрямую!)
        if (body && body instanceof File) {
            console.log('🛡️ 📄 XHR с File обнаружен! (ChatGPT mode)');

            processFile(body).then(processedFile => {
                console.log('🛡️ ✓ Отправляем обработанный File через XHR');
                originalXHRSend.call(this, processedFile);
            }).catch(error => {
                if (error.message.includes('отменена пользователем')) {
                    console.log('🛡️ ❌ XHR запрос ОТМЕНЕН пользователем');
                    this.abort();
                } else {
                    console.warn('🛡️ ⚠️ Ошибка обработки, отправляем оригинал');
                    originalXHRSend.call(this, body);
                }
            });

            return;
        }

        // Обработка Blob (на всякий случай)
        if (body && body instanceof Blob && !(body instanceof File)) {
            console.log('🛡️ 📄 XHR с Blob обнаружен!');

            const tempFile = new File([body], 'blob', { type: body.type });
            processFile(tempFile).then(processedFile => {
                console.log('🛡️ ✓ Отправляем обработанный Blob через XHR');
                originalXHRSend.call(this, processedFile);
            }).catch(error => {
                if (error.message.includes('отменена пользователем')) {
                    console.log('🛡️ ❌ XHR запрос ОТМЕНЕН пользователем');
                    this.abort();
                } else {
                    console.warn('🛡️ ⚠️ Ошибка обработки, отправляем оригинал');
                    originalXHRSend.call(this, body);
                }
            });

            return;
        }

        return originalXHRSend.call(this, body);
    };

    console.log("🛡️ ✅ AI Sanitizer Interceptor v3.2 АКТИВЕН (fetch + XMLHttpRequest + File)");
    console.log("🛡️ 📡 Мониторинг всех загрузок файлов...");
})();
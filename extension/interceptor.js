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
     * Checks if a file extension is in the scanned list.
     * Returns true if the file should be scanned.
     * Uses postMessage to cross page/content-script boundary.
     */
    async function shouldScanFile(filename) {
        try {
            const reqId = 'extCheck_' + (requestIdCounter++);
            const settingsPromise = new Promise((resolve) => {
                const handler = (event) => {
                    if (event.source !== window) return;
                    if (event.data && event.data.type === 'NOLEX_FILE_EXT_SETTINGS_RESULT' && event.data.reqId === reqId) {
                        window.removeEventListener('message', handler);
                        resolve(event.data.settings);
                    }
                };
                window.addEventListener('message', handler);
                setTimeout(() => {
                    window.removeEventListener('message', handler);
                    resolve(null);
                }, 1000);
            });
            window.postMessage({ type: 'NOLEX_FILE_EXT_SETTINGS_REQ', reqId }, '*');
            const settings = await settingsPromise;

            if (!settings || !settings.enabled) return true; // No settings = scan everything
            const dotIdx = filename.lastIndexOf('.');
            if (dotIdx === -1) return true; // No extension = scan
            const ext = filename.substring(dotIdx).toLowerCase();
            return settings.enabled.includes(ext);
        } catch (e) {
            return true; // On error, scan everything
        }
    }

    /**
     * Обрабатывает файл и запрашивает разрешение пользователя
     */
    async function processFile(file) {
        const fileName = file.name || "unknown file";

        console.log(`🛡️ 🔍 Проверка файла: "${fileName}", размер: ${file.size} байт, тип: ${file.type}`);

        // Check file extension against settings
        if (!(await shouldScanFile(fileName))) {
            console.log(`🛡️ ⏭️ Файл "${fileName}" пропущен (расширение не в списке сканирования)`);
            return file;
        }

        try {
            // Determine if file is PDF and extract text accordingly
            let fileContent;
            const isPdf = window.NolexPDF && window.NolexPDF.isPdf(file);

            if (isPdf) {
                console.log('📄 PDF file detected, extracting text...');
                const arrayBuffer = await file.arrayBuffer();
                fileContent = await window.NolexPDF.extractText(arrayBuffer);
            } else {
                fileContent = await file.text();
            }

            console.log(`🛡️ ✓ Содержимое прочитано, длина: ${fileContent.length} символов`);

            if (!window.SensitiveDataDetector) {
                console.warn('🛡️ ⚠️ Детектор не загружен, пропускаем файл');
                return file;
            }

            let findings = window.SensitiveDataDetector.analyze(fileContent);

            // Structured data analysis — detect secrets by key names in JSON/XML/YAML/.env
            if (window.NolexStructured) {
                try {
                    const structFindings = window.NolexStructured.analyze(fileContent);
                    if (structFindings.length > 0) {
                        console.log(`🔧 Structured: ${structFindings.length} sensitive values found`);
                        let nextId = findings.length;
                        structFindings.forEach(f => { f.id = nextId++; });
                        findings = findings.concat(structFindings);
                    }
                } catch (e) {
                    console.warn('🔧 Structured analysis error:', e);
                }
            }

            // NER analysis (Pro) — if enabled and loaded
            if (window.NolexNER && window.NolexNER.isReady()) {
                try {
                    const nerFindings = await window.NolexNER.analyze(fileContent);
                    if (nerFindings.length > 0) {
                        console.log(`🧠 NER: ${nerFindings.length} entities found`);
                        // Assign unique IDs continuing from regex findings
                        let nextId = findings.length;
                        nerFindings.forEach(f => { f.id = nextId++; });
                        findings = findings.concat(nerFindings);
                    }
                } catch (e) {
                    console.warn('🧠 NER analysis error:', e);
                }
            }

            console.log(`🛡️ 📊 Анализ завершен, найдено элементов: ${findings.length}`);

            if (findings.length === 0) {
                console.log(`🛡️ ✅ Файл "${fileName}" чист - нет чувствительных данных`);
                return file;
            }

            console.warn(`🛡️ ⚠️ В файле "${fileName}" найдено ${findings.length} потенциально чувствительных элементов!`, findings);

            // Отправить статистику в background
            window.postMessage({
                type: 'NOLEX_FINDINGS',
                findings: findings.map(f => ({ type: f.type, name: f.name }))
            }, '*');

            const userDecision = await askUserPermission(fileName, fileContent, findings);
            console.log('🛡️ 👤 Решение пользователя:', userDecision.action);

            switch (userDecision.action) {
                case 'cancel':
                    console.log('🛡️ ❌ Загрузка ОТМЕНЕНА пользователем');
                    throw new Error('Upload cancelled by user');

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
            if (error.message.includes('cancelled by user')) {
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
                    if (error.message.includes('cancelled by user')) {
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
                    if (error.message.includes('cancelled by user')) {
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
                if (error.message.includes('cancelled by user')) {
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
                if (error.message.includes('cancelled by user')) {
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
                if (error.message.includes('cancelled by user')) {
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
                if (error.message.includes('cancelled by user')) {
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
// Модуль для перехвата вставки из буфера обмена
(function () {
    console.log("🛡️ AI Sanitizer Clipboard Interceptor загружается...");

    let requestIdCounter = 0;
    const pendingRequests = new Map();

    /**
     * Показывает диалог пользователю и ждет его решения
     */
    async function askUserPermission(clipboardText, findings) {
        return new Promise((resolve) => {
            const requestId = `clipboard_req_${requestIdCounter++}`;

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
                        window.SanitizerDialog.show("Clipboard", clipboardText, findings)
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
                detail: { requestId, fileName: "Clipboard", fileContent: clipboardText, findings }
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
     * Программно вставляет текст в активный элемент
     */
    function insertTextIntoElement(element, text) {
        if (!element) {
            console.warn('🛡️ ⚠️ No active element for insertion');
            return;
        }

        element.click();
        element.focus();

        // 1. Try execCommand first — best compatibility with React/Vue
        try {
            if (document.execCommand('insertText', false, text)) {
                console.log('🛡️ ✓ Text inserted via execCommand');
                return;
            }
        } catch (e) { /* fall through */ }

        // 2. Native setter fallback for INPUT/TEXTAREA
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const proto = element.tagName === 'INPUT'
                ? window.HTMLInputElement.prototype
                : window.HTMLTextAreaElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

            if (setter) {
                setter.call(element, element.value + text);
            } else {
                element.value = element.value + text;
            }

            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('🛡️ ✓ Text inserted via native setter');
            return;
        }

        // 3. ContentEditable fallback
        if (element.isContentEditable || element.contentEditable === 'true') {
            insertTextManually(element, text);
            element.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: text
            }));
            console.log('🛡️ ✓ Text inserted manually into contentEditable');
            return;
        }

        console.warn('🛡️ ⚠️ Unknown element type:', element.tagName);
    }

    /**
     * Ручная вставка текста в contenteditable
     */
    function insertTextManually(element, text) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            const textNode = document.createTextNode(text);
            range.insertNode(textNode);

            // Перемещаем курсор после вставленного текста
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);

            console.log('🛡️ ✓ Текст вставлен вручную в contenteditable');
        }

        // Генерируем события
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Обработчик события paste
     */
    async function handlePaste(event) {
        console.log('🛡️ 📋 Событие paste перехвачено');

        // Получаем текст из буфера обмена
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) {
            console.warn('🛡️ ⚠️ Нет доступа к данным буфера обмена');
            return;
        }

        const clipboardText = clipboardData.getData('text');
        if (!clipboardText || clipboardText.trim().length === 0) {
            console.log('🛡️ ℹ️ Буфер обмена пуст, пропускаем');
            return;
        }

        console.log(`🛡️ 📝 Текст из буфера обмена (${clipboardText.length} символов)`);

        // Проверяем наличие детектора
        if (!window.SensitiveDataDetector) {
            console.warn('🛡️ ⚠️ Детектор не загружен, пропускаем проверку');
            return;
        }

        // Анализируем текст (regex — synchronous)
        let findings = window.SensitiveDataDetector.analyze(clipboardText);

        // Structured data analysis — detect secrets by key names
        if (window.NolexStructured) {
            try {
                const structFindings = window.NolexStructured.analyze(clipboardText);
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

        const nerEnabled = window.NolexNER && window.NolexNER.isReady();

        // If regex found something OR NER is enabled (may find more) — block paste early
        if (findings.length > 0 || nerEnabled) {
            event.preventDefault();
            event.stopPropagation();
        }

        // NER analysis (Pro) — async, runs after preventDefault
        if (nerEnabled) {
            try {
                const nerFindings = await window.NolexNER.analyze(clipboardText);
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

        // Если чувствительных данных нет — вставляем текст как есть
        if (findings.length === 0) {
            console.log('🛡️ ✅ Текст чист - нет чувствительных данных');
            // We already blocked paste, so insert manually
            if (nerEnabled) {
                insertTextIntoElement(event.target, clipboardText);
            }
            return;
        }

        console.warn(`🛡️ ⚠️ В буфере обмена найдено ${findings.length} потенциально чувствительных элементов!`, findings);

        // Отправить статистику в background
        window.postMessage({
            type: 'NOLEX_FINDINGS',
            findings: findings.map(f => ({ type: f.type, name: f.name }))
        }, '*');

        // Сохраняем ссылку на целевой элемент
        const targetElement = event.target;

        try {
            // Запрашиваем решение пользователя
            const userDecision = await askUserPermission(clipboardText, findings);
            console.log('🛡️ 👤 Решение пользователя:', userDecision.action);

            switch (userDecision.action) {
                case 'cancel':
                    console.log('🛡️ ❌ Вставка ОТМЕНЕНА пользователем');
                    break;

                case 'proceed':
                    console.warn('🛡️ ⚡ Вставляем текст БЕЗ ИЗМЕНЕНИЙ (пользователь разрешил)');
                    insertTextIntoElement(targetElement, clipboardText);
                    break;

                case 'replace':
                    const cleanedText = window.SensitiveDataDetector.replace(
                        clipboardText,
                        userDecision.replacements,
                        userDecision.findings
                    );

                    console.log('🛡️ ✅ Чувствительные данные ЗАМЕНЕНЫ');
                    insertTextIntoElement(targetElement, cleanedText);
                    break;

                default:
                    console.warn('🛡️ ⚠️ Неизвестное действие:', userDecision.action);
                    break;
            }

        } catch (error) {
            console.error('🛡️ ❌ Ошибка при обработке буфера обмена:', error);
        }
    }

    // Устанавливаем обработчик на весь документ
    document.addEventListener('paste', handlePaste, true);

    console.log("🛡️ ✅ AI Sanitizer Clipboard Interceptor АКТИВЕН");
    console.log("🛡️ 📋 Мониторинг всех событий вставки из буфера обмена...");
})();

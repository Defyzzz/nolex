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
                        window.SanitizerDialog.show("Буфер обмена", clipboardText, findings)
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
                detail: { requestId, fileName: "Буфер обмена", fileContent: clipboardText, findings }
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
            console.warn('🛡️ ⚠️ Нет активного элемента для вставки');
            return;
        }

        // Симулируем клик и фокус для активации элемента
        element.click();
        element.focus();

        // Для обычных input и textarea
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            // Сначала установим значение напрямую
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 'value'
            )?.set || Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            )?.set;

            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(element, element.value + text);
            } else {
                element.value = element.value + text;
            }

            // Генерируем события для React/Vue
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));

            console.log('🛡️ ✓ Текст вставлен в input/textarea');
        }
        // Для contenteditable элементов (DeepSeek, ChatGPT и др.)
        else if (element.isContentEditable || element.contentEditable === 'true') {
            // Используем execCommand для лучшей совместимости с фреймворками
            try {
                // Попробуем использовать execCommand (лучшая совместимость)
                const success = document.execCommand('insertText', false, text);

                if (success) {
                    console.log('🛡️ ✓ Текст вставлен через execCommand');
                } else {
                    // Fallback: вставляем напрямую
                    insertTextManually(element, text);
                }
            } catch (e) {
                // Fallback: вставляем напрямую
                insertTextManually(element, text);
            }

            // Генерируем события для React/Vue фреймворков
            element.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: text
            }));

            // Дополнительное событие для некоторых фреймворков
            element.dispatchEvent(new Event('keyup', { bubbles: true }));
        }
        // Fallback для любых других элементов
        else {
            console.warn('🛡️ ⚠️ Неизвестный тип элемента:', element.tagName);
            // Пробуем через execCommand
            try {
                document.execCommand('insertText', false, text);
                console.log('🛡️ ✓ Текст вставлен через execCommand (fallback)');
            } catch (e) {
                console.error('🛡️ ❌ Не удалось вставить текст:', e);
            }
        }
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

        // Анализируем текст
        const findings = window.SensitiveDataDetector.analyze(clipboardText);
        console.log(`🛡️ 📊 Анализ завершен, найдено элементов: ${findings.length}`);

        // Если чувствительных данных нет - разрешаем вставку
        if (findings.length === 0) {
            console.log('🛡️ ✅ Текст чист - нет чувствительных данных');
            return;
        }

        // Блокируем стандартное поведение вставки
        event.preventDefault();
        event.stopPropagation();

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

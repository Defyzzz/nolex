// Content Script - мост между страницей и расширением
// Внедряем все необходимые скрипты в контекст страницы

console.log('🛡️ AI Sanitizer: Content script загружен');

// Функция для внедрения скрипта
function injectScript(filename) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(filename);
        script.onload = function () {
            this.remove();
            resolve();
        };
        script.onerror = reject;
        (document.head || document.documentElement).appendChild(script);
    });
}

// Внедряем скрипты по порядку
async function injectAllScripts() {
    try {
        // Сначала детектор (независимый модуль)
        await injectScript('detector.js');
        console.log('🛡️ Detector.js внедрен');

        // Затем модуль диалога (независимый модуль)
        await injectScript('dialog.js');
        console.log('🛡️ Dialog.js внедрен');

        // И наконец interceptor (использует detector и dialog)
        await injectScript('interceptor.js');
        console.log('🛡️ Interceptor.js внедрен');

        // Clipboard interceptor (использует detector и dialog)
        await injectScript('clipboard_interceptor.js');
        console.log('🛡️ Clipboard_interceptor.js внедрен');

        console.log('🛡️ Все модули AI Sanitizer загружены');
    } catch (error) {
        console.error('🛡️ Ошибка загрузки модулей:', error);
    }
}

// Загружаем и передаем кастомные паттерны в detector
async function loadAndInjectCustomPatterns() {
    try {
        const result = await chrome.storage.local.get(['customPatterns']);
        const customPatterns = result.customPatterns || {};

        console.log(`🔧 Content: Загружено ${Object.keys(customPatterns).length} кастомных паттернов`);

        // Отправляем паттерны в контекст страницы
        const event = new CustomEvent('sanitizer:setCustomPatterns', {
            detail: { customPatterns }
        });
        window.dispatchEvent(event);
    } catch (error) {
        console.error('🛡️ Ошибка загрузки custom patterns:', error);
    }
}

// Проверить состояние расширения перед внедрением
async function checkAndInject() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_ENABLED' });
        if (response && response.enabled) {
            console.log('🛡️ Расширение включено, внедряем скрипты');
            await injectAllScripts();
            // После внедрения скриптов загружаем паттерны
            await loadAndInjectCustomPatterns();
        } else {
            console.log('🛡️ Расширение выключено, пропускаем внедрение');
        }
    } catch (error) {
        console.error('🛡️ Ошибка проверки состояния:', error);
        // В случае ошибки внедряем скрипты
        await injectAllScripts();
        await loadAndInjectCustomPatterns();
    }
}

// Запускаем проверку и внедрение
checkAndInject();

// Слушаем сообщения от interceptors (через postMessage)
window.addEventListener('message', (event) => {
    // Проверяем что сообщение от нашей страницы
    if (event.source !== window) return;

    if (event.data.type === 'NOLEX_FINDINGS') {
        console.log('🛡️ Content: Перенаправляем статистику в background', event.data.findings);
        // Пересылаем в background
        chrome.runtime.sendMessage({
            type: 'UPDATE_STATISTICS',
            findings: event.data.findings
        }).catch(err => {
            console.error('🛡️ Ошибка отправки статистики:', err);
        });
    }
});

// Слушаем изменения состояния от background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTENSION_TOGGLED') {
        console.log('🛡️ Content: Расширение переключено:', message.enabled);
        // Перезагрузить страницу для применения изменений
        location.reload();
    }

    if (message.type === 'RELOAD_PATTERNS') {
        console.log('🔄 Content: Перезагрузка custom patterns');
        // Reload and inject patterns
        loadAndInjectCustomPatterns();
    }
});

// Слушаем события от interceptor.js (из контекста страницы)
window.addEventListener('sanitizer:showDialog', async (event) => {
    console.log('🛡️ Content: Получен запрос на показ диалога', event.detail);

    const { fileName, fileContent, findings, requestId } = event.detail;

    try {
        // Показываем диалог через SanitizerDialog (который уже в контексте страницы)
        // Отправляем событие обратно в контекст страницы
        const showEvent = new CustomEvent('sanitizer:showDialogReady', {
            detail: { requestId, fileName, fileContent, findings }
        });
        window.dispatchEvent(showEvent);

    } catch (error) {
        console.error('🛡️ Ошибка при показе диалога:', error);

        // Отправляем ошибку обратно
        const errorEvent = new CustomEvent('sanitizer:dialogResult', {
            detail: { requestId, result: { action: 'cancel' } }
        });
        window.dispatchEvent(errorEvent);
    }
});

console.log('🛡️ AI Sanitizer Content Script активен');
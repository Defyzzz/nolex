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

        console.log('🛡️ Все модули AI Sanitizer загружены');
    } catch (error) {
        console.error('🛡️ Ошибка загрузки модулей:', error);
    }
}

// Запускаем внедрение
injectAllScripts();

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
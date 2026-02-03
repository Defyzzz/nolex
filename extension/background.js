// Background Service Worker for Nolex Extension

console.log('🛡️ Nolex Background Service Worker загружен');

// Состояние расширения
let state = {
    enabled: true,
    statistics: {},
    totalFindings: 0
};

// Инициализация - загрузить сохраненное состояние
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🎉 Nolex установлен/обновлен');

    // Загрузить сохраненное состояние
    const saved = await chrome.storage.local.get(['state']);
    if (saved.state) {
        state = saved.state;
        console.log('📊 Загружено состояние из storage:', state);
    }

    updateBadge();
});

// Загрузить состояние при запуске
chrome.storage.local.get(['state']).then((result) => {
    if (result.state) {
        state = result.state;
        console.log('📊 Состояние загружено:', state);
        updateBadge();
    }
});

// Обработка сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Получено сообщение:', message.type);

    switch (message.type) {
        case 'GET_STATE':
            sendResponse(state);
            break;

        case 'GET_ENABLED':
            sendResponse({ enabled: state.enabled });
            break;

        case 'TOGGLE_ENABLED':
            handleToggleEnabled(message.enabled);
            sendResponse({ success: true, enabled: state.enabled });
            break;

        case 'UPDATE_STATISTICS':
            handleUpdateStatistics(message.findings);
            sendResponse({ success: true });
            break;

        case 'RESET_STATISTICS':
            handleResetStatistics();
            sendResponse({ success: true });
            break;

        case 'RELOAD_PATTERNS':
            // Notify all tabs to reload custom patterns
            console.log('🔄 Reloading custom patterns');
            notifyTabs({ type: 'RELOAD_PATTERNS' });
            sendResponse({ success: true });
            break;

        default:
            console.warn('⚠️ Неизвестный тип сообщения:', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
    }

    return true; // Keep channel open for async response
});

// Включить/выключить расширение
function handleToggleEnabled(enabled) {
    state.enabled = enabled;
    console.log(`🔄 Расширение ${enabled ? 'включено' : 'выключено'}`);

    saveState();
    updateBadge();

    // Уведомить все вкладки
    notifyTabs({ type: 'EXTENSION_TOGGLED', enabled: enabled });
}

// Обновить статистику
function handleUpdateStatistics(findings) {
    if (!findings || findings.length === 0) {
        return;
    }

    console.log('📊 Обновление статистики, findings:', findings.length);

    // Подсчитать количество по типам
    findings.forEach(finding => {
        const type = finding.type;
        if (!state.statistics[type]) {
            state.statistics[type] = 0;
        }
        state.statistics[type]++;
    });

    // Обновить общее количество
    state.totalFindings = Object.values(state.statistics).reduce((sum, count) => sum + count, 0);

    console.log('📊 Новая статистика:', state.statistics);
    console.log('📊 Всего найдено:', state.totalFindings);

    saveState();
    updateBadge();

    // Уведомить popup если он открыт
    notifyPopup({ type: 'STATISTICS_UPDATED' });
}

// Сбросить статистику
function handleResetStatistics() {
    console.log('🔄 Сброс статистики');

    state.statistics = {};
    state.totalFindings = 0;

    saveState();
    updateBadge();

    notifyPopup({ type: 'STATISTICS_UPDATED' });
}

// Обновить badge на иконке
function updateBadge() {
    const count = state.totalFindings;

    if (!state.enabled) {
        // Расширение выключено
        chrome.action.setBadgeText({ text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#f56565' }); // Красный
    } else if (count === 0) {
        // Нет находок
        chrome.action.setBadgeText({ text: '' });
    } else if (count > 99) {
        // Много находок
        chrome.action.setBadgeText({ text: '99+' });
        chrome.action.setBadgeBackgroundColor({ color: '#ed8936' }); // Оранжевый
    } else {
        // Показать количество
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' }); // Синий (акцент)
    }

    console.log('🔢 Badge обновлен:', count);
}

// Сохранить состояние
async function saveState() {
    try {
        await chrome.storage.local.set({ state: state });
        console.log('💾 Состояние сохранено');
    } catch (error) {
        console.error('❌ Ошибка сохранения состояния:', error);
    }
}

// Уведомить все вкладки
async function notifyTabs(message) {
    try {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {
                // Игнорировать ошибки (вкладка может не иметь content script)
            });
        });
    } catch (error) {
        console.error('❌ Ошибка уведомления вкладок:', error);
    }
}

// Уведомить popup
function notifyPopup(message) {
    chrome.runtime.sendMessage(message).catch(() => {
        // Popup может быть закрыт
    });
}

// Периодическая синхронизация (на случай если storage был изменен извне)
setInterval(async () => {
    const saved = await chrome.storage.local.get(['state']);
    if (saved.state && JSON.stringify(saved.state) !== JSON.stringify(state)) {
        console.log('🔄 Обнаружены изменения в storage, синхронизация...');
        state = saved.state;
        updateBadge();
    }
}, 30000); // Каждые 30 секунд

console.log('✅ Background Service Worker готов');

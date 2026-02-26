// Popup Logic for Nolex Extension

// Типы чувствительных данных с иконками
const DATA_TYPES_INFO = {
    'openai_key': { icon: '🔑', label: 'OpenAI API Key' },
    'anthropic_key': { icon: '🔐', label: 'Anthropic Key' },
    'google_api_key': { icon: '🔑', label: 'Google API Key' },
    'aws_access_key': { icon: '☁️', label: 'AWS Access Key' },
    'aws_secret_key': { icon: '🔒', label: 'AWS Secret Key' },
    'aws_session_token': { icon: '🎫', label: 'AWS Session Token' },
    'github_token': { icon: '🐙', label: 'GitHub Token' },
    'github_oauth': { icon: '🔐', label: 'GitHub OAuth' },
    'github_pat': { icon: '🔑', label: 'GitHub PAT' },
    'slack_bot_token': { icon: '💬', label: 'Slack Bot Token' },
    'slack_user_token': { icon: '👤', label: 'Slack User Token' },
    'slack_webhook': { icon: '🪝', label: 'Slack Webhook' },
    'discord_token': { icon: '🎮', label: 'Discord Token' },
    'discord_webhook': { icon: '🪝', label: 'Discord Webhook' },
    'stripe_secret_key': { icon: '💳', label: 'Stripe Secret Key' },
    'stripe_restricted_key': { icon: '🔑', label: 'Stripe Restricted Key' },
    'stripe_webhook_secret': { icon: '🪝', label: 'Stripe Webhook Secret' },
    'redis_url': { icon: '🗄️', label: 'Redis Connection' },
    'postgresql_url': { icon: '🐘', label: 'PostgreSQL Connection' },
    'mysql_url': { icon: '🐬', label: 'MySQL Connection' },
    'mongodb_url': { icon: '🍃', label: 'MongoDB Connection' },
    'email': { icon: '📧', label: 'Email Address' },
    'phone_ru': { icon: '📱', label: 'Phone Number (RU)' },
    'phone_international': { icon: '📞', label: 'Phone Number' },
    'credit_card': { icon: '💳', label: 'Credit Card' },
    'deepseek_key': { icon: '🔑', label: 'DeepSeek API Key' },
    'huggingface_token': { icon: '🤗', label: 'Hugging Face Token' },
    'mistral_key': { icon: '🔑', label: 'Mistral API Key' },
    'replicate_token': { icon: '🔑', label: 'Replicate Token' },
    'cohere_key': { icon: '🔑', label: 'Cohere API Key' },
    'jwt_token': { icon: '🎫', label: 'JWT Token' },
    'private_key': { icon: '🔐', label: 'Private Key' }
};

// DOM Elements
let mainScreen, menuScreen;
let extensionToggle, statusText;
let totalCountNumber, statsListElement;
let menuBtn, closeMenuBtn;
let resetBtn;

// State
let currentState = {
    enabled: true,
    statistics: {},
    totalFindings: 0
};

// Custom patterns names cache
let customPatternNames = {};

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🛡️ Nolex Popup загружен');

    // Получить элементы DOM
    initDOMElements();

    // Загрузить состояние
    await loadState();

    // Загрузить названия кастомных паттернов
    await loadCustomPatternNames();

    // Настроить обработчики событий
    setupEventListeners();

    // Отрисовать UI
    renderUI();
});

// Загрузка названий кастомных паттернов
async function loadCustomPatternNames() {
    try {
        const result = await chrome.storage.local.get(['customPatternGroups', 'customPatterns']);

        customPatternNames = {};

        if (result.customPatternGroups) {
            // New grouped format
            for (const group of Object.values(result.customPatternGroups)) {
                for (const [id, pattern] of Object.entries(group.patterns || {})) {
                    customPatternNames[id] = pattern.name || id;
                }
            }
        } else if (result.customPatterns) {
            // Legacy flat format
            for (const [id, pattern] of Object.entries(result.customPatterns)) {
                customPatternNames[id] = pattern.name || id;
            }
        }

        console.log('📋 Загружены названия кастомных паттернов:', Object.keys(customPatternNames).length);
    } catch (error) {
        console.error('❌ Ошибка загрузки названий паттернов:', error);
    }
}

function initDOMElements() {
    mainScreen = document.getElementById('main-screen');
    menuScreen = document.getElementById('menu-screen');

    extensionToggle = document.getElementById('extension-toggle');
    statusText = document.getElementById('status-text');

    totalCountNumber = document.querySelector('.count-number');
    statsListElement = document.getElementById('stats-list');

    menuBtn = document.getElementById('menu-btn');
    closeMenuBtn = document.getElementById('close-menu-btn');
    resetBtn = document.getElementById('reset-btn');
}

function setupEventListeners() {
    // Toggle расширения
    extensionToggle.addEventListener('change', handleToggleChange);

    // Навигация меню
    menuBtn.addEventListener('click', showMenu);
    closeMenuBtn.addEventListener('click', showMain);

    // Сброс статистики
    resetBtn.addEventListener('click', handleReset);

    // Меню действия
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', handleMenuItemClick);
    });
}

// Загрузка состояния из background
async function loadState() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
        if (response) {
            currentState = response;
            console.log('📊 Состояние загружено:', currentState);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки состояния:', error);
    }
}

// Отрисовка UI
function renderUI() {
    // Обновить toggle
    extensionToggle.checked = currentState.enabled;
    updateStatusText();

    // Обновить счетчик
    totalCountNumber.textContent = currentState.totalFindings || 0;

    // Отрисовать статистику
    renderStatistics();
}

function updateStatusText() {
    if (currentState.enabled) {
        statusText.textContent = 'Active';
        statusText.className = 'status-text active';
    } else {
        statusText.textContent = 'Inactive';
        statusText.className = 'status-text inactive';
    }
}

function renderStatistics() {
    const stats = currentState.statistics || {};
    const statsArray = Object.entries(stats)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]); // Сортировка по убыванию

    if (statsArray.length === 0) {
        // Показать пустое состояние
        statsListElement.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                </svg>
                <p>No sensitive data detected yet</p>
                <small>Start using the web to see statistics</small>
            </div>
        `;
        return;
    }

    // Отрисовать список статистики
    statsListElement.innerHTML = statsArray.map(([type, count]) => {
        // Check if it's a custom pattern
        let info;
        if (DATA_TYPES_INFO[type]) {
            info = DATA_TYPES_INFO[type];
        } else if (customPatternNames[type]) {
            info = { icon: '🔒', label: customPatternNames[type] };
        } else {
            info = { icon: '🔒', label: type };
        }
        return `
            <div class="stat-item">
                <div class="stat-item-left">
                    <span class="stat-icon">${info.icon}</span>
                    <span class="stat-name">${info.label}</span>
                </div>
                <span class="stat-count">${count}</span>
            </div>
        `;
    }).join('');
}

// Обработчики событий
async function handleToggleChange(e) {
    const enabled = e.target.checked;
    console.log('🔄 Toggle изменен:', enabled);

    try {
        // Отправить в background
        const response = await chrome.runtime.sendMessage({
            type: 'TOGGLE_ENABLED',
            enabled: enabled
        });

        if (response && response.success) {
            currentState.enabled = enabled;
            updateStatusText();
            console.log('✅ Статус обновлен');
        }
    } catch (error) {
        console.error('❌ Ошибка обновления статуса:', error);
        // Вернуть toggle обратно при ошибке
        e.target.checked = !enabled;
    }
}

async function handleReset() {
    if (!confirm('Reset all statistics? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({ type: 'RESET_STATISTICS' });

        if (response && response.success) {
            currentState.statistics = {};
            currentState.totalFindings = 0;
            renderUI();
            console.log('✅ Статистика сброшена');
        }
    } catch (error) {
        console.error('❌ Ошибка сброса статистики:', error);
    }
}

function showMenu() {
    mainScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
}

function showMain() {
    menuScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
}

function handleMenuItemClick(e) {
    e.preventDefault();
    const action = e.currentTarget.dataset.action;

    console.log('📱 Меню действие:', action);

    // Обработка различных действий
    switch (action) {
        case 'personal-account':
        case 'about-us':
            // Coming soon — no action
            break;
        case 'data-constructor':
            chrome.tabs.create({ url: 'constructor.html' });
            break;
        case 'support':
            chrome.tabs.create({ url: 'mailto:support@nolex.zendesk.com?subject=Nolex Support Request' });
            break;
    }
}

// Слушать обновления от background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STATISTICS_UPDATED') {
        console.log('📊 Статистика обновлена');
        loadState().then(() => {
            renderUI();
        });
    }
});

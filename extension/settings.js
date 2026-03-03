// Settings Page Logic - Nolex

const DEFAULT_EXTENSIONS = [
    // Config
    '.env', '.ini', '.cfg', '.conf', '.toml', '.yaml', '.yml',
    // Code
    '.js', '.ts', '.py', '.rb', '.php', '.go', '.java', '.sh', '.bash',
    // Data
    '.json', '.xml', '.csv',
    // Keys/Certs
    '.pem', '.key', '.pub', '.crt', '.cer',
    // Docker/CI
    '.dockerfile', '.dockerignore',
    // Text
    '.txt', '.log', '.md'
];

const STORAGE_KEY = 'fileExtensionSettings';

let currentSettings = null;

// DOM — initialized in DOMContentLoaded
let extensionsContainer, extInput, addExtBtn, resetBtn, extError;

// Init
document.addEventListener('DOMContentLoaded', async () => {
    extensionsContainer = document.getElementById('extensions-container');
    extInput = document.getElementById('ext-input');
    addExtBtn = document.getElementById('add-ext-btn');
    resetBtn = document.getElementById('reset-btn');
    extError = document.getElementById('ext-error');

    await loadSettings();
    renderChips();
    setupListeners();
});

async function loadSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) {
        currentSettings = result[STORAGE_KEY];
    } else {
        currentSettings = {
            enabled: [...DEFAULT_EXTENSIONS],
            custom: [],
            mode: 'whitelist'
        };
        await saveSettings();
    }
}

async function saveSettings() {
    await chrome.storage.local.set({ [STORAGE_KEY]: currentSettings });
}

function renderChips() {
    extensionsContainer.innerHTML = '';

    const customSet = new Set(currentSettings.custom);

    // All enabled sorted alphabetically together
    const sorted = [...currentSettings.enabled].sort();

    for (const ext of sorted) {
        const isCustom = customSet.has(ext);
        const chip = document.createElement('div');
        chip.className = 'ext-chip' + (isCustom ? ' custom' : '');
        chip.innerHTML = `
            <span class="ext-name">${ext}</span>
            ${isCustom ? '<span class="custom-marker">✦</span>' : ''}
            <button class="remove-btn" data-ext="${ext}" title="Remove">×</button>
        `;
        extensionsContainer.appendChild(chip);
    }
}

function setupListeners() {
    addExtBtn.addEventListener('click', addExtension);
    extInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addExtension();
    });

    extensionsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-btn');
        if (!btn) return;
        removeExtension(btn.dataset.ext);
    });

    resetBtn.addEventListener('click', resetToDefaults);
}

async function addExtension() {
    hideError();
    let ext = extInput.value.trim().toLowerCase();

    if (!ext) return;

    if (!ext.startsWith('.')) {
        ext = '.' + ext;
    }

    if (!/^\.[a-z0-9]+$/.test(ext)) {
        showError('Only letters and numbers allowed (e.g. .twb)');
        return;
    }

    if (currentSettings.enabled.includes(ext)) {
        showError(`"${ext}" is already in the list`);
        return;
    }

    currentSettings.enabled.push(ext);
    currentSettings.custom.push(ext);
    await saveSettings();
    renderChips();
    extInput.value = '';
    extInput.focus();
}

async function removeExtension(ext) {
    currentSettings.enabled = currentSettings.enabled.filter(e => e !== ext);
    currentSettings.custom = currentSettings.custom.filter(e => e !== ext);
    await saveSettings();
    renderChips();
}

async function resetToDefaults() {
    if (!confirm('Reset to default extensions? All custom extensions will be removed.')) {
        return;
    }
    currentSettings.enabled = [...DEFAULT_EXTENSIONS];
    currentSettings.custom = [];
    await saveSettings();
    renderChips();
}

function showError(msg) {
    extError.textContent = msg;
    extError.classList.remove('hidden');
}

function hideError() {
    extError.classList.add('hidden');
}

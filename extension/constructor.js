// Smart Constructor Logic
console.log('🔧 Smart Constructor загружен');

// State
let customPatternGroups = {};
let currentGenerated = null;
let editingPatternInfo = null; // { groupId, patternId } when editing

// DOM Elements
let builtinPatternsContainer, customPatternsContainer;
let exampleInput, patternAnalysisSection, analysisResult, analysisWarnings;
let patternConfigSection, patternNameInput, replacementTextInput;
let generatedRegexCode, regexEditor, editRegexBtn;
let patternTestSection, testInput, testResult;
let patternActionsSection, savePatternBtn, clearBtn;
let groupSelect;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Initializing Smart Constructor');

    // Get DOM elements
    initDOMElements();

    // Load patterns
    await loadBuiltInPatterns();
    await loadCustomPatternGroups();

    // Setup event listeners
    setupEventListeners();
});

function initDOMElements() {
    // Containers
    builtinPatternsContainer = document.getElementById('builtin-patterns');
    customPatternsContainer = document.getElementById('custom-patterns');

    // Form elements
    exampleInput = document.getElementById('example-input');
    patternAnalysisSection = document.getElementById('pattern-analysis');
    analysisResult = document.getElementById('analysis-result');
    analysisWarnings = document.getElementById('analysis-warnings');

    patternConfigSection = document.getElementById('pattern-config');
    patternNameInput = document.getElementById('pattern-name');
    replacementTextInput = document.getElementById('replacement-text');

    generatedRegexCode = document.getElementById('generated-regex');
    regexEditor = document.getElementById('regex-editor');
    editRegexBtn = document.getElementById('edit-regex-btn');

    patternTestSection = document.getElementById('pattern-test');
    testInput = document.getElementById('test-input');
    testResult = document.getElementById('test-result');

    patternActionsSection = document.getElementById('pattern-actions');
    savePatternBtn = document.getElementById('save-pattern-btn');
    clearBtn = document.getElementById('clear-btn');

    groupSelect = document.getElementById('group-select');

    // Delegated click handler for custom patterns (attached once)
    customPatternsContainer.addEventListener('click', handleCustomPatternsClick);

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
        window.close();
    });
}

function setupEventListeners() {
    // Example input - trigger analysis on change
    exampleInput.addEventListener('input', handleExampleInput);

    // Match mode radio buttons
    document.querySelectorAll('input[name="match-mode"]').forEach(radio => {
        radio.addEventListener('change', handleMatchModeChange);
    });

    // Case sensitive checkbox
    document.getElementById('case-sensitive').addEventListener('change', () => {
        if (currentGenerated) {
            regeneratePattern();
        }
    });

    // Regex info button (cheatsheet toggle)
    const regexInfoBtn = document.getElementById('regex-info-btn');
    const regexCheatsheet = document.getElementById('regex-cheatsheet');

    regexInfoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !regexCheatsheet.classList.contains('hidden');
        regexCheatsheet.classList.toggle('hidden');
        regexInfoBtn.classList.toggle('active', !isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!regexCheatsheet.classList.contains('hidden') &&
            !regexCheatsheet.contains(e.target) &&
            e.target !== regexInfoBtn) {
            regexCheatsheet.classList.add('hidden');
            regexInfoBtn.classList.remove('active');
        }
    });

    // Edit regex button
    editRegexBtn.addEventListener('click', toggleRegexEditor);

    // Regex editor
    regexEditor.addEventListener('input', handleRegexEdit);

    // Test input
    testInput.addEventListener('input', handleTestInput);

    // Save button
    savePatternBtn.addEventListener('click', handleSavePattern);

    // Clear button
    clearBtn.addEventListener('click', handleClear);

    // New Group button (in form)
    document.getElementById('new-group-inline-btn').addEventListener('click', () => {
        openGroupDialog();
    });

    // Group dialog
    document.getElementById('group-dialog-cancel').addEventListener('click', closeGroupDialog);
    document.getElementById('group-dialog-save').addEventListener('click', handleGroupDialogSave);

    // Import button
    document.getElementById('import-group-btn').addEventListener('click', handleImportGroup);

    // Hidden file input for import
    document.getElementById('import-file-input').addEventListener('change', handleImportFile);
}

// ==================== MIGRATION ====================

async function migrateOldPatterns() {
    try {
        const result = await chrome.storage.local.get(['customPatterns', 'customPatternGroups']);

        // If already migrated or no old data, skip
        if (result.customPatternGroups || !result.customPatterns) {
            return result.customPatternGroups || {};
        }

        const oldPatterns = result.customPatterns;
        if (Object.keys(oldPatterns).length === 0) {
            return {};
        }

        console.log('🔄 Migrating old customPatterns to customPatternGroups...');

        const defaultGroupId = 'group_' + Date.now();
        const groups = {
            [defaultGroupId]: {
                id: defaultGroupId,
                name: 'My Patterns',
                description: 'Migrated from previous version',
                created: new Date().toISOString(),
                enabled: true,
                patterns: {}
            }
        };

        // Move all old patterns into the default group
        for (const [id, pattern] of Object.entries(oldPatterns)) {
            groups[defaultGroupId].patterns[id] = pattern;
        }

        // Save new structure and remove old
        await chrome.storage.local.set({ customPatternGroups: groups });
        await chrome.storage.local.remove('customPatterns');

        console.log(`✅ Migrated ${Object.keys(oldPatterns).length} patterns to group "My Patterns"`);

        return groups;
    } catch (error) {
        console.error('❌ Migration error:', error);
        return {};
    }
}

// ==================== LOAD / SAVE GROUPS ====================

async function loadCustomPatternGroups() {
    try {
        // Run migration first
        const migrated = await migrateOldPatterns();

        if (Object.keys(migrated).length > 0) {
            customPatternGroups = migrated;
        } else {
            const result = await chrome.storage.local.get(['customPatternGroups']);
            customPatternGroups = result.customPatternGroups || {};
        }

        renderCustomPatternGroups();
        updateGroupSelect();

        const totalPatterns = countTotalPatterns();
        console.log(`✅ Loaded ${Object.keys(customPatternGroups).length} groups, ${totalPatterns} patterns`);
    } catch (error) {
        console.error('❌ Error loading custom pattern groups:', error);
    }
}

async function saveCustomPatternGroups() {
    await chrome.storage.local.set({ customPatternGroups });
    chrome.runtime.sendMessage({ type: 'RELOAD_PATTERNS' });
}

function countTotalPatterns() {
    let count = 0;
    for (const group of Object.values(customPatternGroups)) {
        count += Object.keys(group.patterns || {}).length;
    }
    return count;
}

// ==================== GROUP CRUD ====================

async function createGroup(name, description) {
    const id = 'group_' + Date.now();
    customPatternGroups[id] = {
        id,
        name: name || 'New Group',
        description: description || '',
        created: new Date().toISOString(),
        enabled: true,
        patterns: {}
    };

    await saveCustomPatternGroups();
    renderCustomPatternGroups();
    updateGroupSelect();

    console.log('✅ Group created:', id, name);
    return id;
}

async function deleteGroup(groupId) {
    if (!customPatternGroups[groupId]) return;

    const patternCount = Object.keys(customPatternGroups[groupId].patterns || {}).length;
    const groupName = customPatternGroups[groupId].name;

    showConfirm(
        `Delete group "${groupName}" with ${patternCount} pattern(s)?`,
        async () => {
            delete customPatternGroups[groupId];
            await saveCustomPatternGroups();
            renderCustomPatternGroups();
            updateGroupSelect();
            console.log('✅ Group deleted:', groupId);
        }
    );
}

async function renameGroup(groupId) {
    if (!customPatternGroups[groupId]) return;

    openGroupDialog(groupId);
}

async function toggleGroup(groupId) {
    if (!customPatternGroups[groupId]) return;

    customPatternGroups[groupId].enabled = !customPatternGroups[groupId].enabled;
    await saveCustomPatternGroups();
    renderCustomPatternGroups();

    console.log(`✅ Group ${groupId} ${customPatternGroups[groupId].enabled ? 'enabled' : 'disabled'}`);
}

async function exportGroup(groupId) {
    const group = customPatternGroups[groupId];
    if (!group) return;

    const exportData = {
        nolex_pattern_group: true,
        version: 1,
        name: group.name,
        description: group.description || '',
        exported: new Date().toISOString(),
        patterns: Object.values(group.patterns).map(p => ({
            name: p.name,
            regex: p.regex,
            flags: p.flags,
            replacement: p.replacement
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `nolex-patterns-${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Group exported:', group.name);
}

function handleImportGroup() {
    document.getElementById('import-file-input').click();
}

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate format
        if (!data.nolex_pattern_group || !data.patterns || !Array.isArray(data.patterns)) {
            alert('Invalid file format. Expected a Nolex pattern group export file.');
            return;
        }

        // Create group from import
        const groupId = 'group_' + Date.now();
        const patterns = {};

        data.patterns.forEach((p, i) => {
            const patId = 'pat_' + Date.now() + '_' + i;
            patterns[patId] = {
                id: patId,
                name: p.name || `Pattern ${i + 1}`,
                regex: p.regex,
                flags: p.flags || 'gi',
                replacement: p.replacement || '***REDACTED***',
                created: new Date().toISOString(),
                enabled: true
            };
        });

        customPatternGroups[groupId] = {
            id: groupId,
            name: data.name || 'Imported Group',
            description: data.description || `Imported from ${file.name}`,
            created: new Date().toISOString(),
            enabled: true,
            patterns
        };

        await saveCustomPatternGroups();
        renderCustomPatternGroups();
        updateGroupSelect();

        alert(`✓ Imported group "${data.name}" with ${data.patterns.length} pattern(s)`);
    } catch (error) {
        console.error('❌ Import error:', error);
        alert('Error importing file: ' + error.message);
    }

    // Reset file input
    event.target.value = '';
}

// ==================== GROUP DIALOG ====================

let editingGroupId = null;

function openGroupDialog(groupId) {
    editingGroupId = groupId || null;

    const dialog = document.getElementById('group-dialog');
    const titleEl = document.getElementById('group-dialog-title');
    const nameInput = document.getElementById('group-name-input');
    const descInput = document.getElementById('group-desc-input');

    if (groupId && customPatternGroups[groupId]) {
        titleEl.textContent = 'Edit Group';
        nameInput.value = customPatternGroups[groupId].name;
        descInput.value = customPatternGroups[groupId].description || '';
    } else {
        titleEl.textContent = 'New Group';
        nameInput.value = '';
        descInput.value = '';
    }

    dialog.classList.remove('hidden');
    nameInput.focus();
}

function closeGroupDialog() {
    document.getElementById('group-dialog').classList.add('hidden');
    editingGroupId = null;
}

async function handleGroupDialogSave() {
    const nameInput = document.getElementById('group-name-input');
    const descInput = document.getElementById('group-desc-input');
    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (!name) {
        alert('Please enter a group name');
        return;
    }

    if (editingGroupId && customPatternGroups[editingGroupId]) {
        // Rename/edit existing group
        customPatternGroups[editingGroupId].name = name;
        customPatternGroups[editingGroupId].description = description;
        await saveCustomPatternGroups();
        renderCustomPatternGroups();
        updateGroupSelect();
    } else {
        // Create new group
        await createGroup(name, description);
    }

    closeGroupDialog();
}

// ==================== GROUP SELECT (in form) ====================

function updateGroupSelect() {
    if (!groupSelect) return;

    const groups = Object.values(customPatternGroups);

    let html = '';
    if (groups.length === 0) {
        html = '<option value="">No groups - create one first</option>';
    } else {
        groups.forEach(g => {
            html += `<option value="${g.id}">${escapeHtml(g.name)}</option>`;
        });
    }

    groupSelect.innerHTML = html;
}

function getSelectedGroupId() {
    if (!groupSelect) return null;
    return groupSelect.value || null;
}

function ensureDefaultGroup() {
    // If no groups exist, create a default one
    if (Object.keys(customPatternGroups).length === 0) {
        const id = 'group_' + Date.now();
        customPatternGroups[id] = {
            id,
            name: 'My Patterns',
            description: '',
            created: new Date().toISOString(),
            enabled: true,
            patterns: {}
        };
        return id;
    }
    return Object.keys(customPatternGroups)[0];
}

// ==================== RENDER GROUPS ====================

function renderCustomPatternGroups() {
    const totalPatterns = countTotalPatterns();
    const groupCount = Object.keys(customPatternGroups).length;
    document.getElementById('custom-count').textContent = totalPatterns;

    if (groupCount === 0) {
        customPatternsContainer.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4M12 16h.01"></path>
                </svg>
                <p>No custom patterns yet</p>
                <small>Create your first pattern above</small>
            </div>
        `;
        return;
    }

    let html = '';

    for (const [groupId, group] of Object.entries(customPatternGroups)) {
        const patternCount = Object.keys(group.patterns || {}).length;
        const isDisabled = !group.enabled;

        html += `
            <div class="pattern-category group-category ${isDisabled ? 'group-disabled' : ''}" data-group-id="${groupId}">
                <div class="category-header group-header">
                    <div class="category-title" data-group-id="${groupId}">
                        <span>${escapeHtml(group.name)}</span>
                        ${group.description ? `<small class="group-description">${escapeHtml(group.description)}</small>` : ''}
                    </div>
                    <div class="group-header-right">
                        <div class="group-actions">
                            <label class="toggle-switch" title="${group.enabled ? 'Disable group' : 'Enable group'}">
                                <input type="checkbox" ${group.enabled ? 'checked' : ''} data-action="toggle-group" data-group-id="${groupId}">
                                <span class="toggle-slider"></span>
                            </label>
                            <button class="icon-btn icon-btn-sm" data-action="rename-group" data-group-id="${groupId}" title="Edit group">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="icon-btn icon-btn-sm" data-action="export-group" data-group-id="${groupId}" title="Export group">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                            <button class="icon-btn icon-btn-sm icon-btn-danger" data-action="delete-group" data-group-id="${groupId}" title="Delete group">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="category-count">
                            <span>${patternCount} pattern${patternCount !== 1 ? 's' : ''}</span>
                            <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="category-patterns">
                    ${patternCount === 0
                        ? `<div class="empty-group-state">No patterns in this group</div>`
                        : Object.entries(group.patterns).map(([patId, p]) => `
                            <div class="pattern-item ${!p.enabled ? 'pattern-disabled' : ''}">
                                <div class="pattern-header">
                                    <div class="pattern-name">${escapeHtml(p.name)}</div>
                                    <div class="pattern-actions-inline">
                                        <button class="icon-btn" data-action="edit-pattern" data-group-id="${groupId}" data-pattern-id="${patId}" title="Edit pattern">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="icon-btn icon-btn-danger" data-action="delete-pattern" data-group-id="${groupId}" data-pattern-id="${patId}" title="Delete pattern">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="pattern-detail">
                                    Replacement: <code>${escapeHtml(p.replacement)}</code>
                                </div>
                                <div class="pattern-example">
                                    /${escapeHtml(p.regex)}/${p.flags}
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }

    customPatternsContainer.innerHTML = html;

    // Category expand/collapse on title click
    customPatternsContainer.querySelectorAll('.category-title').forEach(titleEl => {
        titleEl.addEventListener('click', () => {
            const header = titleEl.closest('.category-header');
            toggleCategory(header);
        });
    });

    customPatternsContainer.querySelectorAll('.category-count').forEach(countEl => {
        countEl.addEventListener('click', () => {
            const header = countEl.closest('.category-header');
            toggleCategory(header);
        });
    });

    // Toggle switches
    customPatternsContainer.querySelectorAll('[data-action="toggle-group"]').forEach(input => {
        input.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleGroup(input.getAttribute('data-group-id'));
        });
    });
}

function handleCustomPatternsClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');

    // Skip toggle-group — handled by change listener on the checkbox
    if (action === 'toggle-group') return;

    e.preventDefault();
    e.stopPropagation();

    const groupId = btn.getAttribute('data-group-id');
    const patternId = btn.getAttribute('data-pattern-id');

    switch (action) {
        case 'rename-group':
            renameGroup(groupId);
            break;
        case 'export-group':
            exportGroup(groupId);
            break;
        case 'delete-group':
            deleteGroup(groupId);
            break;
        case 'edit-pattern':
            editCustomPattern(groupId, patternId);
            break;
        case 'delete-pattern':
            deleteCustomPattern(groupId, patternId);
            break;
    }
}

// ==================== BUILT-IN PATTERNS ====================

// Load built-in patterns from detector.js
async function loadBuiltInPatterns() {
    try {
        // Get built-in patterns from detector
        if (!window.SensitiveDataDetector || !window.SensitiveDataDetector.patterns) {
            builtinPatternsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Failed to load built-in patterns</p>
                </div>
            `;
            return;
        }

        const patterns = window.SensitiveDataDetector.patterns;

        // Group patterns by category
        const categories = {
            '🔑 API Keys & Tokens': ['openai_key', 'anthropic_key', 'google_api_key', 'deepseek_key', 'huggingface_token', 'mistral_key', 'replicate_token', 'cohere_key', 'jwt_token'],
            '☁️ Cloud Services': ['aws_access_key', 'aws_secret_key', 'aws_session_token'],
            '🐙 Version Control': ['github_token', 'github_oauth', 'github_pat'],
            '💬 Communication': ['slack_bot_token', 'slack_user_token', 'slack_webhook', 'discord_token', 'discord_webhook'],
            '💳 Payments': ['stripe_secret_key', 'stripe_restricted_key', 'stripe_webhook_secret'],
            '🗄️ Database Connections': ['redis_url', 'postgresql_url', 'mysql_url', 'mongodb_url'],
            '👤 Personal Information': ['email', 'phone_ru', 'phone_international'],
            '💰 Financial Data': ['credit_card'],
            '🔐 Security': ['private_key']
        };

        let html = '';
        let totalCount = 0;

        for (const [categoryName, patternKeys] of Object.entries(categories)) {
            const categoryPatterns = patternKeys
                .filter(key => patterns[key])
                .map(key => ({ key, ...patterns[key] }));

            if (categoryPatterns.length === 0) continue;

            totalCount += categoryPatterns.length;

            html += `
                <div class="pattern-category">
                    <div class="category-header" data-category="${escapeHtml(categoryName)}">
                        <div class="category-title">
                            <span>${categoryName}</span>
                        </div>
                        <div class="category-count">
                            <span>${categoryPatterns.length} patterns</span>
                            <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="category-patterns">
                        ${categoryPatterns.map(p => `
                            <div class="pattern-item">
                                <div class="pattern-header">
                                    <div class="pattern-name">${p.name}</div>
                                </div>
                                ${p.example ? `<div class="pattern-detail">
                                    Example: <code>${escapeHtml(p.example)}</code>
                                </div>` : ''}
                                <div class="pattern-detail">
                                    Replacement: <code>${escapeHtml(p.replacement)}</code>
                                </div>
                                <div class="pattern-example">
                                    Pattern: ${escapeHtml(p.regex.source)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        builtinPatternsContainer.innerHTML = html;
        document.getElementById('builtin-count').textContent = totalCount;

        // Add event listeners to category headers
        builtinPatternsContainer.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                toggleCategory(header);
            });
        });

        console.log(`✅ Loaded ${totalCount} built-in patterns`);
    } catch (error) {
        console.error('❌ Error loading built-in patterns:', error);
        builtinPatternsContainer.innerHTML = `
            <div class="empty-state">
                <p>Error loading patterns</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Toggle category expand/collapse
window.toggleCategory = function (header) {
    const category = header.parentElement;
    const patternsDiv = category.querySelector('.category-patterns');
    const icon = header.querySelector('.expand-icon');

    if (patternsDiv.classList.contains('expanded')) {
        patternsDiv.classList.remove('expanded');
        icon.classList.remove('expanded');
    } else {
        patternsDiv.classList.add('expanded');
        icon.classList.add('expanded');
    }
};

// ==================== PATTERN FORM HANDLERS ====================

// Handle example input
function handleExampleInput() {
    const value = exampleInput.value.trim();

    if (!value) {
        patternAnalysisSection.classList.add('hidden');
        patternConfigSection.classList.add('hidden');
        patternTestSection.classList.add('hidden');
        patternActionsSection.classList.add('hidden');
        currentGenerated = null;
        return;
    }

    // Generate pattern using SmartGenerator
    const matchMode = document.querySelector('input[name="match-mode"]:checked').value;
    const caseSensitive = document.getElementById('case-sensitive').checked;

    const generated = window.SmartGenerator.generateRegexFromExample(value, {
        strictMode: matchMode === 'strict',
        requirePrefix: true,
        caseSensitive: caseSensitive
    });

    currentGenerated = generated;

    showAnalysis(generated);
    showConfiguration(generated, value);
    showTestSection();

    patternActionsSection.classList.remove('hidden');
}

function showAnalysis(generated) {
    patternAnalysisSection.classList.remove('hidden');

    if (generated.staticParts && generated.staticParts.length > 0) {
        analysisResult.innerHTML = window.SmartGenerator.highlightParts(generated.staticParts);
    } else {
        analysisResult.innerHTML = '<span class="static-part">No patterns detected</span>';
    }

    if (generated.warnings && generated.warnings.length > 0) {
        analysisWarnings.innerHTML = generated.warnings.map(w => `
            <div class="warning-item">
                <span>⚠️</span>
                <span>${escapeHtml(w)}</span>
            </div>
        `).join('');
    } else {
        analysisWarnings.innerHTML = '';
    }
}

function showConfiguration(generated, example) {
    patternConfigSection.classList.remove('hidden');

    if (!patternNameInput.value) {
        const detectedTypes = generated.detectedPatterns?.map(p => p.name).join(' + ') || 'Custom Pattern';
        patternNameInput.value = detectedTypes;
    }

    if (!replacementTextInput.value) {
        replacementTextInput.value = '***SENSITIVE_DATA_REDACTED***';
    }

    generatedRegexCode.textContent = generated.regex;
    regexEditor.value = generated.regex;
}

function showTestSection() {
    patternTestSection.classList.remove('hidden');

    if (testInput.value.trim()) {
        handleTestInput();
    }
}

function handleMatchModeChange() {
    if (exampleInput.value.trim()) {
        handleExampleInput();
    }
}

function regeneratePattern() {
    handleExampleInput();
}

function toggleRegexEditor() {
    if (regexEditor.classList.contains('hidden')) {
        regexEditor.classList.remove('hidden');
        generatedRegexCode.parentElement.style.display = 'none';
    } else {
        regexEditor.classList.add('hidden');
        generatedRegexCode.parentElement.style.display = 'flex';
    }
}

function handleRegexEdit() {
    generatedRegexCode.textContent = regexEditor.value;

    if (currentGenerated) {
        currentGenerated.regex = regexEditor.value;
    }

    if (testInput.value.trim()) {
        handleTestInput();
    }
}

function handleTestInput() {
    const testValue = testInput.value.trim();

    if (!testValue || !currentGenerated) {
        testResult.innerHTML = '';
        return;
    }

    const caseSensitive = document.getElementById('case-sensitive').checked;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = regexEditor.classList.contains('hidden')
        ? currentGenerated.regex
        : regexEditor.value;

    const result = window.SmartGenerator.testPattern(regex, flags, testValue);

    if (result.success) {
        if (result.matchCount > 0) {
            const replacement = replacementTextInput.value || '***REDACTED***';
            const replaced = testValue.replace(new RegExp(regex, flags), replacement);

            testResult.innerHTML = `
                <div class="test-match">
                    ✓ Matched ${result.matchCount} time(s)
                </div>
                <div class="pattern-detail">
                    Original: <code>${escapeHtml(testValue)}</code>
                </div>
                <div class="pattern-detail">
                    After replacement: <code>${escapeHtml(replaced)}</code>
                </div>
            `;
        } else {
            testResult.innerHTML = `
                <div class="test-no-match">
                    ✗ No matches found
                </div>
            `;
        }
    } else {
        testResult.innerHTML = `
            <div class="test-no-match">
                ✗ Invalid regex: ${escapeHtml(result.error)}
            </div>
        `;
    }
}

// ==================== SAVE / EDIT / DELETE PATTERNS ====================

async function handleSavePattern() {
    const name = patternNameInput.value.trim();
    const replacement = replacementTextInput.value.trim();
    const caseSensitive = document.getElementById('case-sensitive').checked;
    const regex = regexEditor.classList.contains('hidden')
        ? currentGenerated.regex
        : regexEditor.value;

    if (!name) { alert('Please enter a pattern name'); return; }
    if (!replacement) { alert('Please enter replacement text'); return; }
    if (!regex) { alert('Pattern regex is empty'); return; }

    try {
        new RegExp(regex, caseSensitive ? 'g' : 'gi');
    } catch (error) {
        alert('Invalid regex pattern: ' + error.message);
        return;
    }

    // Determine target group
    let targetGroupId = getSelectedGroupId();

    if (!targetGroupId) {
        targetGroupId = ensureDefaultGroup();
        updateGroupSelect();
    }

    // If editing, use the original group (unless user changed the select)
    if (editingPatternInfo) {
        // Pattern was already removed from old group in editCustomPattern
        // Just save to selected group
    }

    const patternId = 'pat_' + Date.now();

    customPatternGroups[targetGroupId].patterns[patternId] = {
        id: patternId,
        name,
        regex,
        flags: caseSensitive ? 'g' : 'gi',
        replacement,
        created: new Date().toISOString(),
        enabled: true
    };

    await saveCustomPatternGroups();
    renderCustomPatternGroups();
    updateGroupSelect();

    handleClear();
    editingPatternInfo = null;

    alert('✓ Custom pattern saved successfully!');
    console.log('✅ Pattern saved to group:', targetGroupId);
}

function editCustomPattern(groupId, patternId) {
    const group = customPatternGroups[groupId];
    if (!group) return;

    const pattern = group.patterns[patternId];
    if (!pattern) return;

    console.log('🔧 Editing pattern:', patternId, 'in group:', groupId);

    // Fill form (example is not stored — leave empty)
    exampleInput.value = '';
    patternNameInput.value = pattern.name;
    replacementTextInput.value = pattern.replacement;
    document.getElementById('case-sensitive').checked = pattern.flags.includes('g') && !pattern.flags.includes('i');

    // Select the group
    if (groupSelect) {
        groupSelect.value = groupId;
    }

    // Show config and regex directly (no example needed for editing)
    currentGenerated = { regex: pattern.regex };
    generatedRegexCode.textContent = pattern.regex;
    regexEditor.value = pattern.regex;

    patternAnalysisSection.classList.add('hidden');
    patternConfigSection.classList.remove('hidden');
    patternTestSection.classList.remove('hidden');
    patternActionsSection.classList.remove('hidden');

    // Scroll to form
    document.querySelector('.add-section').scrollIntoView({ behavior: 'smooth' });

    // Store editing info and remove old pattern
    editingPatternInfo = { groupId, patternId };
    delete customPatternGroups[groupId].patterns[patternId];
    saveCustomPatternGroups();
    renderCustomPatternGroups();
}

function deleteCustomPattern(groupId, patternId) {
    const group = customPatternGroups[groupId];
    if (!group || !group.patterns[patternId]) return;

    const patName = group.patterns[patternId].name;

    showConfirm(
        `Delete pattern "${patName}"?`,
        async () => {
            delete customPatternGroups[groupId].patterns[patternId];
            await saveCustomPatternGroups();
            renderCustomPatternGroups();
            updateGroupSelect();
            console.log('✅ Pattern deleted:', patternId, 'from group:', groupId);
        }
    );
}

// ==================== CONFIRM DIALOG ====================

let pendingConfirmCallback = null;

function showConfirm(message, onConfirm) {
    pendingConfirmCallback = onConfirm;
    const dialog = document.getElementById('confirm-dialog');
    document.getElementById('confirm-message').textContent = message;
    dialog.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('confirm-dialog');
    const cancelBtn = document.getElementById('confirm-cancel');
    const okBtn = document.getElementById('confirm-ok');

    cancelBtn.addEventListener('click', () => {
        dialog.classList.add('hidden');
        pendingConfirmCallback = null;
    });

    okBtn.addEventListener('click', async () => {
        dialog.classList.add('hidden');
        if (pendingConfirmCallback) {
            await pendingConfirmCallback();
            pendingConfirmCallback = null;
        }
    });
});

// Handle clear
function handleClear() {
    exampleInput.value = '';
    patternNameInput.value = '';
    replacementTextInput.value = '';
    testInput.value = '';

    patternAnalysisSection.classList.add('hidden');
    patternConfigSection.classList.add('hidden');
    patternTestSection.classList.add('hidden');
    patternActionsSection.classList.add('hidden');

    currentGenerated = null;
    editingPatternInfo = null;
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('✅ Smart Constructor ready');

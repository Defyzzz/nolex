// Smart Constructor Logic
console.log('🔧 Smart Constructor загружен');

// State
let customPatterns = {};
let currentGenerated = null;

// DOM Elements
let builtinPatternsContainer, customPatternsContainer;
let exampleInput, patternAnalysisSection, analysisResult, analysisWarnings;
let patternConfigSection, patternNameInput, replacementTextInput;
let generatedRegexCode, regexEditor, editRegexBtn;
let patternTestSection, testInput, testResult;
let patternActionsSection, savePatternBtn, clearBtn;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Initializing Smart Constructor');

    // Get DOM elements
    initDOMElements();

    // Load patterns
    await loadBuiltInPatterns();
    await loadCustomPatterns();

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
}

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
            '🔑 API Keys & Tokens': ['openai_key', 'anthropic_key', 'google_api_key', 'jwt_token'],
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

// Load custom patterns from storage
async function loadCustomPatterns() {
    try {
        const result = await chrome.storage.local.get(['customPatterns']);
        customPatterns = result.customPatterns || {};

        renderCustomPatterns();

        console.log(`✅ Loaded ${Object.keys(customPatterns).length} custom patterns`);
    } catch (error) {
        console.error('❌ Error loading custom patterns:', error);
    }
}

// Render custom patterns
function renderCustomPatterns() {
    const patternCount = Object.keys(customPatterns).length;
    document.getElementById('custom-count').textContent = patternCount;

    if (patternCount === 0) {
        customPatternsContainer.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4M12 16h.01"></path>
                </svg>
                <p>No custom patterns yet</p>
                <small>Create your first pattern below</small>
            </div>
        `;
        return;
    }

    let html = '';
    for (const [id, pattern] of Object.entries(customPatterns)) {
        html += `
            <div class="pattern-item">
                <div class="pattern-header">
                    <div class="pattern-name">${escapeHtml(pattern.name)}</div>
                    <div class="pattern-actions-inline">
                        <button class="icon-btn edit-pattern-btn" data-pattern-id="${id}" title="Edit pattern">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="icon-btn icon-btn-danger delete-pattern-btn" data-pattern-id="${id}" title="Delete pattern">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="pattern-detail">
                    Example: <code>${escapeHtml(pattern.example)}</code>
                </div>
                <div class="pattern-detail">
                    Replacement: <code>${escapeHtml(pattern.replacement)}</code>
                </div>
                <div class="pattern-example">
                    /${escapeHtml(pattern.regex)}/${pattern.flags}
                </div>
            </div>
        `;
    }

    customPatternsContainer.innerHTML = html;

    // Add event listeners for edit buttons
    customPatternsContainer.querySelectorAll('.edit-pattern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-pattern-id');
            editCustomPattern(id);
        });
    });

    // Add event listeners for delete buttons
    customPatternsContainer.querySelectorAll('.delete-pattern-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-pattern-id');
            deleteCustomPattern(id);
        });
    });
}

// Handle example input
function handleExampleInput() {
    const value = exampleInput.value.trim();

    if (!value) {
        // Hide all sections if input is empty
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

    // Show analysis
    showAnalysis(generated);

    // Show configuration
    showConfiguration(generated, value);

    // Show test section
    showTestSection();

    // Show action buttons
    patternActionsSection.classList.remove('hidden');
}

// Show analysis section
function showAnalysis(generated) {
    patternAnalysisSection.classList.remove('hidden');

    // Highlight parts
    if (generated.staticParts && generated.staticParts.length > 0) {
        analysisResult.innerHTML = window.SmartGenerator.highlightParts(generated.staticParts);
    } else {
        analysisResult.innerHTML = '<span class="static-part">No patterns detected</span>';
    }

    // Show warnings
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

// Show configuration section
function showConfiguration(generated, example) {
    patternConfigSection.classList.remove('hidden');

    // Auto-fill pattern name if empty
    if (!patternNameInput.value) {
        const detectedTypes = generated.detectedPatterns?.map(p => p.name).join(' + ') || 'Custom Pattern';
        patternNameInput.value = detectedTypes;
    }

    // Auto-fill replacement if empty
    if (!replacementTextInput.value) {
        replacementTextInput.value = '***SENSITIVE_DATA_REDACTED***';
    }

    // Show generated regex
    generatedRegexCode.textContent = generated.regex;
    regexEditor.value = generated.regex;
}

// Show test section
function showTestSection() {
    patternTestSection.classList.remove('hidden');

    // Auto-run test if there's already test input
    if (testInput.value.trim()) {
        handleTestInput();
    }
}

// Handle match mode change
function handleMatchModeChange() {
    if (exampleInput.value.trim()) {
        handleExampleInput();
    }
}

// Regenerate pattern (when options change)
function regeneratePattern() {
    handleExampleInput();
}

// Toggle regex editor
function toggleRegexEditor() {
    if (regexEditor.classList.contains('hidden')) {
        regexEditor.classList.remove('hidden');
        generatedRegexCode.parentElement.style.display = 'none';
    } else {
        regexEditor.classList.add('hidden');
        generatedRegexCode.parentElement.style.display = 'flex';
    }
}

// Handle regex edit
function handleRegexEdit() {
    // Update displayed regex
    generatedRegexCode.textContent = regexEditor.value;

    // Update current generated
    if (currentGenerated) {
        currentGenerated.regex = regexEditor.value;
    }

    // Re-run test if exists
    if (testInput.value.trim()) {
        handleTestInput();
    }
}

// Handle test input
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

// Handle save pattern
async function handleSavePattern() {
    const name = patternNameInput.value.trim();
    const replacement = replacementTextInput.value.trim();
    const example = exampleInput.value.trim();
    const caseSensitive = document.getElementById('case-sensitive').checked;
    const regex = regexEditor.classList.contains('hidden')
        ? currentGenerated.regex
        : regexEditor.value;

    // Validation
    if (!name) {
        alert('Please enter a pattern name');
        return;
    }

    if (!replacement) {
        alert('Please enter replacement text');
        return;
    }

    if (!regex) {
        alert('Pattern regex is empty');
        return;
    }

    // Test regex validity
    try {
        new RegExp(regex, caseSensitive ? 'g' : 'gi');
    } catch (error) {
        alert('Invalid regex pattern: ' + error.message);
        return;
    }

    // Create pattern ID
    const id = 'custom_' + Date.now();

    // Save to storage
    customPatterns[id] = {
        id: id,
        name: name,
        regex: regex,
        flags: caseSensitive ? 'g' : 'gi',
        replacement: replacement,
        example: example,
        created: new Date().toISOString(),
        enabled: true
    };

    await chrome.storage.local.set({ customPatterns });

    console.log('✅ Pattern saved:', id);

    // Reload custom patterns
    await loadCustomPatterns();

    // Clear form
    handleClear();

    // Show success message
    alert('✓ Custom pattern saved successfully!');

    // Reload detector (send message to background)
    chrome.runtime.sendMessage({ type: 'RELOAD_PATTERNS' });
}

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
}

// Edit custom pattern
window.editCustomPattern = function (id) {
    console.log('🔧 Editing custom pattern:', id);
    const pattern = customPatterns[id];
    if (!pattern) {
        console.error('❌ Pattern not found:', id);
        return;
    }

    // Fill form with pattern data
    exampleInput.value = pattern.example;
    patternNameInput.value = pattern.name;
    replacementTextInput.value = pattern.replacement;
    document.getElementById('case-sensitive').checked = pattern.flags.includes('g') && !pattern.flags.includes('i');

    // Trigger analysis
    handleExampleInput();

    // Scroll to form
    document.querySelector('.add-section').scrollIntoView({ behavior: 'smooth' });

    // Delete old pattern (will be re-saved)
    delete customPatterns[id];
    chrome.storage.local.set({ customPatterns });

    console.log('✅ Pattern loaded for editing');
};

// Delete custom pattern
let pendingDeleteId = null;

window.deleteCustomPattern = function (id) {
    console.log('🗑️ Attempting to delete pattern:', id);
    pendingDeleteId = id;

    // Show custom confirm dialog
    const dialog = document.getElementById('confirm-dialog');
    dialog.classList.remove('hidden');
};

// Setup confirm dialog buttons
document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('confirm-dialog');
    const cancelBtn = document.getElementById('confirm-cancel');
    const okBtn = document.getElementById('confirm-ok');

    cancelBtn.addEventListener('click', () => {
        console.log('⚠️ Deletion cancelled by user');
        dialog.classList.add('hidden');
        pendingDeleteId = null;
    });

    okBtn.addEventListener('click', async () => {
        dialog.classList.add('hidden');

        if (pendingDeleteId) {
            const id = pendingDeleteId;
            pendingDeleteId = null;

            delete customPatterns[id];
            await chrome.storage.local.set({ customPatterns });

            console.log('✅ Pattern deleted:', id);

            // Reload custom patterns
            await loadCustomPatterns();

            // Reload detector
            chrome.runtime.sendMessage({ type: 'RELOAD_PATTERNS' });
        }
    });
});

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('✅ Smart Constructor ready');
console.log('🔍 Global functions:', {
    toggleCategory: typeof window.toggleCategory,
    editCustomPattern: typeof window.editCustomPattern,
    deleteCustomPattern: typeof window.deleteCustomPattern
});

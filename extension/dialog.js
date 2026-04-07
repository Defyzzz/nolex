// Логика управления диалоговым окном (программное создание UI)
(function () {
    window.SanitizerDialog = {
        currentDialog: null,
        resolveCallback: null,
        _fileContent: null,
        _allFindings: null,
        _strictFilterActive: false,

        /**
         * Показывает диалоговое окно с найденными чувствительными данными
         */
        async show(fileName, fileContent, findings) {
            return new Promise((resolve) => {
                this.resolveCallback = resolve;
                this.createDialog(fileName, fileContent, findings);
            });
        },

        /**
         * Создает и показывает диалоговое окно программно (DOM-based construction)
         */
        createDialog(fileName, fileContent, findings) {
            // Сохраняем для strict filter
            this._fileContent = fileContent;
            this._allFindings = findings;
            this._strictFilterActive = false;

            // Внедряем стили
            this.injectStyles();

            // Создаем overlay
            const overlay = document.createElement('div');
            overlay.id = 'sanitizer-dialog-overlay';
            overlay.className = 'sanitizer-overlay';

            // --- Sanitizer Dialog Container ---
            const dialog = document.createElement('div');
            dialog.className = 'sanitizer-dialog';

            // --- Header ---
            const header = document.createElement('div');
            header.className = 'sanitizer-header';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'sanitizer-icon';
            iconDiv.textContent = '⚠️';

            const title = document.createElement('h2');
            title.textContent = 'Sensitive Data Detected';

            header.appendChild(iconDiv);
            header.appendChild(title);
            dialog.appendChild(header);

            // --- Content ---
            const content = document.createElement('div');
            content.className = 'sanitizer-content';

            // Warning
            const warningP = document.createElement('p');
            warningP.className = 'sanitizer-warning';

            const warningTextStart = document.createTextNode('The file ');
            const fileNameStrong = document.createElement('strong');
            fileNameStrong.id = 'sanitizer-filename';
            fileNameStrong.textContent = fileName;
            const warningTextEnd = document.createTextNode(' contains potentially sensitive information.');

            warningP.appendChild(warningTextStart);
            warningP.appendChild(fileNameStrong);
            warningP.appendChild(warningTextEnd);
            content.appendChild(warningP);

            // Preview
            const previewDiv = document.createElement('div');
            previewDiv.className = 'sanitizer-preview';

            const previewTitle = document.createElement('h3');
            previewTitle.textContent = 'Preview:';
            previewDiv.appendChild(previewTitle);

            const textPreview = document.createElement('div');
            textPreview.id = 'sanitizer-text-preview';
            textPreview.className = 'text-preview';
            // Use highlightSensitiveDataDOM to append nodes directly instead of innerHTML
            this.highlightSensitiveDataDOM(textPreview, fileContent, findings);
            previewDiv.appendChild(textPreview);

            content.appendChild(previewDiv);

            // Findings List
            const findingsDiv = document.createElement('div');
            findingsDiv.className = 'sanitizer-findings';

            const findingsTitleRow = document.createElement('div');
            findingsTitleRow.className = 'findings-title-row';

            const findingsTitle = document.createElement('h3');
            findingsTitle.textContent = 'Detected Data:';
            findingsTitleRow.appendChild(findingsTitle);

            const strictWrap = document.createElement('div');
            strictWrap.className = 'strict-filter-wrap';

            const strictBtn = document.createElement('button');
            strictBtn.className = 'btn-strict-filter';
            strictBtn.textContent = 'Strict Filter';
            strictWrap.appendChild(strictBtn);

            const infoBtn = document.createElement('span');
            infoBtn.className = 'strict-info-btn';
            infoBtn.textContent = 'i';
            strictWrap.appendChild(infoBtn);

            const infoTooltip = document.createElement('div');
            infoTooltip.className = 'strict-info-tooltip';
            infoTooltip.textContent = 'Removes matches that are part of a longer sequence — e.g. a phone number inside a large integer. If a digit or letter is directly adjacent to the match, it is likely a false positive and will be filtered out.';
            strictWrap.appendChild(infoTooltip);

            findingsTitleRow.appendChild(strictWrap);

            findingsDiv.appendChild(findingsTitleRow);

            const findingsList = document.createElement('div');
            findingsList.id = 'sanitizer-findings-list';
            findingsList.className = 'findings-list';
            findingsDiv.appendChild(findingsList);

            content.appendChild(findingsDiv);

            // Feedback
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'sanitizer-feedback';

            const feedbackTitle = document.createElement('h3');
            feedbackTitle.textContent = 'Report Issue or Send Feedback:';
            feedbackDiv.appendChild(feedbackTitle);

            const feedbackTextarea = document.createElement('textarea');
            feedbackTextarea.id = 'sanitizer-feedback-text';
            feedbackTextarea.className = 'feedback-textarea';
            feedbackTextarea.placeholder = 'If you notice any errors or have questions about the detected data, please describe them here...';
            feedbackTextarea.rows = 3;
            feedbackDiv.appendChild(feedbackTextarea);

            const feedbackHint = document.createElement('p');
            feedbackHint.className = 'feedback-hint';
            feedbackHint.textContent = 'Your feedback will be sent when you click one of the buttons below (optional)';
            feedbackDiv.appendChild(feedbackHint);

            content.appendChild(feedbackDiv);
            dialog.appendChild(content);

            // --- Footer ---
            const footer = document.createElement('div');
            footer.className = 'sanitizer-footer';

            const btnCancel = document.createElement('button');
            btnCancel.id = 'sanitizer-btn-cancel';
            btnCancel.className = 'btn btn-secondary';
            btnCancel.textContent = 'Cancel Upload';

            const btnProceed = document.createElement('button');
            btnProceed.id = 'sanitizer-btn-proceed';
            btnProceed.className = 'btn btn-warning';
            btnProceed.textContent = 'Keep As Is';

            const btnReplace = document.createElement('button');
            btnReplace.id = 'sanitizer-btn-replace';
            btnReplace.className = 'btn btn-primary';
            btnReplace.textContent = 'Apply & Continue';

            footer.appendChild(btnCancel);
            footer.appendChild(btnProceed);
            footer.appendChild(btnReplace);
            dialog.appendChild(footer);

            // Assemble
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            this.currentDialog = overlay;

            // Populate findings using DOM methods
            this.populateFindings(findings);

            // Setup listeners
            this.setupEventListeners(findings);
        },

        /**
         * Внедряет CSS стили
         */
        injectStyles() {
            if (document.getElementById('sanitizer-styles')) return;

            const style = document.createElement('style');
            style.id = 'sanitizer-styles';
            style.textContent = `
                /* Nolex Theme v2 (Hybrid: Old Colors + New Tech Style) */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

                .sanitizer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85); /* Restored original overlay opacity */
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2147483647;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    animation: fadeIn 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .sanitizer-dialog {
                    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%); /* Adjusted old purple for glass */
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    color: #FFFFFF;
                }

                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .sanitizer-header {
                    background: linear-gradient(135deg, rgba(231, 76, 60, 0.9) 0%, rgba(192, 57, 43, 0.9) 100%); /* Restored Red Header with slight opacity */
                    padding: 24px 32px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .sanitizer-icon {
                    font-size: 28px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .sanitizer-header h2 {
                    margin: 0;
                    color: #FFFFFF;
                    font-size: 20px;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                }

                .sanitizer-content {
                    padding: 32px;
                    overflow-y: auto;
                    flex: 1;
                    color: #ecf0f1;
                }

                .sanitizer-warning {
                    margin: 0 0 24px 0;
                    padding: 16px 0;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #ecf0f1;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .sanitizer-warning strong {
                    color: #FFFFFF;
                    font-weight: 600;
                }

                .sanitizer-preview h3,
                .sanitizer-findings h3,
                .sanitizer-feedback h3 {
                    margin: 0 0 12px 0;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #3498db; /* Restored Light Blue */
                }

                .text-preview {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    font-family: 'JetBrains Mono', monospace; /* Keep new font */
                    font-size: 13px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                    color: #ecf0f1;
                }

                .sanitizer-highlight {
                    background: rgba(231, 76, 60, 0.3); /* Restored Red Highlight */
                    padding: 2px 4px;
                    border-radius: 3px;
                    border: 1px solid #e74c3c;
                    color: #ffffff;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .sanitizer-highlight.highlight-active {
                    background: rgba(231, 76, 60, 0.7);
                    box-shadow: 0 0 8px rgba(231, 76, 60, 0.6), 0 0 16px rgba(231, 76, 60, 0.3);
                    border-color: #ff6b6b;
                }

                .sanitizer-preview {
                    margin-bottom: 24px;
                }

                .findings-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }

                .findings-title-row h3 {
                    margin: 0 !important;
                }

                .btn-strict-filter {
                    padding: 4px 12px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    font-weight: 500;
                    background: rgba(52, 152, 219, 0.15);
                    color: #3498db;
                    border: 1px solid rgba(52, 152, 219, 0.3);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-strict-filter:hover {
                    background: rgba(52, 152, 219, 0.25);
                    border-color: #3498db;
                }

                .btn-strict-filter.active {
                    background: rgba(52, 152, 219, 0.4);
                    color: #fff;
                    border-color: #3498db;
                }

                .strict-filter-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    position: relative;
                }

                .strict-info-btn {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 1.5px solid rgba(52, 152, 219, 0.5);
                    background: transparent;
                    color: #3498db;
                    font-size: 11px;
                    font-weight: 700;
                    font-style: italic;
                    font-family: Georgia, 'Times New Roman', serif;
                    cursor: help;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .strict-info-btn:hover {
                    background: rgba(52, 152, 219, 0.15);
                    border-color: #3498db;
                }

                .strict-info-btn:hover + .strict-info-tooltip {
                    opacity: 1;
                    visibility: visible;
                }

                .strict-info-tooltip {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 280px;
                    padding: 10px 12px;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid rgba(52, 152, 219, 0.3);
                    border-radius: 6px;
                    color: #ecf0f1;
                    font-family: 'Inter', sans-serif;
                    font-size: 12px;
                    line-height: 1.5;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s ease;
                    z-index: 10;
                    pointer-events: none;
                }

                .findings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .finding-group {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .finding-group-header {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    user-select: none;
                }

                .finding-group-header:hover {
                    background: rgba(52, 152, 219, 0.1);
                }

                .finding-group-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .finding-group-name {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px;
                    font-weight: 600;
                    color: #FFFFFF;
                }

                .finding-group-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .finding-group-count {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px;
                    color: rgba(236, 240, 241, 0.6);
                    background: rgba(52, 152, 219, 0.15);
                    padding: 2px 10px;
                    border-radius: 10px;
                }

                .finding-group-chevron {
                    transition: transform 0.3s ease;
                    color: rgba(236, 240, 241, 0.5);
                }

                .finding-group-chevron.expanded {
                    transform: rotate(180deg);
                }

                .finding-group-items {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }

                .finding-group-items.expanded {
                    max-height: 50000px;
                }

                .finding-group-items .finding-item {
                    border-radius: 0;
                    border: none;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .finding-group-items .finding-item:hover {
                    border-color: rgba(255, 255, 255, 0.05);
                }

                .sanitizer-feedback {
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .feedback-textarea {
                    width: 100%;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(52, 152, 219, 0.3);
                    border-radius: 8px;
                    color: #FFFFFF;
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: vertical;
                    min-height: 80px;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .feedback-textarea:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }

                .feedback-textarea::placeholder {
                    color: rgba(236, 240, 241, 0.5);
                }

                .feedback-hint {
                    margin: 8px 0 0 0;
                    font-size: 12px;
                    color: rgba(236, 240, 241, 0.6);
                }

                .finding-item {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    cursor: pointer;
                }

                .finding-item:hover {
                    border-color: #3498db;
                    background: rgba(52, 152, 219, 0.1);
                }

                .finding-item.finding-active {
                    border-color: #e74c3c;
                    background: rgba(231, 76, 60, 0.1);
                }

                .finding-item.disabled {
                    opacity: 0.5;
                }

                .replace-checkbox {
                    margin-top: 4px;
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                    accent-color: #3498db;
                    flex-shrink: 0;
                }

                .finding-content {
                    flex: 1;
                    min-width: 0;
                }

                .finding-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .finding-type {
                    font-weight: 600;
                    color: #FFFFFF;
                    font-size: 13px;
                    font-family: 'JetBrains Mono', monospace;
                }

                .finding-value {
                    font-family: 'JetBrains Mono', monospace;
                    color: #95a5a6; /* Restored Gray Value Text */
                    font-size: 12px;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 4px 8px;
                    border-radius: 4px;
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .finding-replacement {
                    margin-top: 12px;
                }

                .finding-replacement label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 12px;
                    color: #bdc3c7;
                    font-family: 'Inter', sans-serif;
                }

                .finding-replacement input {
                    width: 100%;
                    padding: 10px 12px;
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    color: #FFFFFF;
                    font-family: 'JetBrains Mono', monospace; /* Keep new font */
                    font-size: 13px;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .finding-replacement input:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }

                .sanitizer-footer {
                    padding: 24px 32px;
                    background: rgba(0, 0, 0, 0.3);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .btn {
                    padding: 10px 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: 'Inter', sans-serif;
                    background: #1a1a2e; /* Dark Purple matches window */
                    color: #FFFFFF;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }

                .btn:hover {
                    background: #7f8c8d; /* Gray on hover */
                    border-color: #95a5a6;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .btn:active {
                    transform: translateY(0);
                }

                /* Override specific button classes to share the base style */
                .btn-primary, .btn-secondary, .btn-warning {
                    background: #1a1a2e;
                    color: #FFFFFF;
                }

                .sanitizer-content::-webkit-scrollbar,
                .text-preview::-webkit-scrollbar {
                    width: 6px;
                }

                .sanitizer-content::-webkit-scrollbar-track,
                .text-preview::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }

                .sanitizer-content::-webkit-scrollbar-thumb,
                .text-preview::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }

                .sanitizer-content::-webkit-scrollbar-thumb:hover,
                .text-preview::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `;
            document.head.appendChild(style);
        },

        /**
         * Заполняет список findings, группируя по типу паттерна
         */
        populateFindings(findings) {
            const findingsList = this.currentDialog.querySelector('#sanitizer-findings-list');
            findingsList.textContent = '';

            // Group findings by pattern name
            const groups = {};
            findings.forEach(finding => {
                const key = finding.name || finding.type || 'Unknown';
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(finding);
            });

            const groupEntries = Object.entries(groups);

            // If only one group with few items, render flat (no need for collapsible)
            if (groupEntries.length === 1 && groupEntries[0][1].length <= 5) {
                groupEntries[0][1].forEach(finding => {
                    findingsList.appendChild(this.createFindingItem(finding));
                });
                return;
            }

            groupEntries.forEach(([groupName, groupFindings]) => {
                const group = document.createElement('div');
                group.className = 'finding-group';

                // Header
                const header = document.createElement('div');
                header.className = 'finding-group-header';

                const left = document.createElement('div');
                left.className = 'finding-group-left';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'finding-group-name';
                nameSpan.textContent = groupName;
                left.appendChild(nameSpan);

                const right = document.createElement('div');
                right.className = 'finding-group-right';

                const countSpan = document.createElement('span');
                countSpan.className = 'finding-group-count';
                countSpan.textContent = groupFindings.length;
                right.appendChild(countSpan);

                const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                chevron.setAttribute('width', '16');
                chevron.setAttribute('height', '16');
                chevron.setAttribute('viewBox', '0 0 24 24');
                chevron.setAttribute('fill', 'none');
                chevron.setAttribute('stroke', 'currentColor');
                chevron.setAttribute('stroke-width', '2');
                chevron.classList.add('finding-group-chevron');

                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('points', '6 9 12 15 18 9');
                chevron.appendChild(polyline);
                right.appendChild(chevron);

                header.appendChild(left);
                header.appendChild(right);
                group.appendChild(header);

                // Items container (collapsed by default)
                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'finding-group-items';

                groupFindings.forEach(finding => {
                    itemsContainer.appendChild(this.createFindingItem(finding));
                });

                group.appendChild(itemsContainer);
                findingsList.appendChild(group);

                // Toggle expand/collapse
                header.addEventListener('click', () => {
                    const isExpanded = itemsContainer.classList.contains('expanded');
                    itemsContainer.classList.toggle('expanded');
                    chevron.classList.toggle('expanded');
                });
            });
        },

        /**
         * Подсвечивает чувствительные данные в тексте using DOM nodes
         */
        highlightSensitiveDataDOM(container, text, findings) {
            let lastIndex = 0;
            // Sort findings by index ascending to process sequentially
            const sortedFindings = [...findings].sort((a, b) => a.index - b.index);

            sortedFindings.forEach(finding => {
                // Text before finding
                if (finding.index > lastIndex) {
                    const textBefore = text.substring(lastIndex, finding.index);
                    container.appendChild(document.createTextNode(textBefore));
                }

                // The sensitive part (highlighted)
                const span = document.createElement('span');
                span.className = 'sanitizer-highlight';
                span.dataset.findingId = finding.id;
                span.textContent = finding.value;
                container.appendChild(span);

                lastIndex = finding.index + finding.value.length;
            });

            // Remaining text after last finding
            if (lastIndex < text.length) {
                const textAfter = text.substring(lastIndex);
                container.appendChild(document.createTextNode(textAfter));
            }
        },

        /**
         * Создает элемент для одного finding (DOM-based)
         */
        createFindingItem(finding) {
            const item = document.createElement('div');
            item.className = 'finding-item';
            item.dataset.findingId = finding.id;

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'replace-checkbox';
            checkbox.checked = true;
            checkbox.dataset.findingId = finding.id;
            item.appendChild(checkbox);

            // Item content container
            const content = document.createElement('div');
            content.className = 'finding-content';

            // Header (Type + Value)
            const header = document.createElement('div');
            header.className = 'finding-header';

            const typeDiv = document.createElement('div');
            typeDiv.className = 'finding-type';
            typeDiv.textContent = finding.name;
            header.appendChild(typeDiv);

            const valueDiv = document.createElement('div');
            valueDiv.className = 'finding-value';
            valueDiv.title = finding.value;
            valueDiv.textContent = finding.value;
            header.appendChild(valueDiv);

            content.appendChild(header);

            // Replacement input
            const replacementDiv = document.createElement('div');
            replacementDiv.className = 'finding-replacement';

            const label = document.createElement('label');
            label.textContent = 'Replace with:';
            replacementDiv.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'replacement-input';
            input.dataset.findingId = finding.id;
            input.value = finding.replacement || '';
            input.placeholder = 'Enter replacement...';
            replacementDiv.appendChild(input);

            content.appendChild(replacementDiv);
            item.appendChild(content);

            // Add checkbox event listener
            checkbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                input.disabled = !isChecked;
                item.classList.toggle('disabled', !isChecked);
            });

            // Click to scroll preview to this finding
            item.addEventListener('click', (e) => {
                // Don't trigger scroll when clicking checkbox or input
                if (e.target.tagName === 'INPUT') return;

                this.scrollToFinding(finding.id);
            });

            return item;
        },

        /**
         * Устанавливает обработчики событий
         */
        setupEventListeners(findings) {
            const btnCancel = this.currentDialog.querySelector('#sanitizer-btn-cancel');
            const btnProceed = this.currentDialog.querySelector('#sanitizer-btn-proceed');
            const btnReplace = this.currentDialog.querySelector('#sanitizer-btn-replace');

            btnCancel.addEventListener('click', () => {
                const feedback = this.collectFeedback();
                this.close({ action: 'cancel', feedback });
            });

            btnProceed.addEventListener('click', () => {
                const feedback = this.collectFeedback();
                this.close({ action: 'proceed', feedback });
            });

            btnReplace.addEventListener('click', () => {
                const replacements = this.collectReplacements();
                const feedback = this.collectFeedback();
                const activeFindings = this._strictFilterActive
                    ? this._allFindings.filter(f => this.passesBoundaryCheck(this._fileContent, f))
                    : findings;
                this.close({
                    action: 'replace',
                    replacements: replacements,
                    findings: activeFindings,
                    feedback
                });
            });

            // Strict Filter toggle
            const strictBtn = this.currentDialog.querySelector('.btn-strict-filter');
            strictBtn.addEventListener('click', () => {
                this._strictFilterActive = !this._strictFilterActive;
                strictBtn.classList.toggle('active', this._strictFilterActive);

                const filtered = this._strictFilterActive
                    ? this._allFindings.filter(f => this.passesBoundaryCheck(this._fileContent, f))
                    : this._allFindings;

                if (filtered.length === 0) {
                    this.close({ action: 'proceed' });
                    return;
                }

                // Re-render preview and findings
                const preview = this.currentDialog.querySelector('#sanitizer-text-preview');
                preview.textContent = '';
                this.highlightSensitiveDataDOM(preview, this._fileContent, filtered);
                this.populateFindings(filtered);
            });

            // ESC для закрытия
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close({ action: 'cancel' });
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        },

        /**
         * Собирает введенные пользователем замены
         */
        collectReplacements() {
            const findingItems = this.currentDialog.querySelectorAll('.finding-item');
            const replacements = [];

            findingItems.forEach(item => {
                const checkbox = item.querySelector('.replace-checkbox');
                const input = item.querySelector('.replacement-input');

                // Only include checked items
                if (checkbox.checked) {
                    const id = parseInt(input.dataset.findingId);
                    const newValue = input.value;

                    replacements.push({
                        id: id,
                        newValue: newValue
                    });
                }
            });

            return replacements;
        },

        /**
         * Собирает feedback от пользователя
         */
        collectFeedback() {
            const feedbackTextarea = this.currentDialog.querySelector('#sanitizer-feedback-text');
            if (!feedbackTextarea) {
                return null;
            }

            const feedbackText = feedbackTextarea.value.trim();
            if (!feedbackText) {
                return null;
            }

            // Send feedback to Google Forms (fire and forget)
            const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSciUTUiBDJCdRCov8QbIKxqTxWoxp7FJmcvM6p6o2tLlDt24Q/formResponse';
            const body = new URLSearchParams();
            body.append('entry.903530303', feedbackText);
            fetch(formUrl, { method: 'POST', body, mode: 'no-cors' }).catch(() => {});

            console.log('📝 Feedback sent');

            return {
                text: feedbackText,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
        },

        /**
         * Закрывает диалог и возвращает результат
         */
        close(result) {
            if (this.currentDialog) {
                this.currentDialog.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (this.currentDialog && this.currentDialog.parentNode) {
                        this.currentDialog.parentNode.removeChild(this.currentDialog);
                    }
                    this.currentDialog = null;

                    if (this.resolveCallback) {
                        this.resolveCallback(result);
                        this.resolveCallback = null;
                    }
                }, 300);
            }
        },

        /**
         * Прокрутить preview к найденному совпадению и подсветить его
         */
        scrollToFinding(findingId) {
            if (!this.currentDialog) return;

            const preview = this.currentDialog.querySelector('#sanitizer-text-preview');
            const highlight = preview.querySelector(`.sanitizer-highlight[data-finding-id="${findingId}"]`);
            if (!highlight) return;

            // Remove previous active states
            preview.querySelectorAll('.sanitizer-highlight.highlight-active').forEach(el => {
                el.classList.remove('highlight-active');
            });
            this.currentDialog.querySelectorAll('.finding-item.finding-active').forEach(el => {
                el.classList.remove('finding-active');
            });

            // Activate highlight in preview
            highlight.classList.add('highlight-active');

            // Activate finding item in list
            const findingItem = this.currentDialog.querySelector(`.finding-item[data-finding-id="${findingId}"]`);
            if (findingItem) {
                findingItem.classList.add('finding-active');
            }

            // Scroll preview to the highlight
            highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Remove active state after a delay
            clearTimeout(this._highlightTimeout);
            this._highlightTimeout = setTimeout(() => {
                highlight.classList.remove('highlight-active');
                if (findingItem) findingItem.classList.remove('finding-active');
            }, 2000);
        },

        /**
         * Checks if a finding has clean boundaries (no adjacent digits/letters).
         * Returns true if the match is NOT surrounded by alphanumeric chars.
         */
        passesBoundaryCheck(text, finding) {
            const boundary = /[a-zA-Z0-9]/;
            const before = finding.index > 0 ? text[finding.index - 1] : '';
            const after = finding.index + finding.value.length < text.length
                ? text[finding.index + finding.value.length] : '';
            return !boundary.test(before) && !boundary.test(after);
        },

        /**
         * Экранирует HTML (NOT NEEDED ANYMORE if using DOM methods, but kept for utility if needed)
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    console.log('💬 SanitizerDialog загружен');
})();

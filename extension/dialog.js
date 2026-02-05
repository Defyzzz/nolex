// Логика управления диалоговым окном (программное создание UI)
(function () {
    window.SanitizerDialog = {
        currentDialog: null,
        resolveCallback: null,

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

            const findingsTitle = document.createElement('h3');
            findingsTitle.textContent = 'Detected Data:';
            findingsDiv.appendChild(findingsTitle);

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
                }

                .sanitizer-preview {
                    margin-bottom: 24px;
                }

                .findings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
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
                }

                .finding-item:hover {
                    border-color: #3498db;
                    background: rgba(52, 152, 219, 0.1);
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
         * Заполняет список findings (DOM-based)
         */
        populateFindings(findings) {
            const findingsList = this.currentDialog.querySelector('#sanitizer-findings-list');
            findingsList.textContent = ''; // Clear using textContent is safe

            findings.forEach(finding => {
                const item = this.createFindingItem(finding);
                findingsList.appendChild(item);
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
                this.close({
                    action: 'replace',
                    replacements: replacements,
                    findings: findings,
                    feedback
                });
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

            // Логируем feedback
            console.log('📝 Feedback от пользователя:', feedbackText);

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

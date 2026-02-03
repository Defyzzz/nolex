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
         * Создает и показывает диалоговое окно программно
         */
        createDialog(fileName, fileContent, findings) {
            // Создаем overlay
            const overlay = document.createElement('div');
            overlay.id = 'sanitizer-dialog-overlay';
            overlay.className = 'sanitizer-overlay';

            // Внедряем стили
            this.injectStyles();

            // Создаем структуру диалога
            overlay.innerHTML = `
                <div class="sanitizer-dialog">
                    <div class="sanitizer-header">
                        <div class="sanitizer-icon">⚠️</div>
                        <h2>Sensitive Data Detected</h2>
                    </div>
                    
                    <div class="sanitizer-content">
                        <p class="sanitizer-warning">
                            The file <strong id="sanitizer-filename">${this.escapeHtml(fileName)}</strong> contains potentially sensitive information.
                        </p>

                        <div class="sanitizer-preview">
                            <h3>Preview:</h3>
                            <div id="sanitizer-text-preview" class="text-preview">${this.highlightSensitiveData(fileContent, findings)}</div>
                        </div>

                        <div class="sanitizer-findings">
                            <h3>Detected Data:</h3>
                            <div id="sanitizer-findings-list" class="findings-list"></div>
                        </div>

                        <div class="sanitizer-feedback">
                            <h3>Report Issue or Send Feedback:</h3>
                            <textarea 
                                id="sanitizer-feedback-text" 
                                class="feedback-textarea" 
                                placeholder="If you notice any errors or have questions about the detected data, please describe them here..."
                                rows="3"
                            ></textarea>
                            <p class="feedback-hint">Your feedback will be sent when you click one of the buttons below (optional)</p>
                        </div>
                    </div>

                    <div class="sanitizer-footer">
                        <button id="sanitizer-btn-cancel" class="btn btn-secondary">
                            Cancel Upload
                        </button>
                        <button id="sanitizer-btn-proceed" class="btn btn-warning">
                            Keep As Is
                        </button>
                        <button id="sanitizer-btn-replace" class="btn btn-primary">
                            Apply & Continue
                        </button>
                    </div>
                </div>
            `;

            // Добавляем в DOM
            document.body.appendChild(overlay);
            this.currentDialog = overlay;

            // Заполняем список findings
            this.populateFindings(findings);

            // Устанавливаем обработчики
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
                .sanitizer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    animation: fadeIn 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .sanitizer-dialog {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.4s ease-out;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .sanitizer-header {
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    padding: 24px 32px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                }

                .sanitizer-icon {
                    font-size: 32px;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .sanitizer-header h2 {
                    margin: 0;
                    color: #fff;
                    font-size: 24px;
                    font-weight: 600;
                }

                .sanitizer-content {
                    padding: 24px 32px;
                    overflow-y: auto;
                    flex: 1;
                    color: #ecf0f1;
                }

                .sanitizer-warning {
                    margin: 0 0 20px 0;
                    padding: 16px;
                    background: rgba(52, 152, 219, 0.1);
                    border-left: 4px solid #3498db;
                    border-radius: 8px;
                    font-size: 15px;
                    line-height: 1.6;
                }

                .sanitizer-warning strong {
                    color: #5dade2;
                }

                .sanitizer-preview h3,
                .sanitizer-findings h3 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #5dade2;
                }

                .text-preview {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 13px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                }

                .sanitizer-highlight {
                    background: rgba(231, 76, 60, 0.3);
                    padding: 2px 4px;
                    border-radius: 3px;
                    border: 1px solid #e74c3c;
                    color: #fff;
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
                    border-top: 1px solid rgba(52, 152, 219, 0.2);
                }

                .feedback-textarea {
                    width: 100%;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(52, 152, 219, 0.3);
                    border-radius: 8px;
                    color: #ecf0f1;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: vertical;
                    min-height: 80px;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .feedback-textarea:focus {
                    outline: none;
                    border-color: #5dade2;
                    background: rgba(52, 152, 219, 0.15);
                }

                .feedback-textarea::placeholder {
                    color: rgba(236, 240, 241, 0.5);
                }

                .feedback-hint {
                    margin: 8px 0 0 0;
                    font-size: 12px;
                    color: rgba(236, 240, 241, 0.6);
                    font-style: italic;
                }

                .finding-item {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .finding-item:hover {
                    border-color: #5dade2;
                    background: rgba(52, 152, 219, 0.15);
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
                    color: #ffffff;
                    font-size: 14px;
                }

                .finding-value {
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    color: #95a5a6;
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
                    font-size: 13px;
                    color: #d6eaf8;
                }

                .finding-replacement input {
                    width: 100%;
                    padding: 10px 12px;
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(52, 152, 219, 0.3);
                    border-radius: 6px;
                    color: #ecf0f1;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 13px;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .finding-replacement input:focus {
                    outline: none;
                    border-color: #5dade2;
                    background: rgba(52, 152, 219, 0.15);
                }

                .sanitizer-footer {
                    padding: 20px 32px;
                    background: rgba(0, 0, 0, 0.3);
                    border-top: 1px solid rgba(52, 152, 219, 0.2);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
                }

                .btn:active {
                    transform: translateY(0);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white;
                }

                .btn-primary:hover {
                    background: linear-gradient(135deg, #5dade2 0%, #3498db 100%);
                }

                .btn-secondary {
                    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
                    color: white;
                }

                .btn-secondary:hover {
                    background: linear-gradient(135deg, #7f8c8d 0%, #6c7a7b 100%);
                }

                .btn-warning {
                    background: linear-gradient(135deg, #1f618d 0%, #154360 100%);
                    color: white;
                }

                .btn-warning:hover {
                    background: linear-gradient(135deg, #2874a6 0%, #1f618d 100%);
                }

                .sanitizer-content::-webkit-scrollbar,
                .text-preview::-webkit-scrollbar {
                    width: 8px;
                }

                .sanitizer-content::-webkit-scrollbar-track,
                .text-preview::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }

                .sanitizer-content::-webkit-scrollbar-thumb,
                .text-preview::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }

                .sanitizer-content::-webkit-scrollbar-thumb:hover,
                .text-preview::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `;
            document.head.appendChild(style);
        },

        /**
         * Заполняет список findings
         */
        populateFindings(findings) {
            const findingsList = this.currentDialog.querySelector('#sanitizer-findings-list');
            findingsList.innerHTML = '';

            findings.forEach(finding => {
                const item = this.createFindingItem(finding);
                findingsList.appendChild(item);
            });
        },

        /**
         * Подсвечивает чувствительные данные в тексте
         */
        highlightSensitiveData(text, findings) {
            let result = this.escapeHtml(text);

            // Сортируем findings по индексу в обратном порядке
            const sortedFindings = [...findings].sort((a, b) => b.index - a.index);

            sortedFindings.forEach(finding => {
                const escapedValue = this.escapeHtml(finding.value);
                const before = result.substring(0, finding.index);
                const after = result.substring(finding.index + escapedValue.length);

                result = before + `<span class="sanitizer-highlight">${escapedValue}</span>` + after;
            });

            return result;
        },

        /**
         * Создает элемент для одного finding
         */
        createFindingItem(finding) {
            const item = document.createElement('div');
            item.className = 'finding-item';
            item.dataset.findingId = finding.id;

            item.innerHTML = `
                <input type="checkbox" class="replace-checkbox" checked data-finding-id="${finding.id}">
                <div class="finding-content">
                    <div class="finding-header">
                        <div class="finding-type">${this.escapeHtml(finding.name)}</div>
                        <div class="finding-value" title="${this.escapeHtml(finding.value)}">${this.escapeHtml(finding.value)}</div>
                    </div>
                    <div class="finding-replacement">
                        <label>Replace with:</label>
                        <input type="text" 
                               class="replacement-input" 
                               data-finding-id="${finding.id}"
                               value="${this.escapeHtml(finding.replacement)}"
                               placeholder="Enter replacement...">
                    </div>
                </div>
            `;

            // Add checkbox event listener
            const checkbox = item.querySelector('.replace-checkbox');
            const input = item.querySelector('.replacement-input');

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

            // Логируем feedback (для будущей интеграции с Supabase)
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
         * Экранирует HTML
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    console.log('💬 SanitizerDialog загружен');
})();

// Модуль для детектирования чувствительных данных
(function () {
    window.SensitiveDataDetector = {
        // Правила для различных типов чувствительных данных
        patterns: {
            // API ключи популярных сервисов
            openai_key: {
                regex: /sk-[a-zA-Z0-9]{20,}/g,
                name: 'API ключ OpenAI',
                replacement: '***OPENAI_KEY_REDACTED***'
            },
            anthropic_key: {
                regex: /sk-ant-[a-zA-Z0-9\-]{95,}/g,
                name: 'API ключ Anthropic (Claude)',
                replacement: '***ANTHROPIC_KEY_REDACTED***'
            },
            google_api_key: {
                regex: /AIza[0-9A-Za-z\-_]{35}/g,
                name: 'API ключ Google',
                replacement: '***GOOGLE_KEY_REDACTED***'
            },

            // AWS ключи (критично!)
            aws_access_key: {
                regex: /AKIA[0-9A-Z]{16}/g,
                name: 'AWS Access Key ID',
                replacement: '***AWS_ACCESS_KEY_REDACTED***'
            },
            aws_secret_key: {
                regex: /(?:aws_secret_access_key|secret_access_key|AWS_SECRET_ACCESS_KEY)[\s]*[=:]+[\s]*["']?([A-Za-z0-9/+=]{40})["']?/g,
                name: 'AWS Secret Access Key',
                replacement: 'AWS_SECRET_ACCESS_KEY=***AWS_SECRET_REDACTED***'
            },
            aws_session_token: {
                regex: /(?:aws_session_token|AWS_SESSION_TOKEN)[\s]*[=:]+[\s]*["']?([A-Za-z0-9/+=]{100,})["']?/g,
                name: 'AWS Session Token',
                replacement: 'AWS_SESSION_TOKEN=***AWS_SESSION_TOKEN_REDACTED***'
            },

            // GitHub токены
            github_token: {
                regex: /ghp_[a-zA-Z0-9]{36}/g,
                name: 'GitHub Personal Access Token',
                replacement: '***GITHUB_TOKEN_REDACTED***'
            },
            github_oauth: {
                regex: /gho_[a-zA-Z0-9]{36}/g,
                name: 'GitHub OAuth Token',
                replacement: '***GITHUB_OAUTH_REDACTED***'
            },
            github_pat: {
                regex: /github_pat_[a-zA-Z0-9_]{20,}/g,
                name: 'GitHub Personal Access Token (Fine-grained)',
                replacement: '***GITHUB_PAT_REDACTED***'
            },

            // Slack токены
            slack_bot_token: {
                regex: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
                name: 'Slack Bot Token',
                replacement: '***SLACK_BOT_TOKEN_REDACTED***'
            },
            slack_user_token: {
                regex: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
                name: 'Slack User Token',
                replacement: '***SLACK_USER_TOKEN_REDACTED***'
            },
            slack_webhook: {
                regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
                name: 'Slack Webhook URL',
                replacement: '***SLACK_WEBHOOK_REDACTED***'
            },

            // Discord токены
            discord_token: {
                regex: /[MN][A-Za-z\d]{23,25}\.[A-Za-z\d]{6}\.[A-Za-z\d_\-]{27,}/g,
                name: 'Discord Bot Token',
                replacement: '***DISCORD_TOKEN_REDACTED***'
            },
            discord_webhook: {
                regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_\-]+/g,
                name: 'Discord Webhook URL',
                replacement: '***DISCORD_WEBHOOK_REDACTED***'
            },

            // Stripe ключи
            stripe_secret_key: {
                regex: /sk_(live|test)_[a-zA-Z0-9]{24,}/g,
                name: 'Stripe Secret Key',
                replacement: '***STRIPE_SECRET_KEY_REDACTED***'
            },
            stripe_restricted_key: {
                regex: /rk_(live|test)_[a-zA-Z0-9]{24,}/g,
                name: 'Stripe Restricted Key',
                replacement: '***STRIPE_RESTRICTED_KEY_REDACTED***'
            },
            stripe_webhook_secret: {
                regex: /whsec_[a-zA-Z0-9]{24,}/g,
                name: 'Stripe Webhook Secret',
                replacement: '***STRIPE_WEBHOOK_SECRET_REDACTED***'
            },

            // Database connection strings
            redis_url: {
                regex: /redis:\/\/[^:]*:[^@]+@[^\s'"]+/gi,
                name: 'Redis Connection String',
                replacement: 'redis://***USERNAME***:***PASSWORD***@***HOST***'
            },
            postgresql_url: {
                regex: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
                name: 'PostgreSQL Connection String',
                replacement: 'postgresql://***USERNAME***:***PASSWORD***@***HOST***/***DB***'
            },
            mysql_url: {
                regex: /mysql:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
                name: 'MySQL Connection String',
                replacement: 'mysql://***USERNAME***:***PASSWORD***@***HOST***/***DB***'
            },
            mongodb_url: {
                regex: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
                name: 'MongoDB Connection String',
                replacement: 'mongodb://***USERNAME***:***PASSWORD***@***HOST***/***DB***'
            },

            // Личные данные
            email: {
                regex: /(?<![:/@])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?!:[0-9])/g,
                name: 'Email адрес',
                replacement: '***EMAIL_REDACTED***'
            },
            phone_ru: {
                regex: /(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
                name: 'Номер телефона (РФ)',
                replacement: '***PHONE_REDACTED***'
            },
            phone_international: {
                regex: /\+\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g,
                name: 'Международный номер телефона',
                replacement: '***PHONE_REDACTED***'
            },

            // Финансовые данные
            credit_card: {
                regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
                name: 'Номер кредитной карты',
                replacement: '***CARD_NUMBER_REDACTED***'
            },

            // JWT и другие токены
            jwt_token: {
                regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
                name: 'JWT токен',
                replacement: '***JWT_TOKEN_REDACTED***'
            },

            // Приватные ключи
            private_key: {
                regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
                name: 'Приватный ключ SSH/RSA',
                replacement: '***PRIVATE_KEY_REDACTED***'
            }
        },

        // Custom patterns loaded from storage
        customPatterns: {},

        /**
         * Set custom patterns (called from content script via event)
         */
        setCustomPatterns(patterns) {
            this.customPatterns = patterns || {};
            console.log(`🔧 Loaded ${Object.keys(this.customPatterns).length} custom patterns`);
        },

        /**
         * Get all patterns (built-in + custom merged)
         */
        getAllPatterns() {
            // Merge built-in and custom patterns
            // Custom patterns take priority if there's a name collision
            const allPatterns = { ...this.patterns };

            for (const [id, customPattern] of Object.entries(this.customPatterns)) {
                if (customPattern.enabled !== false) {
                    try {
                        allPatterns[id] = {
                            regex: new RegExp(customPattern.regex, customPattern.flags),
                            name: customPattern.name,
                            replacement: customPattern.replacement
                        };
                    } catch (error) {
                        console.error(`❌ Error creating regex for pattern ${id}:`, error);
                    }
                }
            }

            return allPatterns;
        },

        /**
         * Анализирует текст и возвращает найденные чувствительные данные
         * @param {string} text - текст для анализа
         * @returns {Array} массив объектов с информацией о найденных данных
         */
        analyze(text) {
            const findings = [];
            let findingId = 0;

            // Use all patterns (built-in + custom)
            const allPatterns = this.getAllPatterns();

            for (const [type, pattern] of Object.entries(allPatterns)) {
                const matches = text.matchAll(pattern.regex);

                for (const match of matches) {
                    findings.push({
                        id: findingId++,
                        type: type,
                        name: pattern.name,
                        value: match[0],
                        index: match.index,
                        replacement: pattern.replacement
                    });
                }
            }

            // Сортируем по индексу для последовательной обработки
            findings.sort((a, b) => a.index - b.index);

            return findings;
        },

        /**
         * Заменяет найденные чувствительные данные на предложенные замены
         * @param {string} text - исходный текст
         * @param {Array} replacements - массив замен [{id, newValue}]
         * @param {Array} findings - массив найденных данных из analyze()
         * @returns {string} текст с заменами
         */
        replace(text, replacements, findings) {
            if (!replacements || replacements.length === 0) {
                return text;
            }

            let result = text;
            // Создаем карту замен по ID
            const replacementMap = {};
            replacements.forEach(r => {
                replacementMap[r.id] = r.newValue;
            });

            // Заменяем с конца, чтобы индексы не сбивались
            for (let i = findings.length - 1; i >= 0; i--) {
                const finding = findings[i];
                if (replacementMap.hasOwnProperty(finding.id)) {
                    const newValue = replacementMap[finding.id];
                    result = result.substring(0, finding.index) +
                        newValue +
                        result.substring(finding.index + finding.value.length);
                }
            }

            return result;
        },

        /**
         * Быстрая проверка - есть ли в тексте чувствительные данные
         * @param {string} text - текст для проверки
         * @returns {boolean} true если найдены чувствительные данные
         */
        hassSensitiveData(text) {
            // Check all patterns (built-in + custom)
            const allPatterns = this.getAllPatterns();

            for (const pattern of Object.values(allPatterns)) {
                if (pattern.regex.test(text)) {
                    return true;
                }
            }
            return false;
        }
    };

    console.log('🔍 SensitiveDataDetector загружен');

    // Listen for custom pattern injection from content script
    window.addEventListener('sanitizer:setCustomPatterns', (event) => {
        console.log('🎧 Detector: Получено событие sanitizer:setCustomPatterns');
        if (event.detail && event.detail.customPatterns) {
            console.log('📦 Detector: Данные паттернов:', Object.keys(event.detail.customPatterns));
            window.SensitiveDataDetector.setCustomPatterns(event.detail.customPatterns);
        } else {
            console.warn('⚠️ Detector: Нет данных паттернов в событии');
        }
    });
})();

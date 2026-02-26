// Модуль для детектирования чувствительных данных
(function () {
    window.SensitiveDataDetector = {
        // Правила для различных типов чувствительных данных
        patterns: {
            // API ключи популярных сервисов
            openai_key: {
                regex: /sk-(?:proj-|svcacct-|None-)?[a-zA-Z0-9\-_]{20,}/g,
                name: 'API ключ OpenAI',
                replacement: '***OPENAI_KEY_REDACTED***',
                example: 'sk-proj-abc123def456ghi789-jkl0mnopqrst'
            },
            anthropic_key: {
                regex: /sk-ant-[a-zA-Z0-9\-]{95,}/g,
                name: 'API ключ Anthropic (Claude)',
                replacement: '***ANTHROPIC_KEY_REDACTED***',
                example: 'sk-ant-api03-aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6aB7cD8eF9gH0iJ'
            },
            google_api_key: {
                regex: /AIza[0-9A-Za-z\-_]{35}/g,
                name: 'API ключ Google',
                replacement: '***GOOGLE_KEY_REDACTED***',
                example: 'AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q'
            },
            deepseek_key: {
                regex: /sk-[a-f0-9]{32}/g,
                name: 'API ключ DeepSeek',
                replacement: '***DEEPSEEK_KEY_REDACTED***',
                example: 'sk-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
            },
            huggingface_token: {
                regex: /hf_[a-zA-Z0-9]{34,}/g,
                name: 'Hugging Face Token',
                replacement: '***HF_TOKEN_REDACTED***',
                example: 'hf_ABCDefgh1234567890abcDEFGhijklmnoPQR'
            },
            mistral_key: {
                regex: /(?:MISTRAL_API_KEY|mistral_api_key)[\s]*[=:]+[\s]*["']?([a-zA-Z0-9]{32,})["']?/g,
                name: 'API ключ Mistral',
                replacement: 'MISTRAL_API_KEY=***MISTRAL_KEY_REDACTED***',
                example: 'MISTRAL_API_KEY=abc123def456ghi789jkl012mno345pq'
            },
            replicate_token: {
                regex: /r8_[a-zA-Z0-9]{37,}/g,
                name: 'Replicate API Token',
                replacement: '***REPLICATE_TOKEN_REDACTED***',
                example: 'r8_ABCDefgh1234567890abcDEFGhijklmnoPQRstu'
            },
            cohere_key: {
                regex: /(?:COHERE_API_KEY|cohere_api_key|CO_API_KEY)[\s]*[=:]+[\s]*["']?([a-zA-Z0-9]{40,})["']?/g,
                name: 'API ключ Cohere',
                replacement: 'COHERE_API_KEY=***COHERE_KEY_REDACTED***',
                example: 'COHERE_API_KEY=abcDEF123456ghiJKL789012mnoPQR345678stuVWX'
            },

            // AWS ключи (критично!)
            aws_access_key: {
                regex: /AKIA[0-9A-Z]{16}/g,
                name: 'AWS Access Key ID',
                replacement: '***AWS_ACCESS_KEY_REDACTED***',
                example: 'AKIAIOSFODNN7EXAMPLE'
            },
            aws_secret_key: {
                regex: /(?:aws_secret_access_key|secret_access_key|AWS_SECRET_ACCESS_KEY)[\s]*[=:]+[\s]*["']?([A-Za-z0-9/+=]{40})["']?/g,
                name: 'AWS Secret Access Key',
                replacement: 'AWS_SECRET_ACCESS_KEY=***AWS_SECRET_REDACTED***',
                example: 'aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
            },
            aws_session_token: {
                regex: /(?:aws_session_token|AWS_SESSION_TOKEN)[\s]*[=:]+[\s]*["']?([A-Za-z0-9/+=]{100,})["']?/g,
                name: 'AWS Session Token',
                replacement: 'AWS_SESSION_TOKEN=***AWS_SESSION_TOKEN_REDACTED***',
                example: 'AWS_SESSION_TOKEN=FwoGZXIvYXdzEBYaDHbMRkNfJiGDmELxUiLAAU9nBFGYsgimhGOCLnB7GNKFinTyYXQx6RM0Wk3UYgQ3stWxNdKOSrOoakFagMNGP1+EXAMPLE'
            },

            // GitHub токены
            github_token: {
                regex: /ghp_[a-zA-Z0-9]{36}/g,
                name: 'GitHub Personal Access Token',
                replacement: '***GITHUB_TOKEN_REDACTED***',
                example: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh12'
            },
            github_oauth: {
                regex: /gho_[a-zA-Z0-9]{36}/g,
                name: 'GitHub OAuth Token',
                replacement: '***GITHUB_OAUTH_REDACTED***',
                example: 'gho_16C7e42F292c6912E7710c838347Ae178B4a'
            },
            github_pat: {
                regex: /github_pat_[a-zA-Z0-9_]{20,}/g,
                name: 'GitHub Personal Access Token (Fine-grained)',
                replacement: '***GITHUB_PAT_REDACTED***',
                example: 'github_pat_11AABBC_xyzDEFghiJKLmnoPQRstu12345'
            },

            // Slack токены
            slack_bot_token: {
                regex: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
                name: 'Slack Bot Token',
                replacement: '***SLACK_BOT_TOKEN_REDACTED***',
                example: 'xoxb-1234567890-9876543210123-AbCdEfGhIjKlMnOpQrStUvWx'
            },
            slack_user_token: {
                regex: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
                name: 'Slack User Token',
                replacement: '***SLACK_USER_TOKEN_REDACTED***',
                example: 'xoxp-1234567890-9876543210123-AbCdEfGhIjKlMnOpQrStUvWx'
            },
            slack_webhook: {
                regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
                name: 'Slack Webhook URL',
                replacement: '***SLACK_WEBHOOK_REDACTED***',
                example: 'https://hooks.slack.com/services/T0EXAMPLE/B0EXAMPLE/xxXXxxXXxxXXxxXXxxXXxxXX'
            },

            // Discord токены
            discord_token: {
                regex: /[MN][A-Za-z\d]{23,25}\.[A-Za-z\d]{6}\.[A-Za-z\d_\-]{27,}/g,
                name: 'Discord Bot Token',
                replacement: '***DISCORD_TOKEN_REDACTED***',
                example: 'MTAxNTIwODQ3NzM2NTQ5MzEyNg.G8pUwg.ABCDEFGHIJKLMNOPQRSTUVWXYZabc'
            },
            discord_webhook: {
                regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_\-]+/g,
                name: 'Discord Webhook URL',
                replacement: '***DISCORD_WEBHOOK_REDACTED***',
                example: 'https://discord.com/api/webhooks/123456789012345678/abcDEF_ghiJKL-mnoPQR123456'
            },

            // Stripe ключи
            stripe_secret_key: {
                regex: /sk_(live|test)_[a-zA-Z0-9]{24,}/g,
                name: 'Stripe Secret Key',
                replacement: '***STRIPE_SECRET_KEY_REDACTED***',
                example: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc'
            },
            stripe_restricted_key: {
                regex: /rk_(live|test)_[a-zA-Z0-9]{24,}/g,
                name: 'Stripe Restricted Key',
                replacement: '***STRIPE_RESTRICTED_KEY_REDACTED***',
                example: 'rk_live_4eC39HqLyjWDarjtT1zdp7dc'
            },
            stripe_webhook_secret: {
                regex: /whsec_[a-zA-Z0-9]{24,}/g,
                name: 'Stripe Webhook Secret',
                replacement: '***STRIPE_WEBHOOK_SECRET_REDACTED***',
                example: 'whsec_MbzKEEeRTYQODLaqEvSmNLPE'
            },

            // Database connection strings
            redis_url: {
                regex: /redis:\/\/[^:]*:[^@]+@[^\s'"]+/gi,
                name: 'Redis Connection String',
                replacement: 'redis://***USERNAME***:***PASSWORD***@***HOST***',
                example: 'redis://admin:p4ssw0rd@redis.example.com:6379/0'
            },
            postgresql_url: {
                regex: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
                name: 'PostgreSQL Connection String',
                replacement: 'postgresql://***USERNAME***:***PASSWORD***@***HOST***/***DB***',
                example: 'postgresql://dbuser:secret123@db.example.com:5432/myapp'
            },
            mysql_url: {
                regex: /mysql:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
                name: 'MySQL Connection String',
                replacement: 'mysql://***USERNAME***:***PASSWORD***@***HOST***/***DB***',
                example: 'mysql://root:password@mysql.example.com:3306/appdb'
            },
            mongodb_url: {
                regex: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
                name: 'MongoDB Connection String',
                replacement: 'mongodb://***USERNAME***:***PASSWORD***@***HOST***/***DB***',
                example: 'mongodb+srv://admin:pass123@cluster0.example.net/mydb'
            },

            // Личные данные
            email: {
                regex: /(?<![:/@])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?!:[0-9])/g,
                name: 'Email адрес',
                replacement: '***EMAIL_REDACTED***',
                example: 'john.doe@example.com'
            },
            phone_ru: {
                regex: /(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
                name: 'Номер телефона (РФ)',
                replacement: '***PHONE_REDACTED***',
                example: '+7 (999) 123-45-67'
            },
            phone_international: {
                regex: /\+\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g,
                name: 'Международный номер телефона',
                replacement: '***PHONE_REDACTED***',
                example: '+44 20 7946 0958'
            },

            // Финансовые данные
            credit_card: {
                regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
                name: 'Номер кредитной карты',
                replacement: '***CARD_NUMBER_REDACTED***',
                example: '4111111111111111'
            },

            // JWT и другие токены
            jwt_token: {
                regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
                name: 'JWT токен',
                replacement: '***JWT_TOKEN_REDACTED***',
                example: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
            },

            // Приватные ключи
            private_key: {
                regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
                name: 'Приватный ключ SSH/RSA',
                replacement: '***PRIVATE_KEY_REDACTED***',
                example: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0Z3VS5JJcds...\n-----END RSA PRIVATE KEY-----'
            }
        },

        // Custom pattern groups loaded from storage
        customPatternGroups: {},

        /**
         * Set custom pattern groups (called from content script via event)
         * Accepts both new grouped format and legacy flat format
         */
        setCustomPatterns(data) {
            if (!data) {
                this.customPatternGroups = {};
                console.log('🔧 Custom patterns cleared');
                return;
            }

            // Detect format: new grouped vs legacy flat
            const firstValue = Object.values(data)[0];
            if (firstValue && firstValue.patterns !== undefined) {
                // New grouped format
                this.customPatternGroups = data;
                const groupCount = Object.keys(data).length;
                let patternCount = 0;
                for (const g of Object.values(data)) {
                    patternCount += Object.keys(g.patterns || {}).length;
                }
                console.log(`🔧 Loaded ${groupCount} groups, ${patternCount} custom patterns`);
            } else {
                // Legacy flat format — wrap in a single group
                this.customPatternGroups = {
                    legacy: {
                        id: 'legacy',
                        name: 'Legacy Patterns',
                        enabled: true,
                        patterns: data
                    }
                };
                console.log(`🔧 Loaded ${Object.keys(data).length} custom patterns (legacy format)`);
            }
        },

        /**
         * Get all patterns (built-in + custom from enabled groups)
         */
        getAllPatterns() {
            const allPatterns = { ...this.patterns };

            for (const group of Object.values(this.customPatternGroups)) {
                // Skip disabled groups
                if (group.enabled === false) continue;

                for (const [id, customPattern] of Object.entries(group.patterns || {})) {
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
            }

            return allPatterns;
        },

        /**
         * Анализирует текст и возвращает найденные чувствительные данные
         * @param {string} text - текст для анализа
         * @returns {Array} массив объектов с информацией о найденных данных
         */
        analyze(text) {
            // DEBUG: Log strict details about the text to detect invisible chars
            if (text.length < 100) {
                const hex = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
                console.log(`🔍 DEBUG Text Analysis [${text.length}]: "${text}" (Hex: ${hex})`);
            } else {
                console.log(`🔍 DEBUG Text Analysis [${text.length} chars]`);
            }

            const findings = [];
            let findingId = 0;

            // Use all patterns (built-in + custom)
            const allPatterns = this.getAllPatterns();

            for (const [type, pattern] of Object.entries(allPatterns)) {
                // IMPORTANT: Reset lastIndex before using matchAll if the regex is shared
                pattern.regex.lastIndex = 0;

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
                // IMPORTANT: Reset lastIndex to ensure consistent results
                pattern.regex.lastIndex = 0;
                if (pattern.regex.test(text)) {
                    pattern.regex.lastIndex = 0; // Reset again just to be safe
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

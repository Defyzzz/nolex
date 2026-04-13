// Structured Data Scanner for Nolex
// Detects sensitive values by key/tag name in JSON, XML, YAML, .env files
// Runs entirely in browser — local-first, no server calls

(function() {
    'use strict';

    // Sensitive key names — if a key matches, its value is flagged
    const SENSITIVE_KEYS = [
        // Auth & credentials
        'password', 'passwd', 'pass', 'pwd',
        'secret', 'token', 'api_key', 'apikey', 'api-key',
        'auth', 'authorization', 'bearer',
        'credential', 'credentials',
        'private_key', 'privatekey', 'private-key',
        'access_key', 'accesskey', 'access-key',
        'secret_key', 'secretkey', 'secret-key',
        'session', 'session_id', 'sessionid',
        'cookie', 'csrf', 'xsrf',
        // Connection & database
        'connection_string', 'connectionstring',
        'database_url', 'db_url', 'db_password', 'db_pass',
        'mongo_uri', 'redis_url', 'jdbc_url',
        // Keys & tokens
        'client_secret', 'client_id',
        'consumer_key', 'consumer_secret',
        'signing_key', 'encryption_key',
        'webhook_secret', 'webhook_url',
        'ssh_key', 'rsa_key',
        // Personal data
        'ssn', 'social_security',
        'passport', 'passport_number',
        'driver_license', 'license_number',
        'tax_id', 'tin', 'inn', 'snils',
        'credit_card', 'card_number', 'cvv', 'cvc',
        'account_number', 'routing_number', 'iban', 'swift',
        'phone', 'phone_number', 'mobile', 'cell',
        'address', 'home_address', 'street',
        'date_of_birth', 'dob', 'birthday'
    ];

    /**
     * Check if a key name is sensitive (case-insensitive, partial match)
     */
    function isSensitiveKey(key) {
        const lower = key.toLowerCase().replace(/[-\s]/g, '_');
        return SENSITIVE_KEYS.some(sk => lower.includes(sk));
    }

    /**
     * Check if a value is worth flagging (not empty, not a boolean, not too short)
     */
    function isValueWorthFlagging(value) {
        if (typeof value !== 'string') return false;
        const trimmed = value.trim();
        if (trimmed.length < 2) return false;
        // Skip obvious non-sensitive values
        if (['true', 'false', 'null', 'none', 'yes', 'no', '0', '1'].includes(trimmed.toLowerCase())) return false;
        // Skip placeholder values
        if (/^\*{3,}|^<.*>$|^\{.*\}$|^TODO|^CHANGE_ME|^xxx/i.test(trimmed)) return false;
        return true;
    }

    /**
     * Detect file type from content
     */
    function detectType(text) {
        const trimmed = text.trimStart();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
        if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
            // Check if it's actually XML (has closing tags)
            if (/<\/[a-zA-Z]/.test(trimmed)) return 'xml';
        }
        // .env style: KEY=VALUE lines
        const lines = trimmed.split('\n').slice(0, 20);
        const envLines = lines.filter(l => /^[A-Z_][A-Z0-9_]*\s*=/.test(l.trim()));
        if (envLines.length >= 2) return 'env';
        // YAML: key: value lines (no = sign, has : )
        const yamlLines = lines.filter(l => /^[a-zA-Z_][a-zA-Z0-9_-]*\s*:(?!\/)/.test(l.trim()));
        if (yamlLines.length >= 2) return 'yaml';
        return null;
    }

    /**
     * Scan JSON content for sensitive key-value pairs
     */
    function scanJSON(text) {
        const findings = [];
        try {
            const obj = JSON.parse(text);
            walkObject(obj, '', text, findings);
        } catch (e) {
            // Invalid JSON — try line-by-line regex fallback
            scanKeyValueLines(text, findings, /["']([^"']+)["']\s*:\s*["']([^"']+)["']/g);
        }
        return findings;
    }

    /**
     * Recursively walk a parsed JSON object
     */
    function walkObject(obj, path, originalText, findings) {
        if (obj === null || typeof obj !== 'object') return;

        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;

            if (typeof value === 'object' && value !== null) {
                walkObject(value, currentPath, originalText, findings);
            } else if (typeof value === 'string' && isSensitiveKey(key) && isValueWorthFlagging(value)) {
                const index = findValuePosition(originalText, key, value);
                findings.push({
                    type: 'structured_secret',
                    name: `Sensitive Value (${key})`,
                    value: value,
                    index: index,
                    replacement: `***${key.toUpperCase()}_REDACTED***`,
                    confidence: 95,
                    source: 'structured'
                });
            }
        }
    }

    /**
     * Scan XML content for sensitive tags and attributes
     */
    function scanXML(text) {
        const findings = [];

        // Match <TagName>value</TagName>
        const tagRegex = /<([a-zA-Z_][\w.-]*)[^>]*>([^<]+)<\/\1>/g;
        let match;
        while ((match = tagRegex.exec(text)) !== null) {
            const tagName = match[1];
            const value = match[2].trim();
            if (isSensitiveKey(tagName) && isValueWorthFlagging(value)) {
                findings.push({
                    type: 'structured_secret',
                    name: `Sensitive Tag <${tagName}>`,
                    value: value,
                    index: match.index + match[0].indexOf(value),
                    replacement: `***${tagName.toUpperCase()}_REDACTED***`,
                    confidence: 95,
                    source: 'structured'
                });
            }
        }

        // Match attribute values: name="password" value="secret123"
        const attrRegex = /(\w+)=["']([^"']+)["']/g;
        const attrPairs = [];
        while ((match = attrRegex.exec(text)) !== null) {
            attrPairs.push({ name: match[1], value: match[2], index: match.index });
        }
        // Check pairs: if name attr is sensitive, flag value attr nearby
        for (let i = 0; i < attrPairs.length - 1; i++) {
            const nameAttr = attrPairs[i];
            const valueAttr = attrPairs[i + 1];
            if (nameAttr.name.toLowerCase() === 'name' && isSensitiveKey(nameAttr.value) &&
                valueAttr.name.toLowerCase() === 'value' && isValueWorthFlagging(valueAttr.value)) {
                findings.push({
                    type: 'structured_secret',
                    name: `Sensitive Attr (${nameAttr.value})`,
                    value: valueAttr.value,
                    index: valueAttr.index + valueAttr.name.length + 2,
                    replacement: `***${nameAttr.value.toUpperCase()}_REDACTED***`,
                    confidence: 90,
                    source: 'structured'
                });
            }
        }

        return findings;
    }

    /**
     * Scan .env style content: KEY=VALUE
     */
    function scanEnv(text) {
        const findings = [];
        const lines = text.split('\n');
        let offset = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
                offset += line.length + 1;
                continue;
            }

            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
                const key = trimmed.substring(0, eqIndex).trim();
                let value = trimmed.substring(eqIndex + 1).trim();
                // Strip surrounding quotes
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                if (isSensitiveKey(key) && isValueWorthFlagging(value)) {
                    const valueStart = offset + line.indexOf(value);
                    findings.push({
                        type: 'structured_secret',
                        name: `Sensitive Env (${key})`,
                        value: value,
                        index: valueStart,
                        replacement: `***${key.toUpperCase()}_REDACTED***`,
                        confidence: 95,
                        source: 'structured'
                    });
                }
            }
            offset += line.length + 1;
        }
        return findings;
    }

    /**
     * Scan YAML content: key: value
     */
    function scanYAML(text) {
        const findings = [];
        const lines = text.split('\n');
        let offset = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                offset += line.length + 1;
                continue;
            }

            // Match key: value (not URLs like http://)
            const yamlMatch = trimmed.match(/^([a-zA-Z_][\w.-]*)\s*:\s+(.+)$/);
            if (yamlMatch) {
                const key = yamlMatch[1];
                let value = yamlMatch[2].trim();
                // Strip surrounding quotes
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                if (isSensitiveKey(key) && isValueWorthFlagging(value)) {
                    const valueStart = offset + line.indexOf(value);
                    findings.push({
                        type: 'structured_secret',
                        name: `Sensitive Config (${key})`,
                        value: value,
                        index: valueStart,
                        replacement: `***${key.toUpperCase()}_REDACTED***`,
                        confidence: 90,
                        source: 'structured'
                    });
                }
            }
            offset += line.length + 1;
        }
        return findings;
    }

    /**
     * Fallback: scan key-value patterns with regex
     */
    function scanKeyValueLines(text, findings, regex) {
        let match;
        while ((match = regex.exec(text)) !== null) {
            const key = match[1];
            const value = match[2];
            if (isSensitiveKey(key) && isValueWorthFlagging(value)) {
                findings.push({
                    type: 'structured_secret',
                    name: `Sensitive Value (${key})`,
                    value: value,
                    index: match.index + match[0].indexOf(value),
                    replacement: `***${key.toUpperCase()}_REDACTED***`,
                    confidence: 85,
                    source: 'structured'
                });
            }
        }
    }

    /**
     * Find the position of a value in original text near its key
     */
    function findValuePosition(text, key, value) {
        // Search for key near value
        const keyIndex = text.indexOf(`"${key}"`);
        if (keyIndex !== -1) {
            const valueIndex = text.indexOf(`"${value}"`, keyIndex);
            if (valueIndex !== -1) return valueIndex + 1; // skip opening quote
        }
        // Fallback
        const idx = text.indexOf(value);
        return idx !== -1 ? idx : 0;
    }

    // Public API
    window.NolexStructured = {
        /**
         * Analyze text for structured sensitive data
         * @param {string} text - File content to analyze
         * @returns {Array} Array of findings compatible with detector.js
         */
        analyze(text) {
            if (!text || text.length < 5) return [];

            const type = detectType(text);
            if (!type) return [];

            console.log(`🔧 Structured: Detected ${type} format`);

            let findings;
            switch (type) {
                case 'json': findings = scanJSON(text); break;
                case 'xml':  findings = scanXML(text); break;
                case 'env':  findings = scanEnv(text); break;
                case 'yaml': findings = scanYAML(text); break;
                default: return [];
            }

            console.log(`🔧 Structured: Found ${findings.length} sensitive values`);
            return findings;
        },

        /**
         * Get the list of sensitive keys
         */
        getSensitiveKeys() {
            return [...SENSITIVE_KEYS];
        },

        /**
         * Check if a key name is considered sensitive
         */
        isSensitiveKey(key) {
            return isSensitiveKey(key);
        }
    };

    console.log('🔧 NolexStructured scanner loaded');
})();

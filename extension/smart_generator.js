// Smart Pattern Generator - AI-powered regex generation from examples
(function () {
    window.SmartGenerator = {
        // Library of heuristic patterns (ordered from specific to general)
        HEURISTIC_PATTERNS: [
            {
                name: "IPv4 Address",
                icon: "🌐",
                exampleMatch: /\b(\d{1,3}\.){3}\d{1,3}\b/g,
                replacement: '((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
                description: "IP address like 192.168.1.1"
            },
            {
                name: "IPv6 Address",
                icon: "🌐",
                exampleMatch: /\b([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
                replacement: '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}',
                description: "IPv6 address"
            },
            {
                name: "Email Address",
                icon: "📧",
                exampleMatch: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
                replacement: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
                description: "Email like user@example.com"
            },
            {
                name: "URL",
                icon: "🔗",
                exampleMatch: /https?:\/\/[^\s<>"']+/g,
                replacement: 'https?:\\/\\/[^\\s<>"\']+',
                description: "HTTP/HTTPS URL"
            },
            {
                name: "UUID",
                icon: "🆔",
                exampleMatch: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
                replacement: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
                description: "UUID like 550e8400-e29b-41d4-a716-446655440000"
            },
            {
                name: "Hex Token (32+ chars)",
                icon: "🔐",
                exampleMatch: /\b[a-fA-F0-9]{32,}\b/g,
                replacement: '[a-fA-F0-9]{32,}',
                description: "Long hexadecimal token"
            },
            {
                name: "Alphanumeric Token (20+ chars)",
                icon: "🎫",
                exampleMatch: /\b[a-zA-Z0-9]{20,}\b/g,
                replacement: '[a-zA-Z0-9]{20,}',
                description: "Long alphanumeric string"
            },
            {
                name: "Base64 String",
                icon: "🔢",
                exampleMatch: /\b[A-Za-z0-9+/]{20,}={0,2}\b/g,
                replacement: '[A-Za-z0-9+/]{20,}={0,2}',
                description: "Base64 encoded string"
            },
            {
                name: "Port Number",
                icon: "🔌",
                exampleMatch: /:\d{2,5}\b/g,
                replacement: ':\\d{2,5}',
                description: "Port number like :8080"
            },
            {
                name: "Generic Number",
                icon: "🔢",
                exampleMatch: /\b\d+\b/g,
                replacement: '\\d+',
                description: "Any number"
            },
            {
                name: "Word Characters",
                icon: "📝",
                exampleMatch: /\b[a-zA-Z]+\b/g,
                replacement: '[a-zA-Z]+',
                description: "Letters only"
            }
        ],

        /**
         * Main function: Generate regex pattern from example string
         * @param {string} inputString - User's example string
         * @param {object} options - Configuration options
         * @returns {object} Generated pattern with metadata
         */
        generateRegexFromExample(inputString, options = {}) {
            const {
                strictMode = false,      // If true, match exact value instead of pattern
                requirePrefix = true,     // If true, keep static prefix
                caseSensitive = false     // Case sensitivity
            } = options;

            if (!inputString || inputString.trim() === '') {
                return null;
            }

            // If strict mode, just escape the input
            if (strictMode) {
                return {
                    regex: this.escapeRegex(inputString),
                    flags: caseSensitive ? 'g' : 'gi',
                    detectedPatterns: [],
                    staticParts: [{ text: inputString, isStatic: true }],
                    confidence: 100
                };
            }

            // Analyze the input and detect patterns
            const analysis = this.analyzeInput(inputString);

            // Generate regex by replacing detected patterns
            let regexPattern = this.buildRegexPattern(inputString, analysis, requirePrefix);

            return {
                regex: regexPattern,
                flags: caseSensitive ? 'g' : 'gi',
                detectedPatterns: analysis.detectedPatterns,
                staticParts: analysis.parts,
                confidence: analysis.confidence,
                warnings: analysis.warnings
            };
        },

        /**
         * Analyze input string and detect known patterns
         * @param {string} input - Input string to analyze
         * @returns {object} Analysis result
         */
        analyzeInput(input) {
            const detectedPatterns = [];
            const parts = [];
            let lastIndex = 0;
            let confidence = 50; // Base confidence
            const warnings = [];

            // Detect separator patterns (key=value, key:value, "key": value)
            const separatorRegex = /^([^=:]+)(=|:\s*|":\s*)/;
            const separatorMatch = input.match(separatorRegex);

            let staticPrefixEnd = 0;

            // If we found a separator, the left part is always static
            if (separatorMatch) {
                staticPrefixEnd = separatorMatch[1].length + separatorMatch[2].length;

                // Add static prefix (including separator)
                parts.push({
                    text: input.substring(0, staticPrefixEnd),
                    isStatic: true,
                    start: 0,
                    end: staticPrefixEnd
                });

                lastIndex = staticPrefixEnd;
                confidence += 20; // Boost confidence for having a key=value pattern
            }

            // Create a map of matches with their positions (only search after prefix)
            const matches = [];
            const searchStart = staticPrefixEnd;

            // Find all pattern matches in the remaining part
            for (const pattern of this.HEURISTIC_PATTERNS) {
                const regex = new RegExp(pattern.exampleMatch);
                let match;

                // Reset regex
                pattern.exampleMatch.lastIndex = 0;

                // Only search in the part after the static prefix
                const searchText = input.substring(searchStart);

                while ((match = pattern.exampleMatch.exec(searchText)) !== null) {
                    matches.push({
                        start: match.index + searchStart,
                        end: match.index + match[0].length + searchStart,
                        value: match[0],
                        pattern: pattern
                    });
                }
            }

            // Sort matches by position
            matches.sort((a, b) => a.start - b.start);

            // Remove overlapping matches (keep first/best match)
            const filteredMatches = [];
            let lastEnd = searchStart - 1;
            for (const match of matches) {
                if (match.start >= lastEnd) {
                    filteredMatches.push(match);
                    lastEnd = match.end;
                }
            }

            // Build parts array for the value part (after prefix)
            for (const match of filteredMatches) {
                // Add static part before this match
                if (match.start > lastIndex) {
                    const staticText = input.substring(lastIndex, match.start);
                    if (staticText.length > 0) {
                        parts.push({
                            text: staticText,
                            isStatic: true,
                            start: lastIndex,
                            end: match.start
                        });
                    }
                }

                // Add dynamic part (the match)
                parts.push({
                    text: match.value,
                    isStatic: false,
                    pattern: match.pattern,
                    start: match.start,
                    end: match.end
                });

                detectedPatterns.push(match.pattern);
                lastIndex = match.end;
                confidence += 10; // Increase confidence for each detected pattern
            }

            // Add remaining static text
            if (lastIndex < input.length) {
                const remainingText = input.substring(lastIndex);
                if (remainingText.length > 0) {
                    parts.push({
                        text: remainingText,
                        isStatic: true,
                        start: lastIndex,
                        end: input.length
                    });
                }
            }

            // Calculate confidence and warnings
            const hasStaticPrefix = parts.length > 0 && parts[0].isStatic && parts[0].text.length > 0;

            if (!hasStaticPrefix) {
                warnings.push("No static prefix found. Pattern might be too broad.");
                confidence -= 20;
            }

            if (detectedPatterns.length === 0 && !separatorMatch) {
                warnings.push("No recognizable patterns detected. Using generic pattern.");
                confidence -= 20;
            }

            confidence = Math.max(0, Math.min(100, confidence));

            return {
                parts,
                detectedPatterns,
                confidence,
                warnings,
                hasStaticPrefix
            };
        },

        /**
         * Build final regex pattern from analysis
         * @param {string} input - Original input
         * @param {object} analysis - Analysis result
         * @param {boolean} requirePrefix - Whether to keep static prefix
         * @returns {string} Regex pattern string
         */
        buildRegexPattern(input, analysis, requirePrefix) {
            let pattern = '';

            for (const part of analysis.parts) {
                if (part.isStatic) {
                    // Escape static parts
                    pattern += this.escapeRegex(part.text);
                } else {
                    // Use pattern's replacement regex
                    if (part.pattern && part.pattern.replacement) {
                        pattern += part.pattern.replacement;
                    } else {
                        // Fallback: escape the text
                        pattern += this.escapeRegex(part.text);
                    }
                }
            }

            return pattern;
        },

        /**
         * Escape special regex characters
         * @param {string} str - String to escape
         * @returns {string} Escaped string
         */
        escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        /**
         * Test generated pattern against test strings
         * @param {string} patternStr - Regex pattern string
         * @param {string} flags - Regex flags
         * @param {string} testString - String to test against
         * @returns {object} Test result
         */
        testPattern(patternStr, flags, testString) {
            try {
                const regex = new RegExp(patternStr, flags);
                const matches = [];
                let match;

                while ((match = regex.exec(testString)) !== null) {
                    matches.push({
                        value: match[0],
                        index: match.index,
                        length: match[0].length
                    });

                    // Prevent infinite loop
                    if (!flags.includes('g')) break;
                }

                return {
                    success: true,
                    matches,
                    matchCount: matches.length
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        },

        /**
         * Highlight pattern parts in HTML for visualization
         * @param {Array} parts - Parts array from analysis
         * @returns {string} HTML string with highlighted parts
         */
        highlightParts(parts) {
            return parts.map(part => {
                if (part.isStatic) {
                    return `<span class="static-part">${this.escapeHtml(part.text)}</span>`;
                } else {
                    const icon = part.pattern ? part.pattern.icon : '🔍';
                    const name = part.pattern ? part.pattern.name : 'Unknown';
                    return `<span class="dynamic-part" title="${name}">${icon} ${this.escapeHtml(part.text)}</span>`;
                }
            }).join('');
        },

        /**
         * Escape HTML special characters
         * @param {string} text - Text to escape
         * @returns {string} Escaped HTML
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    console.log('✨ SmartGenerator loaded');
})();

// NER Engine for Nolex Pro
// Uses Transformers.js with multilingual BERT NER model
// Runs entirely in browser — local-first, no server calls

(function() {
    'use strict';

    const MODEL_ID = 'Xenova/bert-base-multilingual-cased-ner-hrl';
    let nerPipeline = null;
    let isLoading = false;
    let loadError = null;

    const TYPE_LABELS = {
        'PER': 'Person',
        'LOC': 'Location',
        'ORG': 'Organization',
        'MISC': 'Miscellaneous'
    };

    /**
     * Check if a word is a subword continuation.
     * Handles both "##suffix" format and single-char continuations
     * that are part of a longer word in the original text.
     */
    function isSubword(word) {
        return word.startsWith('##');
    }

    /**
     * Strip subword prefix
     */
    function stripSubword(word) {
        return word.startsWith('##') ? word.substring(2) : word;
    }

    /**
     * Merges raw B-/I- tokens and subwords into complete entities.
     * B-PER "John" + I-PER "Smith" → { type: "PER", text: "John Smith" }
     * B-ORG "С" + I-ORG "##ид" + I-ORG "##оров" → { type: "ORG", text: "Сидоров" }
     * Also handles cases where tokenizer splits "АЛЕКСАНДР" → "АЛ" + "ЕКСАНДР"
     * without ## prefix (detected by checking original text).
     */
    function mergeEntities(rawEntities, originalText) {
        const merged = [];
        let current = null;

        for (let i = 0; i < rawEntities.length; i++) {
            const token = rawEntities[i];
            const label = token.entity || '';
            const prefix = label.substring(0, 2);
            const type = label.substring(2);
            const word = token.word || '';
            const score = token.score || 0;
            const tokenIndex = token.index || 0;

            if (prefix === 'B-') {
                if (current) merged.push(current);
                current = {
                    type,
                    parts: [stripSubword(word)],
                    scoreSum: score,
                    tokenCount: 1,
                    firstTokenIndex: tokenIndex
                };
            } else if (prefix === 'I-' && current && current.type === type) {
                if (isSubword(word)) {
                    // Definite subword — concatenate without space
                    const lastIdx = current.parts.length - 1;
                    current.parts[lastIdx] += stripSubword(word);
                } else {
                    // Could be a new word OR a continuation without ## prefix
                    // Check if the previous part + this word appear joined in original text
                    const lastPart = current.parts[current.parts.length - 1];
                    const joined = lastPart + word;
                    if (originalText && originalText.toLowerCase().includes(joined.toLowerCase())) {
                        // They appear joined in original — concatenate
                        current.parts[current.parts.length - 1] = joined;
                    } else {
                        // Separate word in same entity
                        current.parts.push(word);
                    }
                }
                current.scoreSum += score;
                current.tokenCount += 1;
            } else {
                if (current) merged.push(current);
                current = {
                    type: type || 'MISC',
                    parts: [stripSubword(word)],
                    scoreSum: score,
                    tokenCount: 1,
                    firstTokenIndex: tokenIndex
                };
            }
        }
        if (current) merged.push(current);

        // Build final text and clean up
        return merged
            .map(e => {
                let text = e.parts.join(' ');
                // Fix spacing before punctuation: "ул . Ленина" → "ул. Ленина"
                text = text.replace(/\s+([.,!?;:])/g, '$1').trim();
                return {
                    type: e.type,
                    label: TYPE_LABELS[e.type] || e.type,
                    text,
                    score: e.scoreSum / e.tokenCount,
                    confidence: Math.round((e.scoreSum / e.tokenCount) * 100)
                };
            })
            .filter(e => e.confidence >= 50 && e.text.length >= 2);
    }

    /**
     * Find the position of entity text in the original string.
     * Uses case-insensitive search and tries multiple strategies.
     */
    function findEntityPosition(text, entityText, startFrom) {
        // 1. Exact match
        let idx = text.indexOf(entityText, startFrom);
        if (idx !== -1) return idx;

        // 2. Case-insensitive match
        const textLower = text.toLowerCase();
        const entityLower = entityText.toLowerCase();
        idx = textLower.indexOf(entityLower, startFrom);
        if (idx !== -1) return idx;

        // 3. Try matching each word of the entity separately, return position of first word
        const words = entityText.split(/\s+/);
        if (words.length > 0) {
            const firstWord = words[0];
            idx = textLower.indexOf(firstWord.toLowerCase(), startFrom);
            if (idx !== -1) return idx;
        }

        // 4. Try from beginning (entity may appear before startFrom)
        idx = textLower.indexOf(entityLower);
        if (idx !== -1) return idx;

        return -1;
    }

    /**
     * Convert NER entities to detector.js-compatible findings format.
     * Each entity gets its own correct position in the original text.
     */
    function entitiesToFindings(entities, originalText) {
        const findings = [];
        const usedPositions = new Set();

        for (const entity of entities) {
            // Find position, avoiding already-used positions
            let searchFrom = 0;
            let index = -1;

            while (searchFrom < originalText.length) {
                index = findEntityPosition(originalText, entity.text, searchFrom);
                if (index === -1) break;
                if (!usedPositions.has(`${entity.type}_${index}`)) break;
                searchFrom = index + 1;
            }

            if (index !== -1) {
                usedPositions.add(`${entity.type}_${index}`);
            }

            findings.push({
                type: `ner_${entity.type.toLowerCase()}`,
                name: `${entity.label} (AI)`,
                value: entity.text,
                index: index !== -1 ? index : 0,
                replacement: `{{REDACTED_${entity.type}}}`,
                confidence: entity.confidence,
                source: 'ner'
            });
        }

        return findings;
    }

    // Public API
    window.NolexNER = {
        /**
         * Check if model is loaded and ready
         */
        isReady() {
            return nerPipeline !== null;
        },

        /**
         * Check if model is currently loading
         */
        isLoading() {
            return isLoading;
        },

        /**
         * Get load error if any
         */
        getError() {
            return loadError;
        },

        /**
         * Load the NER model. Call once, model is cached by Transformers.js.
         * @returns {Promise<boolean>} true if loaded successfully
         */
        async load() {
            if (nerPipeline) return true;
            if (isLoading) return false;

            isLoading = true;
            loadError = null;

            try {
                console.log('🧠 NER: Loading model...');
                const startTime = Date.now();

                // Dynamic import of Transformers.js
                const { pipeline } = await import(
                    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1'
                );

                nerPipeline = await pipeline('token-classification', MODEL_ID);

                const loadTime = Date.now() - startTime;
                console.log(`🧠 NER: Model loaded in ${loadTime}ms`);
                isLoading = false;
                return true;
            } catch (error) {
                console.error('🧠 NER: Failed to load model:', error);
                loadError = error.message;
                isLoading = false;
                return false;
            }
        },

        /**
         * Analyze text for named entities.
         * @param {string} text - Text to analyze
         * @returns {Promise<Array>} Array of findings compatible with detector.js
         */
        async analyze(text) {
            if (!nerPipeline) {
                console.warn('🧠 NER: Model not loaded, skipping analysis');
                return [];
            }

            if (!text || text.length < 5) return [];

            try {
                const startTime = Date.now();

                // Pre-process: convert UPPERCASE words to Title Case for better NER
                // NER models work poorly with all-caps text like "GRACHEV IVAN"
                const normalizedText = text.replace(
                    /\b([A-ZА-ЯЁ]{2,})\b/g,
                    (match) => match.charAt(0) + match.slice(1).toLowerCase()
                );

                const raw = await nerPipeline(normalizedText);
                const entities = mergeEntities(raw, normalizedText);

                // Map findings back to original text positions
                const findings = entitiesToFindings(entities, text);
                const inferTime = Date.now() - startTime;

                console.log(`🧠 NER: Found ${findings.length} entities in ${inferTime}ms`);
                return findings;
            } catch (error) {
                console.error('🧠 NER: Analysis error:', error);
                return [];
            }
        },

        /**
         * Get type labels mapping
         */
        getTypeLabels() {
            return { ...TYPE_LABELS };
        }
    };

    // Auto-load model when script is injected
    window.NolexNER.load();

    // Listen for toggle from popup via content.js
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data && event.data.type === 'NOLEX_NER_TOGGLED') {
            if (event.data.enabled) {
                window.NolexNER.load();
            }
        }
    });

    console.log('🧠 NolexNER engine loaded, model loading in background...');
})();

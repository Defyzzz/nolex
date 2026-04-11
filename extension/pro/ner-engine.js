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
                    // Definite subword (##suffix) — concatenate without space
                    const lastIdx = current.parts.length - 1;
                    current.parts[lastIdx] += stripSubword(word);
                } else if (word.length === 1 && !isSubword(word)) {
                    // Single char without ## — might be start of a split word
                    // Check if next token is ## continuation
                    const nextToken = i + 1 < rawEntities.length ? rawEntities[i + 1] : null;
                    if (nextToken && isSubword(nextToken.word) && nextToken.entity.substring(2) === type) {
                        // Will be joined with next token — start new part
                        current.parts.push(word);
                    } else {
                        current.parts.push(word);
                    }
                } else {
                    // Regular word without ## — always separate word in the entity
                    current.parts.push(word);
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
            .filter(e => {
                // For Person entities, use lower threshold (names often have low-confidence middle tokens)
                const threshold = e.type === 'PER' ? 60 : 75;
                return e.confidence >= threshold && e.text.length >= 3;
            });
    }

    /**
     * Remove entities that are substrings of longer entities of the same type.
     * "Дуна" is removed if "Дунаев" exists. "Кингисепп" kept if no longer version.
     */
    function deduplicateEntities(entities) {
        return entities.filter((entity, i) => {
            // Check if this entity's text is a substring of any other entity's text
            return !entities.some((other, j) => {
                if (i === j) return false;
                if (other.type !== entity.type) return false;
                if (other.text.length <= entity.text.length) return false;
                return other.text.toLowerCase().includes(entity.text.toLowerCase());
            });
        });
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

                // Pre-process: strip XML/HTML tags — NER only needs text content
                // Add newline after closing tags to prevent word merging
                let cleanText = text
                    .replace(/<\/[^>]+>/g, '\n')       // closing tags → newline
                    .replace(/<[^>]+>/g, ' ')           // opening tags → space
                    .replace(/[^\S\n]+/g, ' ')          // collapse spaces (keep newlines)
                    .replace(/\n+/g, '\n')              // collapse newlines
                    .trim();

                // Convert UPPERCASE words to Title Case for better NER
                const normalizedText = cleanText.replace(
                    /(?<![a-zA-Zа-яА-ЯёЁ])([A-ZА-ЯЁ]{2,})(?![a-zA-Zа-яА-ЯёЁ])/g,
                    (match) => match.charAt(0) + match.slice(1).toLowerCase()
                );

                // Split into chunks by sentences/lines (BERT limit ~512 tokens)
                const MAX_CHUNK_CHARS = 200;
                const MAX_CHUNKS = 150;
                let allEntities = [];

                // Split text into natural segments (lines, sentences)
                const lines = normalizedText.split(/\n+/);
                const chunks = [];
                let currentChunk = '';

                for (const line of lines) {
                    if (currentChunk.length + line.length + 1 > MAX_CHUNK_CHARS && currentChunk.length > 0) {
                        chunks.push(currentChunk);
                        currentChunk = line;
                    } else {
                        currentChunk += (currentChunk ? '\n' : '') + line;
                    }
                }
                if (currentChunk.trim()) chunks.push(currentChunk);

                if (chunks.length <= 1) {
                    const raw = await nerPipeline(normalizedText);
                    allEntities = mergeEntities(raw, normalizedText);
                } else {
                    const seenTexts = new Set();
                    const total = Math.min(chunks.length, MAX_CHUNKS);

                    for (let i = 0; i < total; i++) {
                        const raw = await nerPipeline(chunks[i]);
                        const chunkEntities = mergeEntities(raw, chunks[i]);

                        for (const entity of chunkEntities) {
                            const key = `${entity.type}:${entity.text}`;
                            if (!seenTexts.has(key)) {
                                seenTexts.add(key);
                                allEntities.push(entity);
                            }
                        }
                    }

                    console.log(`🧠 NER: Processed ${total} chunks (${normalizedText.length} chars)`);
                }

                // Deduplicate: remove substrings of longer entities
                const cleanEntities = deduplicateEntities(allEntities);
                console.log(`🧠 NER: ${allEntities.length} raw → ${cleanEntities.length} after dedup`);

                // Map findings back to original text positions
                const findings = entitiesToFindings(cleanEntities, text);
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

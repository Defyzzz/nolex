// PDF Text Extractor for Nolex Pro
// Uses Mozilla pdf.js to extract text from PDF files in the browser

(function() {
    'use strict';

    const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.min.mjs';
    const PDFJS_WORKER_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs';

    let pdfjsLib = null;
    let isLoading = false;

    /**
     * Load pdf.js library from CDN
     */
    async function loadPdfJs() {
        if (pdfjsLib) return true;
        if (isLoading) return false;

        isLoading = true;
        try {
            console.log('📄 PDF Parser: Loading pdf.js...');
            const startTime = Date.now();

            pdfjsLib = await import(PDFJS_CDN);
            pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

            console.log(`📄 PDF Parser: Loaded in ${Date.now() - startTime}ms`);
            isLoading = false;
            return true;
        } catch (error) {
            console.error('📄 PDF Parser: Failed to load pdf.js:', error);
            isLoading = false;
            return false;
        }
    }

    /**
     * Extract text from all pages of a PDF file
     * @param {ArrayBuffer} arrayBuffer - PDF file contents
     * @returns {Promise<string>} Extracted text from all pages
     */
    async function extractText(arrayBuffer) {
        if (!pdfjsLib) {
            const loaded = await loadPdfJs();
            if (!loaded) throw new Error('Failed to load PDF parser');
        }

        const startTime = Date.now();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        console.log(`📄 PDF: ${totalPages} page(s)`);

        const pageTexts = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Join text items with proper spacing
            let pageText = '';
            let lastY = null;

            for (const item of textContent.items) {
                if (item.str === undefined) continue;

                const y = item.transform ? item.transform[5] : null;

                // New line if Y position changed significantly
                if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
                    pageText += '\n';
                } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
                    pageText += ' ';
                }

                pageText += item.str;
                lastY = y;
            }

            pageTexts.push(pageText.trim());
        }

        const fullText = pageTexts.join('\n\n');

        // Deduplicate repeated fragments (PDF layers can cause "АэрофлотАэрофлот")
        const dedupedText = fullText.replace(/(.{4,}?)\1+/g, '$1');

        console.log(`📄 PDF: Extracted ${dedupedText.length} chars in ${Date.now() - startTime}ms`);

        return dedupedText;
    }

    /**
     * Check if a file is a PDF
     */
    function isPdf(file) {
        if (file.type === 'application/pdf') return true;
        if (file.name && file.name.toLowerCase().endsWith('.pdf')) return true;
        return false;
    }

    // Public API
    window.NolexPDF = {
        isPdf,
        extractText,
        loadPdfJs,

        isReady() {
            return pdfjsLib !== null;
        },

        isLoading() {
            return isLoading;
        }
    };

    // Pre-load pdf.js
    loadPdfJs();

    console.log('📄 NolexPDF parser loaded');
})();

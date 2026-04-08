# FAQ

Common questions and answers about Nolex.

---

## General

### Is Nolex free?

Yes. The core extension with all 40+ built-in patterns, clipboard protection, file scanning, and custom patterns is completely free.

Pro features (document scanning for PDF/Excel, team sync, cloud backup) are coming soon.

### Does Nolex work on my browser?

Nolex works on all Chromium-based browsers:
- Google Chrome
- Microsoft Edge
- Brave
- Opera

Firefox and Safari are not yet supported.

### Does Nolex work offline?

Yes. Since all scanning happens locally in your browser, Nolex works without an internet connection. The only thing that requires internet is the AI chatbot itself.

### Does Nolex slow down my browser?

No. Nolex has negligible performance impact:
- **Memory:** ~2 MB
- **CPU:** Only active during paste/upload events (not running in background)
- **Scan time:** < 5ms for typical files

### Do I need to create an account?

No. Nolex works immediately after installation with no registration required.

---

## Detection & Accuracy

### Nolex detected something that isn't sensitive (false positive)

This can happen, especially with:
- Phone numbers embedded in large numbers
- Credit card patterns in order IDs
- Email-like strings in URLs

**Solutions:**

1. **Use Strict Filter** -- click the "Strict Filter" button in the dialog to remove context-dependent false positives
2. **Uncheck the finding** -- in the dialog, uncheck the checkbox next to the false positive
3. **Click "Keep As Is"** -- proceed with the original data unchanged
4. **Leave feedback** -- report the false positive in the dialog's feedback field

### Nolex missed sensitive data (false negative)

Built-in patterns cover the most common formats. If Nolex missed something:

1. **Create a custom pattern** using the [Smart Constructor](../features/smart-constructor.md)
2. **Report it** via the feedback form or at [GitHub Issues](https://github.com/Defyzzz/nolex/issues)

### Can I disable specific built-in patterns?

Currently, all built-in patterns are always active. You can:
- Use **Strict Filter** to reduce false positives
- **Uncheck** specific findings in the dialog
- Custom pattern groups can be individually enabled/disabled

### Does Nolex detect data in images?

No. Nolex only scans plain text content. It cannot read text in images, PDFs, or other non-text formats. Document scanning is planned as a Pro feature.

---

## Privacy & Security

### Does Nolex send my data anywhere?

No. All scanning happens locally in your browser. See [Local-First Architecture](../privacy/local-first.md) for details.

### What data does Nolex store?

Only your settings and statistics:
- File extension whitelist configuration
- Custom detection patterns you created
- Detection counts (e.g., "5 API keys detected total")

Nolex does NOT store file content, clipboard text, or the actual values of detected data.

### Can Nolex read my passwords?

No. Nolex does not have access to Chrome's password manager. It only scans text that **you** paste or files that **you** upload.

### Is the source code available?

Yes. Nolex is open source: [github.com/Defyzzz/nolex](https://github.com/Defyzzz/nolex)

### What happens to my feedback?

Feedback submitted through the dialog is collected anonymously via Google Forms. It contains only the text you typed -- no file content, no clipboard data, no personal information.

---

## Troubleshooting

### Nolex icon shows "OFF"

The extension is disabled. Click the icon and toggle the switch to enable it.

### The dialog didn't appear when I pasted sensitive data

Possible causes:

1. **Nolex is disabled** -- check the toggle in the popup
2. **The data doesn't match any pattern** -- check [Built-in Patterns](../patterns/built-in-patterns.md)
3. **The page intercepted the paste first** -- some websites override paste behavior
4. **The paste was programmatic** -- Nolex only intercepts user-initiated paste (Ctrl+V / Cmd+V)

### The dialog appeared but text wasn't inserted after my choice

This can happen on websites with custom input fields. Nolex supports standard inputs, textareas, and contentEditable elements. If a website uses a non-standard input method, the text may not insert correctly.

**Workaround:** Click "Keep As Is" and paste manually, or copy the cleaned text from the dialog.

### My custom patterns aren't working

1. Verify the regex syntax in the Smart Constructor's test feature
2. Check that the pattern group is enabled
3. Check that the individual pattern is enabled (checkbox)
4. Reload the page after saving new patterns

### How do I reset everything?

To reset Nolex to its default state:

1. Go to `chrome://extensions`
2. Find Nolex
3. Click **"Remove"**
4. Reinstall from the [Chrome Web Store](https://chromewebstore.google.com/detail/nolex/chebnmpkokgdhdcmlfooilohcanlpppp)

This clears all settings, custom patterns, and statistics.

---

## Getting Help

- **GitHub Issues:** [github.com/Defyzzz/nolex/issues](https://github.com/Defyzzz/nolex/issues)
- **Email:** riskoffice23@gmail.com
- **Website:** [getnolex.com](https://getnolex.com)

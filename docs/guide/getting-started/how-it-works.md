# How It Works

Nolex works as an invisible security layer inside your browser. Here's what happens under the hood.

## Architecture Overview

```
 YOUR BROWSER
 +-------------------------------------------------+
 |                                                  |
 |   [You type/paste/upload]                        |
 |          |                                       |
 |          v                                       |
 |   +------------------+                           |
 |   |  Nolex Detector  |  <-- 40+ regex patterns   |
 |   |  (runs locally)  |  <-- your custom patterns  |
 |   +------------------+                           |
 |          |                                       |
 |    Found sensitive data?                         |
 |     /          \                                 |
 |   No            Yes                              |
 |    |              |                              |
 |    v              v                              |
 | [Data sent    [Dialog shown]                     |
 |  normally]     You decide:                       |
 |               Cancel / Keep / Replace            |
 |                                                  |
 +-------------------------------------------------+
                    |
                    v  (only after your decision)
              [AI Service]
```

**Key point:** Everything happens inside your browser. No data is sent to Nolex servers because there are no Nolex servers.

## The Three Interception Points

### 1. File Upload Interception

When any website sends a file via `fetch()` or `XMLHttpRequest` (this is how all AI chatbots work), Nolex intercepts the request **before** it leaves your browser.

```
Supported upload methods:
  - Drag-and-drop files
  - File picker ("Attach file" button)
  - Direct file API calls
```

**How it works step by step:**

1. You attach a file to ChatGPT / Claude / DeepSeek / etc.
2. The website prepares to send the file to its server
3. Nolex intercepts the network request
4. Nolex reads the file content **locally**
5. Nolex scans the content against all detection patterns
6. If sensitive data found -- shows a dialog
7. You choose: Cancel, Keep As Is, or Apply Replacements
8. Only then the request proceeds (or gets blocked)

### 2. Clipboard Interception

When you press **Ctrl+V** (or **Cmd+V** on Mac) to paste text:

1. Nolex catches the paste event **before** the text appears in the input field
2. Scans the clipboard content
3. If sensitive data found -- blocks the paste and shows a dialog
4. After your decision, inserts the text (original or cleaned)

### 3. File Extension Filter

Not all files need scanning. A `.png` image can't contain API keys, but a `.env` file very likely can.

```
Scanned by default:
  .env, .json, .yaml, .yml, .js, .ts, .py, .php,
  .pem, .key, .conf, .toml, .ini, .sh, .log, .txt, ...

Not scanned:
  .png, .jpg, .mp4, .pdf, .zip, .docx, ...
```

You can customize this list in [Settings](../features/settings.md).

## Detection Engine

The detection engine uses **regular expressions** (regex) -- precise text patterns that match specific data formats.

For example, an OpenAI API key always starts with `sk-proj-` followed by a long string of characters. Nolex knows this pattern and flags it immediately.

```
Example pattern:  sk-proj-[A-Za-z0-9_-]{20,}
Matches:          sk-proj-abc123def456ghi789jkl012mno345
Does not match:   sk-project-management
```

The engine runs **40+ built-in patterns** covering API keys, tokens, passwords, personal data, and more. See the full list in [Built-in Patterns](../patterns/built-in-patterns.md).

## What Happens to Your Data

| Stage | Where data is | Who can see it |
|-------|--------------|----------------|
| File/text entered | Your browser | Only you |
| Nolex scans it | Your browser (in memory) | Only you |
| Dialog shown | Your browser (DOM) | Only you |
| After "Cancel" | Discarded from memory | Nobody |
| After "Keep As Is" | Sent to AI service as-is | AI service |
| After "Replace" | Modified version sent | AI service (sees masked data) |

**Nolex never stores, logs, or transmits your data.** The scanning happens in RAM and is discarded immediately.

## Performance

| Metric | Value |
|--------|-------|
| Scan latency | < 5ms for typical files |
| Memory usage | ~2 MB |
| CPU impact | Negligible (runs only on paste/upload) |
| Network usage | Zero (no external calls) |

Nolex doesn't run continuously. It only activates when you paste text or upload a file.

---

> **Next:** Try Nolex in action with the [Quick Start](quick-start.md) guide.

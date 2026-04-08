# File Upload Scanning

Nolex automatically scans files before they are uploaded to any AI service. This page explains how file scanning works, which files are checked, and what you can do when sensitive data is found.

## How It Works

When you attach a file to ChatGPT, Claude, Gemini, DeepSeek, or any other website, the browser uses one of two methods to send it:

- **Fetch API** -- modern method used by most AI chatbots
- **XMLHttpRequest** -- older method still used by some services

Nolex intercepts **both** methods. The file is read and scanned **before** it leaves your browser.

```
You click "Attach file"
        |
        v
Browser prepares upload request
        |
        v
Nolex intercepts the request
        |
        v
Reads file content locally
        |
        v
Scans against 40+ patterns
        |
   Found anything?
   /            \
  No             Yes
  |               |
  v               v
File sent      Dialog appears
normally       (you decide)
```

## Which Files Are Scanned?

By default, Nolex scans text-based files that are likely to contain sensitive data:

| Category | Extensions |
|----------|-----------|
| Config files | `.env`, `.ini`, `.cfg`, `.conf`, `.toml`, `.yaml`, `.yml` |
| Code | `.js`, `.ts`, `.py`, `.rb`, `.php`, `.go`, `.java`, `.sh`, `.bash` |
| Data | `.json`, `.xml`, `.csv` |
| Keys & Certificates | `.pem`, `.key`, `.pub`, `.crt`, `.cer` |
| Docker & CI | `.dockerfile`, `.dockerignore` |
| Text | `.txt`, `.log`, `.md` |

**Files NOT scanned** (images, videos, archives):
`.png`, `.jpg`, `.gif`, `.mp4`, `.zip`, `.pdf`, `.docx`, etc.

> You can add or remove file extensions in [Settings](settings.md).

## What Happens When Sensitive Data Is Found

If Nolex detects sensitive data in your file, it shows a [Detection Dialog](detection-dialog.md) with three options:

### Option 1: Cancel Upload

The file is **not uploaded**. The network request is blocked entirely. The AI chatbot may show an error message -- this is normal.

**Use when:** You didn't realize the file contained secrets and want to stop.

### Option 2: Keep As Is

The **original file** is uploaded without any changes. Nolex steps aside.

**Use when:** You reviewed the findings and they are false positives, or you intentionally want to share this data.

### Option 3: Apply & Continue

Nolex creates a **modified copy** of your file with sensitive data replaced by safe placeholders. The original file on your disk is **never modified**.

**Use when:** You want to share the file but without exposing real credentials.

**Example:**

Before (your original file):
```
DATABASE_URL=postgres://admin:p@ssw0rd@prod.db.com:5432/myapp
API_KEY=sk-proj-abc123def456ghi789jkl
```

After (what gets uploaded):
```
DATABASE_URL={{REDACTED_POSTGRESQL_URL}}
API_KEY={{REDACTED_OPENAI_KEY}}
```

## Supported AI Platforms

Nolex works on **any website** that accepts file uploads. Tested platforms:

| Platform | Upload method | Status |
|----------|--------------|--------|
| ChatGPT | Fetch API | Fully supported |
| Claude (Anthropic) | Fetch API | Fully supported |
| Google Gemini | Fetch API | Fully supported |
| DeepSeek | XMLHttpRequest | Fully supported |
| Perplexity | Fetch API | Fully supported |
| Any other website | Both methods | Supported |

## Edge Cases

### Files Without Extensions

If a file has no extension (e.g., `Dockerfile`, `Makefile`), it is **always scanned** regardless of settings. This is a safety measure.

### Binary Files

If a file appears to be binary (images, archives, compiled code), Nolex skips it. Only text-readable content is analyzed.

### Very Large Files

Files of any size are scanned. However, for files larger than 1 MB, there may be a brief delay (a few hundred milliseconds) before the dialog appears.

### Multiple Files at Once

If you upload several files at once, each file is scanned and shown individually. You make a separate decision for each file.

---

> **See also:** [Detection Dialog](detection-dialog.md) for a detailed walkthrough of the warning dialog.

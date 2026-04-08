# Settings

The Settings page lets you control which file types Nolex scans. Open it from the popup menu.

## Opening Settings

1. Click the **Nolex icon** in your toolbar
2. Click the **menu button** (three lines)
3. Select **"Settings"**

Settings opens in a new browser tab.

## File Extension Whitelist

The main feature on the Settings page is the **file extension whitelist**. This controls which files Nolex scans when they are uploaded to AI services.

### How It Works

```
File "report.pdf" uploaded
        |
        v
Is ".pdf" in the whitelist?
  /            \
 No             Yes
 |               |
 v               v
File skipped   File scanned
(uploaded       by Nolex
as-is)
```

**Only files with whitelisted extensions are scanned.** All other files pass through without any check.

### Default Extensions

These extensions are enabled out of the box:

| Category | Extensions |
|----------|-----------|
| **Config** | `.env` `.ini` `.cfg` `.conf` `.toml` `.yaml` `.yml` |
| **Code** | `.js` `.ts` `.py` `.rb` `.php` `.go` `.java` `.sh` `.bash` |
| **Data** | `.json` `.xml` `.csv` |
| **Keys** | `.pem` `.key` `.pub` `.crt` `.cer` |
| **Docker** | `.dockerfile` `.dockerignore` |
| **Text** | `.txt` `.log` `.md` |

### Adding an Extension

To add a new file extension to the whitelist:

1. Type the extension in the input field (e.g., `.twb`)
2. Click **"Add"** or press Enter
3. The extension appears as a chip

**Rules:**
- Extensions must start with a dot (auto-added if missing)
- Only letters and numbers allowed (no special characters)
- Case-insensitive (`.TXT` and `.txt` are the same)

### Removing an Extension

Hover over any extension chip and click the **x** button to remove it.

- **Blue chips** = default extensions (can be removed, will reappear on reset)
- **Purple chips** with a marker = custom extensions you added

### Resetting to Defaults

Click the **"Reset"** button in the top right corner. A confirmation dialog will appear:

> "Reset to default extensions? All custom extensions will be removed."

This restores the original list of extensions and removes all custom ones.

## When Files Are Not Scanned

In these cases, Nolex does **not** scan the file:

| Situation | Behavior |
|-----------|----------|
| File extension is not in the whitelist | Skipped |
| File has no extension (e.g., `Dockerfile`) | **Always scanned** (safety measure) |
| Extension is disabled but file sent as Blob | **Always scanned** (no filename available) |
| Nolex is toggled OFF | All files skipped |

## Settings Storage

Your settings are saved **locally** in Chrome's storage. They:

- Persist across browser restarts
- Are never sent to any server
- Are specific to your browser profile
- Are not synced across devices (yet)

---

> **See also:** [File Upload Scanning](file-scanning.md) for how the scanning process works.

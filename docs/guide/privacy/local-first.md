# Local-First Architecture

Nolex follows a **local-first** principle: your data never leaves your browser during scanning.

## What "Local-First" Means

```
Traditional cloud scanner:          Nolex (local-first):

Your file                           Your file
    |                                   |
    v                                   v
[Send to cloud]                     [Scan in browser]
    |                                   |
    v                                   v
[Cloud server scans]                [Result shown to you]
    |                                   |
    v                                   v
[Result sent back]                  [You decide]
    |                                   |
    v                                   v
You see results                     File sent to AI
                                    (or blocked)

Risk: Your data was on              Risk: NONE
a third-party server                Data never left browser
```

## What Stays Local

| Component | Where it runs | Data stored |
|-----------|--------------|-------------|
| Detection engine | Browser (JavaScript) | Nothing stored |
| Dialog UI | Browser (DOM) | Nothing stored |
| Your settings | `chrome.storage.local` | On your device only |
| Custom patterns | `chrome.storage.local` | On your device only |
| Statistics | `chrome.storage.local` | Counts only, no actual data |

## What Is NOT Stored

Nolex **never** stores:

- The content of your files
- The text from your clipboard
- The actual values of detected secrets
- Your browsing history
- Your keystrokes
- Screenshots or page content

## Network Activity

Nolex makes **zero network requests** during normal operation.

The only network activity is:

| Activity | When | What is sent |
|----------|------|-------------|
| **Feedback** (optional) | When you type feedback in the dialog | Only your typed message |
| **Chrome Web Store updates** | Automatic by Chrome | Extension metadata only |

There are **no** analytics, telemetry, tracking, or data collection endpoints.

## How to Verify

You don't have to take our word for it. You can verify:

### Method 1: Check the Source Code

Nolex is open source. Every line of code is available at:
[github.com/Defyzzz/nolex](https://github.com/Defyzzz/nolex)

### Method 2: Monitor Network Traffic

1. Open Chrome DevTools (F12)
2. Go to the **Network** tab
3. Use any AI chatbot with Nolex active
4. Upload a file or paste text
5. Observe: Nolex makes **no requests**

### Method 3: Check Extension Permissions

Go to `chrome://extensions` and click "Details" on Nolex. The only permissions are:

- **storage** -- to save settings locally
- **Access to all websites** -- to inject the scanner into any page

No permissions for:
- `webRequest` (intercepting network traffic)
- `cookies` (reading your cookies)
- `history` (reading your browsing history)
- `bookmarks`, `downloads`, `management`, etc.

## Comparison with Alternatives

| Feature | Nolex | Cloud-based scanners |
|---------|-------|---------------------|
| Data leaves browser | No | Yes |
| Requires account | No | Usually yes |
| Works offline | Yes | No |
| Scans your traffic | No | Some do |
| Third-party risk | None | Server breach = your data leaked |
| Speed | < 5ms | 100-500ms (network round-trip) |

---

> **See also:** [Permissions Explained](permissions.md) for details on each browser permission.

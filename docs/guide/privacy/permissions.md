# Permissions Explained

Nolex requests the minimum permissions needed to work. This page explains each permission and why it's required.

## Required Permissions

### `storage`

**What it does:** Allows Nolex to save data in Chrome's local storage on your device.

**Why it's needed:** To store your settings, custom patterns, and detection statistics between browser sessions.

**What it accesses:**
- Your Nolex settings (file extension whitelist, toggle state)
- Your custom detection patterns
- Detection statistics (counts only, not actual data)

**What it does NOT access:**
- Other extensions' storage
- Website cookies or local storage
- Your bookmarks, history, or passwords

### `host_permissions: <all_urls>`

**What it does:** Allows the Nolex content script to run on any website you visit.

**Why it's needed:** AI chatbots exist on many different domains (chat.openai.com, claude.ai, gemini.google.com, etc.). New AI services appear regularly. Instead of maintaining a list of specific domains that would need constant updates, Nolex runs on all pages to ensure protection regardless of which AI service you use.

**What it accesses:**
- Ability to inject the scanner script into any page
- Ability to intercept file uploads and paste events on any page

**What it does NOT do:**
- Does not read page content proactively
- Does not track your browsing
- Does not send data anywhere
- Only activates when you upload a file or paste text

## Permissions Nolex Does NOT Request

| Permission | What it would allow | Why Nolex doesn't need it |
|-----------|-------------------|--------------------------|
| `webRequest` | Intercept all network traffic | Nolex hooks into JavaScript APIs, not network layer |
| `cookies` | Read website cookies | Not relevant to data scanning |
| `history` | Read browsing history | Not relevant |
| `bookmarks` | Read bookmarks | Not relevant |
| `downloads` | Manage downloads | Not relevant |
| `management` | Manage other extensions | Not relevant |
| `clipboardRead` | Read clipboard at any time | Nolex only checks during paste events |
| `geolocation` | Track your location | Not relevant |

## Chrome Web Store Compliance

Nolex has been reviewed and approved by the Chrome Web Store team. The review process verifies that:

1. All requested permissions are used in the code
2. No unnecessary permissions are requested
3. The extension does what it claims to do
4. No malicious or deceptive behavior

---

> **See also:** [Local-First Architecture](local-first.md) for how Nolex keeps your data private.

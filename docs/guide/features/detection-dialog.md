# Detection Dialog

When Nolex detects sensitive data in a file or clipboard content, it shows a full-screen dialog. This page explains every part of the dialog.

## Dialog Overview

```
+----------------------------------------------------------+
|                                                          |
|     ! WARNING                                            |
|     Sensitive Data Detected                              |
|                                                          |
|     The file "config.env" contains potentially           |
|     sensitive information                                |
|                                                          |
|  +------------------------------------------------------+|
|  |  PREVIEW                                             ||
|  |                                                      ||
|  |  DB_HOST=localhost                                   ||
|  |  DB_PASSWORD=[MyS3cretP@ss!]  <-- highlighted red    ||
|  |  API_KEY=[sk-proj-abc123...]  <-- highlighted red    ||
|  |                                                      ||
|  +------------------------------------------------------+|
|                                                          |
|  FINDINGS (2)                     [Strict Filter]        |
|                                                          |
|  v API Keys (1)                                          |
|    [x] OpenAI API Key    sk-proj-abc1...  [input field]  |
|                                                          |
|  v Personal Data (1)                                     |
|    [x] Password          MyS3cret...      [input field]  |
|                                                          |
|  +------------------------------------------------------+|
|  | Feedback (optional)                                  ||
|  | [If you notice any errors...]                        ||
|  +------------------------------------------------------+|
|                                                          |
|  [Cancel Upload]    [Keep As Is]    [Apply & Continue]   |
|                                                          |
+----------------------------------------------------------+
```

## Part 1: Header

The header shows:

- **Warning icon** (pulsing animation) to draw your attention
- **Title:** "Sensitive Data Detected"
- **Description:** Which file or source contains the data
  - For file uploads: shows the file name (e.g., "config.env")
  - For clipboard: shows "Clipboard"

## Part 2: Preview

The preview shows the **actual content** of your file or clipboard text.

- Sensitive data is **highlighted in red** with a border
- You can **scroll** through the preview if the content is long
- **Click on a finding** in the list below to scroll the preview to that match

The preview is read-only. You cannot edit the content directly.

## Part 3: Findings List

Findings are **grouped by type** (API Keys, Personal Data, etc.).

### Group Header

Each group shows:
- **Type name** (e.g., "API Keys")
- **Count badge** (number of findings in this group)
- **Chevron** (click to expand/collapse the group)

### Individual Finding

Each finding shows:

| Element | Description |
|---------|------------|
| **Checkbox** | Checked = will be replaced. Uncheck to skip this finding. |
| **Type name** | What kind of data was found (e.g., "OpenAI API Key") |
| **Found value** | The actual sensitive text (truncated, hover to see full) |
| **Replacement field** | What the value will be replaced with. You can edit this. |

### Editing Replacements

Each finding has a pre-filled replacement value like `{{REDACTED_OPENAI_KEY}}`. You can:

- **Keep the default** -- safe and descriptive
- **Edit it** -- type your own replacement
- **Uncheck the checkbox** -- skip this finding entirely (keep original)

## Part 4: Strict Filter

The **Strict Filter** button is in the findings header. When enabled, it removes findings that are likely false positives.

**How it works:** If a detected pattern has a letter or digit immediately before or after it, it's probably part of a larger token/ID and not actually sensitive data.

**Example:**

```
Text: "error code 18446744073709551612"
                   ^^^^^^^^^^^^^^^^^^
                   This looks like a phone number
                   but it's inside a larger number

Strict Filter ON:  This finding is removed (false positive)
Strict Filter OFF: This finding is shown
```

See [Strict Filter](strict-filter.md) for more details.

## Part 5: Feedback

An optional text area at the bottom where you can:

- Report false positives (Nolex detected something that isn't sensitive)
- Report missed detections (Nolex missed something that IS sensitive)
- Share any other feedback

Your feedback helps improve Nolex. It is sent anonymously.

## Part 6: Action Buttons

Three buttons at the bottom of the dialog:

### Cancel Upload

- **Color:** Gray (secondary)
- **Action:** Stops the upload/paste entirely
- **Result:** Nothing is sent or pasted
- **When to use:** You realize the content shouldn't be shared at all

### Keep As Is

- **Color:** Orange (warning)
- **Action:** Proceeds with the **original, unmodified** content
- **Result:** Everything is sent exactly as-is, including sensitive data
- **When to use:** The findings are false positives, or you intentionally want to share this data

### Apply & Continue

- **Color:** Blue (primary)
- **Action:** Replaces only the **checked** findings with their replacement values
- **Result:** A cleaned version is sent
- **When to use:** You want to share the content but protect your secrets

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Esc** | Same as "Cancel Upload" |

## Timeout

If you don't interact with the dialog for **60 seconds**, it automatically cancels the operation. This prevents the browser from hanging if you switch tabs and forget about the dialog.

## Tips

1. **Click a finding** in the list to highlight it in the preview -- helps you see the context
2. **Uncheck findings** you want to keep -- only checked items are replaced
3. **Edit replacement values** if the default placeholder doesn't work for your use case
4. **Use Strict Filter** if you see too many false positives
5. **Leave feedback** if Nolex made a mistake -- it helps us improve

---

> **See also:** [Strict Filter](strict-filter.md) for reducing false positives.

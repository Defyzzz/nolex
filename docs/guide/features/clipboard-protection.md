# Clipboard Protection

Nolex monitors paste events across all websites. When you press **Ctrl+V** (Windows/Linux) or **Cmd+V** (Mac), Nolex checks the clipboard content before it reaches the page.

## How It Works

```
You press Ctrl+V / Cmd+V
        |
        v
Browser fires "paste" event
        |
        v
Nolex intercepts (before text appears)
        |
        v
Reads clipboard text
        |
        v
Scans against all patterns
        |
   Found anything?
   /            \
  No             Yes
  |               |
  v               v
Text pasted    Paste blocked,
normally       dialog appears
```

**Key difference from file scanning:** With clipboard protection, the text is intercepted **before** it appears in the input field. If sensitive data is found, nothing is pasted until you make a decision.

## What Gets Checked

Clipboard protection scans **plain text only**. It does not scan:

- Images copied to clipboard
- Rich text formatting (HTML)
- Files copied in file manager

Only text content is analyzed (the same text you'd get with "Paste as plain text").

## Real-World Scenarios

### Scenario 1: Pasting Code with API Keys

You copy a code snippet from your editor:

```python
import openai

client = openai.Client(api_key="sk-proj-abc123def456ghi789jkl012mno345")
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}]
)
```

When you paste into ChatGPT, Nolex detects the OpenAI API key and shows the dialog.

If you click **Apply & Continue**, the pasted text becomes:

```python
import openai

client = openai.Client(api_key="{{REDACTED_OPENAI_KEY}}")
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### Scenario 2: Pasting a Config File

You copy the contents of `.env` file:

```
DB_HOST=production-db.internal.company.com
DB_USER=admin
DB_PASS=S3cur3P@ssw0rd!
STRIPE_KEY=sk_test_EXAMPLE_DO_NOT_USE_12345678
```

Nolex detects the Stripe key and shows the dialog with findings.

### Scenario 3: Clean Text (No Interruption)

You paste a question:

```
How do I implement binary search in JavaScript?
```

No sensitive data detected. Nolex allows the paste immediately. You don't even notice it's there.

## How Text Is Inserted After Decision

After you choose **Keep As Is** or **Apply & Continue**, Nolex needs to insert the text into the active input field. It uses the most compatible method for each type of input:

| Input Type | Method | Works With |
|-----------|--------|-----------|
| Standard inputs | `execCommand` | React, Vue, Angular |
| `<input>` / `<textarea>` | Native value setter | Search bars, forms |
| Rich text editors | DOM selection API | ContentEditable fields |

This ensures compatibility with modern frameworks used by AI chatbots.

## Limitations

### What Clipboard Protection Does NOT Do

- **Does not monitor what you copy** -- it only checks when you paste
- **Does not modify your clipboard** -- your clipboard content stays unchanged
- **Does not work with drag-and-drop text** -- only Ctrl+V / Cmd+V paste events
- **Does not scan images** -- only plain text

### Auto-fill and Form Restoration

Some websites automatically restore form content when you reload the page. These programmatic paste events are **not** intercepted by Nolex (only user-initiated paste events are checked).

---

> **See also:** [Detection Dialog](detection-dialog.md) to learn about all the options in the warning dialog.

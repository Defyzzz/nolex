# Quick Start

Try Nolex in 2 minutes. No configuration needed.

## Test 1: Clipboard Protection

Let's test paste interception with a fake API key.

**Step 1.** Copy this text (select it and press Ctrl+C / Cmd+C):

```
Here is my config:
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
DATABASE_URL=postgres://admin:supersecret@db.example.com:5432/myapp
```

**Step 2.** Open any AI chatbot (ChatGPT, Claude, Gemini, etc.)

**Step 3.** Click in the message input field and press Ctrl+V / Cmd+V

**Step 4.** Nolex should show a warning dialog:

```
+------------------------------------------+
|  ! Sensitive Data Detected               |
|                                          |
|  File: Clipboard                         |
|  Found: 3 items                          |
|                                          |
|  [ ] OpenAI API Key     sk-proj-abc...   |
|  [ ] AWS Access Key     AKIAIOSF...      |
|  [ ] PostgreSQL URL     postgres://...   |
|                                          |
|  [Cancel]  [Keep As Is]  [Apply]         |
+------------------------------------------+
```

**Step 5.** Try each action:

| Action | What happens |
|--------|-------------|
| **Cancel Upload** | Nothing is pasted. The input field stays empty. |
| **Keep As Is** | Original text is pasted with all keys visible. |
| **Apply & Continue** | Text is pasted with keys replaced by safe placeholders. |

## Test 2: File Upload Protection

**Step 1.** Create a test file called `test-config.env` on your desktop:

```
# Database
DB_HOST=localhost
DB_PASSWORD=MyS3cretP@ss!

# API
OPENAI_KEY=sk-proj-testkey123456789abcdefghijklmnopqrstuvwxyz
STRIPE_SECRET=sk_test_EXAMPLE_KEY_DO_NOT_USE_1234567890
```

**Step 2.** Go to ChatGPT (or any AI chatbot)

**Step 3.** Click the attachment/paperclip icon and select your `test-config.env` file

**Step 4.** Before the file is uploaded, Nolex will show the warning dialog with all detected secrets

**Step 5.** Click **"Apply & Continue"** to upload a cleaned version

## Test 3: Safe Content (No Warning)

Copy and paste this text -- Nolex should allow it silently with no dialog:

```
Hello! Can you help me write a Python function
that sorts a list of numbers using quicksort?
```

No sensitive data = no interruption. Nolex only speaks up when it matters.

## Understanding the Popup

Click the Nolex icon in your toolbar:

```
+---------------------------+
|  [Shield] Nolex     [=]  |
|                           |
|  Extension Status         |
|  [====] Active            |
|                           |
|  Detected Sensitive Data  |
|  +---------+              |
|  |   3     |  Total       |
|  +---------+              |
|                           |
|  API Key OpenAI ..... 1   |
|  AWS Access Key ..... 1   |
|  PostgreSQL URL ..... 1   |
+---------------------------+
```

- **Toggle switch** -- Turn Nolex on/off
- **Statistics** -- Shows what was detected during your session
- **Menu (=)** -- Access Settings, Smart Constructor, Support

## What's Next?

| Goal | Page |
|------|------|
| Understand each feature in detail | [File Scanning](../features/file-scanning.md), [Clipboard Protection](../features/clipboard-protection.md) |
| See all data types Nolex detects | [Built-in Patterns](../patterns/built-in-patterns.md) |
| Create your own detection rules | [Smart Constructor](../features/smart-constructor.md) |
| Reduce false positives | [Strict Filter](../features/strict-filter.md) |
| Configure which files to scan | [Settings](../features/settings.md) |
| Learn about privacy | [Local-First Architecture](../privacy/local-first.md) |

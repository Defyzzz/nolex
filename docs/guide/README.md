# What is Nolex?

**Nolex** is a Chrome browser extension that protects your sensitive data when using AI services like ChatGPT, Claude, Gemini, DeepSeek, and others.

## The Problem

Every day, millions of people paste code, configs, and documents into AI chatbots. Often, this data contains:

- API keys and tokens (OpenAI, AWS, Stripe...)
- Passwords and database connection strings
- Personal data (emails, phone numbers, credit cards)
- Private keys and certificates

Once sent, **this data is no longer under your control**. It may be stored, logged, or used for training.

## The Solution

Nolex acts as a **security layer between you and AI**. It automatically scans everything you upload or paste, and if it finds sensitive data, it warns you **before** the data leaves your browser.

```
You paste code with API key
        |
        v
  [Nolex intercepts]
        |
        v
  "AWS key detected!"
        |
   +---------+-----------+
   |         |           |
Cancel   Keep As Is   Replace
   |         |           |
 Nothing   Original   aws_key=****
 sent      sent        sent
```

## Key Principles

| Principle | What it means |
|-----------|--------------|
| **Local-first** | All scanning happens in your browser. No data is sent to any server. |
| **Zero configuration** | Works immediately after installation. No account required. |
| **Non-blocking** | You always decide what happens. Nolex never blocks you silently. |
| **Open source** | Full source code available on [GitHub](https://github.com/Defyzzz/nolex). |

## What Nolex Protects

Nolex detects **40+ types of sensitive data** out of the box:

- **API Keys** -- OpenAI, Anthropic, Google, AWS, Stripe, GitHub, Slack, Discord, and more
- **Database URLs** -- PostgreSQL, MySQL, MongoDB, Redis connection strings with credentials
- **Authentication** -- JWT tokens, private keys, session tokens
- **Personal Data** -- Emails, phone numbers, credit card numbers
- **Custom Patterns** -- You can add your own detection rules

## Two Protection Layers

### Layer 1: File Upload Scanning

When you drag-and-drop or attach a file to any AI chatbot, Nolex reads the file content **locally**, scans it for sensitive data, and shows you what it found.

### Layer 2: Clipboard Protection

When you paste text (Ctrl+V / Cmd+V) into any input field, Nolex checks the clipboard content before it reaches the page.

---

> **Ready to get started?** Head to [Installation](getting-started/installation.md) to add Nolex to your browser in under a minute.

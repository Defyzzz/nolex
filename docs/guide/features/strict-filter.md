# Strict Filter

The Strict Filter reduces false positives by checking the **context** around each detected pattern. It's a one-click toggle in the [Detection Dialog](detection-dialog.md).

## The Problem: False Positives

Regular expressions match text patterns, but sometimes innocent text looks like sensitive data:

| Text | Detected as | Actually is |
|------|------------|-------------|
| `18446744073709551612` | Phone number | A large integer |
| `order1234567890123` | Credit card | An order ID |
| `abc123def456ghi789` | Hex token | A test string |

These are **false positives** -- Nolex flagged them, but they aren't actually sensitive.

## How Strict Filter Works

The Strict Filter checks what's **immediately before and after** the matched text:

```
Text: "value is 18446744073709551612 bytes"
                 ^^^^^^^^^^^^^^^^^^^
                 Matched as phone number

Character before match: "9" (digit before "1")  --> Adjacent!
Character after match:  " " (space after "2")   --> OK

Strict Filter: REMOVE (digit is adjacent = likely part of larger number)
```

**Rule:** If a letter (`a-z`, `A-Z`) or digit (`0-9`) is directly adjacent to the match on either side, the finding is considered a false positive and removed.

## Examples

### Example 1: Phone Number in Large Integer

```
Input: "max_int = 18446744073709551612"

Without Strict Filter:
  [!] Russian Phone: 84467440737  <-- false positive

With Strict Filter:
  No findings  <-- correct!
```

The `8446...` looks like a phone starting with `8`, but it's embedded in a larger number.

### Example 2: Real Phone Number

```
Input: "Call me at +7 (999) 123-45-67"

Without Strict Filter:
  [!] Russian Phone: +7 (999) 123-45-67

With Strict Filter:
  [!] Russian Phone: +7 (999) 123-45-67  <-- kept! (space before "+")
```

Real phone numbers are usually separated by spaces or punctuation, so the Strict Filter keeps them.

### Example 3: Email in URL Path

```
Input: "path/admin@example.com/settings"

Without Strict Filter:
  [!] Email: admin@example.com

With Strict Filter:
  No findings  <-- "/" is not alphanumeric, but let's check...
```

Actually, `/` is not a letter or digit, so the email would be kept even with Strict Filter. The filter only removes matches adjacent to `[a-zA-Z0-9]`.

## When to Use

| Situation | Recommendation |
|-----------|---------------|
| Many false positives in the list | Turn ON Strict Filter |
| Pasting code with long numbers/hashes | Turn ON |
| Pasting plain text config files | Leave OFF (default) |
| Not sure | Try ON, review what's removed |

## How to Activate

1. Open any detection dialog (paste or upload sensitive data)
2. Look for the **"Strict Filter"** button next to the findings count
3. Click to toggle on/off
4. The findings list updates immediately

The info icon (i) next to the button explains the feature in a tooltip.

## What Happens If Everything Is Filtered Out

If Strict Filter removes **all** findings, the dialog closes automatically and the content is allowed through. This means the detected patterns were all likely false positives.

---

> **See also:** [Detection Dialog](detection-dialog.md) for the full dialog reference.

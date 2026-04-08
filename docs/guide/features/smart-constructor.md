# Smart Constructor

The Smart Constructor helps you create custom detection patterns **without writing regex manually**. You provide an example of the data you want to detect, and Nolex generates a pattern for you.

## Opening Smart Constructor

1. Click the **Nolex icon** in your browser toolbar
2. Click the **menu button** (three lines)
3. Select **"Smart Constructor"**

This opens the Smart Constructor in a new tab.

## How to Create a Pattern

### Step 1: Paste an Example

Enter an example of the sensitive data you want to detect:

```
INTERNAL_PROJECT_ID=PROJ-2024-0847
```

### Step 2: Nolex Analyzes It

The Smart Constructor automatically:

1. **Detects the format** -- finds the `KEY=VALUE` structure
2. **Identifies the key** -- recognizes `INTERNAL_PROJECT_ID` as a potential sensitive key name
3. **Analyzes the value** -- breaks `PROJ-2024-0847` into static (`PROJ-`) and dynamic (`2024-0847`) parts
4. **Generates a regex** -- creates a pattern that matches this format

### Step 3: Review the Result

The constructor shows you:

```
Generated Pattern:
  INTERNAL_PROJECT_ID=PROJ-\d{4}-\d{4}

Confidence: 80%

Detected parts:
  [Static]  INTERNAL_PROJECT_ID=PROJ-
  [Dynamic] 2024  (4-digit number)
  [Static]  -
  [Dynamic] 0847  (4-digit number)
```

### Step 4: Test the Pattern

The constructor lets you test against sample text to verify the pattern works:

```
Test input: "Config: INTERNAL_PROJECT_ID=PROJ-2025-1234"
Result:     Match found! --> PROJ-2025-1234
```

### Step 5: Save the Pattern

Give your pattern a name and replacement value, then save it to your custom patterns.

## What the Smart Constructor Detects

The analyzer recognizes these data formats automatically:

| Pattern Type | Example | Icon |
|-------------|---------|------|
| IPv4 Address | `192.168.1.100` | |
| IPv6 Address | `2001:0db8:85a3::8a2e:0370:7334` | |
| Email | `admin@internal.corp` | |
| URL | `https://api.internal.com/v2` | |
| UUID | `550e8400-e29b-41d4-a716-446655440000` | |
| Hex Token | `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6` (32+ hex chars) | |
| Alphanumeric Token | `AbCdEf123456GhIjKl789012` (20+ mixed chars) | |
| Base64 String | `SGVsbG8gV29ybGQ=` | |
| Port Number | `:8080`, `:3306` | |
| Mixed Alphanumeric | `abc123def` (letters + digits mixed) | |
| Number Sequence | `1234567890` | |
| Word | `production`, `admin` | |

## Sensitive Key Detection

If the key part of your example matches a known sensitive name, the **entire value** is treated as dynamic (replaceable):

**Sensitive key names:**

```
password, passwd, pass, pwd, secret, token,
api_key, apikey, auth, credential, private_key,
access_key, secret_key, session, cookie
```

**Example:**

```
Input:   DB_PASSWORD=MyC0mpl3xP@ss!

Result:  DB_PASSWORD=[^\s]+
         (entire value is dynamic because "PASSWORD" is a sensitive key)
```

## Entropy-Based Detection

For parts that don't match any known pattern, the Smart Constructor checks **entropy** (randomness):

- **Low entropy** (< 3.5 bits): Likely a normal word or predictable text
- **High entropy** (>= 3.5 bits): Likely a password, token, or random string

```
"hello"          --> entropy: 2.3  --> treated as static
"xK9mN2pQ7wR4"  --> entropy: 3.8  --> treated as dynamic (high entropy)
```

## Confidence Score

Each generated pattern gets a confidence score (0-100%):

| Factor | Points |
|--------|--------|
| Key=value format detected | +20 |
| Key is a known sensitive name | +30 |
| Each recognized pattern in value | +10 |
| No static prefix found | -20 |
| No patterns detected | -20 |

**What the score means:**

| Score | Meaning |
|-------|---------|
| 80-100% | High confidence, pattern is reliable |
| 50-79% | Good, but review the generated regex |
| Below 50% | Low confidence, consider editing manually |

## Advanced: Editing the Regex

You can always edit the generated regex before saving. Common modifications:

| Goal | Edit |
|------|------|
| Match any length | Change `{4}` to `{1,}` |
| Make case-insensitive | Add `i` flag |
| Match optional parts | Add `?` after optional section |
| Match exact value only | Enable "Strict Mode" option |

## Examples

### Example 1: Internal API Endpoint

```
Input:    API_URL=https://api.mycompany.com/v2/users
Pattern:  API_URL=https?://[^\s]+
```

### Example 2: Database Connection

```
Input:    MONGO_URI=mongodb+srv://admin:p@ss@cluster0.abc123.mongodb.net
Pattern:  MONGO_URI=mongodb\+srv://[^\s]+
```

### Example 3: Custom Token Format

```
Input:    AUTH_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9
Pattern:  AUTH_TOKEN=eyJ[A-Za-z0-9+/=]+
```

### Example 4: Project-Specific ID

```
Input:    TICKET_ID=JIRA-PROJECT-12345
Pattern:  TICKET_ID=JIRA-PROJECT-\d{5}
```

---

> **See also:** [Custom Patterns](../patterns/custom-patterns.md) for managing saved patterns, and [Built-in Patterns](../patterns/built-in-patterns.md) for the full list of default detections.

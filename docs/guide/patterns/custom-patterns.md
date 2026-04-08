# Custom Patterns

In addition to 40+ built-in patterns, you can create your own detection rules for data specific to your organization or workflow.

## Why Custom Patterns?

Every company has unique sensitive data that generic patterns can't detect:

- Internal project IDs (`PROJ-2024-0847`)
- Employee IDs (`EMP-12345`)
- Internal API endpoints (`https://api.internal.corp/...`)
- Custom token formats (`myapp_tk_abc123...`)
- Proprietary data formats

Custom patterns let you teach Nolex to recognize **your** sensitive data.

## Creating Custom Patterns

### Method 1: Smart Constructor (Recommended)

The easiest way -- paste an example and let Nolex generate the regex. See [Smart Constructor](../features/smart-constructor.md).

### Method 2: Manual Regex

For advanced users who know regular expressions:

1. Open the **Smart Constructor**
2. Write your regex directly in the pattern field
3. Test it against sample data
4. Save with a name and replacement value

## Pattern Groups

Custom patterns are organized into **groups**. Each group:

- Has a name (e.g., "Internal APIs", "Employee Data")
- Contains one or more patterns
- Can be enabled/disabled as a whole
- Individual patterns within a group can also be toggled

```
Custom Patterns
├── Group: "Internal APIs"
│   ├── [x] Internal API Key      myapp_key_[a-z0-9]{32}
│   └── [x] Internal Endpoint     https://api\.corp\.com/.*
│
├── Group: "Employee Data"
│   ├── [x] Employee ID           EMP-\d{5}
│   └── [ ] Badge Number          BADGE-[A-Z]{2}\d{4}  (disabled)
│
└── Group: "Legacy Systems"
    └── [x] Old Token Format      legacy_[a-f0-9]{16}
```

## Import & Export

You can export your custom patterns as JSON and import them on another device or share with colleagues.

### Export

1. Open Settings or Smart Constructor
2. Click **Export** button
3. Save the `.json` file

### Import

1. Open Settings or Smart Constructor
2. Click **Import** button
3. Select a `.json` file with patterns

### JSON Format

```json
{
  "groups": [
    {
      "name": "My Company Patterns",
      "enabled": true,
      "patterns": [
        {
          "name": "Internal API Key",
          "regex": "myapp_key_[a-z0-9]{32}",
          "flags": "g",
          "replacement": "{{REDACTED_INTERNAL_KEY}}",
          "enabled": true
        }
      ]
    }
  ]
}
```

## Tips for Writing Patterns

### Start Simple

Don't try to match every edge case. Start with the most common format:

```
Bad:   (?:EMP|EMPLOYEE|emp)[-_]?\d{3,8}
Good:  EMP-\d{5}
```

You can always refine later.

### Use Anchors Wisely

- `\b` -- word boundary (prevents partial matches)
- `^` / `$` -- start/end of line (too restrictive for inline text)

```
Pattern:  \bEMP-\d{5}\b
Matches:  "User EMP-12345 logged in"
Skips:    "TEMP-12345" (different prefix)
```

### Escape Special Characters

These characters have special meaning in regex and must be escaped with `\`:

```
.  *  +  ?  (  )  [  ]  {  }  |  \  ^  $
```

**Example:** To match `api.internal.com`, use `api\.internal\.com`

### Test Before Saving

Always test your pattern against:
1. Text that **should** match (true positives)
2. Text that **should not** match (true negatives)

## Common Custom Pattern Examples

| Use Case | Pattern | Matches |
|----------|---------|---------|
| Internal API key | `myapp_[a-z0-9]{32}` | `myapp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4` |
| Employee ID | `EMP-\d{5}` | `EMP-12345` |
| Internal URL | `https://[a-z]+\.corp\.com/[^\s]*` | `https://api.corp.com/v2/users` |
| Docker image tag | `registry\.corp\.com/[^\s]+` | `registry.corp.com/app:v2.1` |
| SSH key fingerprint | `SHA256:[A-Za-z0-9+/]{43}` | `SHA256:abc123DEF456ghi789jklMNO012pqr345stuVWX67` |
| Kubernetes secret | `kubectl.*secret.*[^\s]+` | `kubectl get secret my-app-token` |

---

> **See also:** [Smart Constructor](../features/smart-constructor.md) for AI-assisted pattern creation, and [Built-in Patterns](built-in-patterns.md) for the full list of default patterns.

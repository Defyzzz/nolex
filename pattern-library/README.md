# Nolex Pattern Library

Community-driven collection of detection patterns for [Nolex](https://github.com/Defyzzz/nolex).

Each JSON file is a pattern group compatible with Nolex Smart Constructor — download and import in one click.

## How to Use

1. Browse the folders below and find the pattern group you need
2. Download the `.json` file
3. Open Nolex → Menu → Smart Constructor
4. Click **Import** → select the downloaded file
5. Done — patterns are now active

## Categories

| Folder | Description |
|--------|-------------|
| `phone-numbers/` | Phone number formats by country (E.164, local formats) |
| `national-ids/` | National ID numbers (SSN, SNILS, NIE, etc.) |
| `financial/` | IBAN, SWIFT, tax IDs, VAT numbers |
| `structured/` | Sensitive keys in JSON, XML, YAML, .env files |

## JSON Format

Each file follows the Nolex Smart Constructor import format:

```json
{
  "nolex_pattern_group": true,
  "version": 1,
  "name": "Group Name",
  "description": "What these patterns detect",
  "patterns": [
    {
      "name": "Pattern Name",
      "regex": "your-regex-here",
      "flags": "g",
      "replacement": "***REDACTED***"
    }
  ]
}
```

## Contributing

Want to add patterns?

1. Fork this repo
2. Create a JSON file in the appropriate folder
3. Test your regex patterns against real-world examples
4. Submit a pull request

Guidelines:
- One pattern group per file
- Include `description` field explaining what the group covers
- Use specific, low-false-positive patterns
- Don't include patterns already built into Nolex core (see `extension/detector.js`)

# Nolex Pattern Library

Community-driven collection of detection patterns for [Nolex](https://github.com/Defyzzz/nolex).

Each JSON file is a pattern group compatible with Nolex Smart Constructor — download and import in one click.

## How to Use

1. Browse the folders below and find the pattern group you need
2. Download the `.json` file
3. Open Nolex → Menu → Smart Constructor
4. Click **Import** → select the downloaded file
5. Done — patterns are now active

## Phone Numbers

| File | Country | Formats |
|------|---------|---------|
| [us-phone.json](phone-numbers/us-phone.json) | US | (555) 123-4567, +1 555 123 4567 |
| [ca-phone.json](phone-numbers/ca-phone.json) | Canada | +1 416-555-0199, (416) 555-0199 |
| [uk-phone.json](phone-numbers/uk-phone.json) | UK | +44 20 7946 0958, 07911 123456 |
| [de-phone.json](phone-numbers/de-phone.json) | Germany | +49 30 12345678, 0151 12345678 |
| [fr-phone.json](phone-numbers/fr-phone.json) | France | +33 1 23 45 67 89, 06 12 34 56 78 |
| [es-phone.json](phone-numbers/es-phone.json) | Spain | +34 612 345 678, 612 345 678 |
| [in-phone.json](phone-numbers/in-phone.json) | India | +91 98765 43210, 098765 43210 |
| [cn-phone.json](phone-numbers/cn-phone.json) | China | +86 138 0013 8000, 13800138000 |
| [jp-phone.json](phone-numbers/jp-phone.json) | Japan | +81 90-1234-5678, 090-1234-5678 |
| [br-phone.json](phone-numbers/br-phone.json) | Brazil | +55 11 91234-5678, (11) 91234-5678 |
| [au-phone.json](phone-numbers/au-phone.json) | Australia | +61 4 1234 5678, 0412 345 678 |

## National IDs

| File | Country | Document |
|------|---------|----------|
| [us-ssn.json](national-ids/us-ssn.json) | US | Social Security Number (123-45-6789) |
| [ru-personal-ids.json](national-ids/ru-personal-ids.json) | Russia | SNILS, INN, passport number |
| [uk-nin.json](national-ids/uk-nin.json) | UK | National Insurance Number (AB 12 34 56 C) |
| [de-personal-ids.json](national-ids/de-personal-ids.json) | Germany | Steuer-ID, Personalausweis |
| [fr-nir.json](national-ids/fr-nir.json) | France | NIR / Social Security (1 85 05 78 006 084 36) |
| [es-dni.json](national-ids/es-dni.json) | Spain | DNI (12345678Z), NIE (X1234567L) |
| [in-aadhaar.json](national-ids/in-aadhaar.json) | India | Aadhaar (1234 5678 9012), PAN |
| [cn-id.json](national-ids/cn-id.json) | China | Resident Identity Card (18 digits) |
| [br-cpf.json](national-ids/br-cpf.json) | Brazil | CPF (123.456.789-09), CNPJ |
| [ca-sin.json](national-ids/ca-sin.json) | Canada | Social Insurance Number (123-456-789) |

## Financial

| File | Description |
|------|-------------|
| [iban.json](financial/iban.json) | IBAN and SWIFT/BIC codes |

## Structured Data

| File | Description |
|------|-------------|
| [env-files.json](structured/env-files.json) | PASSWORD=, TOKEN=, DATABASE_URL= in config files |

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

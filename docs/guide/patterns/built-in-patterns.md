# Built-in Patterns

Nolex ships with **40+ detection patterns** organized into 6 categories. Each pattern uses a regular expression to identify a specific type of sensitive data.

## API Keys

These patterns detect API keys for popular AI and cloud services.

| # | Name | Prefix / Format | Example |
|---|------|-----------------|---------|
| 1 | OpenAI API Key | `sk-proj-` or `sk-svcacct-` + 20 chars | `sk-proj-abc123def456ghi789...` |
| 2 | Anthropic API Key | `sk-ant-` + 95 chars | `sk-ant-api03-abc123...` |
| 3 | Google API Key | `AIza` + 35 chars | `AIzaSyA1b2c3d4e5f6g7h8i9j0...` |
| 4 | DeepSeek API Key | `sk-` + 32 hex chars | `sk-a1b2c3d4e5f6a7b8c9d0e1f2...` |
| 5 | Hugging Face Token | `hf_` + 34 chars | `hf_abcDEFghiJKLmnoPQRstuVWXyz1234` |
| 6 | Mistral API Key | `MISTRAL_API_KEY=` format | `MISTRAL_API_KEY=abc123...` |
| 7 | Replicate Token | `r8_` + 37 chars | `r8_abcdefghijklmnopqrstuvwxyz1234567` |
| 8 | Cohere API Key | `COHERE_API_KEY=` or `CO_API_KEY=` | `COHERE_API_KEY=abc123...` |

## Cloud & Infrastructure

| # | Name | Format | Example |
|---|------|--------|---------|
| 9 | AWS Access Key ID | `AKIA` + 16 alphanumeric | `AKIAIOSFODNN7EXAMPLE` |
| 10 | AWS Secret Key | `aws_secret_access_key=` + 40 chars | `aws_secret_access_key=wJalrXUt...` |
| 11 | AWS Session Token | `aws_session_token=` + 100 chars | `aws_session_token=FwoGZX...` |

## Database Connection Strings

| # | Name | Format | Example |
|---|------|--------|---------|
| 12 | PostgreSQL | `postgres://user:pass@host` | `postgres://admin:secret@db.com:5432/app` |
| 13 | MySQL | `mysql://user:pass@host` | `mysql://root:pass123@localhost:3306/db` |
| 14 | MongoDB | `mongodb://` or `mongodb+srv://` | `mongodb://admin:pass@cluster.mongodb.net` |
| 15 | Redis | `redis://user:pass@host` | `redis://default:secret@redis.example.com` |

## Authentication Tokens

### GitHub

| # | Name | Prefix | Example |
|---|------|--------|---------|
| 16 | Personal Access Token | `ghp_` + 36 chars | `ghp_abc123def456ghi789jkl012mno345pqr6` |
| 17 | OAuth Token | `gho_` + 36 chars | `gho_abc123def456ghi789jkl012mno345pqr6` |
| 18 | Fine-grained PAT | `github_pat_` + 20 chars | `github_pat_abc123def456ghi789...` |

### Slack

| # | Name | Prefix | Example |
|---|------|--------|---------|
| 19 | Bot Token | `xoxb-` + digits + chars | `xoxb-1234567890-1234567890-abc...` |
| 20 | User Token | `xoxp-` + digits + chars | `xoxp-1234567890-1234567890-abc...` |
| 21 | Webhook URL | `https://hooks.slack.com/services/` | `https://hooks.slack.com/services/T.../B.../...` |

### Discord

| # | Name | Format | Example |
|---|------|--------|---------|
| 22 | Bot Token | Base64-like token | `MTIzNDU2Nzg5.ABCdef.abc123_DEF456-ghi789...` |
| 23 | Webhook URL | `https://discord.com/api/webhooks/` | `https://discord.com/api/webhooks/123/abc...` |

## Payment & Financial

### Stripe

| # | Name | Prefix | Example |
|---|------|--------|---------|
| 24 | Secret Key | `sk_live_` or `sk_test_` + 24 chars | `sk_test_EXAMPLE_DO_NOT_USE_12345` |
| 25 | Restricted Key | `rk_live_` or `rk_test_` + 24 chars | `rk_test_EXAMPLE_DO_NOT_USE_12345` |
| 26 | Webhook Secret | `whsec_` + 24 chars | `whsec_abc123def456ghi789jkl012mn` |

### Credit Cards

| # | Name | Format | Example |
|---|------|--------|---------|
| 27 | Credit Card Number | 13-19 digits (Luhn validated) | `4111 1111 1111 1111` (Visa) |

Supported card networks: Visa, Mastercard, American Express, Discover, Diners Club, JCB.

> **Note:** Nolex validates credit card numbers using the [Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm), the same method used by payment processors. Random number sequences that don't pass the checksum are not flagged.

## Personal Data

| # | Name | Format | Example |
|---|------|--------|---------|
| 28 | Email Address | `user@domain.tld` | `john.doe@company.com` |
| 29 | Russian Phone | `+7` or `8` + 10 digits | `+7 (999) 123-45-67` |
| 30 | International Phone | `+1` to `+3xx` + digits | `+1 (555) 123-4567` |

## Security Tokens

| # | Name | Format | Example |
|---|------|--------|---------|
| 31 | JWT Token | `eyJ...eyJ...signature` | `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIx...` |
| 32 | Private Key | `-----BEGIN ... PRIVATE KEY-----` | RSA, EC, OpenSSH private keys |

## Custom Patterns

In addition to built-in patterns, you can create your own. See [Custom Patterns](custom-patterns.md).

## Pattern Accuracy

Each pattern is designed to minimize false positives:

- **Prefix matching** -- Most API keys have unique prefixes (`sk-proj-`, `ghp_`, `AKIA`, etc.)
- **Length validation** -- Patterns require minimum character counts
- **Character set validation** -- Only expected characters are matched
- **Checksum validation** -- Credit cards use Luhn algorithm
- **Boundary checking** -- [Strict Filter](../features/strict-filter.md) removes context-dependent false positives

### False Positive Rate

| Category | False Positive Risk | Reason |
|----------|-------------------|--------|
| API Keys (prefix-based) | Very Low | Unique prefixes make false matches rare |
| Database URLs | Very Low | Protocol prefix (`postgres://`) is distinctive |
| GitHub/Slack tokens | Very Low | Unique prefixes |
| Email addresses | Low | Standard format, well-defined |
| Phone numbers | Medium | Digit sequences can appear in other contexts |
| Credit cards | Low | Luhn validation eliminates most false matches |
| JWT tokens | Very Low | `eyJ` prefix + dot-separated structure |
| Private keys | Very Low | PEM header/footer is distinctive |

> **Tip:** If you experience frequent false positives, enable [Strict Filter](../features/strict-filter.md) in the detection dialog.

---

> **See also:** [Custom Patterns](custom-patterns.md) to add your own detection rules.

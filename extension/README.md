# Nolex — Chrome Extension

Chrome extension that automatically detects and prevents sensitive data leaks when uploading files to AI platforms (ChatGPT, Claude, DeepSeek, etc.).

## Features

- Automatic file scanning before upload
- 25+ built-in sensitive data patterns
- Smart Constructor — custom regex patterns with groups, import/export
- Interactive dialog with match preview and selective replacement
- Local-first — everything runs in your browser, no data is sent anywhere
- Real-time detection statistics in popup

## Detected Data Types

### API Keys & Tokens
| Type | Example | Description |
|------|---------|-------------|
| OpenAI API Key | `sk-...` | OpenAI API keys |
| Anthropic API Key | `sk-ant-...` | Claude/Anthropic API keys |
| Google API Key | `AIza...` | Google Cloud/Maps API keys |
| AWS Access Key ID | `AKIA...` | AWS access identifier |
| AWS Secret Access Key | `wJalrXUtn...` | AWS secret key (40 chars) |
| AWS Session Token | `FwoGZXIv...` | AWS temporary session token |
| GitHub Token | `ghp_...` | GitHub Personal Access Token |
| GitHub OAuth | `gho_...` | GitHub OAuth Token |
| DeepSeek API Key | `sk-...` | DeepSeek API keys |
| Hugging Face Token | `hf_...` | Hugging Face access tokens |
| Mistral API Key | `...` | Mistral AI API keys |
| Replicate Token | `r8_...` | Replicate API tokens |
| Cohere API Key | `...` | Cohere API keys |

### Slack & Discord
| Type | Example | Description |
|------|---------|-------------|
| Slack Bot Token | `xoxb-...` | Slack bot token |
| Slack User Token | `xoxp-...` | Slack user token |
| Slack Webhook | `https://hooks.slack.com/...` | Slack webhook URL |
| Discord Bot Token | `MTk4NjI...` | Discord bot token |
| Discord Webhook | `https://discord.com/api/webhooks/...` | Discord webhook URL |

### Payment Systems
| Type | Example | Description |
|------|---------|-------------|
| Stripe Secret Key | `sk_live_...` / `sk_test_...` | Stripe secret key |
| Stripe Restricted Key | `rk_live_...` / `rk_test_...` | Stripe restricted key |
| Credit Card | `4532148803436467` | Credit card numbers |

### Databases
| Type | Example | Description |
|------|---------|-------------|
| PostgreSQL URL | `postgresql://user:pass@host/db` | PostgreSQL connection string |
| MySQL URL | `mysql://user:pass@host/db` | MySQL connection string |
| MongoDB URL | `mongodb://user:pass@host/db` | MongoDB connection string |
| Redis URL | `redis://user:pass@host:port` | Redis connection string |

### Personal Data
| Type | Example | Description |
|------|---------|-------------|
| Email | `user@example.com` | Email addresses |
| Phone (RU) | `+7 (999) 123-45-67` | Russian phone numbers |
| International Phone | `+1 234 567 8900` | International phone numbers |

### Other
| Type | Example | Description |
|------|---------|-------------|
| JWT Token | `eyJ...` | JSON Web Tokens |
| Private Key | `-----BEGIN PRIVATE KEY-----` | SSH/RSA private keys |

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension/` folder

## Usage

1. Open any AI platform (ChatGPT, Claude, DeepSeek, etc.)
2. Upload a file containing sensitive data
3. If sensitive data is found, a dialog appears with options:
   - **Cancel upload** — file won't be uploaded
   - **Keep as is** — upload without changes (at your own risk)
   - **Replace and continue** — replace sensitive data with safe placeholders

## Architecture

- `manifest.json` — extension config
- `content.js` — module initialization on page
- `detector.js` — sensitive data detection engine
- `dialog.js` — interactive UI dialog
- `constructor.js` — Smart Constructor for custom patterns
- `interceptor.js` — fetch/XHR interception for file checking
- `popup.js/html/css` — extension popup with stats

## Testing

Test files are available in `test_files/` directory. See [TESTING.md](TESTING.md) for details.

## FAQ

**Q: Is any data sent to a server?**
A: No. Everything runs locally in your browser. No data ever leaves your device.

**Q: Can I add custom patterns?**
A: Yes! Use the Smart Constructor in the extension menu to create, group, import/export patterns.

**Q: Does it slow down file uploads?**
A: Minimally. Scanning is near-instant for files up to several megabytes.

## License

MIT License

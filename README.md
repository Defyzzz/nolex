# Nolex

**Protect sensitive data when working with AI**

Nolex is a Chrome extension that automatically detects and blocks sensitive information before it gets uploaded to AI platforms (ChatGPT, Claude, DeepSeek, etc.).

## Features

- Automatic file scanning before upload to AI platforms
- 25+ built-in detection patterns (API keys, tokens, emails, credit cards, database URLs, etc.)
- Smart Constructor — create custom regex patterns with grouping and import/export
- Interactive dialog with match preview and selective replacement
- Local-first — all data processing happens on your device, nothing is sent anywhere
- Real-time statistics in popup

## Project Structure

```
nolex/
├── extension/     # Chrome extension
└── app/           # Mobile/desktop app (coming soon)
```

## Quick Start

1. Clone the repo
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` folder
5. Open any AI platform and upload files safely

## Contributing

Contributions are welcome:
- New detection patterns
- UI/UX improvements
- Bug fixes

## License

MIT License

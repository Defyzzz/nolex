# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Nolex, please report it responsibly:

1. Open an issue at [github.com/Defyzzz/nolex/issues](https://github.com/Defyzzz/nolex/issues)
2. Include steps to reproduce and potential impact

We will respond within 48 hours and work on a fix.

## Architecture

Nolex is designed with security as a core principle:

- **Local-first**: All data processing happens in the browser. No data is sent to external servers.
- **No telemetry**: The extension does not collect or transmit any user data.
- **Minimal permissions**: Only requests permissions strictly necessary for operation.
- **No remote code**: The extension does not load or execute any remote code.

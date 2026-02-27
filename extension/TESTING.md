# Testing Guide

## Step 1: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. The extension should appear in the list

## Step 2: Verify Module Loading

1. Open any AI platform (e.g., chatgpt.com or claude.ai)
2. Open DevTools console (F12 or Cmd+Option+I)
3. You should see initialization messages from Nolex modules

## Step 3: Test File Upload

### Test 1: File with sensitive data
1. Open ChatGPT or Claude
2. Upload `test_files/test.txt`
3. **Expected:** A dialog appears showing detected sensitive data with options to Cancel, Keep, or Replace

### Test 2: Replace sensitive data
1. In the dialog, click "Replace and continue"
2. **Expected:** File uploads with placeholders instead of real data

### Test 3: Keep as is
1. Upload `test.txt` again, click "Keep as is"
2. **Expected:** File uploads with original data unchanged

### Test 4: Cancel upload
1. Upload `test.txt` again, click "Cancel upload"
2. **Expected:** File is not uploaded

### Test 5: Clean file
1. Upload a file with no sensitive data
2. **Expected:** No dialog, file uploads normally

## Test Files

| File | Contents |
|------|----------|
| `test.txt` | OpenAI key, email, phone number |
| `test.json` | Multiple API keys, AWS credentials, JWT, credit card |
| `test.env` | All types of API keys, database URLs |
| `test_aws.txt` | AWS Access Key, Secret Key, Session Token |
| `test_databases.txt` | PostgreSQL, MySQL, MongoDB connection strings |
| `test_slack_discord.txt` | Slack/Discord tokens and webhooks |
| `test_stripe.txt` | Stripe API keys |
| `test_new_patterns.txt` | DeepSeek, Hugging Face, Mistral, Replicate, Cohere keys |

## Detected Data Types (25+)

**API Keys & Tokens:** OpenAI, Anthropic, Google, AWS (Access Key, Secret Key, Session Token), GitHub (PAT, OAuth), DeepSeek, Hugging Face, Mistral, Replicate, Cohere

**Messaging:** Slack (Bot, User, Webhook), Discord (Bot, Webhook)

**Payment:** Stripe (Secret, Restricted, Webhook Secret), Credit Cards

**Databases:** PostgreSQL, MySQL, MongoDB, Redis

**Personal:** Email, Phone (RU), Phone (International)

**Other:** JWT Tokens, Private Keys (SSH/RSA)

## Troubleshooting

- **Extension won't load:** Check Developer mode is enabled, check for errors on chrome://extensions/
- **Dialog doesn't appear:** Check console for JavaScript errors, verify all modules loaded
- **DeepSeek rejects .env files:** Rename to .txt before uploading (DeepSeek limitation)

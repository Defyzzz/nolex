# Инструкция по загрузке и тестированию расширения

## Шаг 1: Загрузка расширения в Chrome

1. Откройте Chrome и перейдите по адресу: `chrome://extensions/`
2. Включите "Режим разработчика" (Developer mode) в правом верхнем углу
3. Нажмите кнопку "Загрузить распакованное расширение" (Load unpacked)
4. Выберите папку: `/Users/grachouvivan/Desktop/Obsidian/Maga/Work/sanitizer`
5. Расширение должно появиться в списке

## Шаг 2: Проверка загрузки модулей

1. Откройте любой сайт (например, chatgpt.com или claude.ai)
2. Откройте консоль разработчика (F12 или Cmd+Option+I)
3. В консоли должны появиться сообщения:
   - `🛡️ AI Sanitizer: Content script загружен`
   - `🛡️ Detector.js внедрен`
   - `🛡️ Dialog.js внедрен`
   - `🛡️ Interceptor.js внедрен`
   - `🛡️ Все модули AI Sanitizer загружены`
   - `🔍 SensitiveDataDetector загружен`
   - `💬 SanitizerDialog загружен`
   - `🛡️ AI Sanitizer Interceptor v3.0 активен`

## Шаг 3: Тестирование с файлом

### Тест 1: Загрузка файла с чувствительными данными

1. Откройте ChatGPT (https://chatgpt.com) или Claude (https://claude.ai)
2. Попробуйте загрузить файл `test.txt` (который содержит OpenAI ключ)
3. **Ожидаемый результат:**
   - Должно появиться диалоговое окно с предупреждением
   - В окне должен быть виден найденный ключ: `sk-12345abcde12345abcde12345abcde12345`
   - Текст в предпросмотре должен иметь подсвеченный фрагмент
   - Должны быть 3 кнопки: "Отменить загрузку", "Оставить как есть", "Заменить и продолжить"

### Тест 2: Замена чувствительных данных

1. В диалоговом окне можете отредактировать предложенную замену
2. Нажмите "Заменить и продолжить"
3. **Ожидаемый результат:**
   - Диалог закроется
   - Файл должен загрузиться с замененными данными
   - В консоли появится: `🛡️ Решение пользователя: replace` и `🛡️ Чувствительные данные заменены`

### Тест 3: Оставить как есть

1. Загрузите `test.txt` снова
2. В диалоге нажмите "Оставить как есть"
3. **Ожидаемый результат:**
   - Файл загрузится с оригинальными данными (с ключом)
   - В консоли: `🛡️ Решение пользователя: proceed` и `🛡️ Файл загружается без изменений`

### Тест 4: Отмена загрузки

1. Загрузите `test.txt` снова
2. В диалоге нажмите "Отменить загрузку"
3. **Ожидаемый результат:**
   - Файл НЕ должен загрузиться
   - В консоли: `🛡️ Решение пользователя: cancel` и `🛡️ Загрузка отменена пользователем`
   - Может появиться ошибка в консоли - это нормально

### Тест 5: Файл без чувствительных данных

1. Создайте новый текстовый файл с обычным текстом (без ключей, email и т.д.)
2. Попробуйте загрузить его
3. **Ожидаемый результат:**
   - Диалог НЕ должен появиться
   - Файл загрузится сразу
   - В консоли: `🛡️ Файл "[имя]" чист`

## Шаг 4: Тестирование различных типов данных

### Базовые тесты (файлы уже созданы)

#### test.txt
- OpenAI API ключ
- Email адрес
- Номер телефона (РФ)

#### test.json
- OpenAI, Google, GitHub ключи
- **AWS Access Key ID и Secret Access Key** ✅
- Email и телефон
- JWT токен
- Номер кредитной карты

#### test.env
- Все типы API ключей
- Database connection strings
- **⚠️ Важно для DeepSeek**: этот файл не будет принят из-за расширения `.env`
  - **Решение**: переименуйте в `test_env.txt` перед загрузкой на DeepSeek
  - DeepSeek принимает: `.doc`, `.docx`, `.xlsx`, `.ppt`, `.txt`, `.pdf` и другие

### Расширенные тесты (новые файлы)

#### test_aws.txt - AWS Credentials
```
- AWS Access Key ID: AKIA...
- AWS Secret Access Key: wJalrXUtn... (40 символов) ✅ КРИТИЧНО!
- AWS Session Token: длинный токен для временных сессий
- Различные форматы (JSON, env variables)
```

#### test_databases.txt - Database Connection Strings
```
- PostgreSQL: postgresql://user:password@host/db
- MySQL: mysql://user:password@host/db
- MongoDB: mongodb://user:password@host/db
- MongoDB Atlas: mongodb+srv://user:password@cluster/db
```

#### test_slack_discord.txt - Messaging Platform Tokens
```
- Slack Bot Token: xoxb-...
- Slack User Token: xoxp-...
- Slack Webhook URL
- Discord Bot Token
- Discord Webhook URL
```

#### test_stripe.txt - Payment API Keys
```
- Stripe Secret Key (live): sk_live_...
- Stripe Secret Key (test): sk_test_...
- Stripe Restricted Key: rk_live_...
```

### Создание собственных тестов

Создайте тестовые файлы со следующими данными:

#### Email
```
Мой email: ivan@example.com
```

#### Телефон
```
Позвоните мне: +7 (999) 123-45-67
```

#### GitHub Token
```
ghp_1234567890abcdefghijklmnopqrstuv12
```

Каждый из этих файлов должен вызвать диалог с соответствующим типом найденных данных.

## Шаг 5: Полный список детектируемых типов

### API Ключи (9 типов)
1. ✅ OpenAI API Key (`sk-...`)
2. ✅ Anthropic/Claude API Key (`sk-ant-...`)
3. ✅ Google API Key (`AIza...`)
4. ✅ AWS Access Key ID (`AKIA...`)
5. ✅ **AWS Secret Access Key** (40 символов base64)
6. ✅ AWS Session Token (100+ символов)
7. ✅ GitHub Personal Access Token (`ghp_...`)
8. ✅ GitHub OAuth Token (`gho_...`)

### Messaging & Webhooks (5 типов)
9. ✅ Slack Bot Token (`xoxb-...`)
10. ✅ Slack User Token (`xoxp-...`)
11. ✅ Slack Webhook URL
12. ✅ Discord Bot Token
13. ✅ Discord Webhook URL

### Payment (2 типа)
14. ✅ Stripe Secret Key (`sk_live_...`, `sk_test_...`)
15. ✅ Stripe Restricted Key (`rk_live_...`, `rk_test_...`)

### Databases (3 типа)
16. ✅ PostgreSQL Connection String
17. ✅ MySQL Connection String
18. ✅ MongoDB Connection String

### Personal Data (4 типа)
19. ✅ Email адреса
20. ✅ Российские телефоны
21. ✅ Международные телефоны
22. ✅ Номера кредитных карт

### Other (2 типа)
23. ✅ JWT Tokens
24. ✅ SSH/RSA Private Keys

**Всего: 24 типа чувствительных данных!**

## Возможные проблемы

### Расширение не загружается
- Проверьте, включен ли "Режим разработчика"
- Проверьте, нет ли ошибок на странице chrome://extensions/

### Диалог не появляется
- Откройте консоль и проверьте, загружены ли все модули
- Проверьте, нет ли ошибок JavaScript

### Диалог появляется, но не закрывается при нажатии кнопок
- Проверьте консоль на наличие ошибок
- Убедитесь, что все файлы (.html, .css, .js) загружены корректно

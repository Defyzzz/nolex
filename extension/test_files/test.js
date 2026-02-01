/**
 * Пример JavaScript файла с чувствительными данными
 * ПЛОХАЯ ПРАКТИКА - не делайте так в реальных проектах!
 */

// API keys (опасно!)
const OPENAI_API_KEY = 'sk-12345abcde12345abcde12345abcde12345';
const GOOGLE_API_KEY = 'AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe';
const GITHUB_TOKEN = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz12';

// AWS конфиг
const awsConfig = {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1'
};

// Контакты
const ADMIN_EMAIL = 'admin@example.com';
const SUPPORT_PHONE = '+7 (999) 123-45-67';

// JWT токен
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Функция для API вызова
async function callOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'gpt-4', messages: [{ role: 'user', content: prompt }] })
    });

    return await response.json();
}

console.log('Это тестовый файл');
console.log(`Email: ${ADMIN_EMAIL}`);

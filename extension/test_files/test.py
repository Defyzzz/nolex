#!/usr/bin/env python3
"""
Пример Python скрипта с чувствительными данными
"""

import os
import requests

# ПЛОХАЯ ПРАКТИКА: API ключи в коде!
OPENAI_API_KEY = "sk-12345abcde12345abcde12345abcde12345"
GOOGLE_API_KEY = "AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe"

# AWS credentials (тоже плохо!)
AWS_CONFIG = {
    "access_key": "AKIAIOSFODNN7EXAMPLE",
    "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

# Контактные данные
ADMIN_EMAIL = "admin@example.com"
SUPPORT_PHONE = "+7 (999) 123-45-67"

# JWT токен для авторизации
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

def make_api_call():
    """Вызов API с ключом"""
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    # ... остальной код
    pass

if __name__ == "__main__":
    print("Это тестовый файл для проверки детектора")
    print(f"Email: {ADMIN_EMAIL}")

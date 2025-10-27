import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'data/payments.db')
    ORDER_SERVICE_URL = os.getenv('ORDER_SERVICE_URL', 'http://localhost:8083')
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))
    RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672/canteen')
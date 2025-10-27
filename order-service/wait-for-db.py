#!/usr/bin/env python
import os
import sys
import time
import pymysql
from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError

def wait_for_db():
    """Wait for database to be available."""
    db_conn = None
    while not db_conn:
        try:
            # Try to connect to the database
            conn = pymysql.connect(
                host=os.getenv('DB_HOST', 'mysql'),
                user=os.getenv('DB_USER', 'admin'),
                password=os.getenv('DB_PASSWORD', 'admin123'),
                database=os.getenv('DB_NAME', 'orderdb'),
                port=int(os.getenv('DB_PORT', '3306'))
            )
            conn.close()
            db_conn = True
            print("Database connection successful!")
        except Exception as e:
            print(f"Database unavailable, waiting 2 second... ({e})")
            time.sleep(2)

if __name__ == "__main__":
    wait_for_db()
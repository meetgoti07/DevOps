#!/bin/bash
set -e

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
python wait-for-db.py

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Start the Django development server
echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8083
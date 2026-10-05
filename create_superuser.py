import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
username = 'admin'
email = 'admin@example.com'
password = 'YourPassword123'  # Apni marzi ka strong password rakhein

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print("Superuser created successfully!")
else:
    print("Superuser already exists.")

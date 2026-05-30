import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Ensure an admin superuser exists using environment variables'

    def handle(self, *args, **options):
        username = os.environ.get('ADMIN_USERNAME') or os.environ.get('DJANGO_SUPERUSER_USERNAME')
        password = os.environ.get('ADMIN_PASSWORD') or os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        email = os.environ.get('ADMIN_EMAIL') or os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')

        if not username or not password:
            self.stdout.write('ADMIN_USERNAME or ADMIN_PASSWORD not set, skipping admin creation')
            return

        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Updated admin user: {username}'))
        else:
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {username}'))

import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


def _ensure_user(username, password, email, superuser=False):
    if not username or not password:
        return None

    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_superuser = superuser
        user.is_staff = superuser
        user.save()
        return user
    if superuser:
        return User.objects.create_superuser(username=username, email=email, password=password)
    return User.objects.create_user(username=username, email=email, password=password)


class Command(BaseCommand):
    help = 'Ensure admin/worker users exist using environment variables'

    def handle(self, *args, **options):
        admin_username = os.environ.get('ADMIN_USERNAME') or os.environ.get('DJANGO_SUPERUSER_USERNAME')
        admin_password = os.environ.get('ADMIN_PASSWORD') or os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        admin_email = os.environ.get('ADMIN_EMAIL') or os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')

        worker_username = os.environ.get('WORKER_USERNAME')
        worker_password = os.environ.get('WORKER_PASSWORD')
        worker_email = os.environ.get('WORKER_EMAIL', 'worker@example.com')

        if admin_username and admin_password:
            _ensure_user(admin_username, admin_password, admin_email, superuser=True)
            self.stdout.write(self.style.SUCCESS(f'Admin user ready: {admin_username}'))
        else:
            self.stdout.write('ADMIN_USERNAME/ADMIN_PASSWORD not set, skipping admin')

        if worker_username and worker_password:
            _ensure_user(worker_username, worker_password, worker_email)
            self.stdout.write(self.style.SUCCESS(f'Worker user ready: {worker_username}'))
        else:
            self.stdout.write('WORKER_USERNAME/WORKER_PASSWORD not set, skipping worker')

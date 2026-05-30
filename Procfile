release: python manage.py migrate --noinput
web: gunicorn field_project.wsgi --workers 4 --threads 2 --log-file - --log-level debug
from django.urls import path
from .views import sync_work_logs

urlpatterns = [
    path('', sync_work_logs, name='sync_work_logs'),
]

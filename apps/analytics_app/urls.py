from django.urls import path
from .views import dashboard_summary, work_trend, block_summary, crop_summary, cost_summary

urlpatterns = [
    path('dashboard/', dashboard_summary, name='dashboard_summary'),
    path('trend/', work_trend, name='work_trend'),
    path('block-summary/', block_summary, name='block_summary'),
    path('crop-summary/', crop_summary, name='crop_summary'),
    path('cost-summary/', cost_summary, name='cost_summary'),
]

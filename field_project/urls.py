from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.auth_app.views import CustomTokenObtainPairView, user_profile
from apps.core_app.views import (
    BlockViewSet, CropViewSet, BlockCropViewSet,
    WorkerViewSet, WorkTypeViewSet, DailyWorkLogViewSet, SeasonViewSet,
    WeatherRecordViewSet, InventoryItemViewSet, InventoryTransactionViewSet,
    DailyAttendanceViewSet
)

router = DefaultRouter()
router.register(r'blocks', BlockViewSet, basename='block')
router.register(r'crops', CropViewSet, basename='crop')
router.register(r'block-crops', BlockCropViewSet, basename='block-crop')
router.register(r'workers', WorkerViewSet, basename='worker')
router.register(r'work-types', WorkTypeViewSet, basename='work-type')
router.register(r'work-logs', DailyWorkLogViewSet, basename='work-log')
router.register(r'seasons', SeasonViewSet, basename='season')
router.register(r'weather', WeatherRecordViewSet, basename='weather')
router.register(r'inventory', InventoryItemViewSet, basename='inventory')
router.register(r'inventory-transactions', InventoryTransactionViewSet, basename='inventory-transaction')
router.register(r'attendance', DailyAttendanceViewSet, basename='attendance')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', user_profile, name='user_profile'),
    path('api/sync/', include('apps.sync_app.urls')),
    path('api/analytics/', include('apps.analytics_app.urls')),
    path('api/export/', include('apps.export_app.urls')),
]

# SPA fallback - serve index.html for non-API routes in production
import os
if os.environ.get('DEBUG', 'False') != 'True':
    urlpatterns.append(path('', TemplateView.as_view(template_name='index.html')))

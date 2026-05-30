import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core_app.models import (
    Block, Crop, Season, BlockCrop, WorkType, Worker,
    DailyWorkLog, WorkLogAttendance, WeatherRecord,
    InventoryItem, InventoryTransaction, DailyAttendance
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123',
        is_staff=True
    )
    return user


@pytest.fixture
def regular_user(db):
    user = User.objects.create_user(
        username='user',
        email='user@test.com',
        password='testpass123',
        is_staff=False
    )
    return user


@pytest.fixture
def authenticated_client(api_client, admin_user):
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def block(db):
    return Block.objects.create(
        name='Test Block',
        location='Test Location',
        total_area_hectares=10.5
    )


@pytest.fixture
def crop(db):
    return Crop.objects.create(
        name='Pepper',
        scientific_name='Piper nigrum',
        crop_type='spice',
        planting_density_per_hectare=500
    )


@pytest.fixture
def season(db, crop):
    from datetime import date
    return Season.objects.create(
        name='2026',
        crop=crop,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        is_active=True
    )


@pytest.fixture
def work_type(db):
    return WorkType.objects.create(
        category='Field',
        name='Harvesting',
        description='Harvest pepper'
    )


@pytest.fixture
def worker(db):
    return Worker.objects.create(
        name='John Doe',
        gender='M',
        village='Test Village',
        aadhaar_number='123456789012',
        phone_number='9876543210',
        daily_rate_rs=500,
        employment_type='temporary',
        status='active'
    )


@pytest.fixture
def weather_record(db):
    from datetime import date
    return WeatherRecord.objects.create(
        date=date(2026, 4, 22),
        rainfall_mm=10.5,
        temperature_max=32.0,
        temperature_min=25.0,
        humidity=75
    )


@pytest.fixture
def inventory_item(db):
    return InventoryItem.objects.create(
        name='Urea',
        category='Solutions',
        sub_category='Fertilizers',
        unit='KG',
        current_stock=100,
        min_stock_level=20,
        rate_per_unit=50
    )


@pytest.fixture
def daily_work_log(db, block, crop, work_type, admin_user):
    from datetime import date
    return DailyWorkLog.objects.create(
        log_date=date(2026, 4, 22),
        block=block,
        crop=crop,
        work_type=work_type,
        male_labour_count=5,
        female_labour_count=10,
        hours_worked=8,
        status='draft',
        created_by=admin_user
    )
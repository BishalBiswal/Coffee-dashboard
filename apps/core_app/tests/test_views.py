import pytest
from datetime import date

from django.contrib.auth.models import User
from rest_framework import status

from apps.core_app.models import (
    Block, Crop, Season, BlockCrop, WorkType, Worker,
    DailyWorkLog, WorkLogAttendance, WeatherRecord,
    InventoryItem, InventoryTransaction, DailyAttendance
)


@pytest.mark.django_db
class TestBlockAPI:
    def test_list_blocks_unauthenticated(self, api_client, block):
        response = api_client.get('/api/blocks/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_blocks_authenticated(self, authenticated_client, block):
        response = authenticated_client.get('/api/blocks/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

    def test_create_block_authenticated(self, authenticated_client):
        data = {
            'name': 'New Block',
            'location': 'New Location',
            'total_area_hectares': '15.0'
        }
        response = authenticated_client.post('/api/blocks/', data)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_block_detail(self, authenticated_client, block):
        response = authenticated_client.get(f'/api/blocks/{block.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Test Block'


@pytest.mark.django_db
class TestCropAPI:
    def test_list_crops_authenticated(self, authenticated_client, crop):
        response = authenticated_client.get('/api/crops/')
        assert response.status_code == status.HTTP_200_OK

    def test_crop_detail(self, authenticated_client, crop):
        response = authenticated_client.get(f'/api/crops/{crop.id}/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestWorkerAPI:
    def test_list_workers(self, authenticated_client, worker):
        response = authenticated_client.get('/api/workers/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

    def test_create_worker(self, authenticated_client):
        data = {
            'name': 'New Worker',
            'gender': 'M',
            'daily_rate_rs': '400',
            'employment_type': 'temporary'
        }
        response = authenticated_client.post('/api/workers/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Worker'

    def test_update_worker(self, authenticated_client, worker):
        data = {'name': 'Updated Name', 'daily_rate_rs': '450'}
        response = authenticated_client.patch(
            f'/api/workers/{worker.id}/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_worker(self, authenticated_client, worker):
        response = authenticated_client.delete(f'/api/workers/{worker.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestWorkTypeAPI:
    def test_list_work_types(self, authenticated_client, work_type):
        response = authenticated_client.get('/api/work-types/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestDailyWorkLogAPI:
    def test_list_work_logs(self, authenticated_client, daily_work_log):
        response = authenticated_client.get('/api/work-logs/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_work_log(self, authenticated_client, block, crop, work_type):
        data = {
            'log_date': '2026-04-23',
            'block': block.id,
            'crop': crop.id,
            'work_type': work_type.id,
            'male_labour_count': 2,
            'female_labour_count': 4,
            'hours_worked': 8,
            'status': 'draft'
        }
        response = authenticated_client.post(
            '/api/work-logs/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_today_work_logs(self, authenticated_client, daily_work_log):
        response = authenticated_client.get('/api/work-logs/today/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestSeasonAPI:
    def test_list_seasons(self, authenticated_client, season):
        response = authenticated_client.get('/api/seasons/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_season(self, authenticated_client, crop):
        data = {
            'name': '2028',
            'crop': crop.id,
            'start_date': '2028-01-01',
            'end_date': '2028-12-31'
        }
        response = authenticated_client.post(
            '/api/seasons/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestWeatherRecordAPI:
    def test_list_weather(self, authenticated_client, weather_record):
        response = authenticated_client.get('/api/weather/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_weather(self, authenticated_client):
        data = {
            'date': '2026-04-24',
            'rainfall_mm': '5.0',
            'temperature_max': '30.0'
        }
        response = authenticated_client.post(
            '/api/weather/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestInventoryItemAPI:
    def test_list_inventory(self, authenticated_client, inventory_item):
        response = authenticated_client.get('/api/inventory/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_inventory(self, authenticated_client):
        data = {
            'name': 'NPK',
            'category': 'Solutions',
            'sub_category': 'Fertilizers',
            'unit': 'KG',
            'current_stock': 200,
            'min_stock_level': 50,
            'rate_per_unit': 30
        }
        response = authenticated_client.post(
            '/api/inventory/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestInventoryTransactionAPI:
    def test_create_transaction_in(self, authenticated_client, inventory_item):
        data = {
            'date': '2026-04-22',
            'item': inventory_item.id,
            'transaction_type': 'IN',
            'quantity': 50
        }
        response = authenticated_client.post(
            '/api/inventory-transactions/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_transaction_out(self, authenticated_client, inventory_item):
        data = {
            'date': '2026-04-22',
            'item': inventory_item.id,
            'transaction_type': 'OUT',
            'quantity': 30
        }
        response = authenticated_client.post(
            '/api/inventory-transactions/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestDailyAttendanceAPI:
    def test_list_attendance(self, authenticated_client, worker):
        att = DailyAttendance.objects.create(
            date=date(2026, 4, 22),
            worker=worker,
            present=True
        )
        response = authenticated_client.get('/api/attendance/')
        assert response.status_code == status.HTTP_200_OK

    def test_mark_attendance(self, authenticated_client, worker):
        data = {
            'date': '2026-04-25',
            'worker_ids': [worker.id],
            'present': True
        }
        response = authenticated_client.post(
            '/api/attendance/mark_attendance/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestFiltering:
    def test_filter_workers_by_status(self, authenticated_client, worker):
        response = authenticated_client.get('/api/workers/?status=active')
        assert response.status_code == status.HTTP_200_OK

    def test_search_workers(self, authenticated_client, worker):
        response = authenticated_client.get('/api/workers/?search=John')
        assert response.status_code == status.HTTP_200_OK

    def test_ordering_workers(self, authenticated_client, worker):
        response = authenticated_client.get('/api/workers/?ordering=name')
        assert response.status_code == status.HTTP_200_OK
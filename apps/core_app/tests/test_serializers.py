import pytest
from datetime import date

from apps.core_app.serializers import (
    BlockSerializer, CropSerializer, WorkerSerializer,
    WorkTypeSerializer, DailyWorkLogSerializer, SeasonSerializer,
    WeatherRecordSerializer, InventoryItemSerializer,
    InventoryTransactionSerializer, DailyAttendanceSerializer
)


@pytest.mark.django_db
class TestBlockSerializer:
    def test_serialize_block(self, block):
        serializer = BlockSerializer(block)
        data = serializer.data
        assert data['name'] == 'Test Block'
        assert data['location'] == 'Test Location'
        assert data['total_area_hectares'] == '10.50'

    def test_deserialize_block(self):
        data = {
            'name': 'New Block',
            'location': 'New Location',
            'total_area_hectares': '20.0'
        }
        serializer = BlockSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        block = serializer.save()
        assert block.name == 'New Block'


@pytest.mark.django_db
class TestCropSerializer:
    def test_serialize_crop(self, crop):
        serializer = CropSerializer(crop)
        data = serializer.data
        assert data['name'] == 'Pepper'
        assert data['scientific_name'] == 'Piper nigrum'
        assert data['crop_type'] == 'spice'

    def test_deserialize_crop(self):
        data = {
            'name': 'Coffee',
            'scientific_name': 'Coffea arabica',
            'crop_type': 'plantation',
            'planting_density_per_hectare': 1000
        }
        serializer = CropSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        crop = serializer.save()
        assert crop.name == 'Coffee'


@pytest.mark.django_db
class TestSeasonSerializer:
    def test_serialize_season(self, season, crop):
        serializer = SeasonSerializer(season)
        data = serializer.data
        assert data['name'] == '2026'
        assert data['crop_name'] == 'Pepper'

    def test_deserialize_season(self, crop):
        data = {
            'name': '2027',
            'crop': crop.id,
            'start_date': '2027-01-01',
            'end_date': '2027-12-31'
        }
        serializer = SeasonSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        season = serializer.save()
        assert season.name == '2027'


@pytest.mark.django_db
class TestWorkerSerializer:
    def test_serialize_worker(self, worker):
        serializer = WorkerSerializer(worker)
        data = serializer.data
        assert data['name'] == 'John Doe'
        assert data['gender'] == 'M'
        assert data['daily_rate_rs'] == '500.00'

    def test_deserialize_worker(self):
        data = {
            'name': 'Alice',
            'gender': 'F',
            'daily_rate_rs': '450',
            'employment_type': 'temporary'
        }
        serializer = WorkerSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        worker = serializer.save()
        assert worker.name == 'Alice'


@pytest.mark.django_db
class TestWorkTypeSerializer:
    def test_serialize_work_type(self, work_type):
        serializer = WorkTypeSerializer(work_type)
        data = serializer.data
        assert data['name'] == 'Harvesting'
        assert data['category'] == 'Field'


@pytest.mark.django_db
class TestDailyWorkLogSerializer:
    def test_serialize_work_log(self, daily_work_log):
        serializer = DailyWorkLogSerializer(daily_work_log)
        data = serializer.data
        assert data['block_name'] == 'Test Block'
        assert data['crop_name'] == 'Pepper'
        assert data['work_type_name'] == 'Harvesting'
        assert data['total_labour_count'] == 15
        assert data['total_hours'] == 120.0

    def test_deserialize_work_log(self, block, crop, work_type):
        data = {
            'log_date': '2026-04-22',
            'block': block.id,
            'crop': crop.id,
            'work_type': work_type.id,
            'male_labour_count': 3,
            'female_labour_count': 5,
            'hours_worked': 8,
            'status': 'draft'
        }
        serializer = DailyWorkLogSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        log = serializer.save()
        assert log.male_labour_count == 3


@pytest.mark.django_db
class TestWeatherRecordSerializer:
    def test_serialize_weather(self, weather_record):
        serializer = WeatherRecordSerializer(weather_record)
        data = serializer.data
        assert data['rainfall_mm'] == '10.50'
        assert data['temperature_max'] == '32.0'

    def test_deserialize_weather(self):
        data = {
            'date': '2026-04-23',
            'rainfall_mm': '5.0',
            'temperature_max': '30.0',
            'temperature_min': '22.0',
            'humidity': 70
        }
        serializer = WeatherRecordSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestInventoryItemSerializer:
    def test_serialize_inventory_item(self, inventory_item):
        serializer = InventoryItemSerializer(inventory_item)
        data = serializer.data
        assert data['name'] == 'Urea'
        assert data['current_stock'] == '100.00'

    def test_deserialize_inventory_item(self):
        data = {
            'name': ' Pesticide',
            'category': 'Solutions',
            'sub_category': 'PestControl',
            'unit': 'LTR',
            'current_stock': 50,
            'min_stock_level': 10,
            'rate_per_unit': 150
        }
        serializer = InventoryItemSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestInventoryTransactionSerializer:
    def test_serialize_transaction(self, inventory_item, block):
        from apps.core_app.models import InventoryTransaction
        trans = InventoryTransaction.objects.create(
            date=date(2026, 4, 22),
            item=inventory_item,
            transaction_type='IN',
            quantity=25,
            block=block
        )
        serializer = InventoryTransactionSerializer(trans)
        data = serializer.data
        assert data['item_name'] == 'Urea'
        assert data['transaction_type'] == 'IN'


@pytest.mark.django_db
class TestDailyAttendanceSerializer:
    def test_serialize_attendance(self, worker):
        from apps.core_app.models import DailyAttendance
        att = DailyAttendance.objects.create(
            date=date(2026, 4, 22),
            worker=worker,
            present=True,
            present_morning=True,
            present_afternoon=True
        )
        serializer = DailyAttendanceSerializer(att)
        data = serializer.data
        assert data['worker_name'] == 'John Doe'
        assert data['present'] is True
import pytest
from datetime import date, timedelta
from decimal import Decimal

from django.db import IntegrityError
from django.contrib.auth.models import User

from apps.core_app.models import (
    Block, Crop, Season, BlockCrop, WorkType, Worker,
    DailyWorkLog, WorkLogAttendance, WeatherRecord,
    InventoryItem, InventoryTransaction, DailyAttendance
)


@pytest.mark.django_db
class TestBlockModel:
    def test_create_block(self):
        block = Block.objects.create(
            name='Test Block',
            location='Test Location',
            total_area_hectares=10.5
        )
        assert block.name == 'Test Block'
        assert block.total_area_hectares == Decimal('10.5')
        assert block.created_at is not None

    def test_block_str(self, block):
        assert str(block) == 'Block Test Block'

    def test_block_unique_name(self, block):
        with pytest.raises(IntegrityError):
            Block.objects.create(name='Test Block')


@pytest.mark.django_db
class TestCropModel:
    def test_create_crop(self):
        crop = Crop.objects.create(
            name='Cardamom',
            scientific_name='Elettaria cardamomum',
            crop_type='spice',
            planting_density_per_hectare=1000
        )
        assert crop.name == 'Cardamom'
        assert crop.crop_type == 'spice'

    def test_crop_str(self, crop):
        assert str(crop) == 'Pepper'


@pytest.mark.django_db
class TestSeasonModel:
    def test_create_season(self, crop):
        season = Season.objects.create(
            name='2025',
            crop=crop,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            is_active=True
        )
        assert season.name == '2025'
        assert season.is_active is True

    def test_season_unique_together(self, crop, season):
        with pytest.raises(IntegrityError):
            Season.objects.create(
                name='2026',
                crop=crop,
                start_date=date(2026, 1, 1),
                end_date=date(2026, 12, 31)
            )


@pytest.mark.django_db
class TestBlockCropModel:
    def test_create_block_crop(self, block, crop):
        block_crop = BlockCrop.objects.create(
            block=block,
            crop=crop,
            num_rows=10,
            trees_per_row={'1': 50, '2': 50}
        )
        assert block_crop.num_rows == 10
        assert block_crop.total_trees == 100

    def test_total_trees_calculation(self, block, crop):
        bc = BlockCrop.objects.create(
            block=block,
            crop=crop,
            trees_per_row={'1': '25', '2': '30', '3': '45'}
        )
        assert bc.total_trees == 100


@pytest.mark.django_db
class TestWorkTypeModel:
    def test_create_work_type(self):
        wt = WorkType.objects.create(
            category='Nursery',
            name='Watering',
            description='Water nursery plants'
        )
        assert wt.category == 'Nursery'
        assert str(wt) == 'Nursery - Watering'


@pytest.mark.django_db
class TestWorkerModel:
    def test_create_worker(self):
        worker = Worker.objects.create(
            name='Jane Doe',
            gender='F',
            daily_rate_rs=450,
            employment_type='permanent',
            status='active'
        )
        assert worker.name == 'Jane Doe'
        assert worker.daily_rate_rs == Decimal('450')

    def test_worker_unique_aadhaar(self, worker):
        with pytest.raises(IntegrityError):
            Worker.objects.create(
                name='Jane Smith',
                gender='F',
                aadhaar_number='123456789012',
                daily_rate_rs=400
            )

    def test_worker_default_status(self):
        worker = Worker.objects.create(
            name='Test Worker',
            gender='M',
            daily_rate_rs=400
        )
        assert worker.status == 'active'


@pytest.mark.django_db
class TestDailyWorkLogModel:
    def test_create_work_log(self, block, crop, work_type, admin_user):
        log = DailyWorkLog.objects.create(
            log_date=date(2026, 4, 22),
            block=block,
            crop=crop,
            work_type=work_type,
            male_labour_count=5,
            female_labour_count=10,
            hours_worked=8,
            created_by=admin_user
        )
        assert log.total_labour_count == 15
        assert log.total_cost == 2550.0

    def test_total_labour_count(self, daily_work_log):
        assert daily_work_log.total_labour_count == 15

    def test_total_cost_calculation(self, daily_work_log):
        expected = 15 * 8 * 21.25
        assert daily_work_log.total_cost == expected

    def test_default_hours(self, block, crop, work_type, admin_user):
        log = DailyWorkLog.objects.create(
            log_date=date(2026, 4, 22),
            block=block,
            crop=crop,
            work_type=work_type,
            male_labour_count=2,
            female_labour_count=3,
            created_by=admin_user
        )
        assert float(log.hours_worked) == 8.0


@pytest.mark.django_db
class TestWorkLogAttendanceModel:
    def test_create_attendance(self, daily_work_log, worker):
        attendance = WorkLogAttendance.objects.create(
            work_log=daily_work_log,
            worker=worker,
            hours_worked=8
        )
        assert attendance.wage_earned_rs == Decimal('500')

    def test_auto_wage_calculation(self, daily_work_log, worker):
        attendance = WorkLogAttendance(
            work_log=daily_work_log,
            worker=worker,
            hours_worked=4
        )
        attendance.save()
        assert attendance.wage_earned_rs == Decimal('250')


@pytest.mark.django_db
class TestWeatherRecordModel:
    def test_create_weather_record(self):
        record = WeatherRecord.objects.create(
            date=date(2026, 4, 22),
            rainfall_mm=15.5,
            temperature_max=35.0,
            temperature_min=24.0,
            humidity=80
        )
        assert record.rainfall_mm == Decimal('15.5')

    def test_weather_unique_date(self, weather_record):
        with pytest.raises(IntegrityError):
            WeatherRecord.objects.create(
                date=date(2026, 4, 22),
                rainfall_mm=5.0
            )


@pytest.mark.django_db
class TestInventoryItemModel:
    def test_create_inventory_item(self):
        item = InventoryItem.objects.create(
            name='DAP',
            category='Solutions',
            sub_category='Fertilizers',
            unit='KG',
            current_stock=500,
            min_stock_level=100,
            rate_per_unit=25
        )
        assert item.current_stock == Decimal('500')

    def test_inventory_category_choices(self):
        for category, label in InventoryItem.CATEGORIES:
            item = InventoryItem.objects.create(
                name=f'Test {category}',
                category=category,
                unit='NOS'
            )
            assert item.category == category


@pytest.mark.django_db
class TestInventoryTransactionModel:
    def test_stock_in_increases(self, inventory_item):
        InventoryTransaction.objects.create(
            date=date(2026, 4, 22),
            item=inventory_item,
            transaction_type='IN',
            quantity=50
        )
        inventory_item.refresh_from_db()
        assert inventory_item.current_stock == Decimal('150')

    def test_stock_out_decreases(self, inventory_item):
        InventoryTransaction.objects.create(
            date=date(2026, 4, 22),
            item=inventory_item,
            transaction_type='OUT',
            quantity=30
        )
        inventory_item.refresh_from_db()
        assert inventory_item.current_stock == Decimal('70')

    def test_insufficient_stock_raises(self, inventory_item):
        with pytest.raises(ValueError) as exc:
            InventoryTransaction.objects.create(
                date=date(2026, 4, 22),
                item=inventory_item,
                transaction_type='OUT',
                quantity=150
            )
        assert 'Insufficient stock' in str(exc.value)


@pytest.mark.django_db
class TestDailyAttendanceModel:
    def test_create_attendance(self, worker):
        attendance = DailyAttendance.objects.create(
            date=date(2026, 4, 22),
            worker=worker,
            present=True
        )
        assert attendance.present is True
        assert attendance.present_morning is False

    def test_unique_together(self, worker):
        DailyAttendance.objects.create(
            date=date(2026, 4, 22),
            worker=worker,
            present=True
        )
        with pytest.raises(IntegrityError):
            DailyAttendance.objects.create(
                date=date(2026, 4, 22),
                worker=worker,
                present=False
            )
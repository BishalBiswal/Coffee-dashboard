from rest_framework import serializers
from .models import Block, Crop, BlockCrop, Worker, WorkType, DailyWorkLog, WorkLogAttendance, Season, WeatherRecord, InventoryItem, InventoryTransaction, DailyAttendance


class SeasonSerializer(serializers.ModelSerializer):
    crop_name = serializers.CharField(source='crop.name', read_only=True)

    class Meta:
        model = Season
        fields = ['id', 'name', 'crop', 'crop_name', 'start_date', 'end_date', 'description', 'is_active', 'created_at']


class BlockSerializer(serializers.ModelSerializer):
    crop_count = serializers.SerializerMethodField()
    work_log_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Block
        fields = ['id', 'name', 'location', 'total_area_hectares', 'created_at', 'crop_count', 'work_log_count']
    
    def get_crop_count(self, obj):
        return getattr(obj, 'crop_count', 0)
    
    def get_work_log_count(self, obj):
        return getattr(obj, 'work_log_count', 0)


class CropSerializer(serializers.ModelSerializer):
    seasons = SeasonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Crop
        fields = ['id', 'name', 'scientific_name', 'crop_type', 'planting_density_per_hectare', 'seasons', 'created_at']


class BlockCropSerializer(serializers.ModelSerializer):
    crop_name = serializers.CharField(source='crop.name', read_only=True)
    block_name = serializers.CharField(source='block.name', read_only=True)
    total_trees = serializers.SerializerMethodField()

    class Meta:
        model = BlockCrop
        fields = ['id', 'block', 'block_name', 'crop', 'crop_name', 'num_rows', 
                  'trees_per_row', 'total_trees', 'planting_date', 'harvest_season']

    def get_total_trees(self, obj):
        return obj.total_trees


class WorkTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkType
        fields = ['id', 'category', 'name', 'description']


class WorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = ['id', 'name', 'gender', 'village', 'aadhaar_number', 'phone_number', 
                  'daily_rate_rs', 'employment_type', 'status', 'created_at']


class WorkLogAttendanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)

    class Meta:
        model = WorkLogAttendance
        fields = ['id', 'worker', 'worker_name', 'hours_worked', 'wage_earned_rs']


class DailyWorkLogSerializer(serializers.ModelSerializer):
    block_name = serializers.CharField(source='block.name', read_only=True)
    crop_name = serializers.CharField(source='crop.name', read_only=True)
    work_type_name = serializers.CharField(source='work_type.name', read_only=True)
    work_type_category = serializers.CharField(source='work_type.category', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    total_labour_count = serializers.SerializerMethodField()
    total_hours = serializers.SerializerMethodField()
    workers_assigned = WorkLogAttendanceSerializer(
        source='worklogattendance_set', many=True, read_only=True
    )

    class Meta:
        model = DailyWorkLog
        fields = [
            'id', 'log_date', 'block', 'block_name', 'crop', 'crop_name', 
            'season', 'season_name', 'row_number', 'work_type', 'work_type_name', 'work_type_category', 'work_detail',
            'male_labour_count', 'female_labour_count', 'total_labour_count', 'hours_worked', 'total_hours',
            'notes', 'status', 'client_sync_id', 'workers_assigned',
            'submitted_at', 'synced_at', 'created_at', 'updated_at'
        ]

    def get_total_labour_count(self, obj):
        return obj.total_labour_count
    
    def get_total_hours(self, obj):
        return float(obj.total_labour_count) * float(obj.hours_worked or 0)


class WeatherRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherRecord
        fields = ['id', 'date', 'rainfall_mm', 'temperature_max', 'temperature_min', 'humidity', 'notes', 'created_at', 'updated_at']


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = ['id', 'name', 'category', 'sub_category', 'unit', 'current_stock', 'min_stock_level', 'rate_per_unit', 'created_at', 'updated_at']


class InventoryTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_unit = serializers.CharField(source='item.unit', read_only=True)
    block_name = serializers.CharField(source='block.name', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = ['id', 'date', 'item', 'item_name', 'item_unit', 'transaction_type', 'quantity', 'block', 'block_name', 'notes', 'created_at']


class DailyAttendanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)

    class Meta:
        model = DailyAttendance
        fields = ['id', 'date', 'worker', 'worker_name', 'present', 'present_morning', 'present_afternoon', 'marked_by', 'created_at']

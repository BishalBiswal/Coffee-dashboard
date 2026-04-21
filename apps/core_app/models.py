from django.db import models
from django.contrib.auth.models import User
import json

# Use JSONField for PostgreSQL, TextField for SQLite
try:
    from django.contrib.postgres.fields import JSONField
    JSONField = JSONField
except ImportError:
    JSONField = models.TextField


class Block(models.Model):
    name = models.CharField(max_length=50, unique=True)
    location = models.CharField(max_length=255, blank=True)
    total_area_hectares = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"Block {self.name}"


class Crop(models.Model):
    CROP_TYPES = [
        ('tree_crop', 'Tree Crop'),
        ('spice', 'Spice'),
        ('plantation', 'Plantation'),
    ]

    name = models.CharField(max_length=100, unique=True)
    scientific_name = models.CharField(max_length=150, blank=True)
    crop_type = models.CharField(max_length=50, choices=CROP_TYPES)
    planting_density_per_hectare = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Season(models.Model):
    name = models.CharField(max_length=100)
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='seasons')
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ('crop', 'name', 'start_date')

    def __str__(self):
        return f"{self.crop.name} - {self.name} ({self.start_date.year})"


class BlockCrop(models.Model):
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='crops')
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='blocks')
    num_rows = models.IntegerField(default=6)
    trees_per_row = models.JSONField(default=dict)
    planting_date = models.DateField(null=True, blank=True)
    harvest_season = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('block', 'crop')
        ordering = ['block', 'crop']

    @property
    def total_trees(self):
        return sum(int(v) for v in self.trees_per_row.values() if v)

    def __str__(self):
        return f"{self.block.name}-{self.crop.name}"


class WorkType(models.Model):
    CATEGORIES = [
        ('Nursery', 'Nursery'),
        ('Field', 'Field'),
        ('Tree', 'Tree Management'),
        ('Processing', 'Processing'),
        ('Misc', 'Miscellaneous'),
    ]

    category = models.CharField(max_length=50, choices=CATEGORIES)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('category', 'name')
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.category} - {self.name}"


class Worker(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    EMPLOYMENT_TYPES = [
        ('permanent', 'Permanent'),
        ('temporary', 'Temporary'),
        ('contract', 'Contract'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('left', 'Left'),
    ]

    name = models.CharField(max_length=150)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    village = models.CharField(max_length=100, blank=True)
    aadhaar_number = models.CharField(max_length=12, unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=10, blank=True)
    daily_rate_rs = models.DecimalField(max_digits=8, decimal_places=2)
    employment_type = models.CharField(max_length=50, choices=EMPLOYMENT_TYPES, default='temporary')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class DailyWorkLog(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('synced', 'Synced'),
    ]

    log_date = models.DateField(db_index=True)
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='work_logs')
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='work_logs')
    season = models.ForeignKey(Season, on_delete=models.SET_NULL, null=True, blank=True, related_name='work_logs')
    row_number = models.IntegerField(null=True, blank=True)
    work_type = models.ForeignKey(WorkType, on_delete=models.CASCADE, related_name='logs')
    work_detail = models.CharField(max_length=255, blank=True)
    male_labour_count = models.IntegerField(default=0)
    female_labour_count = models.IntegerField(default=0)
    hours_worked = models.DecimalField(max_digits=4, decimal_places=1, default=8.0, help_text="Hours worked per labourer")
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    client_sync_id = models.UUIDField(unique=True, null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    workers = models.ManyToManyField(Worker, related_name='work_logs', through='WorkLogAttendance')

    class Meta:
        ordering = ['-log_date', '-created_at']
        indexes = [
            models.Index(fields=['log_date', 'block']),
            models.Index(fields=['crop']),
            models.Index(fields=['status']),
        ]

    @property
    def total_labour_count(self):
        return self.male_labour_count + self.female_labour_count

    @property
    def total_cost(self):
        hourly_rate = 170.0 / 8.0
        return float(self.total_labour_count) * float(self.hours_worked or 8) * hourly_rate

    def __str__(self):
        return f"{self.log_date} - {self.block.name} - {self.work_type.name}"


class WorkLogAttendance(models.Model):
    work_log = models.ForeignKey(DailyWorkLog, on_delete=models.CASCADE)
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE)
    hours_worked = models.DecimalField(max_digits=4, decimal_places=2, default=8)
    wage_earned_rs = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('work_log', 'worker')

    def save(self, *args, **kwargs):
        if not self.wage_earned_rs and self.worker:
            self.wage_earned_rs = self.worker.daily_rate_rs * self.hours_worked / 8
        super().save(*args, **kwargs)


class WeatherRecord(models.Model):
    date = models.DateField(unique=True)
    rainfall_mm = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    temperature_max = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    temperature_min = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    humidity = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.date} - {self.rainfall_mm}mm"


class DailyAttendance(models.Model):
    date = models.DateField()
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE)
    present = models.BooleanField(default=False)
    present_morning = models.BooleanField(default=False)
    present_afternoon = models.BooleanField(default=False)
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('date', 'worker')
        ordering = ['-date', 'worker']

    def __str__(self):
        return f"{self.date} - {self.worker.name} - {'Present' if self.present else 'Absent'}"


class InventoryItem(models.Model):
    CATEGORIES = [
        ('BaseMaterial', 'Base Material'),
        ('Solutions', 'Solutions'),
        ('Tools', 'Tools'),
        ('Consumables', 'Consumables'),
        ('Produce', 'Produce'),
        ('Expense', 'Expense'),
    ]

    SUB_CATEGORIES = {
        'BaseMaterial': [
            ('Micronutrients', 'Micronutrients'),
            ('SoilAmendments', 'Soil Amendments'),
            ('Microorganisms', 'Microorganisms'),
            ('Other', 'Other'),
        ],
        'Solutions': [
            ('GrowthPromoters', 'Growth Promoters'),
            ('PestControl', 'Pest Control'),
            ('Fertilizers', 'Fertilizers'),
            ('Other', 'Other'),
        ],
        'Tools': [
            ('HandTools', 'Hand Tools'),
            ('PowerTools', 'Power Tools'),
            ('Other', 'Other'),
        ],
        'Consumables': [
            ('Hardware', 'Hardware'),
            ('Safety', 'Safety'),
            ('Other', 'Other'),
        ],
        'Produce': [
            ('Spices', 'Spices'),
            ('Timber', 'Timber'),
            ('Compost', 'Compost'),
            ('Other', 'Other'),
        ],
        'Expense': [
            ('Labour', 'Labour'),
            ('Transport', 'Transport'),
            ('Maintenance', 'Maintenance'),
            ('Other', 'Other'),
        ],
    }

    UNIT_TYPES = [
        ('GMS', 'Grams'),
        ('KG', 'Kilograms'),
        ('LTR', 'Liters'),
        ('MT', 'Metric Tons'),
        ('NOS', 'Numbers'),
    ]

    name = models.CharField(max_length=150)
    category = models.CharField(max_length=50, choices=CATEGORIES)
    sub_category = models.CharField(max_length=50, blank=True)
    unit = models.CharField(max_length=20, choices=UNIT_TYPES, default='NOS')
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'sub_category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category})"


class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
    ]

    date = models.DateField()
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    block = models.ForeignKey(Block, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def save(self, *args, **kwargs):
        from django.db.models import F
        if self.transaction_type == 'IN':
            InventoryItem.objects.filter(pk=self.item.pk).update(
                current_stock=F('current_stock') + self.quantity
            )
        else:
            InventoryItem.objects.filter(pk=self.item.pk).update(
                current_stock=F('current_stock') - self.quantity
            )
        self.item.refresh_from_db()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} - {self.item.name} - {self.transaction_type} - {self.quantity}"

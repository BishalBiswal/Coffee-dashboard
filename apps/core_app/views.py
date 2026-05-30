from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Sum, F
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Block, Crop, BlockCrop, Worker, WorkType, DailyWorkLog, WorkLogAttendance, Season, WeatherRecord, InventoryItem, InventoryTransaction, DailyAttendance
from .serializers import (
    BlockSerializer, CropSerializer, BlockCropSerializer, 
    WorkerSerializer, WorkTypeSerializer, DailyWorkLogSerializer, SeasonSerializer,
    WeatherRecordSerializer, InventoryItemSerializer, InventoryTransactionSerializer,
    DailyAttendanceSerializer
)


class BlockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Block.objects.all().order_by('name')
    serializer_class = BlockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'location']

    def get_queryset(self):
        return Block.objects.annotate(
            crop_count=Count('work_logs__crop', distinct=True),
            work_log_count=Count('work_logs')
        )

    @action(detail=True, methods=['get'])
    def crops(self, request, pk=None):
        block = self.get_object()
        crops = block.crops.all()
        serializer = BlockCropSerializer(crops, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def work_logs(self, request, pk=None):
        block = self.get_object()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to', timezone.now().date())
        
        logs = DailyWorkLog.objects.filter(block=block)
        if date_from:
            logs = logs.filter(log_date__gte=date_from)
        logs = logs.filter(log_date__lte=date_to).order_by('-log_date')
        
        serializer = DailyWorkLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def activity_history(self, request, pk=None):
        block = self.get_object()
        season_id = request.query_params.get('season')
        work_type_id = request.query_params.get('work_type')
        
        logs_qs = DailyWorkLog.objects.filter(block=block).select_related(
            'crop', 'work_type', 'season'
        ).order_by('-log_date')
        
        if season_id:
            logs_qs = logs_qs.filter(season_id=season_id)
        
        if work_type_id:
            logs_qs = logs_qs.filter(work_type_id=work_type_id)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            logs_qs = logs_qs.filter(log_date__gte=date_from)
        if date_to:
            logs_qs = logs_qs.filter(log_date__lte=date_to)
        
        summary = logs_qs.values('work_type__name', 'work_type__id').annotate(
            count=Count('id'),
            total_male=Sum('male_labour_count'),
            total_female=Sum('female_labour_count'),
            total_hours=Sum((F('male_labour_count') + F('female_labour_count')) * F('hours_worked'))
        ).order_by('-count')
        
        logs = logs_qs[:200]
        
        return Response({
            'logs': DailyWorkLogSerializer(logs, many=True).data,
            'summary': list(summary),
        })


class CropViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Crop.objects.all()
    serializer_class = CropSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'scientific_name']

    @action(detail=True, methods=['get'])
    def blocks(self, request, pk=None):
        crop = self.get_object()
        block_crops = crop.blocks.all()
        serializer = BlockCropSerializer(block_crops, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def activity_history(self, request, pk=None):
        crop = self.get_object()
        season_id = request.query_params.get('season')
        work_type_id = request.query_params.get('work_type')
        
        logs_qs = DailyWorkLog.objects.filter(crop=crop).select_related(
            'block', 'work_type', 'season'
        ).order_by('-log_date')
        
        if season_id:
            logs_qs = logs_qs.filter(season_id=season_id)
        
        if work_type_id:
            logs_qs = logs_qs.filter(work_type_id=work_type_id)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            logs_qs = logs_qs.filter(log_date__gte=date_from)
        if date_to:
            logs_qs = logs_qs.filter(log_date__lte=date_to)
        
        summary = logs_qs.values('work_type__name', 'work_type__id').annotate(
            count=Count('id'),
            total_male=Sum('male_labour_count'),
            total_female=Sum('female_labour_count'),
            total_hours=Sum((F('male_labour_count') + F('female_labour_count')) * F('hours_worked'))
        ).order_by('-count')
        
        logs = logs_qs[:200]
        
        return Response({
            'logs': DailyWorkLogSerializer(logs, many=True).data,
            'summary': list(summary),
        })


class BlockCropViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlockCrop.objects.select_related('block', 'crop').all()
    serializer_class = BlockCropSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['block', 'crop']

    @action(detail=True, methods=['get'])
    def work_timeline(self, request, pk=None):
        lot = self.get_object()
        date_from = request.query_params.get('date_from', timezone.now().date() - timedelta(days=90))
        date_to = request.query_params.get('date_to', timezone.now().date())
        
        logs = DailyWorkLog.objects.filter(
            block=lot.block,
            crop=lot.crop,
            log_date__range=[date_from, date_to]
        ).order_by('log_date')
        
        serializer = DailyWorkLogSerializer(logs, many=True)
        return Response({
            'lot': BlockCropSerializer(lot).data,
            'work_timeline': serializer.data,
            'total_labour_days': sum(log.total_labour_count for log in logs),
        })

    @action(detail=True, methods=['get'])
    def row_details(self, request, pk=None):
        lot = self.get_object()
        date_from = request.query_params.get('date_from', timezone.now().date() - timedelta(days=180))
        date_to = request.query_params.get('date_to', timezone.now().date())
        
        rows_data = []
        for row_num in range(1, lot.num_rows + 1):
            row_logs = DailyWorkLog.objects.filter(
                block=lot.block,
                crop=lot.crop,
                row_number=row_num,
                log_date__range=[date_from, date_to]
            ).order_by('log_date')
            
            rows_data.append({
                'row_number': row_num,
                'trees': lot.trees_per_row.get(str(row_num), 0),
                'work_log_count': row_logs.count(),
                'total_labour_days': sum(log.total_labour_count for log in row_logs),
                'work_logs': DailyWorkLogSerializer(row_logs, many=True).data,
            })
        
        return Response(rows_data)


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employment_type', 'gender']
    search_fields = ['name', 'village']
    ordering_fields = ['name', 'daily_rate_rs']

    @action(detail=True, methods=['get'])
    def work_history(self, request, pk=None):
        worker = self.get_object()
        from .models import WorkLogAttendance
        
        attendance = WorkLogAttendance.objects.filter(
            worker=worker
        ).select_related('work_log').order_by('-work_log__log_date')
        
        days_worked = attendance.values('work_log__log_date').distinct().count()
        total_hours = sum(float(a.hours_worked) for a in attendance)
        total_wage = sum(float(a.wage_earned_rs or 0) for a in attendance)
        
        return Response({
            'worker': WorkerSerializer(worker).data,
            'days_worked': days_worked,
            'total_hours': total_hours,
            'total_wage': total_wage,
            'attendance_count': attendance.count(),
            'recent_work': DailyWorkLogSerializer(
                [a.work_log for a in attendance[:20]], many=True
            ).data,
        })

    @action(detail=False, methods=['get'])
    def today(self, request):
        from datetime import date
        from .models import WorkLogAttendance, DailyWorkLog, Block, Crop
        
        today = date.today()
        block_id = request.query_params.get('block')
        crop_id = request.query_params.get('crop')
        
        logs = DailyWorkLog.objects.filter(log_date=today).select_related('block', 'crop')
        
        if block_id:
            logs = logs.filter(block_id=block_id)
        if crop_id:
            logs = logs.filter(crop_id=crop_id)
        
        worker_ids = WorkLogAttendance.objects.filter(
            work_log__in=logs.values_list('id', flat=True)
        ).values_list('worker_id', flat=True).distinct()
        
        workers = Worker.objects.filter(id__in=worker_ids)
        
        return Response(WorkerSerializer(workers, many=True).data)

    @action(detail=False, methods=['get'])
    def by_block(self, request):
        from .models import Block, Crop
        
        block_id = request.query_params.get('block')
        crop_id = request.query_params.get('crop')
        
        if not block_id and not crop_id:
            return Response({'error': 'block or crop required'}, status=400)
        
        worker_ids = set()
        
        if block_id:
            logs = DailyWorkLog.objects.filter(block_id=block_id).values_list('id', flat=True)
            worker_ids.update(
                WorkLogAttendance.objects.filter(work_log__in=logs)
                .values_list('worker_id', flat=True).distinct()
            )
        
        if crop_id:
            logs = DailyWorkLog.objects.filter(crop_id=crop_id).values_list('id', flat=True)
            worker_ids.update(
                WorkLogAttendance.objects.filter(work_log__in=logs)
                .values_list('worker_id', flat=True).distinct()
            )
        
        workers = Worker.objects.filter(id__in=worker_ids)
        
        return Response(WorkerSerializer(workers, many=True).data)


class WorkTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkType.objects.all()
    serializer_class = WorkTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']
    pagination_class = None


class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.select_related('crop').all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['crop', 'is_active']
    search_fields = ['name']
    ordering_fields = ['start_date', 'name']
    ordering = ['-start_date']
    pagination_class = None
    
    def get_queryset(self):
        qs = super().get_queryset()
        crop_id = self.request.query_params.get('crop')
        if crop_id:
            qs = qs.filter(crop_id=crop_id)
        
        year = self.request.query_params.get('year')
        if year:
            qs = qs.filter(start_date__year=year)
        
        return qs


class DailyWorkLogViewSet(viewsets.ModelViewSet):
    queryset = DailyWorkLog.objects.select_related('block', 'crop', 'work_type', 'season').all()
    serializer_class = DailyWorkLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['log_date', 'block', 'crop', 'status', 'season']
    search_fields = ['notes', 'work_detail']
    ordering_fields = ['-log_date', '-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.groups.filter(name='field_worker').exists():
            qs = qs.filter(created_by=self.request.user)
        
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(log_date__gte=date_from)
        if date_to:
            qs = qs.filter(log_date__lte=date_to)
        
        return qs

    def perform_create(self, serializer):
        log = serializer.save(created_by=self.request.user)
        worker_ids = self.request.data.get('worker_ids', [])
        
        from .models import WorkLogAttendance, DailyAttendance
        
        for worker_id in worker_ids:
            WorkLogAttendance.objects.create(
                work_log=log,
                worker_id=worker_id,
                hours_worked=log.hours_worked or 8,
            )
            
            DailyAttendance.objects.update_or_create(
                date=log.log_date,
                worker_id=worker_id,
                defaults={
                    'present': True,
                    'present_morning': True,
                    'present_afternoon': True,
                    'marked_by': self.request.user
                }
            )

    def perform_update(self, serializer):
        log = serializer.save()
        worker_ids = self.request.data.get('worker_ids', [])

        from django.db import transaction
        from .models import WorkLogAttendance, DailyAttendance

        with transaction.atomic():
            log.workers.clear()
            for worker_id in worker_ids:
                WorkLogAttendance.objects.create(
                    work_log=log,
                    worker_id=worker_id,
                    hours_worked=log.hours_worked or 8,
                )

                DailyAttendance.objects.update_or_create(
                    date=log.log_date,
                    worker_id=worker_id,
                    defaults={
                        'present': True,
                        'present_morning': True,
                        'present_afternoon': True,
                        'marked_by': self.request.user
                    }
                )
        
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        logs = self.get_queryset().filter(log_date=today)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_workers(self, request, pk=None):
        log = self.get_object()
        
        if isinstance(request.data, list):
            workers_data = request.data
        else:
            workers_data = request.data.get('workers', [])

        from django.db import transaction
        from .models import WorkLogAttendance

        with transaction.atomic():
            log.workers.clear()
            for w in workers_data:
                WorkLogAttendance.objects.create(
                    work_log=log,
                    worker_id=w.get('worker_id'),
                    hours_worked=w.get('hours_worked', 8),
                )

        serializer = self.get_serializer(log)
        return Response(serializer.data)


class WeatherRecordViewSet(viewsets.ModelViewSet):
    queryset = WeatherRecord.objects.all()
    serializer_class = WeatherRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['notes']
    filterset_fields = ['date']

    @action(detail=False, methods=['get'])
    def monthly(self, request):
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        
        records = WeatherRecord.objects.filter(
            date__gte=f"{year}-{month:02d}-01",
            date__lte=f"{year}-{month:02d}-{last_day}"
        ).order_by('date')
        
        total_rainfall = sum(float(r.rainfall_mm or 0) for r in records)
        rainy_days = records.filter(rainfall_mm__gte=2.5).count()
        
        return Response({
            'records': WeatherRecordSerializer(records, many=True).data,
            'total_rainfall': total_rainfall,
            'rainy_days': rainy_days,
            'year': year,
            'month': month,
        })

    @action(detail=False, methods=['get'])
    def yearly(self, request):
        year = int(request.query_params.get('year', timezone.now().year))
        
        records = WeatherRecord.objects.filter(
            date__gte=f"{year}-01-01",
            date__lte=f"{year}-12-31"
        )
        
        monthly_data = []
        for month in range(1, 13):
            from calendar import monthrange
            _, last_day = monthrange(year, month)
            month_records = records.filter(
                date__gte=f"{year}-{month:02d}-01",
                date__lte=f"{year}-{month:02d}-{last_day}"
            )
            total = sum(float(r.rainfall_mm or 0) for r in month_records)
            rainy_days = month_records.filter(rainfall_mm__gte=2.5).count()
            monthly_data.append({
                'month': month,
                'total_rainfall': total,
                'rainy_days': rainy_days,
            })
        
        return Response({
            'monthly_data': monthly_data,
            'year': year,
        })


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['category']
    pagination_class = None


class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.select_related('item', 'block', 'created_by').all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['item', 'block', 'transaction_type', 'date']
    pagination_class = None
    search_fields = ['notes']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DailyAttendanceViewSet(viewsets.ModelViewSet):
    queryset = DailyAttendance.objects.select_related('worker', 'marked_by').all()
    serializer_class = DailyAttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['date', 'worker', 'present']
    pagination_class = None
    search_fields = ['worker__name']

    def get_queryset(self):
        queryset = super().get_queryset()
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset

    @action(detail=False, methods=['post'])
    def mark_attendance(self, request):
        date_str = request.data.get('date')
        worker_ids = request.data.get('worker_ids', [])
        present = request.data.get('present', True)
        
        if not date_str:
            return Response({'error': 'Date is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        for worker_id in worker_ids:
            DailyAttendance.objects.update_or_create(
                date=date,
                worker_id=worker_id,
                defaults={
                    'present': present,
                    'present_morning': present,
                    'present_afternoon': present,
                    'marked_by': request.user
                }
            )
        
        return Response({'success': True, 'marked': len(worker_ids)})

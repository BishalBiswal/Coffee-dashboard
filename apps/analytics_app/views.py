from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta, date
from calendar import monthrange
from apps.core_app.models import DailyWorkLog, Block, Crop, WorkLogAttendance


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    today = datetime.now().date()
    
    todays_logs = DailyWorkLog.objects.filter(log_date=today)
    
    total_male = todays_logs.aggregate(Sum('male_labour_count'))['male_labour_count__sum'] or 0
    total_female = todays_logs.aggregate(Sum('female_labour_count'))['female_labour_count__sum'] or 0
    total_labour = total_male + total_female
    
    attendance_today = WorkLogAttendance.objects.filter(
        work_log__log_date=today
    ).aggregate(Sum('wage_earned_rs'))['wage_earned_rs__sum'] or 0
    
    return Response({
        'date': today,
        'work_items_today': todays_logs.count(),
        'total_labour_today': total_labour,
        'male_count': total_male,
        'female_count': total_female,
        'cost_today_rs': float(attendance_today),
        'active_workers_today': WorkLogAttendance.objects.filter(
            work_log__log_date=today
        ).values('worker').distinct().count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cost_summary(request):
    period = request.query_params.get('period', 'daily')
    date_from_str = request.query_params.get('date_from')
    date_to_str = request.query_params.get('date_to')
    
    if date_from_str:
        date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
    else:
        date_from = datetime.now().date() - timedelta(days=30)
    
    if date_to_str:
        date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
    else:
        date_to = datetime.now().date()
    
    logs = DailyWorkLog.objects.filter(
        log_date__range=[date_from, date_to]
    ).select_related('block', 'crop', 'work_type')
    
    if period == 'daily':
        data = []
        current = date_from
        while current <= date_to:
            day_logs = logs.filter(log_date=current)
            total_cost = sum(
                float(log.male_labour_count or 0) * 150 + 
                float(log.female_labour_count or 0) * 170
                for log in day_logs
            )
            data.append({
                'date': current.isoformat(),
                'total_cost': total_cost,
                'work_items': day_logs.count(),
                'total_labour': sum(log.male_labour_count + log.female_labour_count for log in day_logs),
            })
            current += timedelta(days=1)
        return Response({'period': 'daily', 'data': data})
    
    elif period == 'weekly':
        data = []
        current = date_from
        while current <= date_to:
            week_end = min(current + timedelta(days=6), date_to)
            week_logs = logs.filter(log_date__range=[current, week_end])
            total_cost = sum(
                float(log.male_labour_count or 0) * 150 + 
                float(log.female_labour_count or 0) * 170
                for log in week_logs
            )
            data.append({
                'week_start': current.isoformat(),
                'week_end': week_end.isoformat(),
                'total_cost': total_cost,
                'work_items': week_logs.count(),
                'total_labour': sum(log.male_labour_count + log.female_labour_count for log in week_logs),
            })
            current += timedelta(days=7)
        return Response({'period': 'weekly', 'data': data})
    
    elif period == 'monthly':
        data = []
        current = date_from
        while current <= date_to:
            _, last_day = monthrange(current.year, current.month)
            month_end = min(date(current.year, current.month, last_day), date_to)
            month_logs = logs.filter(log_date__range=[current, month_end])
            total_cost = sum(
                float(log.male_labour_count or 0) * 150 + 
                float(log.female_labour_count or 0) * 170
                for log in month_logs
            )
            data.append({
                'year': current.year,
                'month': current.month,
                'total_cost': total_cost,
                'work_items': month_logs.count(),
                'total_labour': sum(log.male_labour_count + log.female_labour_count for log in month_logs),
            })
            if current.month == 12:
                current = date(current.year + 1, 1, 1)
            else:
                current = date(current.year, current.month + 1, 1)
        return Response({'period': 'monthly', 'data': data})
    
    elif period == 'yearly':
        data = []
        current = date_from
        while current <= date_to:
            year_logs = logs.filter(log_date__year=current.year)
            total_cost = sum(
                float(log.male_labour_count or 0) * 150 + 
                float(log.female_labour_count or 0) * 170
                for log in year_logs
            )
            data.append({
                'year': current.year,
                'total_cost': total_cost,
                'work_items': year_logs.count(),
                'total_labour': sum(log.male_labour_count + log.female_labour_count for log in year_logs),
            })
            current = date(current.year + 1, 1, 1)
        return Response({'period': 'yearly', 'data': data})
    
    return Response({'error': 'Invalid period'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def work_trend(request):
    date_from_str = request.query_params.get('date_from')
    date_to_str = request.query_params.get('date_to')
    group_by = request.query_params.get('group_by', 'day')
    
    date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date() if date_from_str else datetime.now().date() - timedelta(days=90)
    date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date() if date_to_str else datetime.now().date()
    
    logs = DailyWorkLog.objects.filter(log_date__range=[date_from, date_to])
    
    trend_data = []
    
    if group_by == 'day':
        current = date_from
        while current <= date_to:
            day_logs = logs.filter(log_date=current)
            total_hours = 0
            total_male = 0
            total_female = 0
            for log in day_logs:
                hours = float(log.hours_worked or 8)
                total_hours += (log.male_labour_count + log.female_labour_count) * hours
                total_male += log.male_labour_count
                total_female += log.female_labour_count
            trend_data.append({
                'date': current.isoformat(),
                'work_items': day_logs.count(),
                'male_count': total_male,
                'female_count': total_female,
                'total_labour_hours': total_hours,
            })
            current += timedelta(days=1)
    
    elif group_by == 'week':
        current = date_from
        while current <= date_to:
            week_end = min(current + timedelta(days=6), date_to)
            week_logs = logs.filter(log_date__range=[current, week_end])
            total_hours = 0
            total_male = 0
            total_female = 0
            for log in week_logs:
                hours = float(log.hours_worked or 8)
                total_hours += (log.male_labour_count + log.female_labour_count) * hours
                total_male += log.male_labour_count
                total_female += log.female_labour_count
            trend_data.append({
                'week': current.isoformat(),
                'work_items': week_logs.count(),
                'male_count': total_male,
                'female_count': total_female,
                'total_labour_hours': total_hours,
            })
            current += timedelta(days=7)
    
    return Response(trend_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def block_summary(request):
    date_from_str = request.query_params.get('date_from')
    date_to_str = request.query_params.get('date_to')
    
    date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date() if date_from_str else datetime.now().date() - timedelta(days=90)
    date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date() if date_to_str else datetime.now().date()
    
    blocks = Block.objects.annotate(
        total_items=Count('work_logs', filter=Q(work_logs__log_date__range=[date_from, date_to])),
        total_male=Sum('work_logs__male_labour_count', filter=Q(work_logs__log_date__range=[date_from, date_to])),
        total_female=Sum('work_logs__female_labour_count', filter=Q(work_logs__log_date__range=[date_from, date_to])),
    ).filter(total_items__gt=0)
    
    data = []
    for block in blocks:
        total_labour = (block.total_male or 0) + (block.total_female or 0)
        data.append({
            'id': block.id,
            'name': block.name,
            'work_items': block.total_items,
            'total_labour_days': total_labour,
            'average_labour_per_item': total_labour / block.total_items if block.total_items else 0,
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def crop_summary(request):
    date_from_str = request.query_params.get('date_from')
    date_to_str = request.query_params.get('date_to')
    
    date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date() if date_from_str else datetime.now().date() - timedelta(days=90)
    date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date() if date_to_str else datetime.now().date()
    
    crops = Crop.objects.annotate(
        total_items=Count('work_logs', filter=Q(work_logs__log_date__range=[date_from, date_to])),
        total_labour=Sum('work_logs__male_labour_count', filter=Q(work_logs__log_date__range=[date_from, date_to])) + Sum('work_logs__female_labour_count', filter=Q(work_logs__log_date__range=[date_from, date_to])),
        blocks_count=Count('blocks'),
    ).filter(total_items__gt=0)
    
    data = []
    for crop in crops:
        data.append({
            'id': crop.id,
            'name': crop.name,
            'work_items': crop.total_items,
            'total_labour_days': crop.total_labour or 0,
            'blocks_growing': crop.blocks_count,
        })
    
    return Response(data)

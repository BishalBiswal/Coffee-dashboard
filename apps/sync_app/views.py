from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from apps.core_app.models import DailyWorkLog, WorkLogAttendance
from apps.core_app.serializers import DailyWorkLogSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_work_logs(request):
    entries = request.data.get('entries', [])
    user = request.user
    
    results = {
        'success': [],
        'conflicts': [],
        'errors': [],
    }
    
    for entry in entries:
        try:
            client_sync_id = entry.get('client_sync_id')
            
            existing = DailyWorkLog.objects.filter(client_sync_id=client_sync_id).first()
            
            if existing:
                client_timestamp = entry.get('created_at', 0)
                server_timestamp = existing.updated_at.timestamp() * 1000
                
                if client_timestamp > 0 and client_timestamp > server_timestamp:
                    for field in ['log_date', 'block_id', 'crop_id', 'row_number', 
                                  'work_type_id', 'work_detail', 'male_labour_count',
                                  'female_labour_count', 'notes', 'status']:
                        if field in entry:
                            setattr(existing, field, entry[field])
                    existing.updated_at = timezone.now()
                    existing.save()
                    
                    _update_workers(existing, entry.get('worker_ids', []))
                    
                    results['success'].append({
                        'client_sync_id': str(client_sync_id),
                        'server_id': existing.id,
                    })
                else:
                    results['conflicts'].append({
                        'client_sync_id': str(client_sync_id),
                        'server_entry': DailyWorkLogSerializer(existing).data,
                    })
            else:
                work_log = DailyWorkLog.objects.create(
                    client_sync_id=client_sync_id,
                    log_date=entry['log_date'],
                    block_id=entry['block_id'],
                    crop_id=entry['crop_id'],
                    row_number=entry.get('row_number'),
                    work_type_id=entry['work_type_id'],
                    work_detail=entry.get('work_detail', ''),
                    male_labour_count=entry.get('male_labour_count', 0),
                    female_labour_count=entry.get('female_labour_count', 0),
                    notes=entry.get('notes', ''),
                    status='synced',
                    submitted_at=timezone.now(),
                    synced_at=timezone.now(),
                    created_by=user,
                )
                
                _update_workers(work_log, entry.get('worker_ids', []))
                
                results['success'].append({
                    'client_sync_id': str(client_sync_id),
                    'server_id': work_log.id,
                })
        
        except Exception as e:
            results['errors'].append({
                'client_sync_id': str(entry.get('client_sync_id', 'unknown')),
                'error': str(e),
            })
    
    return Response(results, status=status.HTTP_200_OK)


def _update_workers(work_log, worker_ids):
    work_log.workers.clear()
    for worker_id in worker_ids:
        WorkLogAttendance.objects.create(
            work_log=work_log,
            worker_id=worker_id,
            hours_worked=8,
        )

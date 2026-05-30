import pytest
import uuid
from datetime import date

from rest_framework import status

from apps.core_app.models import (
    Block, Crop, WorkType, Worker, DailyWorkLog, WorkLogAttendance
)


@pytest.mark.django_db
class TestSyncAPI:
    def test_sync_create_new(self, authenticated_client, block, crop, work_type):
        client_sync_id = str(uuid.uuid4())
        data = {
            'entries': [{
                'client_sync_id': client_sync_id,
                'log_date': '2026-04-22',
                'block_id': block.id,
                'crop_id': crop.id,
                'work_type_id': work_type.id,
                'male_labour_count': 3,
                'female_labour_count': 5,
                'hours_worked': 8,
                'status': 'synced',
                'worker_ids': []
            }]
        }
        response = authenticated_client.post('/api/sync/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['success']) == 1

    def test_sync_update_existing(self, authenticated_client, daily_work_log):
        client_sync_id = str(daily_work_log.client_sync_id or uuid.uuid4())
        daily_work_log.client_sync_id = client_sync_id
        daily_work_log.save()

        data = {
            'entries': [{
                'client_sync_id': client_sync_id,
                'log_date': str(daily_work_log.log_date),
                'block_id': daily_work_log.block.id,
                'crop_id': daily_work_log.crop.id,
                'work_type_id': daily_work_log.work_type.id,
                'male_labour_count': 10,
                'female_labour_count': 10,
                'created_at': 0
            }]
        }
        response = authenticated_client.post('/api/sync/', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_sync_empty_entries(self, authenticated_client):
        data = {'entries': []}
        response = authenticated_client.post('/api/sync/', data, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_sync_unauthenticated(self, api_client):
        response = api_client.post('/api/sync/', {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
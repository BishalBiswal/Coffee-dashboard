import pytest
from datetime import date
from rest_framework import status

from apps.core_app.models import DailyWorkLog


@pytest.mark.django_db
class TestExportAPI:
    def test_export_excel(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            f'/api/export/?date_from=2026-04-01&date_to=2026-04-30'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == (
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    def test_export_with_filter(self, authenticated_client, daily_work_log, block):
        response = authenticated_client.get(
            f'/api/export/?date_from=2026-04-01&date_to=2026-04-30&filter=block&filter_id={block.id}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_export_empty_date_range(self, authenticated_client):
        response = authenticated_client.get(
            '/api/export/?date_from=2025-01-01&date_to=2025-12-31'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_export_unauthenticated(self, api_client):
        response = api_client.get('/api/export/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
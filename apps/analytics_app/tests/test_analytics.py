import pytest
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status

from apps.core_app.models import (
    Block, Crop, WorkType, Worker, DailyWorkLog,
    WorkLogAttendance, InventoryItem, InventoryTransaction
)


@pytest.mark.django_db
class TestAnalyticsAPI:
    def test_dashboard_summary(self, authenticated_client, daily_work_log, worker):
        WorkLogAttendance.objects.create(
            work_log=daily_work_log,
            worker=worker,
            hours_worked=8
        )
        response = authenticated_client.get('/api/analytics/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert 'date' in response.data
        assert 'work_items_today' in response.data

    def test_cost_breakdown(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            f'/api/analytics/cost-breakdown/?date_from={date(2026, 4, 1)}&date_to={date(2026, 4, 30)}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_cost_summary_daily(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            f'/api/analytics/cost-summary/?period=daily&date_from={date(2026, 4, 1)}&date_to={date(2026, 4, 30)}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['period'] == 'daily'

    def test_cost_summary_weekly(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            '/api/analytics/cost-summary/?period=weekly'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_cost_summary_monthly(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            '/api/analytics/cost-summary/?period=monthly'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_cost_summary_yearly(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            '/api/analytics/cost-summary/?period=yearly'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_cost_summary_invalid_period(self, authenticated_client):
        response = authenticated_client.get(
            '/api/analytics/cost-summary/?period=invalid'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_work_trend_daily(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            '/api/analytics/trend/?group_by=day'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_work_trend_weekly(self, authenticated_client, daily_work_log):
        response = authenticated_client.get(
            '/api/analytics/trend/?group_by=week'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_block_summary(self, authenticated_client, block, daily_work_log):
        response = authenticated_client.get('/api/analytics/block-summary/')
        assert response.status_code == status.HTTP_200_OK

    def test_crop_summary(self, authenticated_client, crop, daily_work_log):
        response = authenticated_client.get('/api/analytics/crop-summary/')
        assert response.status_code == status.HTTP_200_OK
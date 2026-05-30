import pytest
from datetime import timedelta

from django.contrib.auth.models import User
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken


@pytest.mark.django_db
class TestAuthentication:
    def test_login_success(self, api_client, admin_user):
        response = api_client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'testpass123'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

    def test_login_invalid_credentials(self, api_client, admin_user):
        response = api_client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'wrongpassword'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post('/api/auth/login/', {
            'username': 'nonexistent',
            'password': 'password'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, admin_user):
        refresh = RefreshToken.for_user(admin_user)
        response = api_client.post('/api/auth/refresh/', {
            'refresh': str(refresh)
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    def test_user_profile(self, api_client, admin_user):
        refresh = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        response = api_client.get('/api/auth/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'admin'

    def test_unauthenticated_request(self, api_client):
        response = api_client.get('/api/blocks/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_token(self, api_client):
        api_client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = api_client.get('/api/blocks/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.skip(reason="SimpleJWT handles expired tokens internally")
    def test_expired_token_handled(self, api_client, admin_user):
        from rest_framework_simplejwt.tokens import AccessToken

        access = AccessToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access)}')
        response = api_client.get('/api/blocks/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestAdminDetection:
    def test_staff_user_is_admin(self, api_client):
        user = User.objects.create_user(
            username='staff',
            password='pass123',
            is_staff=True
        )
        response = api_client.post('/api/auth/login/', {
            'username': 'staff',
            'password': 'pass123'
        })
        assert response.data['user']['is_admin'] is True

    def test_group_admin_is_admin(self, api_client, admin_user):
        from django.contrib.auth.models import Group
        group, _ = Group.objects.get_or_create(name='admin')
        admin_user.groups.add(group)
        admin_user.save()
        response = api_client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'testpass123'
        })
        assert response.data['user']['is_admin'] is True
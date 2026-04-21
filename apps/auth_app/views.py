from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            user = User.objects.get(username=request.data['username'])
            is_admin = user.is_staff or user.groups.filter(name='admin').exists()
            response.data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': is_admin,
            }
        
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    is_admin = user.is_staff or user.groups.filter(name='admin').exists()
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': is_admin,
    })

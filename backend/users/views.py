from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

@api_view(['POST'])
def register(request):
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role', 'student')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Each ALU student has one unique email — we use it as the identity anchor
    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    # Auto-generate username from the email prefix (e.g. d.nanatoun from d.nanatoun@alustudent.com)
    username = email.split('@')[0]

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role,
        first_name=first_name,
        last_name=last_name
    )
    token = RefreshToken.for_user(user)

    return Response({
        'message': 'Account created successfully',
        'access': str(token.access_token),
        'refresh': str(token),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Look up the user by email instead of username
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check if the password matches
    if not user.check_password(password):
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    token = RefreshToken.for_user(user)
    return Response({
        'access': str(token.access_token),
        'refresh': str(token),
    })
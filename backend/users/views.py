from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, PasswordResetToken
from .google_email import send_password_reset_email

@api_view(['POST'])
def register(request):
    email = request.data.get('email')
    password = request.data.get('password')
    # Every public registration is a student-tier account. Admin access
    # is granted manually and never exposed through this endpoint,
    # regardless of what a request sends for "role".
    role = 'student'
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
        'email': user.email,
        'role': user.role,
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
        'email': user.email,
        'role': user.role,
    })


@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    generic_response = {'message': 'If that email is registered, a reset link has been sent.'}

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Same response whether or not the account exists — never reveal
        # which emails are actually registered.
        return Response(generic_response)

    reset_token = PasswordResetToken.generate_for_user(user)
    reset_link = f"http://localhost:5173/reset-password?token={reset_token.token}"

    try:
        send_password_reset_email(user.email, reset_link)
    except Exception as e:
        print(f"Password reset email failed: {e}")

    return Response(generic_response)


@api_view(['POST'])
def reset_password(request):
    token_str = request.data.get('token')
    new_password = request.data.get('password')

    if not token_str or not new_password:
        return Response({'error': 'Token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        reset_token = PasswordResetToken.objects.get(token=token_str)
    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)

    if not reset_token.is_valid():
        return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)

    user = reset_token.user
    user.set_password(new_password)
    user.save()

    reset_token.used = True
    reset_token.save()

    return Response({'message': 'Password reset successful. You can now log in.'})
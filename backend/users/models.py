import secrets
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
    


class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    @classmethod
    def generate_for_user(cls, user):
        # Invalidate any older, unused tokens for this user first, so
        # only the most recent reset link ever works.
        cls.objects.filter(user=user, used=False).update(used=True)
        return cls.objects.create(user=user, token=secrets.token_urlsafe(32))

    def is_valid(self):
        if self.used:
            return False
        return timezone.now() < self.created_at + timedelta(hours=1)

    def __str__(self):
        return f"Reset token for {self.user.email}"
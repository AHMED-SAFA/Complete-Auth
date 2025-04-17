from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import random
import string


class User(AbstractUser):
    email = models.EmailField(_("email address"), unique=True,)
    is_verified = models.BooleanField(default=False,)
    image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email}-{self.username}"


class VerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    @classmethod
    def generate_code(cls, user):
        # Delete any existing codes for this user
        cls.objects.filter(user=user).delete()

        # Generate a 6-digit code
        code = "".join(random.choices(string.digits, k=6))

        # Set expiration to 10 minutes from now
        expires_at = timezone.now() + timezone.timedelta(minutes=10)

        return cls.objects.create(user=user, code=code, expires_at=expires_at)

    def is_valid(self):
        return timezone.now() < self.expires_at

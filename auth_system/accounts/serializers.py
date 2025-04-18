from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from .models import VerificationCode


User = get_user_model()


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["username"] = user.username
        token["email"] = user.email
        token["is_verified"] = user.is_verified

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add email verification check
        if not self.user.is_verified:
            raise serializers.ValidationError(
                {"detail": "Email not verified. Please verify your email first."}
            )

        # Add custom responses
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "username": self.user.username,
            "is_verified": self.user.is_verified,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    image = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = (
            "email",
            "username",
            "image",
            "password",
            "password2",
        )

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            image=validated_data.get("image", None),
        )

        user.set_password(validated_data["password"])
        user.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "is_verified", "image")


class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, max_length=68, write_only=True)
    password2 = serializers.CharField(min_length=6, max_length=68, write_only=True)
    token = serializers.CharField(min_length=1, write_only=True)
    uidb64 = serializers.CharField(min_length=1, write_only=True)

    class Meta:
        fields = ["password", "password2", "token", "uidb64"]

    def validate(self, attrs):
        try:
            password = attrs.get("password")
            password2 = attrs.get("password2")
            token = attrs.get("token")
            uidb64 = attrs.get("uidb64")

            if password != password2:
                raise serializers.ValidationError(
                    {"password": "Password fields didn't match."}
                )

            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise serializers.ValidationError(
                    {"error": "The reset link is invalid"}, code="authorization"
                )

            user.set_password(password)
            user.save()

            return attrs
        except Exception as e:
            raise serializers.ValidationError(
                {"error": "The reset link is invalid"}, code="authorization"
            )

# Add this new serializer
class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get("email")
        code = attrs.get("code")

        try:
            user = User.objects.get(email=email)
            verification_code = VerificationCode.objects.filter(
                user=user, code=code
            ).first()

            if not verification_code:
                raise serializers.ValidationError("Invalid verification code")

            if not verification_code.is_valid():
                raise serializers.ValidationError("Verification code has expired")

            attrs["user"] = user
            return attrs

        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")

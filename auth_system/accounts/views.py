from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from .utils import (
    password_reset_token,
    verify_firebase_token,
    get_or_create_user_from_firebase,
)
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    SetNewPasswordSerializer,
    MyTokenObtainPairSerializer,
    VerifyEmailSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
import jwt
from django.utils.encoding import (
    smart_str,
    force_str,
    smart_bytes,
    DjangoUnicodeDecodeError,
)
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.views import APIView
from django.utils import timezone
from .models import VerificationCode
from rest_framework import generics, status
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

User = get_user_model()


class RegisterView(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate and send verification code
        verification_code = VerificationCode.generate_code(user)

        # Create HTML email
        context = {
            "username": user.username,
            "verification_code": verification_code.code,
            "expiry_minutes": 10,
        }

        html_content = render_to_string("email/email_verification.html", context)
        text_content = strip_tags(
            html_content
        )  # Plain text version for clients that don't support HTML

        # Send email with both HTML and plain text
        email = EmailMultiAlternatives(
            subject="Verify your email address",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        return Response(
            {"email": user.email, "message": "Verification code sent to your email"},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmail(generics.GenericAPIView):
    serializer_class = VerifyEmailSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        user.is_verified = True
        user.save()

        # Delete the used verification code
        verification_code = VerificationCode.objects.filter(user=user).first()
        if verification_code:
            verification_code.delete()

        # Generate tokens for auto-login after verification
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Email successfully verified",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {"id": user.id, "email": user.email, "username": user.username},
            },
            status=status.HTTP_200_OK,
        )


class LoginAPIView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            user = User.objects.get(email=request.data.get("email", ""))
            if not user.is_verified:
                # Generate a new verification code for convenience
                verification_code = VerificationCode.generate_code(user)

                # Create HTML email
                context = {
                    "username": user.username,
                    "verification_code": verification_code.code,
                    "expiry_minutes": 10,
                }

                html_content = render_to_string(
                    "email/email_verification.html", context
                )
                text_content = strip_tags(html_content)

                email = EmailMultiAlternatives(
                    subject="Verify your email address",
                    body=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[user.email],
                )
                email.attach_alternative(html_content, "text/html")
                email.send()

                return Response(
                    {
                        "detail": "Email not verified. A new verification code has been sent to your email.",
                        "email": user.email,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        except User.DoesNotExist:
            pass  # Continue with normal login flow, which will handle invalid credentials

        response = super().post(request, *args, **kwargs)
        return response


class LogoutAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                # If the token is invalid or already blacklisted, we still consider it a successful logout
                pass

            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SetNewPasswordAPIView(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer

    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"success": True, "message": "Password reset successful"},
            status=status.HTTP_200_OK,
        )


class TokenRefreshView(generics.GenericAPIView):
    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            # Get user from token
            token_user = User.objects.get(id=refresh["user_id"])

            return Response(
                {
                    "access": access_token,
                    "refresh": str(refresh),
                    "user": {
                        "id": token_user.id,
                        "email": token_user.email,
                        "username": token_user.username,
                        "is_verified": token_user.is_verified,
                    },
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED
            )


class RequestPasswordResetEmail(generics.GenericAPIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)

            # Point to your React frontend reset page
            frontend_url = settings.FRONTEND_URL  # Set this in settings.py
            reset_path = f"/reset-password/{uidb64}/{token}"
            absurl = frontend_url + reset_path

            # Create HTML email
            context = {
                "username": user.username,
                "reset_url": absurl,
                "expiry_minutes": 10,
            }

            html_content = render_to_string("email/password_reset.html", context)
            text_content = strip_tags(html_content)

            email = EmailMultiAlternatives(
                subject="Reset your password",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send()

            return Response(
                {"success": "Password reset link sent to your email"},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "No account with this email exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class PasswordTokenCheckAPI(generics.GenericAPIView):
    def get(self, request, uidb64, token):
        try:
            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response(
                    {"error": "Token is invalid or expired"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            return Response(
                {
                    "success": True,
                    "message": "Credentials Valid",
                    "uidb64": uidb64,
                    "token": token,
                    "email": user.email,
                }
            )

        except (DjangoUnicodeDecodeError, User.DoesNotExist):
            return Response(
                {"error": "Token is invalid or expired"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class FirebaseLoginView(APIView):
    def post(self, request):
        id_token = request.data.get("idToken")

        if not id_token:
            return Response(
                {"error": "Firebase ID token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verify the Firebase token
            firebase_user = verify_firebase_token(id_token)

            # Get or create user from Firebase data
            user = get_or_create_user_from_firebase(firebase_user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Add custom claims
            refresh["username"] = user.username
            refresh["email"] = user.email
            refresh["is_verified"] = user.is_verified

            return Response(
                {
                    "access": access_token,
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "is_verified": user.is_verified,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class UserProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationCodeView(APIView):
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            if user.is_verified:
                return Response(
                    {"message": "Email is already verified"}, status=status.HTTP_200_OK
                )

            # Delete existing codes
            VerificationCode.objects.filter(user=user).delete()

            # Generate new code
            verification_code = VerificationCode.generate_code(user)

            # Create HTML email
            context = {
                "username": user.username,
                "verification_code": verification_code.code,
                "expiry_minutes": 10,
            }

            html_content = render_to_string("email/email_verification.html", context)
            text_content = strip_tags(html_content)

            email = EmailMultiAlternatives(
                subject="Verify your email address",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send()

            return Response(
                {"message": "Verification code resent to your email"},
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "No account with this email exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser
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
import requests
from io import BytesIO
from django.core.files.images import ImageFile

User = get_user_model()


class RegisterView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    parser_classes = (MultiPartParser, FormParser)

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
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "image": (
                        request.build_absolute_uri(user.image.url)
                        if user.image
                        else None
                    ),
                },
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

        # Add image URL to the response if available
        if response.status_code == status.HTTP_200_OK and "user" in response.data:
            user_id = response.data["user"]["id"]
            user = User.objects.get(id=user_id)
            if user.image:
                response.data["user"]["image"] = request.build_absolute_uri(
                    user.image.url
                )
            else:
                response.data["user"]["image"] = None

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

            user_data = {
                "id": token_user.id,
                "email": token_user.email,
                "username": token_user.username,
                "is_verified": token_user.is_verified,
            }

            # Add image URL if available
            if token_user.image:
                user_data["image"] = request.build_absolute_uri(token_user.image.url)
            else:
                user_data["image"] = None

            return Response(
                {
                    "access": access_token,
                    "refresh": str(refresh),
                    "user": user_data,
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

        # Get additional data sent from frontend
        photo_url = request.data.get("photoURL")
        display_name = request.data.get("displayName")
        email = request.data.get("email")

        if not id_token:
            return Response(
                {"error": "Firebase ID token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verify the Firebase token
            firebase_user = verify_firebase_token(id_token)

            # Add or override values from request data
            if photo_url:
                firebase_user["photoURL"] = photo_url
            if display_name:
                firebase_user["displayName"] = display_name
            if email:
                firebase_user["email"] = email

            # Get or create user from Firebase data
            user = get_or_create_user_from_firebase(firebase_user)

            # Always update the profile image when available
            if "photoURL" in firebase_user and firebase_user["photoURL"]:
                try:
                    # Download image from Firebase
                    response = requests.get(firebase_user["photoURL"])
                    if response.status_code == 200:
                        # Create an image file
                        img_temp = BytesIO(response.content)
                        img_name = f"firebase_profile_{user.id}.jpg"
                        # Always update the image even if one already exists
                        user.image.save(img_name, ImageFile(img_temp), save=True)
                        print(f"Successfully saved profile image for user {user.id}")
                except Exception as e:
                    print(f"Error downloading Firebase profile image: {str(e)}")

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Add custom claims
            refresh["username"] = user.username
            refresh["email"] = user.email
            refresh["is_verified"] = user.is_verified

            user_data = {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_verified": user.is_verified,
            }

            # Add image URL if available
            if user.image:
                user_data["image"] = request.build_absolute_uri(user.image.url)
            else:
                user_data["image"] = None

            return Response(
                {
                    "access": access_token,
                    "refresh": str(refresh),
                    "user": user_data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        serializer = UserSerializer(request.user)
        data = serializer.data

        # Add full URL for image
        if request.user.image:
            data["image"] = request.build_absolute_uri(request.user.image.url)

        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            data = serializer.data

            # Add full URL for image
            if user.image:
                data["image"] = request.build_absolute_uri(user.image.url)

            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

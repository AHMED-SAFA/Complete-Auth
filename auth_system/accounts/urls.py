from django.urls import path
from .views import (
    RegisterView,
    VerifyEmail,
    LoginAPIView,
    LogoutAPIView,
    RequestPasswordResetEmail,
    PasswordTokenCheckAPI,
    SetNewPasswordAPIView,
    FirebaseLoginView,
    UserProfileView,
)
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", VerifyEmail.as_view(), name="verify-email"),
    path("email-verify/", VerifyEmail.as_view(), name="email-verify"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path(
        "request-reset-email/",
        RequestPasswordResetEmail.as_view(),
        name="request-reset-email",
    ),
    path(
        "reset-password/<uidb64>/<token>/",
        PasswordTokenCheckAPI.as_view(),
        name="password-reset-confirm",
    ),
    path(
        "password-reset-complete/",
        SetNewPasswordAPIView.as_view(),
        name="password-reset-complete",
    ),
    path("firebase-login/", FirebaseLoginView.as_view(), name="firebase-login"),
    path("user/", UserProfileView.as_view(), name="user-profile"),
]

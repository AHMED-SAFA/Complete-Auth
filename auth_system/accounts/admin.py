
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import VerificationCode

User = get_user_model()


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("email", "username", "is_verified", "is_staff", "is_active")
    list_filter = ("is_verified", "is_staff", "is_active")
    fieldsets = (
        (
            None,
            {"fields": ("email", "username", "password", "image")},
        ), 
        (
            "Permissions",
            {
                "fields": (
                    "is_verified",
                    "is_staff",
                    "is_active",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "image",  
                    "is_verified",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )
    search_fields = ("email", "username")
    ordering = ("email",)


class BlacklistedTokenAdmin(admin.ModelAdmin):
    list_display = ("token", "user", "blacklisted_at")
    search_fields = ("user__email", "user__username", "token")
    readonly_fields = ("blacklisted_at",)

    def user(self, obj):
        return obj.user.email if obj.user else None


admin.site.register(User, CustomUserAdmin)
admin.site.register(VerificationCode)

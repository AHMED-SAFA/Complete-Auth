from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from datetime import timedelta
import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
from django.contrib.auth import get_user_model
import string
import random

User = get_user_model()

# Initialize Firebase Admin SDK (you need to configure this with your Firebase credentials)
# Make sure this is only initialized once
try:
    firebase_app = firebase_admin.get_app()
except ValueError:
    # Use your own Firebase credentials file path
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    firebase_app = firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token):
    """Verify the Firebase ID token and return the user info"""
    try:
        decoded_token = auth.verify_id_token(id_token, app=firebase_app)
        return decoded_token
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {str(e)}")

def generate_random_password(length=12):
    """Generate a random password"""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

def get_or_create_user_from_firebase(firebase_user):
    """Get or create a user from Firebase user data"""
    email = firebase_user.get('email')
    if not email:
        raise ValueError("Firebase user has no email")
    
    # Try to get existing user by email
    try:
        user = User.objects.get(email=email)
        # If user exists but wasn't created via Firebase, update their attributes
        if not user.is_verified:
            user.is_verified = firebase_user.get('email_verified', True)
            user.save()
        return user
    except User.DoesNotExist:
        # Create new user
        username = email.split('@')[0]
        base_username = username
        counter = 1
        
        # Ensure username is unique
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Generate a random password - the user will login via Firebase, not with this password
        random_password = generate_random_password()
        
        # Create the user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password,  # Using our custom random password generator
            is_verified=firebase_user.get('email_verified', True)
        )
        
        return user


class TimeLimitedPasswordResetTokenGenerator(PasswordResetTokenGenerator):
    def __init__(self):
        super().__init__()
        self.timeout = timedelta(minutes=10)  # 10 minutes expiration

    def _make_hash_value(self, user, timestamp):
        # Include the timeout in the hash value
        return str(user.pk) + str(user.password) + str(timestamp) + str(self.timeout.total_seconds())

    def check_token(self, user, token):
        # First check if the token is valid
        if not super().check_token(user, token):
            return False
        
        # Then check if it's expired
        _, timestamp = self.decrypt_token(token)
        expiration_time = timestamp + self.timeout.total_seconds()
        return timezone.now().timestamp() <= expiration_time

password_reset_token = TimeLimitedPasswordResetTokenGenerator()




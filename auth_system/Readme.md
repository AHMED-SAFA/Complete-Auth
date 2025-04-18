<h1 align="center">Backend Authentication System (Django)</h1>
<p align="center">
A comprehensive authentication backend built with Django supporting multiple authentication methods.
</p>

## Overview

This backend authentication system provides a flexible and secure way to handle user authentication through various methods including sessions, cookies, JWT tokens, and Firebase Authentication. The system is designed to be easy to integrate with frontend applications while maintaining robust security standards.

## Features

- **Multiple Authentication Methods**:
  - Session-based Authentication
  - Cookie-based Authentication
  - JWT (JSON Web Tokens)
  - Social (Google) Authentication

- **User Management**:
  - User Registration
  - Login/Logout
  - Email Verification
  - Password Reset/Recovery
  - User Profile

- **Security Features**:
  - Password Hashing
  - Token Expiration Management

## Technology Stack

- **Framework**: Django 4.2+
- **Database**: SQLite
- **Authentication**: Django Authentication System, DRF-JWT, firebase-admin
- **Email**: Django Email Backend with App Password support

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/login/` - Login with credentials
- `POST /api/auth/logout/` - Logout user
- `POST /api/auth/token/` - Obtain JWT token
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/firebase-login/` - Firebase authentication

### User Management
- `GET /api/user/profile/` - Get user profile
- `POST /api/user/verify-email/` - Verify email address
- `POST /api/user/forgot-password/` - Request password reset
- `POST /api/user/request-reset-email/` - Reset password with token

### JWT Authentication
Our system uses SimpleJWT with custom token claims. The JWT tokens include user-specific information to avoid additional database lookups:

```python
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["username"] = user.username
        token["email"] = user.email
        token["is_verified"] = user.is_verified

        return token
```
Token refresh functionality returns complete user data:

```python
def post(self, request):
    refresh_token = request.data.get("refresh")
    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)
        
        # Get user data from token
        token_user = User.objects.get(id=refresh["user_id"])
        user_data = {
            "id": token_user.id,
            "email": token_user.email,
            "username": token_user.username,
            "is_verified": token_user.is_verified,
            "image": request.build_absolute_uri(token_user.image.url) if token_user.image else None
        }

        return Response({
            "access": access_token,
            "refresh": str(refresh),
            "user": user_data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED)
```

### Firebase Authentication
The system integrates with Firebase Authentication for social login capabilities:

```python
def verify_firebase_token(id_token):
    """Verify the Firebase ID token and return the user info"""
    try:
        decoded_token = auth.verify_id_token(id_token, app=firebase_app)
        return decoded_token
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {str(e)}")

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
        # Create new user with unique username
        username = email.split('@')[0]
        base_username = username
        counter = 1
        
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        # Generate a random password
        random_password = generate_random_password()
        
        # Create the user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password,
            is_verified=firebase_user.get('email_verified', True)
        )
        
        return user
```
The Firebase login endpoint also supports profile image synchronization:
```python
# Download image from Firebase
response = requests.get(firebase_user["photoURL"])
if response.status_code == 200:
    # Create an image file
    img_temp = BytesIO(response.content)
    img_name = f"firebase_profile_{user.id}.jpg"
    # Update the image
    user.image.save(img_name, ImageFile(img_temp), save=True)
```

### Email Verification System
Our email verification uses a time-limited code system:

```python
class VerificationCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @classmethod
    def generate_code(cls, user):
        # Generate a random 6-digit code
        code = ''.join(random.choices('0123456789', k=6))
        
        # Create or update verification code
        obj, created = cls.objects.update_or_create(
            user=user,
            defaults={'code': code}
        )
        return obj
    
    def is_valid(self):
        # Code is valid for 10 minutes
        expiry_time = self.created_at + timedelta(minutes=10)
        return timezone.now() <= expiry_time
```
### Time-Limited Password Reset
Custom password reset token generator with 10-minute expiration:

```python
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
```

## Email Configuration

### Email templates:

<div align="center">
<details>
<summary>
<strong>for code-based email verification</strong> 
</summary>
<br>

![Verify-your-email](https://github.com/user-attachments/assets/28ba011a-73f1-4718-ac56-a103cbc7846e)

</br>
</details> 

<details>
<summary>
<strong>for Password Reset</strong> 
</summary>
<br>

![Reset-your-password](https://github.com/user-attachments/assets/f9248ce7-61db-452e-ad53-35af0ed5c60c)

</br>
</details> 
</div>  

The system uses Django's email backend with support for app passwords for secure email delivery. Email functionality is used for:

- Account verification
- Password reset links

```python
# Email configuration in settings.py
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "your SMTP server" 
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "mail@gmail.com" 
EMAIL_HOST_PASSWORD = "app-password" 
DEFAULT_FROM_EMAIL = "mail@gmail.com"  
```

## Database

SQLite is used as the default database for development. For production, switching to a more robust database like PostgreSQL is recommended.

## Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/AHMED-SAFA/Complete-Auth-Backend.git
   ```

2. Navigate to the project directory:
   ```
   cd Complete-Auth-Backend
   ```
   ```
   cd auth_system
   ```
3. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate
   ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Apply migrations:
   ```
   py manage.py makemigrations
   ```
   ```
   py manage.py migrate
   ```

7. Create a superuser:
   ```
   py manage.py createsuperuser
   ```

8. Run the server:
   ```
   py manage.py runserver
   ```

9. Access the admin panel:
   ```
   http://localhost:8000/admin/
   ```

## Configuration


1. Configure Firebase:
   - Download your Firebase service account JSON
   - Place it in the project root `auth_system(project)/accounts(app)/credentials/firebase-adminsdk.json`

## Security Recommendations

- Use HTTPS in production
- Keep your Django SECRET_KEY secure
- Regularly update dependencies
- Implement proper CORS settings
- Consider using Django REST Framework permissions

## Testing

Run tests with the following command:
```
py manage.py test
```

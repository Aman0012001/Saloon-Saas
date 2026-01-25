# PHP Backend for Salon Booking Platform

## Setup Instructions

### 1. Requirements
- PHP 7.4 or higher
- MySQL 5.7 or higher / MariaDB 10.3+
- Apache/Nginx web server
- Composer (optional, for dependencies)

### 2. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE salon_booking;
USE salon_booking;

# Import schema
mysql -u root -p salon_booking < database.sql
```

### 3. Configuration

Edit `config.php` and update:
- Database credentials (DB_HOST, DB_NAME, DB_USER, DB_PASS)
- JWT_SECRET (use a strong random string)
- ALLOWED_ORIGINS (add your frontend URLs)

### 4. Apache Configuration

Add to your Apache virtual host or .htaccess:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /backend/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

### 5. Nginx Configuration

```nginx
location /backend/api/ {
    try_files $uri $uri/ /backend/api/index.php?$query_string;
}
```

### 6. File Permissions

```bash
chmod 755 backend/
chmod 644 backend/*.php
chmod 755 backend/api/
chmod 755 backend/uploads/
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Salons
- `GET /api/salons` - List all active salons
- `GET /api/salons/:id` - Get salon details
- `POST /api/salons` - Create new salon (auth required)
- `PUT /api/salons/:id` - Update salon (owner only)
- `GET /api/salons/my` - Get user's salons (auth required)

### Services
- `GET /api/services?salon_id=xxx` - Get salon services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (owner/manager)
- `PUT /api/services/:id` - Update service (owner/manager)
- `DELETE /api/services/:id` - Delete service (owner/manager)

### Bookings
- `GET /api/bookings` - Get bookings (filtered by user/salon)
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking (auth required)
- `PUT /api/bookings/:id` - Update booking status

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/profiles/:userId` - Get user profile by ID

### Admin (Super Admin only)
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/salons` - All salons
- `PUT /api/admin/salons/:id/approve` - Approve salon
- `PUT /api/admin/salons/:id/reject` - Reject salon
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/users` - All users
- `GET /api/admin/payments` - All payments

### Subscriptions
- `GET /api/subscriptions/plans` - Get subscription plans
- `GET /api/subscriptions/my?salon_id=xxx` - Get salon subscriptions

## Authentication

All authenticated requests must include:
```
Authorization: Bearer <JWT_TOKEN>
```

## Response Format

Success:
```json
{
  "data": { ... }
}
```

Error:
```json
{
  "error": "Error message"
}
```

## Testing

Use Postman or curl to test endpoints:

```bash
# Signup
curl -X POST http://localhost/backend/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get salons
curl http://localhost/backend/api/salons
```

## Security Notes

1. Change JWT_SECRET in production
2. Enable HTTPS in production
3. Set proper CORS origins
4. Disable error display in production
5. Use prepared statements (already implemented)
6. Validate and sanitize all inputs
7. Implement rate limiting
8. Use strong passwords

## File Structure

```
backend/
├── config.php              # Configuration
├── Database.php            # Database connection
├── Auth.php                # Authentication helper
├── database.sql            # Database schema
├── api/
│   ├── index.php          # Main router
│   └── routes/
│       ├── auth.php       # Auth routes
│       ├── salons.php     # Salon routes
│       ├── services.php   # Service routes
│       ├── bookings.php   # Booking routes
│       ├── users.php      # User routes
│       ├── admin.php      # Admin routes
│       └── subscriptions.php # Subscription routes
└── uploads/               # File uploads directory
```

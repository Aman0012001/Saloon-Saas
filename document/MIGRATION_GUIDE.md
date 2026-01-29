# 🔄 Migration from Supabase to PHP/MySQL Backend

## ✅ What Has Been Done:

1. **Created API Service Layer** (`src/services/api.ts`)
   - Complete replacement for Supabase client
   - All API endpoints for salons, bookings, users, admin, etc.
   - JWT authentication support

2. **Updated Environment Configuration**
   - `.env` file now points to PHP backend
   - Supabase credentials commented out

3. **Existing PHP Backend** (already in `backend/` folder)
   - Complete REST API with MySQL database
   - Authentication with JWT
   - All necessary endpoints

---

## 📋 Setup Instructions:

### **Step 1: Set Up MySQL Database**

1. **Open XAMPP Control Panel**
2. **Start Apache and MySQL**
3. **Open phpMyAdmin**: `http://localhost/phpmyadmin`
4. **Create Database**:
   ```sql
   CREATE DATABASE salon_booking;
   ```
5. **Import Schema**:
   - Click on `salon_booking` database
   - Go to "Import" tab
   - Choose file: `backend/database.sql`
   - Click "Go" to import

### **Step 2: Configure PHP Backend**

1. **Edit `backend/config.php`**:
   ```php
   <?php
   // Database Configuration
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'salon_booking');
   define('DB_USER', 'root');  // Your MySQL username
   define('DB_PASS', '');      // Your MySQL password (empty for XAMPP default)

   // JWT Configuration
   define('JWT_SECRET', 'your-super-secret-key-change-this-in-production');
   define('JWT_EXPIRY', 86400); // 24 hours

   // CORS Configuration
   define('ALLOWED_ORIGINS', [
       'http://localhost:8080',
       'http://localhost:5173',
       'http://127.0.0.1:8080',
   ]);
   ```

2. **Create `.htaccess` in `backend/api/` folder**:
   ```apache
   RewriteEngine On
   RewriteBase /backend/api/
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php [QSA,L]
   ```

### **Step 3: Test PHP Backend**

1. **Test Connection**:
   ```bash
   # Open in browser:
   http://localhost/backend/api/salons
   ```

2. **Test Signup**:
   ```bash
   curl -X POST http://localhost/backend/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"admin123","full_name":"Admin User"}'
   ```

3. **Test Login**:
   ```bash
   curl -X POST http://localhost/backend/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"admin123"}'
   ```

### **Step 4: Update Frontend to Use New API**

The API service layer is already created. Now you need to update your React hooks to use it.

**Example - Update `useSalon.tsx`**:

```typescript
import api from '@/services/api';

// Instead of:
// const { data } = await supabase.from('salons').select('*');

// Use:
const salons = await api.salons.getAll();
```

### **Step 5: Create Admin User**

1. **Run this SQL in phpMyAdmin**:
   ```sql
   -- First, signup a user through the API or manually insert
   INSERT INTO users (id, email, password_hash, email_verified)
   VALUES (
     UUID(),
     'admin@salon.com',
     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
     TRUE
   );

   -- Get the user ID
   SET @user_id = (SELECT id FROM users WHERE email = 'admin@salon.com');

   -- Create profile
   INSERT INTO profiles (id, user_id, full_name, user_type)
   VALUES (UUID(), @user_id, 'Super Admin', 'admin');

   -- Make them a platform admin
   INSERT INTO platform_admins (id, user_id, is_active)
   VALUES (UUID(), @user_id, TRUE);
   ```

---

## 🔧 Next Steps to Complete Migration:

### **1. Update Authentication Hook (`src/hooks/useAuth.tsx`)**

Replace Supabase auth with API calls:

```typescript
import api from '@/services/api';

// Login
const login = async (email: string, password: string) => {
  const data = await api.auth.login(email, password);
  setUser(data.user);
};

// Signup
const signup = async (email: string, password: string, full_name: string) => {
  const data = await api.auth.signup(email, password, full_name);
  setUser(data.user);
};

// Get current user
const getCurrentUser = async () => {
  const data = await api.auth.getCurrentUser();
  setUser(data.user);
};
```

### **2. Update Salon Hook (`src/hooks/useSalon.tsx`)**

```typescript
import api from '@/services/api';

const fetchSalons = async () => {
  const salons = await api.salons.getMySalons();
  setSalons(salons);
};

const createSalon = async (data: CreateSalonData) => {
  const salon = await api.salons.create(data);
  return salon;
};
```

### **3. Update Admin Pages**

Replace Supabase calls in admin pages:

```typescript
// AdminSalons.tsx
const fetchSalons = async () => {
  const salons = await api.admin.getAllSalons();
  setSalons(salons);
};

const handleApprove = async (salonId: string) => {
  await api.admin.approveSalon(salonId);
  await fetchSalons();
};
```

---

## 🚀 Quick Start Commands:

```bash
# 1. Start XAMPP (Apache + MySQL)
# 2. Import database schema
# 3. Configure backend/config.php
# 4. Test backend API
curl http://localhost/backend/api/salons

# 5. Start frontend
cd salon-style-clone-main
npm run dev

# 6. Open browser
http://localhost:8080
```

---

## 📊 API Endpoints Reference:

### **Authentication**
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### **Salons**
- `GET /api/salons` - List all salons
- `GET /api/salons/:id` - Get salon
- `POST /api/salons` - Create salon
- `PUT /api/salons/:id` - Update salon
- `GET /api/salons/my` - My salons

### **Admin**
- `GET /api/admin/stats` - Platform stats
- `GET /api/admin/salons` - All salons
- `PUT /api/admin/salons/:id/approve` - Approve salon
- `PUT /api/admin/salons/:id/reject` - Reject salon
- `GET /api/admin/users` - All users
- `GET /api/admin/bookings` - All bookings

---

## ❓ Troubleshooting:

### **Issue: CORS Error**
**Solution**: Update `backend/config.php` ALLOWED_ORIGINS

### **Issue: 404 on API calls**
**Solution**: Check `.htaccess` in `backend/api/` folder

### **Issue: Database connection failed**
**Solution**: Verify MySQL is running and credentials in `config.php`

### **Issue: JWT token errors**
**Solution**: Check JWT_SECRET in `config.php`

---

## 📝 Migration Checklist:

- [x] Create API service layer
- [x] Update environment variables
- [x] Set up MySQL database
- [ ] Configure PHP backend
- [ ] Import database schema
- [ ] Create admin user
- [ ] Update useAuth hook
- [ ] Update useSalon hook
- [ ] Update useSuperAdmin hook
- [ ] Update admin pages
- [ ] Test all functionality

---

## 🎯 Benefits of PHP/MySQL Backend:

✅ **Full Control**: Your data is on your local server
✅ **No External Dependencies**: No reliance on Supabase
✅ **XAMPP Integration**: Works with your existing setup
✅ **Cost**: Completely free, no subscription
✅ **Customizable**: Modify backend logic as needed

---

**Need help? Check the backend/README.md for more details!**

# ⚡ Hospital Management System - Quick Setup Guide

## 🚀 5-Minute Quick Start

### 1. Prerequisites
```bash
# Verify Node.js & MongoDB installed
node --version      # Should be v14+
mongosh --version   # Should be v4.4+
```

### 2. Start MongoDB Locally
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or run MongoDB server
mongod
```

### 3. Setup Backend & Database
```bash
# Navigate to project
cd ~/Desktop/Client_project/Hospital_Management

# Install dependencies
cd server && npm install

# Seed database with demo data
npm run seed

# Start server
npm start
# Server runs on: http://localhost:3000
```

### 4. Access Application
```
🌐 Frontend: http://localhost:3000
🏥 API Docs: See API_DOCUMENTATION.md
```

### 5. Login with Demo Credentials
```
Admin:        admin@hms.com / Admin@123
Doctor:       doctor1@hms.com / Doctor@123  
Receptionist: recept@hms.com / Recept@123
Patient:      patient1@hms.com / Patient@123
Pharmacist:   pharma@hms.com / Pharma@123
Lab Tech:     lab@hms.com / Lab@123
```

---

## 📁 Project Structure
```
Hospital_Management/
├── server/                    ← Node.js + Express backend
│   ├── .env                  ← Configuration (PORT, MONGO_URI)
│   ├── server.js             ← Main server file
│   ├── package.json          ← Dependencies
│   ├── models/               ← 16 MongoDB Schemas
│   ├── controllers/          ← 11 Business Logic Controllers
│   ├── routes/               ← 11 API Route Handlers
│   ├── middleware/           ← Auth, Validation, RBAC
│   └── config/
│       └── db.js             ← MongoDB Connection
├── frontend/                 ← HTML/CSS/JS Frontend
│   ├── index.html            ← Landing page
│   ├── login.html            ← Login/Register
│   ├── css/                  ← Stylesheets
│   ├── js/                   ← Frontend Logic
│   └── pages/                ← Role-specific dashboards
└── database/
    ├── hms_schema.sql        ← MongoDB schema reference
    └── seed.js               ← Database seeder
```

---

## 🔧 Configuration

### .env File (server/.env)
```
PORT=3000                                    # Server port
NODE_ENV=development                         # Environment
MONGO_URI=mongodb://localhost:27017/hms_db  # MongoDB URL
JWT_SECRET=hms_super_secret_key_2026        # JWT secret (change in production!)
JWT_EXPIRES_IN=24h                          # Token expiry
UPLOAD_DIR=uploads/                         # File upload directory
MAX_FILE_SIZE=5242880                       # Max file size (5MB)
```

---

## 📊 Implemented Features Checklist

### ✅ Core Modules (100% Complete)
- [x] 1. Patient Management - Registration, admission, discharge
- [x] 2. Doctor Management - Profiles, specialization, availability
- [x] 3. Appointment System - Book, reschedule, cancel, notifications
- [x] 4. Bed Management - Allocate, discharge, real-time status
- [x] 5. Pharmacy Management - Inventory, stock alerts, fulfillment
- [x] 6. Laboratory Management - Test booking, results, reports
- [x] 7. Billing & Payments - Invoices, multiple payment methods
- [x] 8. Medical Records - Digital storage, access control
- [x] 9. Admin Dashboard - Analytics, reports, system control
- [x] 10. Authentication & Roles - 6 roles with RBAC
- [x] 11. Notifications - Email/SMS ready
- [x] 12. Emergency Management - Emergency appointment type
- [x] 13. Reports & Analytics - Revenue, growth, performance

### ✅ Technical Features (100% Complete)
- [x] MongoDB database with Mongoose ODM
- [x] JWT authentication (24-hour expiry)
- [x] Role-Based Access Control (RBAC)
- [x] Input validation on all endpoints
- [x] Password hashing with bcryptjs
- [x] Password reset functionality
- [x] Error handling & logging
- [x] Database seeding with 10 demo users
- [x] Appointment conflict detection
- [x] Medical records access control
- [x] Prescription to pharmacy workflow
- [x] Stock management & alerts
- [x] Multi-method payment support

---

## 🧪 Testing API Endpoints

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hms.com","password":"Admin@123"}'
```

### Test Health Check
```bash
curl http://localhost:3000/api/health
```

### Test with Authentication
```bash
# 1. Get token from login
TOKEN="<JWT_TOKEN_HERE>"

# 2. Use token in requests
curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Common Issues & Solutions

### MongoDB Connection Refused
```bash
# Start MongoDB
mongosh  # For MongoDB 5.0+
# OR
mongo    # For older versions
```

### Port Already in Use
```bash
# Change PORT in .env, or kill process
lsof -i :3000
kill -9 <PID>
```

### Dependencies Not Installed
```bash
cd server
npm install
```

### Seed Failed
```bash
# Ensure MongoDB is running, then:
npm run seed
```

### Frontend Not Loading
```bash
# Check server is running on http://localhost:3000
# Verify frontendindex.html exists in server root
```

---

## 📞 Quick Support

| Issue | Solution |
|-------|----------|
| Server won't start | Check port, MongoDB connection |
| Login fails | Verify email/password in credentials table |
| API 404 errors | Check authentication header & role permissions |
| Database empty | Run `npm run seed` |
| Prescription not showing | Verify medical record created first |

---

## 🚀 Next Steps

1. **Customize for Your Hospital**
   - Update department names
   - Add your hospital's medicines
   - Configure bed types & charges

2. **Deploy to Production**
   - Change JWT_SECRET
   - Update MONGO_URI to production
   - Set NODE_ENV=production
   - Configure email service

3. **Add Advanced Features**
   - Video consultation integration
   - SMS/Email notifications
   - Payment gateway (Stripe/Razorpay)
   - QR code patient records
   - Mobile app (Flutter/React Native)

---

## 📚 Full Documentation

See `API_DOCUMENTATION.md` for:
- Complete API reference (67+ endpoints)
- All endpoint examples
- Request/Response formats
- Error codes
- Security features

---

## 💡 Pro Tips

✅ **Always use HTTPS in production**
✅ **Update JWT_SECRET regularly**
✅ **Enable MongoDB authentication**
✅ **Set up automated backups**
✅ **Use environment variables for secrets**
✅ **Implement rate limiting**
✅ **Enable CORS appropriately**
✅ **Monitor API logs**
✅ **Test with Postman first**
✅ **Document API changes**

---

**Happy Coding! 🎉**

# Salon Booking Platform

A comprehensive salon booking and management system with dark-themed admin panel.

## Project Features

- **Customer Portal**: Browse salons, book appointments, manage bookings
- **Salon Owner Dashboard**: Manage salon, services, appointments, and customers
- **Super Admin Panel**: Platform management with dark theme UI
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live booking notifications and status updates

## Project Structure

```
.
├── frontend/           # React setup, Vite, and frontend assets
│   ├── src/           # Component logic, pages, and hooks
│   ├── public/        # Static assets for the frontend
│   └── package.json   # Frontend-specific dependencies
├── backend/            # PHP API and Core logic
│   ├── api/           # Entry point for backend routes
│   ├── scripts/       # Utility and diagnostic scripts
│   └── Services/      # Business logic and database services
├── database/           # Database related files
│   ├── sql/           # SQL Migrations and setup scripts
│   └── *.sql          # Initial database schema files
├── uploads/            # Central storage for all user-uploaded files
├── document/           # Technical documentation, logs, and text files
└── router.php          # PHP server entry point
```

## How to run this project?

**Prerequisites**: Node.js & PHP installed.

```sh
# Step 1: Install frontend dependencies
cd frontend && npm install

# Step 2: Start the PHP Backend (from root)
php -S 127.0.0.1:8000 router.php

# Step 3: Start the Vite Frontend (from root or frontend)
npm run dev
```

## Technologies Used

This project is built with modern web technologies:

- **React** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn-ui** - Component library
- **React Router** - Client-side routing
- **Supabase** - Backend and database
- **React Hook Form** - Form handling
- **Lucide React** - Icon library
- **Recharts** - Charts and analytics

## Key Features

### Customer Features
- Browse and search salons
- View salon details and services
- Book appointments online
- Manage booking history
- Responsive mobile interface

### Salon Owner Features
- Complete dashboard for salon management
- Service and staff management
- Appointment scheduling and management
- Customer relationship management
- Revenue and analytics tracking

### Super Admin Features
- **Dark Theme Interface** - Professional dark UI
- Platform-wide salon management
- User management and access control
- Booking oversight and analytics
- Payment and revenue tracking
- Marketing and promotional tools
- Comprehensive reporting system
- Platform settings and configuration

## Deployment

This project can be deployed on various platforms:

- **Vercel** - Recommended for React applications
- **Netlify** - Easy deployment with Git integration
- **AWS Amplify** - Full-stack deployment
- **Railway** - Simple deployment platform

## Custom Domain

You can connect a custom domain through your hosting provider's domain management settings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
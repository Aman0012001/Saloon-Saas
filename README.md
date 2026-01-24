# Salon Booking Platform

A comprehensive salon booking and management system with dark-themed admin panel.

## Project Features

- **Customer Portal**: Browse salons, book appointments, manage bookings
- **Salon Owner Dashboard**: Manage salon, services, appointments, and customers
- **Super Admin Panel**: Platform management with dark theme UI
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live booking notifications and status updates

## How to run this project?

**Prerequisites**: Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd salon-style-clone

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:8081`

## Admin Panel Access

Access the super admin panel directly at: `http://localhost:8081/admin`
- No login required (bypass mode enabled)
- Complete dark theme interface
- Manage salons, users, bookings, payments, marketing, reports, and settings

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
│   ├── admin/          # Admin panel pages
│   └── dashboard/      # Salon owner dashboard
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── styles/             # CSS and styling files
└── utils/              # Utility functions
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
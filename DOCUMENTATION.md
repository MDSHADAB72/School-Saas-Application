# School SaaS Application Documentation

## Overview

A comprehensive multi-tenant School Management System built with the MERN stack (MongoDB, Express.js, React, Node.js). This SaaS platform enables schools to manage students, teachers, attendance, examinations, fees, assignments, and more through role-based dashboards.

## Architecture

### Frontend (Client)
- **Framework**: React 19.2.0 with Vite
- **UI Library**: Material-UI (MUI) + Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router DOM v6
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **HTTP Client**: Axios

### Backend (Server)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Password Hashing**: bcryptjs
- **Real-time**: Socket.io
- **PDF Generation**: Puppeteer

## User Roles & Permissions

### 1. Super Admin
- Manage all schools in the platform
- View system-wide analytics
- Manage subscription plans
- Access to all features across schools

### 2. School Admin
- Manage school-specific data
- Add/manage students and teachers
- Configure school settings
- Access school analytics
- Manage fees and examinations

### 3. Teacher
- View assigned classes and students
- Mark attendance
- Create and grade assignments
- View examination schedules
- Access student performance data

### 4. Student
- View personal dashboard
- Check attendance records
- Submit assignments
- View examination results
- Access fee payment status

### 5. Parent
- Monitor child's academic progress
- View attendance and grades
- Receive school announcements
- Track fee payments

## Core Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Protected routes
- Session management

### 2. School Management
- Multi-tenant architecture
- School registration and onboarding
- Subscription management (Starter, Professional, Enterprise)
- School profile and settings

### 3. Student Management
- Student registration and profiles
- Bulk student upload via Excel
- Class and section assignment
- Student ID generation
- Parent contact management

### 4. Teacher Management
- Teacher profiles and credentials
- Subject and class assignments
- Bulk teacher upload
- Performance tracking

### 5. Attendance Management
- Daily attendance marking
- Attendance reports and analytics
- Bulk attendance upload
- Attendance notifications

### 6. Examination System
- Exam scheduling and management
- Result entry and processing
- Grade calculation
- Report card generation

### 7. Fee Management
- Fee structure configuration
- Payment tracking
- Fee collection reports
- Payment reminders

### 8. Assignment System
- Assignment creation and distribution
- Submission management
- Grading and feedback
- Assignment analytics

### 9. Announcements
- School-wide announcements
- Role-based notifications
- Announcement scheduling

### 10. Analytics & Reporting
- Student performance analytics
- Attendance reports
- Fee collection reports
- School statistics dashboard

### 11. Template System
- Customizable report templates
- Template editor with preview
- PDF generation from templates

## Database Schema

### Core Models

#### User Model
```javascript
{
  schoolId: ObjectId (ref: School),
  firstName: String (required),
  lastName: String,
  email: String (required, unique),
  password: String (required),
  role: Enum ['super_admin', 'school_admin', 'teacher', 'parent', 'student'],
  phoneNumber: String,
  profilePhoto: String,
  active: Boolean (default: true),
  timestamps: true
}
```

#### School Model
```javascript
{
  name: String (required),
  type: Enum ['public', 'private', 'international', 'boarding'],
  establishedYear: Number (required),
  board: Enum ['cbse', 'icse', 'state', 'ib', 'cambridge'],
  email: String (unique),
  phoneNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String (default: 'India')
  },
  registrationNumber: String (unique),
  principalName: String,
  subscription: {
    plan: Enum ['starter', 'professional', 'enterprise'],
    status: Enum ['trial', 'active', 'inactive', 'suspended'],
    startDate: Date,
    endDate: Date
  },
  totalStudents: Number (default: 0),
  totalTeachers: Number (default: 0),
  totalClasses: Number (default: 0),
  logo: String,
  features: [String],
  active: Boolean (default: true),
  timestamps: true
}
```

#### Student Model
```javascript
{
  schoolId: ObjectId (ref: School, required),
  userId: ObjectId (ref: User, required),
  studentId: String (unique),
  rollNumber: String (required),
  class: String (required),
  section: String (required),
  parentEmail: String,
  parentPhone: String,
  dateOfBirth: Date,
  gender: Enum ['Male', 'Female', 'Other'],
  bloodGroup: String,
  address: String,
  admissionNumber: String (unique),
  admissionDate: Date,
  active: Boolean (default: true),
  timestamps: true
}
```

### Additional Models
- **Teacher**: Teacher-specific information and assignments
- **Attendance**: Daily attendance records
- **Assignment**: Assignment details and submissions
- **Examination**: Exam schedules and configurations
- **Fee**: Fee structures and payment records
- **Announcement**: School announcements
- **Result**: Examination results and grades
- **Template**: Customizable report templates
- **Class**: Class and section management
- **Activity**: System activity logs

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile

### School Routes (`/api/schools`)
- `GET /` - Get all schools (Super Admin)
- `POST /` - Create new school
- `GET /:id` - Get school details
- `PUT /:id` - Update school
- `DELETE /:id` - Delete school

### Student Routes (`/api/students`)
- `GET /` - Get all students (filtered by school)
- `POST /` - Add new student
- `GET /:id` - Get student details
- `PUT /:id` - Update student
- `DELETE /:id` - Delete student
- `POST /bulk-upload` - Bulk student upload

### Teacher Routes (`/api/teachers`)
- `GET /` - Get all teachers
- `POST /` - Add new teacher
- `GET /:id` - Get teacher details
- `PUT /:id` - Update teacher
- `DELETE /:id` - Delete teacher
- `POST /bulk-upload` - Bulk teacher upload

### Attendance Routes (`/api/attendance`)
- `GET /` - Get attendance records
- `POST /` - Mark attendance
- `PUT /:id` - Update attendance
- `GET /student/:studentId` - Get student attendance
- `POST /bulk-upload` - Bulk attendance upload

### Examination Routes (`/api/examinations`)
- `GET /` - Get examinations
- `POST /` - Create examination
- `PUT /:id` - Update examination
- `DELETE /:id` - Delete examination
- `GET /:id/results` - Get exam results

### Fee Routes (`/api/fees`)
- `GET /` - Get fee records
- `POST /` - Create fee record
- `PUT /:id` - Update fee record
- `GET /student/:studentId` - Get student fees

### Assignment Routes (`/api/assignments`)
- `GET /` - Get assignments
- `POST /` - Create assignment
- `PUT /:id` - Update assignment
- `DELETE /:id` - Delete assignment
- `POST /:id/submit` - Submit assignment

### Announcement Routes (`/api/announcements`)
- `GET /` - Get announcements
- `POST /` - Create announcement
- `PUT /:id` - Update announcement
- `DELETE /:id` - Delete announcement

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup
1. Navigate to server directory:
   ```bash
   cd SchoolSaaS_server-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/school_saas
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

5. Seed the database:
   ```bash
   npm run seed
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to client directory:
   ```bash
   cd SchoolSaaS_client-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data
- `npm run reset` - Reset database
- `npm run verify` - Verify demo accounts
- `npm run fix-admin` - Fix school admin issues

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your preferred platform (Heroku, AWS, DigitalOcean)
3. Ensure MongoDB connection is configured for production

### Frontend Deployment
1. Update API URL in environment variables
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your hosting platform (Netlify, Vercel, AWS S3)

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS configuration
- Input validation and sanitization
- Role-based access control
- Protected API endpoints
- File upload restrictions

## Performance Optimizations

- Database indexing for frequently queried fields
- Lazy loading of components
- Image optimization
- API response caching
- Pagination for large datasets
- Bulk operations for data import

## Future Enhancements

- Mobile application (React Native)
- Real-time notifications with Socket.io
- Advanced analytics and reporting
- Integration with payment gateways
- Multi-language support
- Advanced template customization
- API rate limiting
- Automated backup system

## Support & Maintenance

- Regular security updates
- Database backup and recovery procedures
- Performance monitoring
- Error logging and tracking
- User feedback collection
- Feature request management

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Contact

For support or questions, please contact the development team.
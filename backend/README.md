# Attend-Ease Backend API

This is the backend API for the Attend-Ease attendance management system.

## Setup

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     NODE_ENV=development
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/attend-ease
     JWT_SECRET=your_secret_key
     JWT_EXPIRE=30d
     ```

3. Start the server:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

## API Documentation

### Authentication

- **Register User**: `POST /api/auth/register`
  - Body: `{ name, email, password, role }`
  - Role can be 'student', 'faculty', or 'admin' (defaults to 'student')

- **Login**: `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns JWT token

- **Get Current User**: `GET /api/auth/me`
  - Requires authentication

### Users

All user routes require admin access.

- **Get All Users**: `GET /api/users`
- **Get Single User**: `GET /api/users/:id`
- **Create User**: `POST /api/users`
  - Body: `{ name, email, password, role }`
- **Update User**: `PUT /api/users/:id`
  - Body: User fields to update
- **Delete User**: `DELETE /api/users/:id`

### Courses

- **Get All Courses**: `GET /api/courses`
  - Admin: sees all courses
  - Faculty: sees courses they teach
  - Student: sees courses they're enrolled in
  
- **Get Single Course**: `GET /api/courses/:id`
- **Create Course**: `POST /api/courses` (Admin, Faculty)
  - Body: `{ name, code, instructor, schedule, semester, description }`
- **Update Course**: `PUT /api/courses/:id` (Admin, Course Owner)
- **Delete Course**: `DELETE /api/courses/:id` (Admin, Course Owner)
- **Add Student to Course**: `POST /api/courses/:id/students` (Admin, Course Owner)
  - Body: `{ studentId }`

### Attendance

- **Create Attendance**: `POST /api/attendance` (Admin, Faculty)
  - Body: `{ course, date, records }`
  - Records: Array of `{ student, status, remarks }`
  - Status: 'present', 'absent', 'late', 'excused'
  
- **Update Attendance**: `PUT /api/attendance/:id` (Admin, Record Owner)
- **Get Course Attendance**: `GET /api/attendance/course/:courseId`
- **Get Student Attendance**: `GET /api/attendance/student/:studentId`

## Data Models

### User
- name: String (required)
- email: String (required, unique)
- password: String (required, min 6 chars)
- role: String (enum: student, faculty, admin)
- profileImage: String
- createdAt: Date

### Course
- name: String (required)
- code: String (required, unique)
- instructor: User reference (required)
- students: Array of User references
- schedule: Object (days, startTime, endTime)
- semester: String (required)
- description: String
- createdAt: Date

### Attendance
- course: Course reference (required)
- date: Date (required)
- records: Array of:
  - student: User reference (required)
  - status: String (enum: present, absent, late, excused)
  - remarks: String
- takenBy: User reference (required)
- createdAt: Date 
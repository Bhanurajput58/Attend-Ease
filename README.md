# AttendEase - Attendance Management System

A modern, full-stack attendance management system built with React and Node.js. Perfect for educational institutions looking to digitize their attendance tracking process.

## Features

- **User Authentication** - Secure login and registration system
- **Role-Based Access** - Separate dashboards for students, faculty, and administrators
- **Smart Attendance Tracking** - Easy-to-use interface for marking attendance
- **Comprehensive Reporting** - Generate detailed attendance reports and analytics
- **Course Management** - Organize courses and manage student enrollments

## Tech Stack

- **Frontend**: React 18, Material-UI, Recharts for data visualization
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Export**: PDF and Excel report generation

## Project Structure

```
AttendEase/
├── frontend/          # React application
├── backend/           # Node.js API server
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have Node.js (v14 or higher) and npm installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AttendEase
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

You'll need to run both the backend and frontend servers. Open two separate terminal windows/tabs for this.

### Start the Backend Server

In your first terminal:
```bash
cd backend
npm run dev
```

The backend will start on **http://localhost:5000** with automatic restart enabled (thanks to nodemon).

### Start the Frontend Server

In your second terminal:
```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:3000** and automatically open in your browser.

## Available Scripts

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server

### Frontend Scripts
- `npm run dev` - Start development server
- `npm start` - Same as dev (alias)
- `npm run build` - Create production build
- `npm test` - Run test suite

## Development Tips

- The backend uses nodemon, so it will automatically restart when you make changes to server files
- The frontend has hot reload enabled, so changes will appear instantly in the browser
- Make sure MongoDB is running locally or update the connection string in the backend config
- Check the console for any error messages if something isn't working

## What You Can Do

- **Students**: View your attendance records, check attendance percentages, and see course schedules
- **Faculty**: Take attendance, view student lists, generate reports, and manage courses
- **Administrators**: Manage users, courses, and access comprehensive system analytics

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this project!

## License

This project is open source and available under the [MIT License](LICENSE). 
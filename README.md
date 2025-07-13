# AttendEase - Attendance Management System

A full-stack attendance management system with React frontend and Node.js backend.

## Project Structure

```
AttendEase/
├── frontend/          # React application
│   ├── package.json   # Frontend dependencies
│   ├── src/          # React source code
│   └── public/       # Static files
└── backend/          # Node.js server
    ├── package.json  # Backend dependencies
    ├── server.js     # Main server file
    ├── routes/       # API routes
    ├── controllers/  # Route controllers
    ├── models/       # Database models
    └── middleware/   # Express middleware
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

## Running the Application

### Start Frontend Server
```bash
cd frontend
npm run dev
# or
npm start
```
Frontend will run on: http://localhost:3000

### Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:5000 (or configured port)

## Development

- **Frontend**: React with Material-UI components
- **Backend**: Express.js with MongoDB
- **Authentication**: JWT tokens
- **File Handling**: Excel/PDF export capabilities

## Available Scripts

### Frontend (in frontend/ directory)
- `npm run dev` - Start development server
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend (in backend/ directory)
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server 
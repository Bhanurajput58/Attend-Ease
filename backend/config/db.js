const mongoose = require('mongoose');

const connectDB = async () => {
  return mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pr_attendance_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = connectDB;
const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Please configure it in your environment.');
  }

  return mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  });
};

module.exports = connectDB;
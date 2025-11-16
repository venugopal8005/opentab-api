const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use your existing MongoDB URI from .env
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1); // Stop the app if DB connection fails
  }
};

module.exports = connectDB;

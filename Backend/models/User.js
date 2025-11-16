const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'], 
      trim: true 
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('hashedPassword')) return next();
  
  try {
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password during login
userSchema.methods.verifyPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.hashedPassword);
};

// Export the model (this creates the collection in MongoDB)
module.exports = mongoose.models.User || mongoose.model('User', userSchema);

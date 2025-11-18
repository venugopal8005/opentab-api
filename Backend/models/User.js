const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    hashedPassword: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    displayName: {
      type: String,
      trim: true,
      default: function() {
        return this.email.split('@')[0];
      }
    },
    refreshToken: {
      type: String,
      default: null,
      select: false
    }
  },
  { 
    timestamps: true,
    collection: 'auth_users'
  }
);

userSchema.index({ email: 1, hashedPassword: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('hashedPassword')) return next();
  this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
  next();
});

userSchema.methods.verifyPassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.hashedPassword);
};

userSchema.methods.generateAccessToken = function () {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: this._id, email: this.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

userSchema.methods.generateRefreshToken = function () {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.hashedPassword;
  delete user.refreshToken;
  return user;
};

userSchema.statics.findByEmailLean = function(email) {
  return this.findOne({ email }).select('-hashedPassword -refreshToken').lean();
};

module.exports = mongoose.model('User', userSchema);

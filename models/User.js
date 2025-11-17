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
      select: false // Don't return password by default (security + performance)
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
      select: false // Don't return refresh token by default
    }
  },
  { 
    timestamps: true,
    collection: 'auth_users'
  }
);

// ===== INDEXES (Performance Optimization) =====
// Primary lookup index
userSchema.index({ email: 1 }, { unique: true });

// Fast auth queries
userSchema.index({ email: 1, hashedPassword: 1 });

// ===== METHODS =====
userSchema.pre('save', async function (next) {
  if (!this.isModified('hashedPassword')) return next();
  try {
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.verifyPassword = async function (candidatePassword) {
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

// Security: Don't expose sensitive fields in JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.hashedPassword;
  delete user.refreshToken;
  return user;
};

// ===== STATIC METHODS (Query Optimization) =====
// Use lean() for read-only operations (5x faster)
userSchema.statics.findByEmailLean = function(email) {
  return this.findOne({ email }).select('-hashedPassword -refreshToken').lean();
};

module.exports = mongoose.model('User', userSchema);

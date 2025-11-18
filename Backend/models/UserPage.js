const mongoose = require('mongoose');

const userPageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      maxlength: 50000, // 50KB limit
      default: ''
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { 
    timestamps: true,
    collection: 'user_pages'
  }
);

// ===== COMPOUND INDEXES =====
// User's pages sorted by date
userPageSchema.index({ userId: 1, createdAt: -1 });

// Public pages discovery
userPageSchema.index({ isPublic: 1, createdAt: -1 }, {
  partialFilterExpression: { isPublic: true }
});

module.exports = mongoose.model('UserPage', userPageSchema);

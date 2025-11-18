const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    dpUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    streak: { type: Number, default: 0, min: 0, index: true }, // Index for leaderboards
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy'],
      default: 'offline',
      index: true // Fast status filtering
    },
    currentActivity: { type: String, default: null },
    bio: { type: String, maxlength: 500, default: null },
    socialLinks: { type: Map, of: String, default: {} }, // Optimized key-value storage
    dailyNote: { type: String, maxlength: 1000, default: null },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 20; // Limit array size for performance
        },
        message: 'Maximum 20 tags allowed'
      }
    },
    workingOn: { type: String, maxlength: 200, default: null },
    credits: { type: Number, default: 0, min: 0 },
    notifications: { type: Number, default: 0, min: 0 }
  },
  { 
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'user_profile'
  }
);

// ===== COMPOUND INDEXES (ESR Rule) =====
// Fast user lookup
userProfileSchema.index({ userId: 1 }, { unique: true });

// Leaderboard queries (Equality + Sort)
userProfileSchema.index({ status: 1, streak: -1 }); // Online users by streak

// Tag search (partial index - only docs with tags)
userProfileSchema.index({ tags: 1 }, { 
  sparse: true, // Only index if tags exist (saves memory)
  partialFilterExpression: { tags: { $exists: true, $ne: [] } }
});

// ===== STATIC METHODS =====
// Get top users by streak (optimized)
userProfileSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ status: 'online' })
    .sort({ streak: -1 })
    .limit(limit)
    .select('userId displayName streak dpUrl')
    .lean(); // Lean for read-only
};

// Find users by tags (covered query)
userProfileSchema.statics.findByTags = function(tags) {
  return this.find({ tags: { $in: tags } })
    .select('userId tags bio dpUrl')
    .lean();
};

module.exports = mongoose.model('UserProfile', userProfileSchema);

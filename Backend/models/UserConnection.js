const mongoose = require('mongoose');

const userConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending',
      index: true
    }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'user_connections'
  }
);

// ===== COMPOUND INDEXES (ESR Rule) =====
// Prevent duplicate connections
userConnectionSchema.index({ userId: 1, targetUserId: 1 }, { unique: true });

// Most common query: user's accepted connections
userConnectionSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Reverse lookup: who connected to this user
userConnectionSchema.index({ targetUserId: 1, status: 1 });

// ===== STATIC METHODS =====
// Get user's connections (optimized)
userConnectionSchema.statics.getUserConnections = function(userId, status = 'accepted') {
  return this.find({ userId, status })
    .select('targetUserId createdAt')
    .sort({ createdAt: -1 })
    .lean();
};

// Get mutual connections (complex query optimization)
userConnectionSchema.statics.getMutualConnections = async function(userId1, userId2) {
  const user1Connections = await this.find({ userId: userId1, status: 'accepted' })
    .select('targetUserId').lean();
  const user1Ids = user1Connections.map(c => c.targetUserId.toString());
  
  return this.find({ 
    userId: userId2, 
    status: 'accepted',
    targetUserId: { $in: user1Ids }
  }).lean();
};

module.exports = mongoose.model('UserConnection', userConnectionSchema);

const mongoose = require('mongoose');

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: false,
    collection: 'workspace_members'
  }
);

// ===== COMPOUND INDEXES (ESR Rule) =====
// Prevent duplicate memberships
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

// Get workspace members by role
workspaceMemberSchema.index({ workspaceId: 1, role: 1, joinedAt: -1 });

// Get user's workspaces
workspaceMemberSchema.index({ userId: 1, isActive: 1 });

// ===== STATIC METHODS =====
// Get workspace members (optimized)
workspaceMemberSchema.statics.getWorkspaceMembers = function(workspaceId) {
  return this.find({ workspaceId, isActive: true })
    .populate('userId', 'displayName email dpUrl')
    .select('role joinedAt')
    .sort({ joinedAt: 1 })
    .lean();
};

module.exports = mongoose.model('WorkspaceMember', workspaceMemberSchema);

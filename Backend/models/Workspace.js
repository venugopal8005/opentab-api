const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    settings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { 
    timestamps: true,
    collection: 'workspaces'
  }
);

// ===== COMPOUND INDEXES =====
// Owner's active workspaces
workspaceSchema.index({ ownerId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Workspace', workspaceSchema);

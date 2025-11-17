const mongoose = require('mongoose');

const todoItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: {
      type: [{
        id: { type: String, required: true },
        text: { type: String, required: true, maxlength: 200 },
        status: { 
          type: String, 
          enum: ['pending', 'completed', 'archived'],
          default: 'pending'
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        createdAt: { type: Date, default: Date.now },
        completedAt: { type: Date }
      }],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 200; // Max 200 todos
        },
        message: 'Maximum 200 todos allowed'
      }
    }
  },
  { 
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'todo_items'
  }
);

// ===== INDEXES =====
userProfileSchema.index({ userId: 1 }, { unique: true });

// ===== INSTANCE METHODS =====
// Get active todos count (computed field)
todoItemSchema.methods.getActiveCount = function() {
  return this.items.filter(item => item.status === 'pending').length;
};

module.exports = mongoose.model('TodoItem', todoItemSchema);

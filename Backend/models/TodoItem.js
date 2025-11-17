const mongoose = require('mongoose');

const todoItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // TASK TITLE
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    // TASK DESCRIPTION
    description: {
      type: String,
      default: ""
    },

    // PRIORITY
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    // DEADLINE / DUE DATE
    deadline: {
      type: Date,
      default: null
    },

    // STATUS (3 Columns)
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
      index: true
    },

    // ORDERING POSITION WITHIN COLUMN
    position: {
      type: Number,
      default: 0
    },

    // USER-WRITTEN SUBTASKS
    subtasks: [
      {
        label: { type: String, required: true },
        completed: { type: Boolean, default: false }
      }
    ],

    // KEYWORD TAGS
    tags: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true,
    collection: "todo_items"
  }
);

// ===== INDEXES =====
todoItemSchema.index({ userId: 1, status: 1, position: 1 });

module.exports = mongoose.model("TodoItem", todoItemSchema);

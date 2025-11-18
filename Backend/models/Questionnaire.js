const mongoose = require('mongoose');

const questionnaireSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      sparse: true // Index only if userId exists
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    options: {
      type: [String], // Array of strings (better than Mixed for performance)
      required: true,
      validate: {
        validator: function(v) {
          return v.length >= 2 && v.length <= 10;
        },
        message: 'Options must have 2-10 items'
      }
    },
    category: {
      type: String,
      required: true,
      index: true,
      enum: ['personality', 'skills', 'interests', 'goals'] // Constrained for index efficiency
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { 
    timestamps: true,
    collection: 'questionnaire'
  }
);

// ===== COMPOUND INDEXES (Query Optimization) =====
// Most common query: active questions by category
questionnaireSchema.index({ isActive: 1, category: 1, createdAt: -1 });

// User-specific questionnaires (sparse index)
questionnaireSchema.index({ userId: 1 }, { sparse: true });

// ===== STATIC METHODS =====
// Get active questions by category (covered query)
questionnaireSchema.statics.getActiveByCategory = function(category) {
  return this.find({ isActive: true, category })
    .select('questionText options difficulty')
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = mongoose.model('Questionnaire', questionnaireSchema);

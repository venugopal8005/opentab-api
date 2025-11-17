const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    answers: {
      type: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        answer: { type: String, required: true },
        score: { type: Number, min: 0, max: 100 },
        answeredAt: { type: Date, default: Date.now }
      }],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 100; // Prevent document bloat
        },
        message: 'Maximum 100 answers allowed'
      }
    },
    personalityTags: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 10;
        },
        message: 'Maximum 10 personality tags allowed'
      }
    },
    completionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true // For analytics/leaderboards
    }
  },
  { 
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'user_answers'
  }
);

// ===== INDEXES =====
userAnswerSchema.index({ userId: 1 }, { unique: true });
userAnswerSchema.index({ personalityTags: 1 }, { sparse: true });
userAnswerSchema.index({ completionScore: -1 }); // Leaderboard

// Prevent excessive document growth
userAnswerSchema.pre('save', function(next) {
  if (this.answers.length > 100) {
    return next(new Error('Cannot exceed 100 answers'));
  }
  next();
});

module.exports = mongoose.model('UserAnswer', userAnswerSchema);

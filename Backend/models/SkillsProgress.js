const mongoose = require('mongoose');

const skillsProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    skills: {
      type: [{
        name: { type: String, required: true, trim: true },
        level: { type: Number, min: 0, max: 100, default: 0 },
        category: { 
          type: String, 
          enum: ['technical', 'soft', 'language', 'creative'],
          default: 'technical'
        },
        milestones: {
          type: [{
            title: String,
            achievedAt: Date,
            progress: Number
          }],
          validate: {
            validator: function(v) {
              return v.length <= 20;
            },
            message: 'Maximum 20 milestones per skill'
          }
        },
        lastUpdated: { type: Date, default: Date.now }
      }],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 50; // Max 50 skills
        },
        message: 'Maximum 50 skills allowed'
      }
    }
  },
  { 
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'skills_progress'
  }
);

// ===== INDEXES =====
skillsProgressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('SkillsProgress', skillsProgressSchema);

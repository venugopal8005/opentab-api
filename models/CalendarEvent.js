const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    events: {
      type: [{
        title: { type: String, required: true, maxlength: 100 },
        date: { type: Date, required: true },
        type: { 
          type: String, 
          enum: ['meeting', 'deadline', 'reminder', 'task'],
          default: 'task'
        },
        notes: { type: String, maxlength: 500 }
      }],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 50; // Max 50 events per month
        },
        message: 'Maximum 50 events per month'
      }
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true
    }
  },
  { 
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'calendar_events'
  }
);

// ===== COMPOUND INDEXES =====
// One document per user per month
calendarEventSchema.index({ userId: 1, month: 1 }, { unique: true });

// Range queries (get multiple months)
calendarEventSchema.index({ userId: 1, month: -1 });

// ===== STATIC METHODS =====
// Get user's events for date range
calendarEventSchema.statics.getEventsInRange = function(userId, startMonth, endMonth) {
  return this.find({
    userId,
    month: { $gte: startMonth, $lte: endMonth }
  })
  .select('month events')
  .sort({ month: 1 })
  .lean();
};

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);

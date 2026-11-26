const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        'message',
        'listing_approved',
        'listing_rejected',
        'favorite',
        'report',
        'listing_sold',
        'listing_deleted'
      ],
      required: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    read: {
      type: Boolean,
      default: false,
      index: true
    },

    data: {
      type: Object,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

schema.index({
  user: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  'Notification',
  schema
);
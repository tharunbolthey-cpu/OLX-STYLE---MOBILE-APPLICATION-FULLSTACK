const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    location: {
      type: String,
      default: ''
    },

    avatar: {
      type: String,
      default: ''
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', schema);
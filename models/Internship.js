const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date_of_birth: {
    type: Date
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  zip_code: {
    type: String,
    required: true,
    trim: true
  },
  institution: {
    type: String,
    required: true
  },
  payment_screenshot: {
    type: String, // Cloudinary URL
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Internship', internshipSchema);
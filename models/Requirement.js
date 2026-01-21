const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
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
    type: String
  },
  site_details: {
    type: String
  },
  area: {
    type: String
  },
  budget: {
    type: String
  },
  category: {
    type: String
  },
  services: {
    type: String
  },
  drawings: {
    type: String // Cloudinary URL for PDF
  },
  message: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'closed'],
    default: 'new'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Requirement', requirementSchema);
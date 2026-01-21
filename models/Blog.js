const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  images: [{
    type: String, // Cloudinary URLs
    max: 4
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  published: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Generate slug from title
blogSchema.pre('save', function(next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // If slug exists and title changed, add timestamp to make it unique
    if (this.slug && this.isModified('title')) {
      baseSlug = baseSlug + '-' + Date.now().toString().slice(-6);
    }
    
    this.slug = baseSlug;
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
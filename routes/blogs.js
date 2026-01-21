const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage } = require('../config/cloudinary');

const router = express.Router();

// Get all published blog posts (public)
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    // Ensure all blogs have slugs (backfill for existing blogs)
    for (const blog of blogs) {
      if (!blog.slug) {
        const slug = blog.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        blog.slug = slug;
        await blog.save();
      }
    }
    
    res.json(blogs);
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all blog posts including unpublished (admin only)
router.get('/all', authenticate, isAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single blog post by ID or slug (public if published)
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    if (!identifier) {
      return res.status(400).json({ message: 'Blog identifier is required' });
    }

    // Skip if identifier is 'all' (should be handled by /all route, but just in case)
    if (identifier === 'all') {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    let blog = null;
    const mongoose = require('mongoose');
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    console.log('Looking for blog with identifier:', identifier, 'isValidObjectId:', isValidObjectId);
    
    // Strategy 1: Try to find by slug first (most common case)
    // Only try slug if it's NOT a valid ObjectId format to avoid casting errors
    if (!isValidObjectId) {
      try {
        // Use lean() first to avoid Mongoose trying to cast identifier as ObjectId
        const blogDoc = await Blog.findOne({ slug: identifier }).lean();
        if (blogDoc) {
          // Convert back to Mongoose document for populate
          blog = await Blog.findById(blogDoc._id).populate('author', 'name email');
          if (blog) {
            console.log('✅ Blog found by slug:', identifier);
          }
        } else {
          console.log('❌ No blog found with slug:', identifier);
        }
      } catch (err) {
        console.log('❌ Slug lookup error:', err.message);
        // If lean() fails, try direct query (shouldn't happen, but fallback)
        try {
          blog = await Blog.findOne({ slug: identifier }).populate('author', 'name email');
          if (blog) {
            console.log('✅ Blog found by slug (direct query):', identifier);
          }
        } catch (err2) {
          console.log('❌ Direct slug query also failed:', err2.message);
        }
      }
    }
    
    // Strategy 2: If not found by slug and it's a valid ObjectId, try by ID
    if (!blog && isValidObjectId) {
      try {
        if (mongoose.Types.ObjectId.isValid(identifier)) {
          blog = await Blog.findById(identifier).populate('author', 'name email');
          if (blog) {
            console.log('✅ Blog found by ObjectId:', identifier);
          }
        }
      } catch (err) {
        console.log('❌ ID lookup failed:', err.message);
      }
    }
    
    // Strategy 3: If still not found and it's not a valid ObjectId, try finding all and matching by slug
    if (!blog && !isValidObjectId) {
      try {
        const allBlogs = await Blog.find({ published: true }).populate('author', 'name email');
        const foundBlog = allBlogs.find(b => {
          return b.slug === identifier || b.slug === String(identifier);
        });
        if (foundBlog) {
          blog = foundBlog;
          console.log('✅ Blog found by slug comparison:', identifier);
        }
      } catch (err) {
        console.log('❌ Slug comparison lookup failed:', err.message);
      }
    }

    if (!blog) {
      console.log('❌ Blog not found for identifier:', identifier);
      // Let's also check what blogs exist for debugging
      try {
        const allBlogs = await Blog.find({}, '_id slug title published').limit(5).lean();
        console.log('Sample of existing blogs:', JSON.stringify(allBlogs, null, 2));
        return res.status(404).json({ 
          message: 'Blog post not found',
          debug: process.env.NODE_ENV === 'development' ? {
            identifier,
            isValidObjectId,
            sampleBlogs: allBlogs.map(b => ({
              _id: b._id.toString(),
              slug: b.slug,
              title: b.title,
              published: b.published
            }))
          } : undefined
        });
      } catch (debugErr) {
        console.error('Error getting debug info:', debugErr);
        return res.status(404).json({ message: 'Blog post not found' });
      }
    }

    // Check if blog is published (unless admin)
    if (!blog.published) {
      console.log('❌ Blog found but not published:', identifier, 'Blog ID:', blog._id);
      return res.status(404).json({ 
        message: 'Blog post not found',
        debug: process.env.NODE_ENV === 'development' ? {
          reason: 'Blog exists but is not published',
          blogId: blog._id.toString(),
          published: blog.published
        } : undefined
      });
    }

    console.log('✅ Blog successfully retrieved:', blog.title, 'ID:', blog._id, 'Slug:', blog.slug);
    res.json(blog);
  } catch (error) {
    console.error('❌ Get blog error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create blog post (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  upload.array('images', 4), // Maximum 4 images
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const blogData = {
        title: req.body.title,
        content: req.body.content,
        author: req.user._id,
        published: req.body.published === 'true' || req.body.published === true
      };

      // Upload images to Cloudinary if provided
      if (req.files && req.files.length > 0) {
        const imagePromises = req.files.map(file => 
          uploadImage(file, 'mudbeaver/blogs')
        );
        blogData.images = await Promise.all(imagePromises);
      }

      const blog = new Blog(blogData);
      await blog.save();
      
      await blog.populate('author', 'name email');

      res.status(201).json({
        message: 'Blog post created successfully',
        blog
      });
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update blog post (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  upload.array('images', 4),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      // Update fields
      if (req.body.title) blog.title = req.body.title;
      if (req.body.content) blog.content = req.body.content;
      if (req.body.published !== undefined) {
        blog.published = req.body.published === 'true' || req.body.published === true;
      }

      // Handle images
      if (req.files && req.files.length > 0) {
        const imagePromises = req.files.map(file => 
          uploadImage(file, 'mudbeaver/blogs')
        );
        const newImages = await Promise.all(imagePromises);
        
        // Merge with existing images or replace
        if (req.body.replaceImages === 'true') {
          blog.images = newImages.slice(0, 4);
        } else {
          blog.images = [...(blog.images || []), ...newImages].slice(0, 4);
        }
      }

      // Regenerate slug if title changed
      if (req.body.title) {
        blog.slug = blog.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      await blog.save();
      await blog.populate('author', 'name email');

      res.json({
        message: 'Blog post updated successfully',
        blog
      });
    } catch (error) {
      console.error('Update blog error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete blog post (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    await blog.deleteOne();
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
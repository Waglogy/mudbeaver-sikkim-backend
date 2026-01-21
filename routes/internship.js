const express = require('express');
const { body, validationResult } = require('express-validator');
const Internship = require('../models/Internship');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImage } = require('../config/cloudinary');

const router = express.Router();

// Submit internship application
router.post(
  '/',
  upload.single('payment_screenshot'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('region').trim().notEmpty().withMessage('Region is required'),
    body('zip_code').trim().notEmpty().withMessage('Zip code is required'),
    body('institution').trim().notEmpty().withMessage('Institution is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Payment screenshot is required' });
      }

      // Upload payment screenshot to Cloudinary
      const paymentScreenshotUrl = await uploadImage(req.file, 'mudbeaver/internships/payments');

      const internshipData = {
        ...req.body,
        payment_screenshot: paymentScreenshotUrl
      };

      const internship = new Internship(internshipData);
      await internship.save();

      res.status(201).json({
        message: 'Internship application submitted successfully',
        internship: {
          id: internship._id,
          name: internship.name,
          email: internship.email,
          phone: internship.phone,
          status: internship.status,
          createdAt: internship.createdAt
        }
      });
    } catch (error) {
      console.error('Internship application error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all internship applications (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const internships = await Internship.find().sort({ createdAt: -1 });
    res.json(internships);
  } catch (error) {
    console.error('Get internships error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single internship application (admin only)
router.get('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship application not found' });
    }
    res.json(internship);
  } catch (error) {
    console.error('Get internship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update internship status (admin only)
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!internship) {
      return res.status(404).json({ message: 'Internship application not found' });
    }

    res.json(internship);
  } catch (error) {
    console.error('Update internship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const Requirement = require('../models/Requirement');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadPDF } = require('../config/cloudinary');

const router = express.Router();

// Submit requirement/appointment form
router.post(
  '/',
  upload.single('drawings'),
  [
    body('username').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').trim().notEmpty().withMessage('Phone is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requirementData = { ...req.body };

      // Upload PDF drawings to Cloudinary if provided
      if (req.file) {
        requirementData.drawings = await uploadPDF(req.file, 'mudbeaver/requirements/drawings');
      }

      const requirement = new Requirement(requirementData);
      await requirement.save();

      res.status(201).json({
        message: 'Requirement submitted successfully',
        requirement: {
          id: requirement._id,
          username: requirement.username,
          email: requirement.email,
          phone: requirement.phone,
          status: requirement.status,
          createdAt: requirement.createdAt
        }
      });
    } catch (error) {
      console.error('Requirement submission error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all requirements (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const requirements = await Requirement.find().sort({ createdAt: -1 });
    res.json(requirements);
  } catch (error) {
    console.error('Get requirements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single requirement (admin only)
router.get('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }
    res.json(requirement);
  } catch (error) {
    console.error('Get requirement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update requirement status (admin only)
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'quoted', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const requirement = await Requirement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    res.json(requirement);
  } catch (error) {
    console.error('Update requirement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
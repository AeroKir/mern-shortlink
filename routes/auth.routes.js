const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('config');
const User = require('../models/User');

const router = Router();

// /api/auth/register
router.post(
  '/register',
  [
    check('email', 'Incorrect email').isEmail(),
    check('password', 'Minimum password length should be less than 6 symbols').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Incorrect registration data',
        });
      }

      const { email, password } = req.body;

      const candidate = await User.findOne({ email });

      if (candidate) {
        return res.status(400).json({ message: 'Such user already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });

      await user.save();
      res.status(201).json({ message: 'User successfully created!' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong. Try again.' });
    }
  },
);

// /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Please, enter correct email').normalizeEmail().isEmail(),
    check('password', 'Please, enter a password').exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Incorrect authorization data',
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password. Please, try again' });
      }

      const token = jwt.sign(
        { userId: user.id },
        config.get('jwtSecretKey'),
        { expiresIn: '1h' },
      );

      res.json({ token, userId: user.id });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong. Try again.' });
    }
  },
);

module.exports = router;

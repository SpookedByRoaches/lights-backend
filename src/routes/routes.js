const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

router.get('/', (req, res) => {
  res.send("OKOK");
});

router.post(
  '/login',
  async (req, res, next) => {
    passport.authenticate(
      'local',
      async (err, user, info) => {
        if (!user) {
          return res.status(401).json({ message: 'Authentication failed' });
        }
        req.login(
          user,
          { session: false },
          async (error) => {
            if (error) return next(error);
            const body = { _id: user._id, email: user.email };
            const token = jwt.sign({ user: body }, process.env.JWT_SECRET);
            return res.json({ token });
          }
        );
      }
    )(req, res, next);
  }
  )

module.exports = router;

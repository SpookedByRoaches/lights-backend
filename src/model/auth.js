const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const constants = require('../lib/constants')
const db = require('../model/db');
const logger = require('../lib/logging');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const fs = require('fs');
require('dotenv').config();

var opts = {};
opts.secretOrKey = process.env.JWT_SECRET;
opts.jwtFromRequest = ExtractJWT.fromHeader("auth");

passport.use(
  new JWTstrategy(opts, async (token, done) => {
      try {
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    }
  )
);


async function isPasswordValid(user, password) {
  inHash = crypto.pbkdf2Sync(password, user.salt, constants.HASH_ITER, constants.HASH_LEN, constants.HASH_ALGO);
  realHash = user.password;
  return crypto.timingSafeEqual(realHash, inHash);
}

passport.use('local', 
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
  async function verify(username, password, cb) {
    user = await db.getUser(username);
    if (!user)
      return cb(null, false);
    user = user[0];

    if (!(await isPasswordValid(user, password)))
      return cb(null, false);
    else {
      return cb(null, user);
    }
  })
);

module.exports = {isPasswordValid};
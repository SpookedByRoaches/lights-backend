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
opts.jwtFromRequest = ExtractJWT.fromAuthHeaderAsBearerToken();

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


async function isPasswordValid(username, password) {
  var user;
  try {
    user = await db.getUser(username);
    if (!user)
      return false;
    user = user[0];
  } catch (err) {
    logger.error("Could not validate user due to DB error");
    throw err;
  }

  inHash = crypto.pbkdf2Sync(password, user.salt, constants.HASH_ITER, constants.HASH_LEN, constants.HASH_ALGO);
  realHash = user.password;
  return crypto.timingSafeEqual(realHash, inHash);
}

passport.use('login', new LocalStrategy(
{
  usernameField: 'username',
  passwordField: 'password'
},
async function verify(username, password, cb) {
  if (!(await isPasswordValid(username, password)))
    return cb(null, false, { message: 'Incorrect username or password.' });
  else {
    const user = await db.getUser(username);
    return cb(null, user[0], { message: 'Logged in Successfully' });
  }
  })
);

module.exports = {isPasswordValid};
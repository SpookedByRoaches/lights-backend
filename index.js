const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
var logger = require('./src/lib/logging');
var db = require('./src/model/db');
var auth = require('./src/model/auth');

const routes = require('./src/routes/routes');
const secureRoute = require('./src/routes/secure-routes');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);

app.use('/user', passport.authenticate('jwt', { session: false }), secureRoute);

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({ error: err });
});
  
app.listen(3333, () => {
    console.log('Server started.');
});

async function printU(username){
    var user = await db.getUser(username);
    console.log(user);
}

async function tellMe(username, password) {
    var isValid = await auth.isPasswordValid(username, password);
    console.log(isValid);
}
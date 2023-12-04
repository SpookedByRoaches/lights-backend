// TODO: What to do??? Nothing seems to be pending 
// in terms of features?

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
const logger = require('./src/lib/logging');
const db = require('./src/model/db');
const auth = require('./src/model/auth');
const communicator = require('./src/model/communicator');
const routes = require('./src/routes/routes');
const secureRoute = require('./src/routes/secure-routes');
const lightsRoute = require('./src/routes/lights-routes');

const app = express();

app.options('*', cors());
app.use(cors({
    origin: "http://192.168.1.9:9000",
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use('/', routes);

app.use('/user', passport.authenticate('jwt', { session: false }), secureRoute);

app.use('/lights', passport.authenticate('jwt', { session: false }), lightsRoute);

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({ error: err });
    console.log(err);
});

communicator.initializeObj();

testThings();

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

async function testGetThings()
{
    if (await db.devExists(1))
        console.log("Looking good");
    else
        console.log("Looking bad");
}

async function testThings()
{
    // await testGetThings();
    // await testGetStrips();
}

async function testGetStrips()
{
    try {
        var rows = await db.getAvailStrips();
    } catch (err) {
        console.log(`Could not get allStrips ${err}`);
    }
}

async function testStrip()
{
    const id = 1;
    const vals = {'ballcount': 3, 'ballFade': 2, 'ballMirrored': 0, 'NONO': 0};
    await comm.setParamLights(id, 'brightness', 99);
    try {
        await db.bulkUpdateStrip(id, vals);
    } catch (err){
        console.log(`Illegal ${err}`);
    }
    var rows = await db.getStrip(id);
    var X = 99;
}

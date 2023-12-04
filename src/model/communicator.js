const mqtt = require('async-mqtt')
const db = require('../model/db');
const logger = require('../lib/logging');
const devStore = require

require('dotenv').config();

const protocol = 'mqtt'
const host = process.env.MQTT_HOST
const port = process.env.MQTT_PORT
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `${protocol}://${host}:${port}`

var devs = {};

async function initDevsList()
{
    var types = await db.getTypes();
    types.forEach(function(type, idx){
      this.devs[type['name']] = {};
    });
    await saveDevsLocal();
}

async function saveDevsLocal()
{
  var retDevs = await db.getAllDevs();
  retDevs.forEach(function(dev, idx){
    devs[dev['type']][dev['id']] = dev;
  });
}

async function handleDiscovered(payload)
{
  vals = JSON.parse(payload);
  if (db.devExists(vals['id'])){
    if (vals['type'] == 'strips'){
      var dbValsPromise = db.getStrip(vals['id']);
      console.log(`${vals['id']} Exists`);
      var dbVals = await dbValsPromise;
      var key_arr = Object.keys(dbVals);
      key_arr.forEach(function(paramName, idx){
        if (dbVals[paramName] != vals[paramName]){
          console.log(`${paramName} in database it is ${dbVals[paramName]} but ${vals[paramName]} on device`)
          setParamLights(vals['id'], paramName, String(dbVals[paramName]));
        }
      });
    }
  }
  else {
    if (vals['type'] == 'strips'){
      await saveStripDB(vals);
    }
  }
  devs[vals['type']][vals['id']] = {'id': vals['id'], 'lastAlive': Date.now()};
  console.log("Handled");
}

async function saveStripDB(device)
{
  if (device['id'] == null){
    logger.warn("Attempting to save device with no ID");
    return null;
  }
  
  if (await db.devExists(device['id'])){
    logger.warn(`Attempting to save existing device as new: ${device['id']}, aborting...`);
    return null;
  }

  var createdStrip = db.createStrip(device['id']);
  var params = Object.assign({}, device);
  delete params['id'];
  delete params['text'];
  delete params['type'];
  delete params['powerState'];
  await createdStrip;
  try {
    db.bulkUpdateStrip(device['id'], params);
  } catch(err) {
    logger.warn(`error updating strip ${err}`);
  }
}

async function initializeObj() {
  await initClient();
  await initDevs();
  await probeDevs();
  declareDevs();
}

function declareDevs()
{
  client.publish("discover", "{'topic':'declare'}");
}

async function initClient() {
  client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    reconnectPeriod: 1000,
  });

  client.on('close', () => {
    logger.debug("Connection closed");
  });
  
  client.on("error",function(err) { 
    logger.warn(`Can't connect ${err}`)
  });
  
  client.on('connect', () => {
      logger.debug('Connected');
  })
  
  client.subscribe('stat/strips/#');
  client.subscribe('declare');
  
  client.on('message', async (topic, payload) => {
    logger.debug(`${topic} got ${payload}`);
    var tokens = topic.split("/");
    if (tokens[0] == 'declare')
      await handleDiscovered(payload);
    if (tokens[3] == 'powerState'){
      devs[tokens[1]][tokens[2]]['lastAlive'] = Date.now();
      devs[tokens[1]][tokens[2]]['powerState'] = payload;
    }
  })
}

async function initDevs() {
  var types = await db.getTypes();

  types.forEach(function(type, idx){
    devs[type['name']] = {};
  });
  
  await saveDevsLocal();
}

async function saveDevsLocal() {
  var retDevs = await db.getAllDevs();
  retDevs.forEach(function(dev, idx){
    devs[dev['type']][dev['id']] = dev;
  });
}

function updateStripLocal(device, param, value) {
  devs[device['type']][device['id']][param] = value;
}

async function probeDevs()
{
  this.client.publish("stat/global/all/powerState", null);
}

async function handleDiscovered(payload)
{
  var vals = JSON.parse(payload);
  if (db.devExists(vals['id'])){
    if (vals['type'] == 'strips'){
      var dbValsPromise = db.getStrip(vals['id']);
      console.log(`${vals['id']} Exists`);
      var dbVals = await dbValsPromise;
      var key_arr = Object.keys(dbVals);
      key_arr.forEach(function(paramName, idx){
        if (dbVals[paramName] != vals[paramName]){
          console.log(`${paramName} in database it is ${dbVals[paramName]} but ${vals[paramName]} on device`)
          setParamLights(vals['id'], paramName, String(dbVals[paramName]));
        }
      });
    }
  }
  else {
    if (vals['type'] == 'strips'){
      await this.saveStripDB(vals);
    }
  }
  devs[vals['type']][vals['id']] = vals;
  devs[vals['type']][vals['id']]['lastAlive'] = Date.now();
  console.log("Handled");
} 

async function setParamLights(device, param, value)
{
  topic = `set/strips/${device}/${param}`;
  client.publish(topic, value);
  await db.updateStripParam(device, param, value);
  updateStripLocal(device, param, value);
}

function getDev(id, type) 
{
  return devs[type][id];
}

function getAllDevs() 
{
  return devs;
}

function getAllStrips() 
{
  return devs['strips'];
}

module.exports = {initializeObj, setParamLights, getAllDevs,
                 getDev, getAllStrips};
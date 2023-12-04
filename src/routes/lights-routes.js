const express = require('express');
const router = express.Router();
const communicator = require('../model/communicator');
const db = require('../model/db');
bodyParser = require('body-parser');


router.post(
    '/set',
    (req, res, next) => {
        var dev = req.body['dev'];
        var param = req.body['param'];
        var value = req.body['value'];

        if (value && param && dev){
            communicator.setParamLights(dev, param, value);
        }
        res.json({
          message: `setted ${value}`,
          user: req.user,
          token: req.query.secret_token
        })
      }
  )

  router.get(
    '/getStrip',
    async (req, res, next) => {
        var dev = req.query.id;
        var retDev = null;
        if (dev){
          retDev = await db.getStrip(dev);
          if (retDev)
            res.json(retDev);
          else
            res.sendStatus(404);
        } else {
          res.sendStatus(400);
        }
      }
  )
  router.get(
    '/getAllDevs',
    async (req, res, next) => {
      retDevs = await communicator.getAllDevs();
      if (retDevs)
        res.json(retDevs);
      else
        res.sendStatus(404);
    }
  )
  router.get(
    '/getAllStrips',
    async (req, res, next) => {
      retDevs = await communicator.getAllStrips();
      if (retDevs)
        res.json(retDevs);
      else
        res.sendStatus(404);
    }
  )


  module.exports = router;
  

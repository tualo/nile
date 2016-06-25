(function() {
  var Geocoords, Sheeter, Template, express, fs, path, router, sass;

  express = require('express');

  router = express.Router();

  path = require('path');

  fs = require('fs');

  sass = require('node-sass');

  Template = require('tualo-template');

  Geocoords = require('geocoords');

  Sheeter = require('sheeter').Sheeter;

  router.post('/check', function(req, res) {
    var city, district, postal_code, sql, street;
    debug('streets', 'check');
    debug('streets', req.body.postal_code);
    debug('streets', req.body.street);
    debug('streets', req.body.city);
    debug('streets', req.body.district);
    postal_code = req.body.postal_code || "";
    street = req.body.street || "";
    city = req.body.city || "";
    district = req.body.district || "";
    sql = 'select * from streetlist where postal_code = $1 street = $2 city = $3 district = $4';
    return req.gisdb.query(sql, [postal_code, street, city, district], function(err, result) {
      var sendResult;
      sendResult = {
        success: false,
        msg: ""
      };
      if (result.rows.length === 0) {
        sendResult.msg = "no results";
        return res.json(sendResult);
      } else if (result.rows.length === 1) {
        sendResult.data = result.rows[0];
        sendResult.success = true;
        return res.json(sendResult);
      } else {
        sendResult.data = result.rows;
        sendResult.msg = "more than one result";
        return res.json(sendResult);
      }
    });
  });

  module.exports = router;

}).call(this);

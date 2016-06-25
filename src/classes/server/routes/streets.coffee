# route for express

express = require 'express'
router = express.Router()
path = require 'path'
fs = require 'fs'
sass = require 'node-sass'
Template = require 'tualo-template'
Geocoords = require 'geocoords'
{Sheeter} = require 'sheeter'

router.post '/check', (req,res) ->

  debug 'streets','check'
  debug 'streets', req.body.postal_code
  debug 'streets', req.body.street
  debug 'streets', req.body.city
  debug 'streets', req.body.district

  postal_code = req.body.postal_code || ""
  street = req.body.street || ""
  city = req.body.city || ""
  district = req.body.district || ""

  sql = '
  select
    *
  from
    streetlist
  where
    postal_code = $1
    street = $2
    city = $3
    district = $4
  '
  req.gisdb.query sql, [postal_code,street,city,district], (err,result) ->
    sendResult =
      success: false
      msg: ""
    if result.rows.length == 0
      sendResult.msg = "no results"
      res.json sendResult
    else if result.rows.length == 1
      sendResult.data = result.rows[0]
      sendResult.success = true
      res.json sendResult
    else
      sendResult.data = result.rows
      sendResult.msg = "more than one result"
      res.json sendResult

module.exports = router

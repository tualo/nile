colors = require "colors"
global.logDebug = process.env.log_debug != "0"
global.logInfo = process.env.log_info != "0"
global.logWarn = process.env.log_warn != "0"
global.logError = process.env.log_error != "0"


global.debug = (tag,msg,data) ->
  if global.logDebug == true
    console.log colors.gray( (new Date().toISOString().substring(0,16))), colors.blue('debug'),colors.gray(tag),msg
global.info = (tag,msg) ->
  if global.logInfo == true
    console.log colors.gray( (new Date().toISOString().substring(0,16))),colors.green('info'),colors.gray(tag),msg
global.warn = (tag,msg) ->
  if global.logWarn == true
    console.log colors.gray( (new Date().toISOString().substring(0,16))),colors.yellow('warning'),colors.gray(tag),msg
global.error = (tag,msg) ->
  if global.logError == true
    console.log colors.gray( (new Date().toISOString().substring(0,16))),colors.red('error'),colors.gray(tag),msg


classNames = [
  'Install'
]

exp = (name) ->
  exports[name] = require './classes/'+name.toLowerCase()
( exp(name) for name in classNames)

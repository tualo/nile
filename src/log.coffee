colors = require "colors"
global.logDebug = process.env.tom_log_debug != "0"
global.logInfo = process.env.tom_log_info != "0"
global.logWarn = process.env.tom_log_warn != "0"
global.logError = process.env.tom_log_error != "0"

error: (tag,remaining...) ->
  options = remaining.join(' ')
  console.error tag, options

warn: (tag,remaining...) ->
  options = remaining.join(' ')
  console.error tag, options

info: (tag,remaining...) ->
  options = remaining.join(' ')
  console.error tag, options

debug: (tag,remaining...) ->
  options = remaining.join(' ')
  console.error tag, options


global.debug = (tag,remaining...) ->
  if global.logDebug == true
    options = remaining.join(' ')
    console.log colors.gray( (new Date()).toISOString().substring(0,19) ), colors.blue('debug'),colors.gray(tag),options
global.info = (tag,remaining...) ->
  if global.logInfo == true
    options = remaining.join(' ')
    console.log colors.gray( (new Date()).toISOString().substring(0,19) ), colors.green('info'),colors.gray(tag),options
global.warn = (tag,remaining...) ->
  if global.logWarn == true
    options = remaining.join(' ')
    console.log colors.gray( (new Date()).toISOString().substring(0,19) ), colors.yellow('warning'),colors.gray(tag),options
global.error = (tag,remaining...) ->
  if global.logError == true
    options = remaining.join(' ')
    console.log colors.gray( (new Date()).toISOString().substring(0,19) ), colors.red('error'),colors.gray(tag),options

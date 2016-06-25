(function() {
  var colors,
    slice = [].slice;

  colors = require("colors");

  global.logDebug = process.env.tom_log_debug !== "0";

  global.logInfo = process.env.tom_log_info !== "0";

  global.logWarn = process.env.tom_log_warn !== "0";

  global.logError = process.env.tom_log_error !== "0";

  ({
    error: function() {
      var options, remaining, tag;
      tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      options = remaining.join(' ');
      return console.error(tag, options);
    },
    warn: function() {
      var options, remaining, tag;
      tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      options = remaining.join(' ');
      return console.error(tag, options);
    },
    info: function() {
      var options, remaining, tag;
      tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      options = remaining.join(' ');
      return console.error(tag, options);
    },
    debug: function() {
      var options, remaining, tag;
      tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      options = remaining.join(' ');
      return console.error(tag, options);
    }
  });

  global.debug = function() {
    var options, remaining, tag;
    tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    if (global.logDebug === true) {
      options = remaining.join(' ');
      return console.log(colors.gray((new Date()).toISOString().substring(0, 19)), colors.blue('debug'), colors.gray(tag), options);
    }
  };

  global.info = function() {
    var options, remaining, tag;
    tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    if (global.logInfo === true) {
      options = remaining.join(' ');
      return console.log(colors.gray((new Date()).toISOString().substring(0, 19)), colors.green('info'), colors.gray(tag), options);
    }
  };

  global.warn = function() {
    var options, remaining, tag;
    tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    if (global.logWarn === true) {
      options = remaining.join(' ');
      return console.log(colors.gray((new Date()).toISOString().substring(0, 19)), colors.yellow('warning'), colors.gray(tag), options);
    }
  };

  global.error = function() {
    var options, remaining, tag;
    tag = arguments[0], remaining = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    if (global.logError === true) {
      options = remaining.join(' ');
      return console.log(colors.gray((new Date()).toISOString().substring(0, 19)), colors.red('error'), colors.gray(tag), options);
    }
  };

}).call(this);

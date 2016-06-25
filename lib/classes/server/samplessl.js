(function() {
  var EventEmitter, SampleSSL, Template, exec, fs, openSSLConfigFile, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs');

  exec = require('child_process').exec;

  EventEmitter = require('events').EventEmitter;

  Template = require('tualo-template');

  openSSLConfigFile = "# OpenSSL configuration to generate a new key with signing requst for a x509v3\n# multidomain certificate\n#\n# openssl req -config bla.cnf -new | tee csr.pem\n# or\n# openssl req -config bla.cnf -new -out csr.pem\n[ req ]\ndefault_bits       = 4096\ndefault_md         = sha512\ndefault_keyfile    = key.pem\nprompt             = no\nencrypt_key        = no\n\n# base request\ndistinguished_name = req_distinguished_name\n\n# distinguished_name\n[ req_distinguished_name ]\ncountryName            = \"{country_code}\"  # C=\nstateOrProvinceName    = \"{state}\"         # ST=\nlocalityName           = \"{locality}\"      # L=\npostalCode             = \"{zipCode}\"       # L/postalcode=\nstreetAddress          = \"{street}\"        # L/street=\norganizationName       = \"{organization}\"  # O=\norganizationalUnitName = \"{unit}\"          # OU=\ncommonName             = \"{comman_name}\"   # CN=\nemailAddress           = \"{email_address}\" # CN/emailAddress=";

  module.exports = SampleSSL = (function(superClass) {
    extend(SampleSSL, superClass);

    function SampleSSL(config) {
      this.config = config;
      if (this.config.https.cert == null) {
        this.config.https.cert = {
          country_code: "DE",
          state: "servertest",
          organization: "servertest",
          comman_name: "localhost",
          unit: "servertest unit",
          locality: "local",
          zipCode: "00000",
          street: "local",
          email_address: "admin@localhost"
        };
      }
      this.debugMode = false;
    }

    SampleSSL.prototype.run = function() {
      if (this.config.https.active) {
        if (this.config.https.credentials != null) {
          return this.emit('done', true);
        } else {
          this.config.https.credentials = {
            key: path.join(this.getTemp(), 'server.key'),
            cert: path.join(this.getTemp(), 'server.crt')
          };
          return this.generate();
        }
      } else {
        return this.emit('done', true);
      }
    };

    SampleSSL.prototype.getTemp = function() {
      return "/tmp";
    };

    SampleSSL.prototype.generate = function() {
      var cnfFile, csrdata;
      csrdata = (new Template(openSSLConfigFile)).render(this.config.https.cert);
      cnfFile = path.join(this.getTemp(), "server.cnf");
      return fs.writeFile(cnfFile, csrdata, (function(_this) {
        return function(err) {
          var cmd, opt, options, proc;
          if (err) {
            return _this.emit('error', err);
          } else {
            opt = {
              csr: path.join(_this.getTemp(), "server.csr"),
              key: _this.config.https.credentials.key,
              cnf: cnfFile,
              crt: _this.config.https.credentials.cert
            };
            cmd = (new Template("openssl req -nodes -config {cnf} -new -x509 -keyout {key} -out {crt}")).render(opt);
            options = {
              cwd: process.cwd()
            };
            proc = exec(cmd, options, function(err, stdout, stderr) {
              if (err) {
                return _this.emit('error', err);
              } else {
                _this.config.https.credentials.key = opt.key;
                _this.config.https.credentials.cert = opt.crt;
                return _this.emit('done', true);
              }
            });
            return proc.on('error', function(e) {
              return console.log(e);
            });
          }
        };
      })(this));
    };

    return SampleSSL;

  })(EventEmitter);

}).call(this);

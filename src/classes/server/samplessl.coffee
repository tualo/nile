path     = require 'path'
fs     = require 'fs'
{exec}  = require 'child_process'
{EventEmitter} = require 'events'
Template = require 'tualo-template'

openSSLConfigFile = """
# OpenSSL configuration to generate a new key with signing requst for a x509v3
# multidomain certificate
#
# openssl req -config bla.cnf -new | tee csr.pem
# or
# openssl req -config bla.cnf -new -out csr.pem
[ req ]
default_bits       = 4096
default_md         = sha512
default_keyfile    = key.pem
prompt             = no
encrypt_key        = no

# base request
distinguished_name = req_distinguished_name

# distinguished_name
[ req_distinguished_name ]
countryName            = "{country_code}"  # C=
stateOrProvinceName    = "{state}"         # ST=
localityName           = "{locality}"      # L=
postalCode             = "{zipCode}"       # L/postalcode=
streetAddress          = "{street}"        # L/street=
organizationName       = "{organization}"  # O=
organizationalUnitName = "{unit}"          # OU=
commonName             = "{comman_name}"   # CN=
emailAddress           = "{email_address}" # CN/emailAddress=
"""

module.exports =
class SampleSSL extends EventEmitter
  constructor: (config) ->
    @config = config

    if not @config.https.cert?
      @config.https.cert =
        country_code: "DE"
        state: "servertest"
        organization: "servertest"
        comman_name: "localhost"
        unit: "servertest unit"
        locality: "local"
        zipCode: "00000"
        street: "local"
        email_address: "admin@localhost"
      #console.log @config.https.cert


    @debugMode = false
  run: ()->
    if @config.https.active
      if @config.https.credentials?
        @emit 'done', true
      else
        @config.https.credentials =
          key: path.join @getTemp(), 'server.key'
          cert: path.join @getTemp(), 'server.crt'
        @generate()
    else
      @emit 'done', true
  getTemp: () ->
    "/tmp"
  generate: () ->
    #openssl req -new -key server.key -out server.csr
    csrdata = (new Template(openSSLConfigFile)).render(@config.https.cert)
    cnfFile = path.join(@getTemp(), "server.cnf")
    fs.writeFile cnfFile, csrdata, (err) =>
      if err
        @emit 'error', err
      else
        opt =
          csr: path.join(@getTemp(), "server.csr")
          key: @config.https.credentials.key
          cnf: cnfFile
          crt: @config.https.credentials.cert
        cmd = (new Template("openssl req -nodes -config {cnf} -new -x509 -keyout {key} -out {crt}")).render(opt)
        options =
          cwd: process.cwd()
        proc = exec cmd, options, (err,stdout,stderr) =>
          if err
            @emit 'error', err
          else
            @config.https.credentials.key = opt.key
            @config.https.credentials.cert = opt.crt
            #console.log @config.https
            @emit 'done', true
        proc.on 'error', (e)->
          console.log e

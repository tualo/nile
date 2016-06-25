{EventEmitter} = require 'events'
{spawn} = require 'child_process'
fs = require 'fs'
os = require 'os'
path = require 'path'
Template = require 'tualo-template'

module.exports =
class STemplate extends EventEmitter
  @startstop: (data) ->
    lines = data.split "\n"
    res = []
    state = 0
    for line in lines
      if line == '-- start'
        state = 1
      if line == '-- end'
        state = 0
      if res.length > 0 and res[res.length-1].state == state
        res[res.length-1].txt += "\n"
        res[res.length-1].txt += line
      else
        opt =
          state: state
          txt: line
        res.push opt
    res
  @render: (options,data) ->
    template = new Template data
    obj =
      'www-user': 'www-data',
      'modulepath': if options['modulepath'] then options['modulepath'] else '' ,
      'ts:address-data': if options['addressData'] then 'TABLESPACE "'+options['addressData']+'"' else '',
      'ts:address-index': if options['addressIndex'] then 'TABLESPACE "'+options['addressIndex']+'"' else '',
      'ts:search-data': if options['searchData'] then 'TABLESPACE "'+options['searchData']+'"' else '',
      'ts:search-index': if options['searchIndex'] then 'TABLESPACE "'+options['searchIndex']+'"' else ''
      'ts:aux-data': if options['auxIndex'] then 'TABLESPACE "'+options['auxIndex']+'"' else ''
      'ts:aux-index': if options['auxData'] then 'TABLESPACE "'+options['auxData']+'"' else ''


    txt = template.render(obj)
    res = []
    if typeof options['partitions']=='object'
      r = /--\sstart.*?--\send/g
      m = STemplate.startstop txt
      for s in m
        if s.state == 0
          res.push s.txt
        else
          (res.push(s.txt.replace(/-partition-/g,row.partition) ) for row in options['partitions'])

    res.join("\n")

path = require 'path'
fs = require 'fs'
{EventEmitter} = require 'events'
Template = require 'tualo-template'

module.exports =
class Geocode extends EventEmitter
  constructor: (db) ->
    @db = db
    @langPrefOrder = []
    @includeAddressDetails = false
    @includePolygonAsText = false
    @includePolygonAsPoints = false
    @includePolygonAsGeoJSON = false
    @includePolygonAsKML = false
    @includePolygonAsSVG = false
    @includePolygonAsPoints = false
    @polygonSimplificationThreshold = 0.0
    @excludePlaceIDs = []
    @deDupe = true
    @reverseInPlan = false
    @limit = 20
    @finalLimit = 10
    @offset = 0
    @fallback = false
    @countryCodes = false
    @nearPoint = false
    @boundedSearch = false
    @viewBox = [0,0,0,0]
    @viewboxSmallSQL = false
    @viewboxLargeSQL = false
    @routePoints = false
    @maxRank = 20
    @minAddressRank = 0
    @maxAddressRank = 30
    @addressRankList =[]
    @exactMatchCache = []
    @allowedTypesSQLList = false
    @query = false
    @structuredQuery = {}
    @aPlaceID = []

  setReverseInPlan: (val) ->
    @reverseInPlan = val
  setLanguagePreference: (val) ->
    @langPrefOrder = val
  setIncludeAddressDetails: (val) ->
    if typeof val=='undefined'
      val = true
    @includeAddressDetails = val
  getIncludeAddressDetails: () ->
    @includeAddressDetails

  setIncludePolygonAsPoints: (val) ->
    if typeof val=='undefined'
      val = true
    @includePolygonAsPoints = val
  getIncludePolygonAsPoints: () ->
    @includePolygonAsPoints

  setIncludePolygonAsText: (val) ->
    if typeof val=='undefined'
      val = true
    @includePolygonAsText = val
  getIncludePolygonAsText: () ->
    @includePolygonAsText

  setIncludePolygonAsJSON: (val) ->
    if typeof val=='undefined'
      val = true
    @includePolygonAsJSON = val
  getIncludePolygonAsJSON: () ->
    @includePolygonAsJSON

  setIncludePolygonAsKML: (val) ->
    if typeof val=='undefined'
      val = true
    @includePolygonAsKML = val
  getIncludePolygonAsKML: () ->
    @includePolygonAsKML

  setIncludePolygonAsSVG: (val) ->
    if typeof val=='undefined'
      val = true
    @includePolygonAsSVG = val
  getIncludePolygonAsSVG: () ->
    @includePolygonAsSVG

  setPolygonSimplificationThreshold: (val) ->
    @polygonSimplificationThreshold = val
  getPolygonSimplificationThreshold: () ->
    @polygonSimplificationThreshold

  setDeDupe: (val) ->
    if typeof val=='undefined'
      val = true
    @deDupe = val
  getDeDupe: () ->
    @deDupe

  setLimit: (val) ->
    if typeof val=='undefined'
      val = 10
    if val < 1
      val = 1
    if val > 50
      val = 50
    @finalLimit = val
    @limit = @finalLimit + Math.min(@finalLimit,10)
  getLimit: () ->
    @limit
  getFinalLimit: () ->
    @finalLimit
  setOffset: (val) ->
    @offset = val
  getOffet: () ->
    @offset


  setFallback: (val) ->
    if typeof val=='undefined'
      val = true
    @fallback = val
  getFallback: () ->
    @fallback

  setExcludedPlaceIDs: (val) ->
    @excludePlaceIDs = []
    (@excludePlaceIDs.push(v) for v in val when not isNaN(v))
  getExcludedPlaceIDs: () ->
    @excludePlaceIDs

  setBounded: (val) ->
    if typeof val=='undefined'
      val = true
    @boundedSearch = val
  getBounded: () ->
    @boundedSearch

  setViewBox: (fLeft, fBottom, fRight, fTop) ->
    fLeft = parseFloat fLeft
    fBottom = parseFloat fBottom
    fRight = parseFloat fRight
    fTop = parseFloat fTop
    @viewBox = [fLeft, fBottom, fRight, fTop]
  getViewBoxString: () ->
    v = @viewBox[0]+'.'+@viewBox[3]+'.'+@viewBox[2]+'.'+@viewBox[1]
    v
  setRoute: (val) ->
    if typeof val=='undefined'
      val = true
    @routePoints = val
  getRoute: () ->
    @routePoints
  setFeatureType: (featureType) ->
    if featureType=='country'
      @setRankRange 4, 4
    if featureType=='state'
      @setRankRange 8, 8
    if featureType=='city'
      @setRankRange 14, 16
    if featureType=='settlement'
      @setRankRange 8, 20
  setRankRange: (min,max) ->
    @minAddressRank = parseInt min
    @maxAddressRank = parseInt max
  setNearPoint: (nearPoint, radiusDeg)->
    if typeof radiusDeg=='undefined'
      radiusDeg = 0.1
    @nearPoint = [ parseFloat(nearPoint[0]), parseFloat(nearPoint[1]), parseFloat(radiusDeg) ]
  setCountryCodesList: (list) ->
    @countryCodes = list
  setQuery: (query) ->
    @query = query
    @structuredQuery = false
  getQueryString: () ->
    @query
  loadParamArray: (options) ->
    if options.addressdetails
      @setIncludeAddressDetails options.addressdetails
    if options.bounded
      @setBounded options.bounded
    if options.dedupe
      @setDeDupe options.dedupe
    if options.limit
      @setLimit options.limit
    if options.offset
      @setOffset options.offset
    if options.fallback
      @setFallback options.fallback
    if options.exclude_place_ids
      @setExcludedPlaceIDs options.exclude_place_ids.split(',')
    if options.featureType
      @setFeatureType options.featureType
    if options.countrycodes
      @setCountryCodesList options.countrycodes.split(',')
    if options.viewboxlbrt
      v = options.viewboxlbrt.split ','
      @setViewBox v[0],v[1],v[2],v[3]
    if options.viewbox
      v = options.viewbox.split ','
      @setViewBox v[0],v[3],v[2],v[1]
    if options.route and options.routewidth
      v = options.route.split ','
      if v.length % 2 == 0
        prevCoord = false
        route = []
        for p in v
          if i % 2 == 1
            route.push [p,prevCoord]
          else
            prevCoord = p
        @setRoutePoints route
        setQueryFromParams
      else
        @emit 'error', 'uneven route point number'

  setQueryFromParams: (options) ->
    if options.q
      @setQuery(options.q)
    else
      @setStructuredQuery options['amenity'], options['street'], options['city'], options['county'], options['state'], options['country'], options['postalcode']
      @setReverseInPlan false
  loadStructuredAddressElement: (value,key,min,max,list) ->
    result = false
    if value
      value = value.trim()
      @structuredQuery[key] = value
      if @minAddressRank==0 and @maxAddressRank==30
        @minAddressRank = min
        @maxAddressRank = max
      if options.list
        @addressRankList = @addressRankList.concat list
      result = true
    result
  setStructuredQuery: (amentiy = false, street = false, city = false, county = false, state = false, country = false, postalCode = false) ->
    @query = false
    @minAddressRank = 0
    @maxAddressRank = 30
    @addressRankList = []
    @structuredQuery = {}
    @allowedTypesSQLList = ''
    @loadStructuredAddressElement(amentiy, 'amenity', 26, 30, false)
    @loadStructuredAddressElement(street, 'street', 26, 30, false)
    @loadStructuredAddressElement(city, 'city', 14, 24, false)
    @loadStructuredAddressElement(county, 'county', 9, 13, false)
    @loadStructuredAddressElement(state, 'state', 8, 8, false)
    @loadStructuredAddressElement(postalCode, 'postalcode' , 5, 11, [5, 11])
    @loadStructuredAddressElement(country, 'country', 4, 4, false)

    if Object.keys(@structuredQuery).length > 0
      for name of @structuredQuery
        if @query!=false
          @query += ', '
        @query += name
      if @maxAddressRank < 30
        @allowedTypesSQLList = '(\'place\',\'boundary\')'

  fallbackStructuredQuery: () ->
    result = false
    if @structuredQuery==false
      result = false
    else
      if Object.keys(@structuredQuery).length > 1
        orderToFallback = ['postalcode', 'street', 'city', 'county', 'state']
        for type in orderToFallback
          if @structuredQuery[type]
            @setStructuredQuery(@structuredQuery['amenity'], @structuredQuery['street'], @structuredQuery['city'], @structuredQuery['county'], @structuredQuery['state'], @structuredQuery['country'], @structuredQuery['postalcode'])
            result = true
      else
        result = false
    result
  escapeString: (str) ->
    str
  getQuoted: (list) ->
    result = []
    (result.push('\''+@escapeString(item)+'\'') for item in list)
    result
  getNumbers: (list) ->
    result = []
    (result.push(parseInt(item)) for item in list)
    result
  getDetails: (ids) ->
    @currentIDS = ids
    fs.readFile path.join(__dirname,'..','..','sql','query','templates','detail.sql'), (err,data) => @onLoadDetailScript(err,data)
  onLoadDetailScript: (err,data) ->
    quotedPref = @getQuoted @langPrefOrder
    languagePrefArraySQL = 'ARRAY['+quotedPref+']'
    placeIDs = @getNumbers @currentIDS
    importanceSQL = ''
    if @viewboxSmallSQL!=false
      importanceSQL += ' case when ST_Contains('+@viewboxSmallSQL+', ST_Collect(centroid)) THEN 1 ELSE 0.75 END * '
    if @viewboxLargeSQL!=false
      importanceSQL += ' case when ST_Contains('+@viewboxLargeSQL+', ST_Collect(centroid)) THEN 1 ELSE 0.75 END * '

    template = new Template data.toString('utf-8')
    template.ctx.def 'compare',(a,b)->
      a==b
    template.ctx.def 'between',(v,a,b)->
      v>=a and v<=b
    template.ctx.def 'isset',(a)->
      result = false
      if typeof a=='object' and a.length>0
        result = true
      if typeof a=='string'
        result = true
      result
    template.ctx.def 'istrue',(a)->
      result = false
      if a==true
        result = true
      result
    options =
      languagePrefArraySQL: languagePrefArraySQL
      placeIDs: placeIDs.join(', ')
      importanceSQL: importanceSQL
      minAddressRank: @minAddressRank
      maxAddressRank: @maxAddressRank
      allowedTypesSQLList: @allowedTypesSQLList
      addressRankList: @addressRankList.join(','),
      gDeDupe: if @getDeDupe() then ',place_id' else ''

    sql = template.render options
    @db.query sql, (err,results) => @onGetDetails(err,results)
  onGetDetails: (err,results) ->
    if err
      @emit 'error', err
    else
      @emit 'details', results




  getDBQuotedArray: (a) ->
    res = []
    (res.push(el) for el in a)
    res
  lookup: () ->
    sLanguagePrefArraySQL = 'ARRAY['+(@getQuoted(@langPrefOrder)).join(',')+']'
    sPlaceIDs = @aPlaceID.join(',')
    sImportanceSQL = ''
    if @sViewboxSmallSQL
      sImportanceSQL +=" case when ST_Contains("+@sViewboxSmallSQL+", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * "
    if @sViewboxLargeSQL
      sImportanceSQL +=" case when ST_Contains("+@sViewboxLargeSQL+", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * "
    aAddressRankList = [] # fix me
    sAddressRankList = aAddressRankList.join(',')

    sSQL = """
      select
        osm_type,
        osm_id,
        class,
        type,
        admin_level,
        rank_search,
        rank_address,
        min(place_id) as place_id,
        min(parent_place_id) as parent_place_id,
        calculated_country_code as country_code,
        get_address_by_language(place_id, {sLanguagePrefArraySQL}) as langaddress,
        get_name_by_language(name, {sLanguagePrefArraySQL}) as placename,
        get_name_by_language(name, ARRAY['ref']) as ref,
        <if term="istrue(bIncludeExtraTags)">
        hstore_to_json(extratags)::text as extra,
        </if>
        <if term="istrue(bIncludeNameDetails)">
        hstore_to_json(name)::text as names,
        </if>
        avg(ST_X(centroid)) as lon,avg(ST_Y(centroid)) as lat,
        {sImportanceSQL}coalesce(importance,0.75-(rank_search::float/40)) as importance,
        (select max(p.importance*(p.rank_address+2)) from place_addressline s, placex p where s.place_id = min(CASE WHEN placex.rank_search < 28 THEN placex.place_id ELSE placex.parent_place_id END) and p.place_id = s.address_place_id and s.isaddress and p.importance is not null) as addressimportance,
        (extratags->'place') as extra_place
      from placex where place_id in ({sPlaceIDs})
        and (
          placex.rank_address between {iMinAddressRank} and {iMaxAddressRank}
          <if term="between(14,iMinAddressRank,iMaxAddressRank)">
          OR (extratags->'place') = 'city'
          </if>
          <if term="isset(aAddressRankList)">
          OR placex.rank_address in ({sAddressRankList})
          </if>
        )
        <if term="isset(sAllowedTypesSQLList)">
          and placex.class in {sAllowedTypesSQLList}
        </if>
        and linked_place_id is null
      group by
        osm_type,
        osm_id,
        class,
        type,
        admin_level,
        rank_search,
        rank_address,
        calculated_country_code,
        importance,
        <if term="istrue(bDeDupe)">
          place_id,
        </if>
        langaddress,
        placename,
        ref,
        <if term="istrue(bIncludeExtraTags)">
        extratags,
        </if>
        <if term="istrue(bIncludeNameDetails)">
         name,
        </if>
        extratags->'place'
    """
    template = new Template sSQL
    template.ctx.def 'compare',(a,b)->
      a==b
    template.ctx.def 'between',(v,a,b)->
      v>=a and v<=b
    template.ctx.def 'isset',(a)->
      result = false
      if typeof a=='object' and a.length>0
        result = true
      if typeof a=='string'
        result = true
      result
    template.ctx.def 'istrue',(a)->
      result = false
      if a==true
        result = true
      result
    sql = template.render @
    console.log sql

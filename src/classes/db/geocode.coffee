{EventEmitter} = require 'events'
Template = require 'tualo-template'

module.exports =
class Geocode extends EventEmitter
  constructor: (options) ->
    @db = options.db
    @acceptedLanguages = ['de']

    @aPlaceID=[]

    @bReverseInPlan = false
    @bIncludeNameDetails = false
    @bIncludeAddressDetails = false
    @bIncludeExtraTags = false

    @bIncludePolygonAsPoints = false
    @bIncludePolygonAsText = false
    @bIncludePolygonAsGeoJSON = false
    @bIncludePolygonAsKML = false
    @bIncludePolygonAsSVG = false
    @fPolygonSimplificationThreshold = 0.0

    @aExcludePlaceIDs = []
    @bDeDupe = true
    @bReverseInPlan = false


    @iLimit = 20
    @iFinalLimit = 10
    @iOffset = 0
    @bFallback = false

    @bBoundedSearch = false
    @aViewBox = false
    @sViewboxSmallSQL = false
    @sViewboxLargeSQL = false
    @aRoutePoints = false


    @iMaxRank = 20
    @iMinAddressRank = 0
    @iMaxAddressRank = 30
    @aAddressRankList = []
    @exactMatchCache = []

    @sAllowedTypesSQLList = false

    @sQuery = false
    @aStructuredQuery = false


  setLanguagePreference: (acceptedLanguages) ->
    @acceptedLanguages = acceptedLanguages
  setReverseInPlan: (bReverseInPlan) ->
    @bReverseInPlan = bReverseInPlan
  setIncludeAddressDetails: (bIncludeAddressDetails) ->
    @bIncludeAddressDetails = bIncludeAddressDetails
  getIncludeAddressDetails: () ->
    @bIncludeAddressDetails
  getIncludeExtraTags: () ->
    @bIncludeAddressDetails
  getIncludeNameDetails: () ->
    @bIncludeNameDetails

  setIncludePolygonAsPoints: (bIncludePolygonAsPoints) ->
    @bIncludePolygonAsPoints = bIncludePolygonAsPoints
  getIncludePolygonAsPoints: () ->
    @bIncludePolygonAsPoints

  setIncludePolygonAsText: (bIncludePolygonAsText) ->
    @bIncludePolygonAsText = bIncludePolygonAsText
  getIncludePolygonAsText: () ->
    @bIncludePolygonAsText

  setIncludePolygonAsGeoJSON: (bIncludePolygonAsGeoJSON) ->
    @bIncludePolygonAsGeoJSON = bIncludePolygonAsGeoJSON
  getIncludePolygonAsGeoJSON: () ->
    @bIncludePolygonAsGeoJSON

  setIncludePolygonAsKML: (bIncludePolygonAsKML) ->
    @bIncludePolygonAsKML = bIncludePolygonAsKML
  getIncludePolygonAsKML: () ->
    @bIncludePolygonAsKML

  setIncludePolygonAsSVG: (bIncludePolygonAsSVG) ->
    @bIncludePolygonAsSVG = bIncludePolygonAsSVG
  getIncludePolygonAsSVG: () ->
    @bIncludePolygonAsSVG

  setPolygonSimplificationThreshold: (fPolygonSimplificationThreshold) ->
    @fPolygonSimplificationThreshold = fPolygonSimplificationThreshold
  getPolygonSimplificationThreshold: () ->
    @fPolygonSimplificationThreshold

  setDeDupe: (bDeDupe) ->
    @bDeDupe = bDeDupe
  getDeDupe: () ->
    @bDeDupe

  setLimit: (iLimit) ->
    if iLimit > 50
      iLimit = 50
    if iLimit < 1
      iLimit = 1
    @iFinalLimit = iLimit
    @iLimit = @iFinalLimit + Math.min(@iFinalLimit, 10)
  getLimit: () ->
    @iLimit
  getFinalLimit: () ->
    @iFinalLimit

  setOffset: (iOffset) ->
    @iOffset = iOffset
  getOffset: () ->
    @iOffset

  setFallback: (bFallback) ->
    @bFallback = bFallback
  getFallback: () ->
    @bFallback

  setExcludedPlaceIDs: (a) ->
    ids = []
    (ids.push(parseInt(el)) for el in a)
    @aExcludePlaceIDs = ids
  getExcludedPlaceIDs: () ->
    @aExcludePlaceIDs

  setBounded: (bBoundedSearch=true) ->
    @bBoundedSearch = bBoundedSearch
  getBounded: () ->
    @bBoundedSearch

  setViewBox: (left,bottom,right,top) ->
    @aViewBox = [left,bottom,right,top]
  getViewBox: () ->
    @aViewBox
  getViewBoxString: () ->
    if @aViewBox==false
      null
    else
      [@aViewBox[0],@aViewBox[3],@aViewBox[2],@aViewBox[1]].join(',')

  setRoute: (aRoutePoints) ->
    @aRoutePoints = aRoutePoints
  getRoute: () ->
    @aRoutePoints

  setFeatureType: (sFeatureType) ->
    if sFeatureType=='country'
      @setRange 4,4
    if sFeatureType=='state'
      @setRange 8,8
    if sFeatureType=='city'
      @setRange 14,16
    if sFeatureType=='settlement'
      @setRange 8,20
  setRankRange: (min,max) ->
    @iMinAddressRank = min
    @iMaxAddressRank = max

  setNearPoint: (aNearPoint,fRadiusDeg = 0.1)->
    @aNearPoint = [parseFloat(aNearPoint[0]),parseFloat(aNearPoint[1]),parseFloat(fRadiusDeg)]

  setCountryCodesList: (list) ->
    @countryCodes = list

  setQuery: (query) ->
    @query = query

  escapeString: (str) ->
    str
  getQuoted: (list) ->
    result = []
    (result.push('\''+@escapeString(item)+'\'') for item in list)
    result
  loadParamArray: (params) ->
    if typeof params['addressdetails']
      @setIncludeAddressDetails params['addressdetails']

  lookup: () ->
    sLanguagePrefArraySQL = 'ARRAY['+(@getQuoted(@acceptedLanguages)).join(',')+']'
    sPlaceIDs = @aPlaceID.join(',')
    sImportanceSQL = ''
    if @sViewboxSmallSQL
      sImportanceSQL +=" case when ST_Contains("+@sViewboxSmallSQL+", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * "
    if @sViewboxLargeSQL
      sImportanceSQL +=" case when ST_Contains("+@sViewboxLargeSQL+", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * "
    sAddressRankList = @aAddressRankList.join(',')

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
    options =
      aAddressRankList: (@aAddressRankList&&@aAddressRankList.length>0)
      sAddressRankList: sAddressRankList
      sPlaceIDs: sPlaceIDs
      sImportanceSQL: sImportanceSQL
      sLanguagePrefArraySQL: sLanguagePrefArraySQL
      bIncludeNameDetails: @bIncludeNameDetails
      bIncludeExtraTags: @bIncludeExtraTags
      sAllowedTypesSQLList: @sAllowedTypesSQLList
      iMinAddressRank: @iMinAddressRank
      iMaxAddressRank: @iMaxAddressRank
      bDeDupe: @bDeDupe

    sql = template.render options
    console.log sql

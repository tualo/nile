
function Nominatim(oDB){
  this.oDB = oDB;
  this.aLangPrefOrder = {};
  this.bIncludeAddressDetails = false;
  this.bIncludePolygonAsPoints = false;
  this.bIncludePolygonAsText = false;
  this.bIncludePolygonAsGeoJSON = false;
  this.bIncludePolygonAsKML = false;
  this.bIncludePolygonAsSVG = false;
  this.aExcludePlaceIDs = {};
  this.bDeDupe = true;
  this.bReverseInPlan = false;
  this.iLimit = 20;
  this.iFinalLimit = 10;
  this.iOffset = 0;
  this.bFallback = false;
  this.aCountryCodes = false;
  this.aNearPoint = false;
  this.bBoundedSearch = false;
  this.aViewBox = false;
  this.sViewboxSmallSQL = false;
  this.sViewboxLargeSQL = false;
  this.aRoutePoints = false;
  this.iMaxRank = 20;
  this.iMinAddressRank = 0;
  this.iMaxAddressRank = 30;
  this.aAddressRankList = {};
  this.exactMatchCache = {};
  this.sAllowedTypesSQLList = false;
  this.sQuery = false;
  this.aStructuredQuery = false;

}

Nominatim.prototype.setReverseInPlan = function(bReverse)
{
  this.bReverseInPlan = bReverse;
}

Nominatim.prototype.setLanguagePreference = function(aLangPref)
{
  this.aLangPrefOrder = aLangPref;
}

Nominatim.prototype.setIncludeAddressDetails = function(bAddressDetails = true)
{
  this.bIncludeAddressDetails = bAddressDetails;
}

Nominatim.prototype.getIncludeAddressDetails = function()
{
  return this.bIncludeAddressDetails;
}

Nominatim.prototype.setIncludePolygonAsPoints = function(b = true)
{
  this.bIncludePolygonAsPoints = b;
}

Nominatim.prototype.getIncludePolygonAsPoints = function()
{
  return this.bIncludePolygonAsPoints;
}

Nominatim.prototype.setIncludePolygonAsText = function(b = true)
{
  this.bIncludePolygonAsText = b;
}

Nominatim.prototype.getIncludePolygonAsText = function()
{
  return this.bIncludePolygonAsText;
}

Nominatim.prototype.setIncludePolygonAsGeoJSON = function(b = true)
{
  this.bIncludePolygonAsGeoJSON = b;
}

Nominatim.prototype.setIncludePolygonAsKML = function(b = true)
{
  this.bIncludePolygonAsKML = b;
}

Nominatim.prototype.setIncludePolygonAsSVG = function(b = true)
{
  this.bIncludePolygonAsSVG = b;
}

Nominatim.prototype.setDeDupe = function(bDeDupe = true)
{
  this.bDeDupe = bDeDupe;
}

Nominatim.prototype.setLimit = function(iLimit = 10)
{
  if (iLimit > 50) iLimit = 50;
  if (iLimit < 1) iLimit = 1;

  this.iFinalLimit = iLimit;
  this.iLimit = this.iFinalLimit + min(this.iFinalLimit, 10);
}

Nominatim.prototype.setOffset = function(iOffset = 0)
{
  this.iOffset = iOffset;
}

Nominatim.prototype.setFallback = function(bFallback = true)
{
  this.bFallback = bFallback;
}

Nominatim.prototype.setExcludedPlaceIDs = function(a)
{
  // TODO: force to int
  this.aExcludePlaceIDs = a;
}

Nominatim.prototype.getExcludedPlaceIDs = function()
{
  return this.aExcludePlaceIDs;
}

Nominatim.prototype.setBounded = function(bBoundedSearch = true)
{
  this.bBoundedSearch = bBoundedSearch;
}

Nominatim.prototype.setViewBox = function(fLeft, fBottom, fRight, fTop)
{
  this.aViewBox = {fLeft, fBottom, fRight, fTop};
}

Nominatim.prototype.getViewBoxString = function()
{
  if (this.aViewBox) return null;
  return this.aViewBox[0]+','+this.aViewBox[3]+','+this.aViewBox[2]+','+this.aViewBox[1];
}

Nominatim.prototype.setRoute = function(aRoutePoints)
{
  this.aRoutePoints = aRoutePoints;
}

Nominatim.prototype.setFeatureType = function(sFeatureType)
{
  (sFeatureType)
  {
    'country'
    this.setRankRange(4, 4);
    break;
    'state'
    this.setRankRange(8, 8);
    break;
    'city'
    this.setRankRange(14, 16);
    break;
    'settlement'
    this.setRankRange(8, 20);
    break;
  }
}

Nominatim.prototype.setRankRange = function(iMin, iMax)
{
  this.iMinAddressRank = iMin;
  this.iMaxAddressRank = iMax;
}

Nominatim.prototype.setNearPoint = function(aNearPoint, fRadiusDeg = )
{
  this.aNearPoint = {aNearPoint[0], aNearPoint[1], fRadiusDeg};
}

Nominatim.prototype.setCountryCodesList = function(aCountryCodes)
{
  this.aCountryCodes = aCountryCodes;
}

Nominatim.prototype.setQuery = function(sQueryString)
{
  this.sQuery = sQueryString;
  this.aStructuredQuery = false;
}

Nominatim.prototype.getQueryString = function()
{
  return this.sQuery;
}


Nominatim.prototype.loadParamArray = function(aParams)
{
  if ((aParams['addressdetails'])) this.bIncludeAddressDetails = aParams['addressdetails'];
  if ((aParams['bounded'])) this.bBoundedSearch = aParams['bounded'];
  if ((aParams['dedupe'])) this.bDeDupe = aParams['dedupe'];

  if ((aParams['limit'])) this.setLimit(aParams['limit']);
  if ((aParams['offset'])) this.iOffset = aParams['offset'];

  if ((aParams['fallback'])) this.bFallback = aParams['fallback'];

  // List of excluded Place IDs - used for more acurate pageing
  if ((aParams['exclude_place_ids']) && aParams['exclude_place_ids']){
    for (var iExcludedPlaceIDVal in aParams) {
      iExcludedPlaceID = aParams[iExcludedPlaceIDVal];
      iExcludedPlaceID = iExcludedPlaceID;
      if (iExcludedPlaceID) aExcludePlaceIDs[iExcludedPlaceID] = iExcludedPlaceID;
    }
    this.aExcludePlaceIDs = aExcludePlaceIDs;
  }

  // Only certain ranks of feature
  if ((aParams['featureType'])) this.setFeatureType(aParams['featureType']);
  if ((aParams['featuretype'])) this.setFeatureType(aParams['featuretype']);

  // Country code list
  if ((aParams['countrycodes'])){
    aCountryCodes = {};
    for (var sCountryCodeVal in aParams) {
      sCountryCode = aParams[sCountryCodeVal];
      if (preg_match('/^[a-zA-Z][a-zA-Z]$/', sCountryCode)){
        aCountryCodes[] = strtolower(sCountryCode);
      }
    }
    this.aCountryCodes = aCountryCodes;
  }

  if ((aParams['viewboxlbrt']) && aParams['viewboxlbrt']){
    aCoOrdinatesLBRT = explode(',',aParams['viewboxlbrt']);
    this.setViewBox(aCoOrdinatesLBRT[0], aCoOrdinatesLBRT[1], aCoOrdinatesLBRT[2], aCoOrdinatesLBRT[3]);
  }else if ((aParams['viewbox']) && aParams['viewbox']){
    aCoOrdinatesLTRB = explode(',',aParams['viewbox']);
    this.setViewBox(aCoOrdinatesLTRB[0], aCoOrdinatesLTRB[3], aCoOrdinatesLTRB[2], aCoOrdinatesLTRB[1]);
  }

  if ((aParams['route']) && aParams['route'] && (aParams['routewidth']) && aParams['routewidth']){
    aPoints = explode(',',aParams['route']);
    if (sizeof(aPoints)  2 != 0){
      userError("Uneven number of points");
      ;
    }
    fPrevCoord = false;
    aRoute = {};
    for (var i in aPoints) {
      fPoint = aPoints[i];
      if (i2){
        aRoute[] = {fPoint, fPrevCoord};
      }
      else{
        fPrevCoord = fPoint;
      }
    }
    this.aRoutePoints = aRoute;
  }
}

Nominatim.prototype.setQueryFromParams = function(aParams)
{
  // Search query
  sQuery = ((aParams['q'])trim(aParams['q'])'');
  if (sQuery){
    this.setStructuredQuery(aParams['amenity'], aParams['street'], aParams['city'], aParams['county'], aParams['state'], aParams['country'], aParams['postalcode']);
    this.setReverseInPlan(false);
  }else{
    this.setQuery(sQuery);
  }
}

Nominatim.prototype.loadStructuredAddressElement = function(sValue, sKey, iNewMinAddressRank, iNewMaxAddressRank, aItemListValues){
  sValue = trim(sValue);
  if (sValue) return false;
  this.aStructuredQuery[sKey] = sValue;
  if (this.iMinAddressRank == 0 && this.iMaxAddressRank == 30){
    this.iMinAddressRank = iNewMinAddressRank;
    this.iMaxAddressRank = iNewMaxAddressRank;
  }
  if (aItemListValues) this.aAddressRankList = array_merge(this.aAddressRankList, aItemListValues);
  return true;
}

Nominatim.prototype.setStructuredQuery = function(sAmentiy = false, sStreet = false, sCity = false, sCounty = false, sState = false, sCountry = false, sPostalCode = false){
  this.sQuery = false;

  // Reset
  this.iMinAddressRank = 0;
  this.iMaxAddressRank = 30;
  this.aAddressRankList = {};

  this.aStructuredQuery = {};
  this.sAllowedTypesSQLList = '';

  this.loadStructuredAddressElement(sAmentiy, 'amenity', 26, 30, false);
  this.loadStructuredAddressElement(sStreet, 'street', 26, 30, false);
  this.loadStructuredAddressElement(sCity, 'city', 14, 24, false);
  this.loadStructuredAddressElement(sCounty, 'county', 9, 13, false);
  this.loadStructuredAddressElement(sState, 'state', 8, 8, false);
  this.loadStructuredAddressElement(sPostalCode, 'postalcode' , 5, 11, {5, 11}};
  this.loadStructuredAddressElement(sCountry, 'country', 4, 4, false);

  if (sizeof(this.aStructuredQuery) > 0){
    this.sQuery = join(', ', this.aStructuredQuery);
    if (this.iMaxAddressRank < 30){
      sAllowedTypesSQLList = '(\'place\',\'boundary\')';
    }
  }
}

Nominatim.prototype.fallbackStructuredQuery = function(){
  if (this.aStructuredQuery) return false;

  aParams = this.aStructuredQuery;

  if (sizeof(aParams) == 1) return false;

  aOrderToFallback = {0:'postalcode', 1:'street', 2:'city', 3:'county', 4:'state'};

  for (var sTypeVal in aOrderToFallback) {
    sType = aOrderToFallback[sTypeVal];
    if ((aParams[sType])){
      (aParams[sType]);
      this.setStructuredQuery(aParams['amenity'], aParams['street'], aParams['city'], aParams['county'], aParams['state'], aParams['country'], aParams['postalcode']);
      return true;
    }
  }

  return false;
}

Nominatim.prototype.getDetails = function(aPlaceIDs)
{
  if (sizeof(aPlaceIDs) == 0)  return {};

  sLanguagePrefArraySQL = "ARRAY["+join(',',array_map("getDBQuoted",this.aLangPrefOrder))+"]";

  // Get the details for display (is this a redundant extra step?)
  sPlaceIDs = join(',',aPlaceIDs);

  sImportanceSQL = '';
  if (this.sViewboxSmallSQL) sImportanceSQL +=  this.sViewboxSmallSQL;
  if (this.sViewboxLargeSQL) sImportanceSQL +=  this.sViewboxLargeSQL;

  sSQL = "select osm_type,osm_id,class,type,admin_level,rank_search,rank_address,min(place_id) as place_id, min(parent_place_id) as parent_place_id, calculated_country_code as country_code,";
  sSQL +=  sLanguagePrefArraySQL;
  sSQL +=  sLanguagePrefArraySQL;
  sSQL +=  "get_name_by_language(name, ARRAY['ref']) as ref,";
  sSQL +=  "avg(ST_X(centroid)) as lon,avg(ST_Y(centroid)) as lat, ";
  sSQL +=  sImportanceSQL+"coalesce(importance,0.75-(rank_search::float/40)) as importance, ";
  sSQL +=  "(select max(p.importance*(p.rank_address+2)) from place_addressline s, placex p where s.place_id = min(CASE WHEN placex.rank_search < 28 THEN placex.place_id ELSE placex.parent_place_id END) and p.place_id = s.address_place_id and s.isaddress and p.importance is not null) as addressimportance, ";
  sSQL +=  "(extratags->'place') as extra_place ";
  sSQL +=  sPlaceIDs;
  sSQL +=  this.iMinAddressRankthis.iMaxAddressRank;
  if (14 >= this.iMinAddressRank && 14 <= this.iMaxAddressRank) sSQL +=  " OR (extratags->'place') = 'city'";
  if (this.aAddressRankList) sSQL +=  " OR placex.rank_address in ("+join(',',this.aAddressRankList)+")";
  sSQL +=  ") ";
  if (this.sAllowedTypesSQLList) sSQL +=  this.sAllowedTypesSQLList;
  sSQL +=  "and linked_place_id is null ";
  sSQL +=  "group by osm_type,osm_id,class,type,admin_level,rank_search,rank_address,calculated_country_code,importance";
  if (this.bDeDupe) sSQL +=  ",place_id";
  sSQL +=  ",langaddress ";
  sSQL +=  ",placename ";
  sSQL +=  ",ref ";
  sSQL +=  ",extratags->'place' ";

  if (30 >= this.iMinAddressRank && 30 <= this.iMaxAddressRank){
    sSQL +=  " union ";
    sSQL +=  "select 'T' as osm_type,place_id as osm_id,'place' as class,'house' as type,null as admin_level,30 as rank_search,30 as rank_address,min(place_id) as place_id, min(parent_place_id) as parent_place_id,'us' as country_code,";
    sSQL +=  sLanguagePrefArraySQL;
    sSQL +=  "null as placename,";
    sSQL +=  "null as ref,";
    sSQL +=  "avg(ST_X(centroid)) as lon,avg(ST_Y(centroid)) as lat, ";
    sSQL +=  sImportanceSQL+"-1.15 as importance, ";
    sSQL +=  "(select max(p.importance*(p.rank_address+2)) from place_addressline s, placex p where s.place_id = min(location_property_tiger.parent_place_id) and p.place_id = s.address_place_id and s.isaddress and p.importance is not null) as addressimportance, ";
    sSQL +=  "null as extra_place ";
    sSQL +=  sPlaceIDs;
    sSQL +=  this.iMinAddressRankthis.iMaxAddressRank;
    sSQL +=  "group by place_id";
    if (this.bDeDupe) sSQL +=  ",place_id ";
    sSQL +=  " union ";
    sSQL +=  "select 'L' as osm_type,place_id as osm_id,'place' as class,'house' as type,null as admin_level,30 as rank_search,30 as rank_address,min(place_id) as place_id, min(parent_place_id) as parent_place_id,'us' as country_code,";
    sSQL +=  sLanguagePrefArraySQL;
    sSQL +=  "null as placename,";
    sSQL +=  "null as ref,";
    sSQL +=  "avg(ST_X(centroid)) as lon,avg(ST_Y(centroid)) as lat, ";
    sSQL +=  sImportanceSQL+"-1.10 as importance, ";
    sSQL +=  "(select max(p.importance*(p.rank_address+2)) from place_addressline s, placex p where s.place_id = min(location_property_aux.parent_place_id) and p.place_id = s.address_place_id and s.isaddress and p.importance is not null) as addressimportance, ";
    sSQL +=  "null as extra_place ";
    sSQL +=  sPlaceIDs;
    sSQL +=  this.iMinAddressRankthis.iMaxAddressRank;
    sSQL +=  "group by place_id";
    if (this.bDeDupe) sSQL +=  ",place_id";
    sSQL +=  sLanguagePrefArraySQL;
  }

  sSQL +=  " order by importance desc";
  if (CONST_Debug) {
    document.write( "<hr>");
    var_dump(sSQL);
  }
  aSearchResults = this.oDB.getAll(sSQL);

  if (PEAR.IsError(aSearchResults)){
    failInternalError("Could not get details for place.", sSQL, aSearchResults);
  }

  return aSearchResults;
}

/* Perform the actual query lookup.

Returns an ordered list of results, each with the following fields:
osm_type: type of corresponding OSM object
N - node
W - way
R - relation
P - postcode (internally computed)
osm_id: id of corresponding OSM object
class: general object class (corresponds to tag key of primary OSM tag)
type: subclass of object (corresponds to tag value of primary OSM tag)
admin_level: see http://wiki.openstreetmap.org/wiki/Admin_level
rank_search: rank in search hierarchy
(see also http://wiki.openstreetmap.org/wiki/Nominatim/Development_overview#Country_to_street_level)
rank_address: rank in address hierarchy (determines orer in address)
place_id: internal key (may differ between different instances)
country_code: ISO country code
langaddress: localized full address
placename: localized name of object
ref: content of ref tag (if available)
lon: longitude
lat: latitude
importance: importance of place based on Wikipedia link count
addressimportance: cumulated importance of address elements
extra_place: type of place (for admin boundaries, if there is a place tag)
aBoundingBox: bounding Box
label: short description of the object class/type (English only)
name: full name (currently the same as langaddress)
foundorder: secondary ordering for places with same importance
*/
Nominatim.prototype.lookup = function(){
  if (this.sQuery && this.aStructuredQuery) return false;

  sLanguagePrefArraySQL = "ARRAY["+join(',',array_map("getDBQuoted",this.aLangPrefOrder))+"]";

  sCountryCodesSQL = false;
  if (this.aCountryCodes && sizeof(this.aCountryCodes)){
    sCountryCodesSQL = join(',', array_map('addQuotes', this.aCountryCodes));
  }

  sQuery = this.sQuery;

  // Conflicts between US state abreviations and various words for 'the' in different languages
  if ((this.aLangPrefOrder['name:en'])){
    sQuery = preg_replace('/(^|,)\s*il\s*(,|$)/','\1illinois\2', sQuery);
    sQuery = preg_replace('/(^|,)\s*al\s*(,|$)/','\1alabama\2', sQuery);
    sQuery = preg_replace('/(^|,)\s*la\s*(,|$)/','\1louisiana\2', sQuery);
  }

  // View Box SQL
  sViewboxCentreSQL = false;
  bBoundingBoxSearch = false;
  if (this.aViewBox){
    fHeight = this.aViewBox[0]-this.aViewBox[2];
    fWidth = this.aViewBox[1]-this.aViewBox[3];
    aBigViewBox[0] = this.aViewBox[0] + fHeight;
    aBigViewBox[2] = this.aViewBox[2] - fHeight;
    aBigViewBox[1] = this.aViewBox[1] + fWidth;
    aBigViewBox[3] = this.aViewBox[3] - fWidth;

    this.sViewboxSmallSQL = "ST_SetSRID(ST_MakeBox2D(ST_Point("+this.aViewBox[0]+","+this.aViewBox[1]+"),ST_Point("+this.aViewBox[2]+","+this.aViewBox[3]+")),4326)";
    this.sViewboxLargeSQL = "ST_SetSRID(ST_MakeBox2D(ST_Point("+aBigViewBox[0]+","+aBigViewBox[1]+"),ST_Point("+aBigViewBox[2]+","+aBigViewBox[3]+")),4326)";
    bBoundingBoxSearch = this.bBoundedSearch;
  }

  // Route SQL
  if (this.aRoutePoints){
    sViewboxCentreSQL = "ST_SetSRID('LINESTRING(";
    bFirst = true;
    for (var aPointVal in this) {
      aPoint = this[aPointVal];
      if (bFirst) sViewboxCentreSQL +=  ",";
      sViewboxCentreSQL +=  aPoint[0]+' '+aPoint[1];
      bFirst = false;
    }
    sViewboxCentreSQL +=  ")'::geometry,4326)";

    sSQL = "select st_buffer("+sViewboxCentreSQL+","+(_GET['routewidth']/69)+")";
    this.sViewboxSmallSQL = this.oDB.getOne(sSQL);
    if (PEAR.isError(this.sViewboxSmallSQL)){
      failInternalError("Could not get small viewbox.", sSQL, this.sViewboxSmallSQL);
    }
    this.sViewboxSmallSQL = "'"+this.sViewboxSmallSQL+"'::geometry";

    sSQL = "select st_buffer("+sViewboxCentreSQL+","+(_GET['routewidth']/30)+")";
    this.sViewboxLargeSQL = this.oDB.getOne(sSQL);
    if (PEAR.isError(this.sViewboxLargeSQL)){
      failInternalError("Could not get large viewbox.", sSQL, this.sViewboxLargeSQL);
    }
    this.sViewboxLargeSQL = "'"+this.sViewboxLargeSQL+"'::geometry";
    bBoundingBoxSearch = this.bBoundedSearch;
  }

  // Do we have anything that looks like a lat/lon pair?
  if ( aLooksLike = looksLikeLatLonPair(sQuery) ){
    this.setNearPoint({aLooksLike['lat'], aLooksLike['lon']}};
    sQuery = aLooksLike['query'];
  }

  aSearchResults = {};
  if (sQuery || this.aStructuredQuery){
    // Start with a blank search
    aSearches = {
      {'iSearchRank' : 0, 'iNamePhrase' : -1, 'sCountryCode' : false, 'aName':{}, 'aAddress':{}, 'aFullNameAddress':{},
      'aNameNonSearch':{}, 'aAddressNonSearch':{},
      'sOperator':'', 'aFeatureName' : {}, 'sClass':'', 'sType':'', 'sHouseNumber':'', 'fLat':'', 'fLon':'', 'fRadius':''}
    };

    // Do we have a radius search?
    sNearPointSQL = false;
    if (this.aNearPoint){
      sNearPointSQL = "ST_SetSRID(ST_Point("+this.aNearPoint[1]+","+this.aNearPoint[0]+"),4326)";
      aSearches[0]['fLat'] = this.aNearPoint[0];
      aSearches[0]['fLon'] = this.aNearPoint[1];
      aSearches[0]['fRadius'] = this.aNearPoint[2];
    }

    // Any 'special' terms in the search?
    bSpecialTerms = false;
    preg_match_all{'/\\[(.*)=(.*)\\]/', sQuery, aSpecialTermsRaw, PREG_SET_ORDER};
    aSpecialTerms = {};
    for (var aSpecialTermVal in aSpecialTermsRaw) {
      aSpecialTerm = aSpecialTermsRaw[aSpecialTermVal];
      sQuery = str_replace(aSpecialTerm[0], ' ', sQuery);
      aSpecialTerms[strtolower(aSpecialTerm[1])] = aSpecialTerm[2];
    }

    preg_match_all('/\\[([\\w ]*)\\]/u', sQuery, aSpecialTermsRaw, PREG_SET_ORDER);
    aSpecialTerms = {};
    if ((aStructuredQuery['amenity']) && aStructuredQuery['amenity']){
      aSpecialTermsRaw[] = {0:'['+aStructuredQuery['amenity']+']', aStructuredQuery['amenity']};
      (aStructuredQuery['amenity']);
    }
    for (var aSpecialTermVal in aSpecialTermsRaw) {
      aSpecialTerm = aSpecialTermsRaw[aSpecialTermVal];
      sQuery = str_replace(aSpecialTerm[0], ' ', sQuery);
      sToken = this.oDB.getOne("select make_standard_name('"+aSpecialTerm[1]+"') as string");
      sSQL = 'select * from (select word_id,word_token, word, class, type, country_code, operator';
      sSQL +=  ' from word where word_token in (\' '+sToken+'\')) as x where (class is not null and class not in (\'place\')) or country_code is not null';
      if (CONST_Debug) var_Dump(sSQL);
      aSearchWords = this.oDB.getAll(sSQL);
      aNewSearches = {};
      for (var aSearchVal in aSearches) {
        aSearch = aSearches[aSearchVal];
        for (var aSearchTermVal in aSearchWords) {
          aSearchTerm = aSearchWords[aSearchTermVal];
          aNewSearch = aSearch;
          if (aSearchTerm['country_code']){
            aNewSearch['sCountryCode'] = strtolower(aSearchTerm['country_code']);
            aNewSearches[] = aNewSearch;
            bSpecialTerms = true;
          }
          if (aSearchTerm['class']){
            aNewSearch['sClass'] = aSearchTerm['class'];
            aNewSearch['sType'] = aSearchTerm['type'];
            aNewSearches[] = aNewSearch;
            bSpecialTerms = true;
          }
        }
      }
      aSearches = aNewSearches;
    }

    // Split query into phrases
    // Commas are used to reduce the search space by indicating where phrases split
    if (this.aStructuredQuery){
      aPhrases = this.aStructuredQuery;
      bStructuredPhrases = true;
    }else{
      aPhrases = explode(',',sQuery);
      bStructuredPhrases = false;
    }

    // Convert each phrase to standard form
    // Create a list of standard words
    // Get all 'sets' of words
    // Generate a complete list of all
    aTokens = {};
    for (var iPhrase in aPhrases) {
      sPhrase = aPhrases[iPhrase];
      aPhrase = this.oDB.getRow("select make_standard_name('"+pg_escape_string(sPhrase)+"') as string");
      if (PEAR.isError(aPhrase)){
        userError("Illegal query string (not an UTF-8 string): "+sPhrase);
        if (CONST_Debug) var_dump(aPhrase);
        ;
      }
      if (trim(aPhrase['string'])){
        aPhrases[iPhrase] = aPhrase;
        aPhrases[iPhrase]['words'] = explode(' ',aPhrases[iPhrase]['string']);
        aPhrases[iPhrase]['wordsets'] = getWordSets(aPhrases[iPhrase]['words'], 0);
        aTokens = array_merge(aTokens, getTokensFromSets(aPhrases[iPhrase]['wordsets']));
      }else{
        (aPhrases[iPhrase]);
      }
    }

    // Reindex phrases - we make assumptions later on that they are numerically keyed in order
    aPhraseTypes = array_keys(aPhrases);
    aPhrases = array_values(aPhrases);

    if (sizeof(aTokens)){
      // Check which tokens we have, get the ID numbers
      sSQL = 'select word_id,word_token, word, class, type, country_code, operator, search_name_count';
      sSQL +=  ' from word where word_token in ('+join(',',array_map("getDBQuoted",aTokens))+')';

      if (CONST_Debug) var_Dump(sSQL);

      aValidTokens = {};
      if (sizeof(aTokens)){
        aDatabaseWords = this.oDB.getAll(sSQL);
      }else{
        aDatabaseWords = {};
      }
      if (PEAR.IsError(aDatabaseWords)){
        failInternalError("Could not get word tokens.", sSQL, aDatabaseWords);
      }
      aPossibleMainWordIDs = {};
      aWordFrequencyScores = {};
      for (var aTokenVal in aDatabaseWords) {
        aToken = aDatabaseWords[aTokenVal];
        // Very special case - require 2 letter country param to match the country code found
        if (bStructuredPhrases && aToken['country_code'] && (aStructuredQuery['country']) && strlen(aStructuredQuery['country']) == 2 && strtolower(aStructuredQuery['country']) != aToken['country_code']){
          ;
        }

        if ((aValidTokens[aToken['word_token']])){
          aValidTokens[aToken['word_token']][] = aToken;
        }else{
          aValidTokens[aToken['word_token']] = {aToken};
        }
        if (aToken['class'] && aToken['country_code']) aPossibleMainWordIDs[aToken['word_id']] = 1;
        aWordFrequencyScores[aToken['word_id']] = aToken['search_name_count'] + 1;
      }
      if (CONST_Debug) var_Dump(aPhrases, aValidTokens);

      // Try and calculate GB postcodes we might be missing
      for (var sTokenVal in aTokens) {
        sToken = aTokens[sTokenVal];
        // Source of gb postcodes is now definitive - always use
        if (preg_match('/^([A-Z][A-Z]?[0-9][0-9A-Z]? ?[0-9])([A-Z][A-Z])$/', strtoupper(trim(sToken)), aData)){
          if (substr(aData[1],-2,1) != ' '){
            aData[0] = substr(aData[0],0,strlen(aData[1])-1)+' '+substr(aData[0],strlen(aData[1])-1);
            aData[1] = substr(aData[1],0,-1)+' '+substr(aData[1],-1,1);
          }
          aGBPostcodeLocation = gbPostcodeCalculate(aData[0], aData[1], aData[2], this.oDB);
          if (aGBPostcodeLocation){
            aValidTokens[sToken] = aGBPostcodeLocation;
          }
        }
        // US ZIP+4 codes - if there is no token,
        // 	merge in the 5-digit ZIP code
        else if ((aValidTokens[sToken]) && preg_match('/^([0-9]{5}) [0-9]{4}$/', sToken, aData)){
          if ((aValidTokens[aData[1]])){
            for (var aData in aValidTokens) {
              aToken = aValidTokens[aData];
              if (aToken['class']){
                if ((aValidTokens[sToken])){
                  aValidTokens[sToken][] = aToken;
                }else{
                  aValidTokens[sToken] = {aToken};
                }
              }
            }
          }
        }
      }

      for (var sTokenVal in aTokens) {
        sToken = aTokens[sTokenVal];
        // Unknown single word token with a number - assume it is a house number
        if ((aValidTokens[' '+sToken]) && strpos(sToken,' ') === false && preg_match('/[0-9]/', sToken)){
          aValidTokens[' '+sToken] = [{'class':'place','type':'house'}];
        }
      }

      // Any words that have failed completely?
      // TODO: suggestions

      // Start the search process
      aResultPlaceIDs = {};

      /*
      Calculate all searches using aValidTokens i.e.
      'Wodsworth Road, Sheffield' =>

      Phrase Wordset
      0      0       (wodsworth road)
      0      1       (wodsworth)(road)
      1      0       (sheffield)

      Score how good the search is so they can be ordered
      */

      aNewPhraseSearches = {};
      if (bStructuredPhrases) sPhraseType = aPhraseTypes[iPhrase];
      else sPhraseType = '';


      // Too many permutations - too expensive
      if (iWordSet > 120) break;

      aWordsetSearches = aSearches;

      // Add all words from this wordset
      for (var iToken in aWordset) {
        sToken = aWordset[iToken];
        //echo "<br><b>$sToken</b>";
        aNewWordsetSearches = {};

        for (var aCurrentSearchVal in aWordsetSearches) {
          aCurrentSearch = aWordsetSearches[aCurrentSearchVal];
          //echo "<i>";
          //var_dump($aCurrentSearch);
          //echo "</i>";

          // If the token is valid
          if ((aValidTokens[' '+sToken])){
            for (var sToken in aValidTokens) {
              aSearchTerm = aValidTokens[sToken];
              aSearch = aCurrentSearch;
              aSearch['iSearchRank']++;
              if ((sPhraseType == '' || sPhraseType == 'country') && (aSearchTerm['country_code']) && aSearchTerm['country_code'] != '0'){
                if (aSearch['sCountryCode'] === false){
                  aSearch['sCountryCode'] = strtolower(aSearchTerm['country_code']);
                  // Country is almost always at the end of the string - increase score for finding it anywhere else (optimisation)
                  // If reverse order is enabled, it may appear at the beginning as well.
                  if ((iToken+1 != sizeof(aWordset) || iPhrase+1 != sizeof(aPhrases)) &&
                    (this.bReverseInPlan || iToken > 0 || iPhrase > 0)){
                      aSearch['iSearchRank'] += 5;
                    }
                    if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                  }
                }else if ((aSearchTerm['lat']) && aSearchTerm['lat'] !== '' && aSearchTerm['lat'] !== null){
                  if (aSearch['fLat'] === ''){
                    aSearch['fLat'] = aSearchTerm['lat'];
                    aSearch['fLon'] = aSearchTerm['lon'];
                    aSearch['fRadius'] = aSearchTerm['radius'];
                    if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                  }
                }else if (sPhraseType == 'postalcode'){
                  // We need to try the case where the postal code is the primary element (i.e. no way to tell if it is (postalcode, city) OR (city, postalcode) so try both
                  if ((aSearchTerm['word_id']) && aSearchTerm['word_id']){
                    // If we already have a name try putting the postcode first
                    if (sizeof(aSearch['aName'])){
                      aNewSearch = aSearch;
                      aNewSearch['aAddress'] = array_merge(aNewSearch['aAddress'], aNewSearch['aName']);
                      aNewSearch['aName'] = {};
                      aNewSearch['aName'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aNewSearch;
                    }

                    if (sizeof(aSearch['aName'])){
                      if ((bStructuredPhrases || iPhrase > 0) && sPhraseType != 'country' && ((aValidTokens[sToken]) || strlen(sToken) < 4 || strpos(sToken, ' ') !== false)){
                        aSearch['aAddress'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      }else{
                        aCurrentSearch['aFullNameAddress'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                        aSearch['iSearchRank'] += 1000; // skip;
                      }
                    }else{
                      aSearch['aName'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      //$aSearch['iNamePhrase'] = $iPhrase;
                    }
                    if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                  }

                }else if ((sPhraseType == '' || sPhraseType == 'street') && aSearchTerm['class'] == 'place' && aSearchTerm['type'] == 'house'){
                  if (aSearch['sHouseNumber'] === ''){
                    aSearch['sHouseNumber'] = sToken;
                    // sanity check: if the housenumber is not mainly made
                    // up of numbers, add a penalty
                    if (preg_match_all("/[^0-9]/", sToken, aMatches) > 2) aSearch['iSearchRank']++;
                    if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                    /*
                    // Fall back to not searching for this item (better than nothing)
                    $aSearch = $aCurrentSearch;
                    $aSearch['iSearchRank'] += 1;
                    if ($aSearch['iSearchRank'] < $this->iMaxRank) $aNewWordsetSearches[] = $aSearch;
                    */
                  }
                }else if (sPhraseType == '' && aSearchTerm['class'] !== '' && aSearchTerm['class'] !== null){
                  if (aSearch['sClass'] === ''){
                    aSearch['sOperator'] = aSearchTerm['operator'];
                    aSearch['sClass'] = aSearchTerm['class'];
                    aSearch['sType'] = aSearchTerm['type'];
                    if (sizeof(aSearch['aName'])){
                      aSearch['sOperator'] = 'name';
                    }else {
                      aSearch['sOperator'] = 'near'; // near = in for the moment
                    }
                    if (strlen(aSearchTerm['operator']) == 0) aSearch['iSearchRank'] += 1;

                    // Do we have a shortcut id?
                    if (aSearch['sOperator'] == 'name'){
                      sSQL = "select get_tagpair('"+aSearch['sClass']+"', '"+aSearch['sType']+"')";
                      if (iAmenityID = this.oDB.getOne(sSQL)){
                        aValidTokens[aSearch['sClass']+':'+aSearch['sType']] = {'word_id' : iAmenityID};
                        aSearch['aName'][iAmenityID] = iAmenityID;
                        aSearch['sClass'] = '';
                        aSearch['sType'] = '';
                      }
                    }
                    if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                  }
                }else if ((aSearchTerm['word_id']) && aSearchTerm['word_id']){
                  if (sizeof(aSearch['aName'])){
                    if ((bStructuredPhrases || iPhrase > 0) && sPhraseType != 'country' && ((aValidTokens[sToken]) || strlen(sToken) < 4 || strpos(sToken, ' ') !== false)){
                      aSearch['aAddress'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                    }else{
                      aCurrentSearch['aFullNameAddress'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      aSearch['iSearchRank'] += 1000; // skip;
                    }
                  }else{
                    aSearch['aName'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                    //$aSearch['iNamePhrase'] = $iPhrase;
                  }
                  if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                }
              }
            }
            if ((aValidTokens[sToken])){
              // Allow searching for a word - but at extra cost
              for (var sToken in aValidTokens) {
                aSearchTerm = aValidTokens[sToken];
                if ((aSearchTerm['word_id']) && aSearchTerm['word_id']){
                  if ((bStructuredPhrases || iPhrase > 0) && sizeof(aCurrentSearch['aName']) && strpos(sToken, ' ') === false){
                    aSearch = aCurrentSearch;
                    aSearch['iSearchRank'] += 1;
                    if (aWordFrequencyScores[aSearchTerm['word_id']] < CONST_Max_Word_Frequency){
                      aSearch['aAddress'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                    }else if ((aValidTokens[' '+sToken]) && strlen(sToken) >= 4){ // revert to the token version?

                      aSearch['aAddressNonSearch'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      aSearch['iSearchRank'] += 1;
                      if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                      for (var sToken in aValidTokens) {
                        aSearchTermToken = aValidTokens[sToken];
                        if ((aSearchTermToken['country_code']) && (aSearchTermToken['lat']) && (aSearchTermToken['class'])){
                          aSearch = aCurrentSearch;
                          aSearch['iSearchRank'] += 1;
                          aSearch['aAddress'][aSearchTermToken['word_id']] = aSearchTermToken['word_id'];
                          if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                        }
                      }
                    }else{
                      aSearch['aAddressNonSearch'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      if (preg_match('#^[0-9]+$#', sToken)) aSearch['iSearchRank'] += 2;
                      if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                    }
                  }

                  if (sizeof(aCurrentSearch['aName']) || aCurrentSearch['iNamePhrase'] == iPhrase){
                    aSearch = aCurrentSearch;
                    aSearch['iSearchRank'] += 1;
                    if (sizeof(aCurrentSearch['aName'])) aSearch['iSearchRank'] += 1;
                    if (preg_match('#^[0-9]+$#', sToken)) aSearch['iSearchRank'] += 2;
                    if (aWordFrequencyScores[aSearchTerm['word_id']] < CONST_Max_Word_Frequency){
                      aSearch['aName'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                    }else{
                      aSearch['aNameNonSearch'][aSearchTerm['word_id']] = aSearchTerm['word_id'];
                      aSearch['iNamePhrase'] = iPhrase;
                      if (aSearch['iSearchRank'] < this.iMaxRank) aNewWordsetSearches[] = aSearch;
                    }
                  }
                }
              }
            }else{
              // Allow skipping a word - but at EXTREAM cost
              //$aSearch = $aCurrentSearch;
              //$aSearch['iSearchRank']+=100;
              //$aNewWordsetSearches[] = $aSearch;
            }
          }
          // Sort and cut
          usort(aNewWordsetSearches, 'bySearchRank');
          aWordsetSearches = array_slice(aNewWordsetSearches, 0, 50);
        }
        //var_Dump('<hr>',sizeof($aWordsetSearches)); exit;

        aNewPhraseSearches = array_merge(aNewPhraseSearches, aNewWordsetSearches);
        usort(aNewPhraseSearches, 'bySearchRank');

        aSearchHash = {};
        for (var iSearch in aNewPhraseSearches) {
          aSearch = aNewPhraseSearches[iSearch];
          sHash = serialize(aSearch);
          if ((aSearchHash[sHash])) (aNewPhraseSearches[iSearch]);
          else aSearchHash[sHash] = 1;
        }

        aNewPhraseSearches = array_slice(aNewPhraseSearches, 0, 50);
      }

      // Re-group the searches by their score, junk anything over 20 as just not worth trying
      aGroupedSearches = {};
      for (var aSearchVal in aNewPhraseSearches) {
        aSearch = aNewPhraseSearches[aSearchVal];
        if (aSearch['iSearchRank'] < this.iMaxRank){
          if ((aGroupedSearches[aSearch['iSearchRank']])) aGroupedSearches[aSearch['iSearchRank']] = {};
          aGroupedSearches[aSearch['iSearchRank']][] = aSearch;
        }
      }
      ksort(aGroupedSearches);

      iSearchCount = 0;
      aSearches = {};
      for (var iScore in aGroupedSearches) {
        aNewSearches = aGroupedSearches[iScore];
        iSearchCount += sizeof(aNewSearches);
        aSearches = array_merge(aSearches, aNewSearches);
        if (iSearchCount > 50) break;
      }

      //if (CONST_Debug) _debugDumpGroupedSearches($aGroupedSearches, $aValidTokens);

    }

  }else{
    // Re-group the searches by their score, junk anything over 20 as just not worth trying
    aGroupedSearches = {};
    for (var aSearchVal in aSearches) {
      aSearch = aSearches[aSearchVal];
      if (aSearch['iSearchRank'] < this.iMaxRank){
        if ((aGroupedSearches[aSearch['iSearchRank']])) aGroupedSearches[aSearch['iSearchRank']] = {};
        aGroupedSearches[aSearch['iSearchRank']][] = aSearch;
      }
    }
    ksort(aGroupedSearches);
  }

  if (CONST_Debug) var_Dump(aGroupedSearches);

  if (this.bReverseInPlan){
    aCopyGroupedSearches = aGroupedSearches;
    for (var iGroup in aCopyGroupedSearches) {
      aSearches = aCopyGroupedSearches[iGroup];
      for (var iSearch in aSearches) {
        aSearch = aSearches[iSearch];
        if (sizeof(aSearch['aAddress'])){
          iReverseItem = array_pop(aSearch['aAddress']);
          if ((aPossibleMainWordIDs[iReverseItem])){
            aSearch['aAddress'] = array_merge(aSearch['aAddress'], aSearch['aName']);
            aSearch['aName'] = {iReverseItem};
            aGroupedSearches[iGroup][] = aSearch;
          }
          //$aReverseSearch['aName'][$iReverseItem] = $iReverseItem;
          //$aGroupedSearches[$iGroup][] = $aReverseSearch;
        }
      }
    }
  }

  if (CONST_Search_TryDroppedAddressTerms && sizeof(aStructuredQuery) > 0){
    aCopyGroupedSearches = aGroupedSearches;
    for (var iGroup in aCopyGroupedSearches) {
      aSearches = aCopyGroupedSearches[iGroup];
      for (var iSearch in aSearches) {
        aSearch = aSearches[iSearch];
        aReductionsList = {aSearch['aAddress']};
        iSearchRank = aSearch['iSearchRank'];
        while(sizeof(aReductionsList) > 0){
          iSearchRank += 5;
          if (iSearchRank > iMaxRank) break 3;
          aNewReductionsList = {};
          for (var aReductionsWordListVal in aReductionsList) {
            aReductionsWordList = aReductionsList[aReductionsWordListVal];
            (iReductionWord = 0; iReductionWord < sizeof(aReductionsWordList); iReductionWord++){
              aReductionsWordListResult = array_merge(array_slice(aReductionsWordList, 0, iReductionWord), array_slice(aReductionsWordList, iReductionWord+1));
              aReverseSearch = aSearch;
              aSearch['aAddress'] = aReductionsWordListResult;
              aSearch['iSearchRank'] = iSearchRank;
              aGroupedSearches[iSearchRank][] = aReverseSearch;
              if (sizeof(aReductionsWordListResult) > 0){
                aNewReductionsList[] = aReductionsWordListResult;
              }
            }
          }
          aReductionsList = aNewReductionsList;
        }
      }
    }
    ksort(aGroupedSearches);
  }

  // Filter out duplicate searches
  aSearchHash = {};
  for (var iGroup in aGroupedSearches) {
    aSearches = aGroupedSearches[iGroup];
    for (var iSearch in aSearches) {
      aSearch = aSearches[iSearch];
      sHash = serialize(aSearch);
      if ((aSearchHash[sHash])){
        (aGroupedSearches[iGroup][iSearch]);
        if (sizeof(aGroupedSearches[iGroup]) == 0) (aGroupedSearches[iGroup]);
      }else{
        aSearchHash[sHash] = 1;
      }
    }
  }

  if (CONST_Debug) _debugDumpGroupedSearches(aGroupedSearches, aValidTokens);

  iGroupLoop = 0;
  iQueryLoop = 0;
  for (var iGroupedRank in aGroupedSearches) {
    aSearches = aGroupedSearches[iGroupedRank];
    iGroupLoop++;
    for (var aSearchVal in aSearches) {
      aSearch = aSearches[aSearchVal];
      iQueryLoop++;

      if (CONST_Debug) {
        document.write( iGroupLoopiQueryLoop);
      }
      if (CONST_Debug) _debugDumpGroupedSearches({iGroupedRank : (aSearch)}, aValidTokens);

      // No location term?
      if (sizeof( aSearch['aName']) && sizeof(aSearch['aAddress']) && aSearch['fLon']){
        if (aSearch['sCountryCode'] && aSearch['sClass'] && aSearch['sHouseNumber']){
          // Just looking for a country by code - look it up
          if (4 >= this.iMinAddressRank && 4 <= this.iMaxAddressRank){
            sSQL = "select place_id from placex where calculated_country_code='"+aSearch['sCountryCode']+"' and rank_search = 4";
            if (sCountryCodesSQL) sSQL +=  sCountryCodesSQL;
            sSQL +=  " order by st_area(geometry) desc limit 1";
            if (CONST_Debug) var_dump(sSQL);
            aPlaceIDs = this.oDB.getCol(sSQL);
          }else{
            aPlaceIDs = {};
          }
        }else{
          if (bBoundingBoxSearch && aSearch['fLon']) ;
          if (aSearch['sClass']) ;
          sSQL = "select count(*) from pg_tables where tablename = 'place_classtype_"+aSearch['sClass']+"_"+aSearch['sType']+"'";
          if (this.oDB.getOne(sSQL)){
            sSQL = "select place_id from place_classtype_"+aSearch['sClass']+"_"+aSearch['sType']+" ct";
            if (sCountryCodesSQL) sSQL +=  " join placex using (place_id)";
            sSQL +=  this.sViewboxSmallSQL;
            if (sCountryCodesSQL) sSQL +=  sCountryCodesSQL;
            if (sizeof(this.aExcludePlaceIDs)){
              sSQL +=  " and place_id not in ("+join(',',this.aExcludePlaceIDs)+")";
            }
            if (sViewboxCentreSQL) sSQL +=  sViewboxCentreSQL;
            sSQL +=  this.iLimit;
            if (CONST_Debug) var_dump(sSQL);
            aPlaceIDs = this.oDB.getCol(sSQL);

            // If excluded place IDs are given, it is fair to assume that
            // there have been results in the small box, so no further
            // expansion in that case.
            // Also don't expand if bounded results were requested.
            if (sizeof(aPlaceIDs) && sizeof(this.aExcludePlaceIDs) && this.bBoundedSearch){
              sSQL = "select place_id from place_classtype_"+aSearch['sClass']+"_"+aSearch['sType']+" ct";
              if (sCountryCodesSQL) sSQL +=  " join placex using (place_id)";
              sSQL +=  this.sViewboxLargeSQL;
              if (sCountryCodesSQL) sSQL +=  sCountryCodesSQL;
              if (sViewboxCentreSQL) sSQL +=  sViewboxCentreSQL;
              sSQL +=  this.iLimit;
              if (CONST_Debug) var_dump(sSQL);
              aPlaceIDs = this.oDB.getCol(sSQL);
            }
          }else{
            sSQL = "select place_id from placex where class='"+aSearch['sClass']+"' and type='"+aSearch['sType']+"'";
            sSQL +=  this.sViewboxSmallSQL;
            if (sCountryCodesSQL) sSQL +=  sCountryCodesSQL;
            if (sViewboxCentreSQL)	sSQL +=  sViewboxCentreSQL;
            sSQL +=  this.iLimit;
            if (CONST_Debug) var_dump(sSQL);
            aPlaceIDs = this.oDB.getCol(sSQL);
          }
        }
      }else{
        aPlaceIDs = {};

        // First we need a position, either aName or fLat or both
        aTerms = {};
        aOrder = {};

        // TODO: filter out the pointless search terms (2 letter name tokens and less)
        // they might be right - but they are just too darned expensive to run
        if (sizeof(aSearch['aName'])) aTerms[] = "name_vector @> ARRAY["+join(aSearch['aName'],",")+"]";
        if (sizeof(aSearch['aNameNonSearch'])) aTerms[] = "array_cat(name_vector,ARRAY[]::integer[]) @> ARRAY["+join(aSearch['aNameNonSearch'],",")+"]";
        if (sizeof(aSearch['aAddress']) && aSearch['aName'] != aSearch['aAddress']){
          // For infrequent name terms disable index usage for address
          if (CONST_Search_NameOnlySearchFrequencyThreshold && sizeof(aSearch['aName']) == 1 && aWordFrequencyScores[aSearch['aName'][reset(aSearch['aName'])]] < CONST_Search_NameOnlySearchFrequencyThreshold){
            aTerms[] = "array_cat(nameaddress_vector,ARRAY[]::integer[]) @> ARRAY["+join(array_merge(aSearch['aAddress'],aSearch['aAddressNonSearch']),",")+"]";
          }else{
            aTerms[] = "nameaddress_vector @> ARRAY["+join(aSearch['aAddress'],",")+"]";
            if (sizeof(aSearch['aAddressNonSearch'])) aTerms[] = "array_cat(nameaddress_vector,ARRAY[]::integer[]) @> ARRAY["+join(aSearch['aAddressNonSearch'],",")+"]";
          }
        }
        if (aSearch['sCountryCode']) aTerms[] = "country_code = '"+pg_escape_string(aSearch['sCountryCode'])+"'";
        if (aSearch['sHouseNumber']){
          aTerms[] = "address_rank between 16 and 27";
        }else{
          if (this.iMinAddressRank > 0){
            aTerms[] = "address_rank >= "+this.iMinAddressRank;
          }
          if (this.iMaxAddressRank < 30){
            aTerms[] = "address_rank <= "+this.iMaxAddressRank;
          }
        }
        if (aSearch['fLon'] && aSearch['fLat']){
          aTerms[] = "ST_DWithin(centroid, ST_SetSRID(ST_Point("+aSearch['fLon']+","+aSearch['fLat']+"),4326), "+aSearch['fRadius']+")";
          aOrder[] = "ST_Distance(centroid, ST_SetSRID(ST_Point("+aSearch['fLon']+","+aSearch['fLat']+"),4326)) ASC";
        }
        if (sizeof(this.aExcludePlaceIDs)){
          aTerms[] = "place_id not in ("+join(',',this.aExcludePlaceIDs)+")";
        }
        if (sCountryCodesSQL){
          aTerms[] = sCountryCodesSQL;
        }

        if (bBoundingBoxSearch) aTerms[] = this.sViewboxSmallSQL;
        if (sNearPointSQL) aOrder[] = sNearPointSQL;

        if (aSearch['sHouseNumber']){
          sImportanceSQL = '- abs(26 - address_rank) + 3';
        }else{
          sImportanceSQL = '(case when importance = 0 OR importance IS NULL then 0.75-(search_rank::float/40) else importance end)';
        }
        if (this.sViewboxSmallSQL) sImportanceSQL +=  this.sViewboxSmallSQL;
        if (this.sViewboxLargeSQL) sImportanceSQL +=  this.sViewboxLargeSQL;

        aOrder[] = sImportanceSQL;
        if (sizeof(aSearch['aFullNameAddress'])){
          sExactMatchSQL = '(select count(*) from (select unnest(ARRAY['+join(aSearch['aFullNameAddress'],",")+']) INTERSECT select unnest(nameaddress_vector))s) as exactmatch';
          aOrder[] = 'exactmatch DESC';
        } else {
          sExactMatchSQL = '0::int as exactmatch';
        }

        if (sizeof(aTerms)){
          sSQL = "select place_id, ";
          sSQL +=  sExactMatchSQL;
          sSQL +=  " from search_name";
          sSQL +=  " where "+join(' and ',aTerms);
          sSQL +=  " order by "+join(', ',aOrder);
          if (aSearch['sHouseNumber'] || aSearch['sClass']){
            sSQL +=  " limit 50";
          }else if (sizeof(aSearch['aName']) && sizeof(aSearch['aAddress']) && aSearch['sClass']){
            sSQL +=  " limit 1";
          }else{
            sSQL +=  " limit "+this.iLimit;
          }
          if (CONST_Debug) {
            var_dump(sSQL);
          }
          aViewBoxPlaceIDs = this.oDB.getAll(sSQL);
          if (PEAR.IsError(aViewBoxPlaceIDs)){
            failInternalError("Could not get places for search terms.", sSQL, aViewBoxPlaceIDs);
          }
          //var_dump($aViewBoxPlaceIDs);
          // Did we have an viewbox matches?
          aPlaceIDs = {};
          bViewBoxMatch = false;
          for (var aViewBoxRowVal in aViewBoxPlaceIDs) {
            aViewBoxRow = aViewBoxPlaceIDs[aViewBoxRowVal];
            //if ($bViewBoxMatch == 1 && $aViewBoxRow['in_small'] == 'f') break;
            //if ($bViewBoxMatch == 2 && $aViewBoxRow['in_large'] == 'f') break;
            //if ($aViewBoxRow['in_small'] == 't') $bViewBoxMatch = 1;
            //else if ($aViewBoxRow['in_large'] == 't') $bViewBoxMatch = 2;
            aPlaceIDs[] = aViewBoxRow['place_id'];
            this.exactMatchCache[aViewBoxRow['place_id']] = aViewBoxRow['exactmatch'];
          }
        }
        //var_Dump($aPlaceIDs);
        //exit;

        if (aSearch['sHouseNumber'] && sizeof(aPlaceIDs)){
          aRoadPlaceIDs = aPlaceIDs;
          sPlaceIDs = join(',',aPlaceIDs);

          // Now they are indexed look for a house attached to a street we found
          sHouseNumberRegex = '\\\\m'+aSearch['sHouseNumber']+'\\\\M';
          sSQL = "select place_id from placex where parent_place_id in ("+sPlaceIDs+") and transliteration(housenumber) ~* E'"+sHouseNumberRegex+"'";
          if (sizeof(this.aExcludePlaceIDs)){
            sSQL +=  " and place_id not in ("+join(',',this.aExcludePlaceIDs)+")";
          }
          sSQL +=  this.iLimit;
          if (CONST_Debug) var_dump(sSQL);
          aPlaceIDs = this.oDB.getCol(sSQL);

          // If not try the aux fallback table
          if (sizeof(aPlaceIDs)){
            sSQL = "select place_id from location_property_aux where parent_place_id in ("+sPlaceIDs+") and housenumber = '"+pg_escape_string(aSearch['sHouseNumber'])+"'";
            if (sizeof(this.aExcludePlaceIDs)){
              sSQL +=  " and place_id not in ("+join(',',this.aExcludePlaceIDs)+")";
            }
            //$sSQL .= " limit $this->iLimit";
            if (CONST_Debug) var_dump(sSQL);
            aPlaceIDs = this.oDB.getCol(sSQL);
          }

          if (sizeof(aPlaceIDs)){
            sSQL = "select place_id from location_property_tiger where parent_place_id in ("+sPlaceIDs+") and housenumber = '"+pg_escape_string(aSearch['sHouseNumber'])+"'";
            if (sizeof(this.aExcludePlaceIDs)){
              sSQL +=  " and place_id not in ("+join(',',this.aExcludePlaceIDs)+")";
            }
            //$sSQL .= " limit $this->iLimit";
            if (CONST_Debug) var_dump(sSQL);
            aPlaceIDs = this.oDB.getCol(sSQL);
          }

          // Fallback to the road
          if (sizeof(aPlaceIDs) && preg_match('/[0-9]+/', aSearch['sHouseNumber'])){
            aPlaceIDs = aRoadPlaceIDs;
          }

        }

        if (aSearch['sClass'] && sizeof(aPlaceIDs)){
          sPlaceIDs = join(',',aPlaceIDs);
          aClassPlaceIDs = {};

          if (aSearch['sOperator'] || aSearch['sOperator'] == 'name'){
            // If they were searching for a named class (i.e. 'Kings Head pub') then we might have an extra match
            sSQL = sPlaceIDs+aSearch['sClass']+"' and type='"+aSearch['sType']+"'";
            sSQL +=  " and linked_place_id is null";
            if (sCountryCodesSQL) sSQL +=  sCountryCodesSQL;
            sSQL +=  this.iLimit;
            if (CONST_Debug) var_dump(sSQL);
            aClassPlaceIDs = this.oDB.getCol(sSQL);
          }

          if (aSearch['sOperator'] || aSearch['sOperator'] == 'near'){ // & in

            sSQL = "select count(*) from pg_tables where tablename = 'place_classtype_"+aSearch['sClass']+"_"+aSearch['sType']+"'";
            bCacheTable = this.oDB.getOne(sSQL);

            sSQL = sPlaceIDs;

            if (CONST_Debug) var_dump(sSQL);
            this.iMaxRank = (this.oDB.getOne(sSQL));

            // For state / country level searches the normal radius search doesn't work very well
            sPlaceGeom = false;
            if (this.iMaxRank < 9 && bCacheTable){
              // Try and get a polygon to search in instead
              sSQL = sPlaceIDsthis.iMaxRank;
              if (CONST_Debug) var_dump(sSQL);
              sPlaceGeom = this.oDB.getOne(sSQL);
            }

            if (sPlaceGeom){
              sPlaceIDs = false;
            }else{
              this.iMaxRank += 5;
              sSQL = sPlaceIDsthis.iMaxRank;
              if (CONST_Debug) var_dump(sSQL);
              aPlaceIDs = this.oDB.getCol(sSQL);
              sPlaceIDs = join(',',aPlaceIDs);
            }

            if (sPlaceIDs || sPlaceGeom){

              fRange = 0.01;
              if (bCacheTable){
                // More efficient - can make the range bigger
                fRange = 0.05;

                sOrderBySQL = '';
                if (sNearPointSQL) sOrderBySQL = sNearPointSQL;
                else if (sPlaceIDs) sOrderBySQL = "ST_Distance(l.centroid, f.geometry)";
                else if (sPlaceGeom) sOrderBysSQL = "ST_Distance(st_centroid('"+sPlaceGeom+"'), l.centroid)";

                sSQL = "select distinct l.place_id"+(sOrderBySQL','+sOrderBySQL'')+" from place_classtype_"+aSearch['sClass']+"_"+aSearch['sType']+" as l";
                if (sCountryCodesSQL) sSQL +=  " join placex as lp using (place_id)";
                if (sPlaceIDs){
                  sSQL +=  ",placex as f where ";
                  sSQL +=  sPlaceIDsfRange;
                }
                if (sPlaceGeom){
                  sSQL +=  " where ";
                  sSQL +=  "ST_Contains('"+sPlaceGeom+"', l.centroid) ";
                }
                if (sizeof(this.aExcludePlaceIDs)){
                  sSQL +=  " and l.place_id not in ("+join(',',this.aExcludePlaceIDs)+")";
                }
                if (sCountryCodesSQL) sSQL +=  sCountryCodesSQL;
                if (sOrderBySQL) sSQL +=  "order by "+sOrderBySQL+" asc";
                if (this.iOffset) sSQL +=  this.iOffset;
                sSQL +=  this.iLimit;
                if (CONST_Debug) var_dump(sSQL);
                aClassPlaceIDs = array_merge(aClassPlaceIDs, this.oDB.getCol(sSQL));
              }else{
                if ((aSearch['fRadius']) && aSearch['fRadius']) fRange = aSearch['fRadius'];

                sOrderBySQL = '';
                if (sNearPointSQL) sOrderBySQL = sNearPointSQL;
                else sOrderBySQL = "ST_Distance(l.geometry, f.geometry)";

                sSQL = "select distinct l.place_id"+(sOrderBysSQL','+sOrderBysSQL'')+" from placex as l,placex as f where ";
                sSQL +=  sPlaceIDsfRange;
                sSQL +=  "and l.class='"+aSearch['sClass']+"' and l.type='"+aSearch['sType']+"' ";
                if (sizeof(this.aExcludePlaceIDs)){
                  sSQL +=  " and l.place_id not in ("+join(',',this.aExcludePlaceIDs)+")";
                }
                if (sCountryCodesSQL) sSQL +=  sCountryCodesSQL;
                if (sOrderBy) sSQL +=  "order by "+OrderBysSQL+" asc";
                if (this.iOffset) sSQL +=  this.iOffset;
                sSQL +=  this.iLimit;
                if (CONST_Debug) var_dump(sSQL);
                aClassPlaceIDs = array_merge(aClassPlaceIDs, this.oDB.getCol(sSQL));
              }
            }
          }

          aPlaceIDs = aClassPlaceIDs;

        }

      }

      if (PEAR.IsError(aPlaceIDs)){
        failInternalError("Could not get place IDs from tokens." ,sSQL, aPlaceIDs);
      }

      if (CONST_Debug) { document.write( "<br><b>Place IDs:</b> "); var_Dump(aPlaceIDs); }

        for (var iPlaceIDVal in aPlaceIDs) {
          iPlaceID = aPlaceIDs[iPlaceIDVal];
          aResultPlaceIDs[iPlaceID] = iPlaceID;
        }
        if (iQueryLoop > 20) break;
      }

      if ((aResultPlaceIDs) && sizeof(aResultPlaceIDs) && (this.iMinAddressRank != 0 || this.iMaxAddressRank != 30)){
        // Need to verify passes rank limits before dropping out of the loop (yuk!)
        sSQL = "select place_id from placex where place_id in ("+join(',',aResultPlaceIDs)+") ";
        sSQL +=  this.iMinAddressRankthis.iMaxAddressRank;
        if (14 >= this.iMinAddressRank && 14 <= this.iMaxAddressRank) sSQL +=  " OR (extratags->'place') = 'city'";
        if (this.aAddressRankList) sSQL +=  " OR placex.rank_address in ("+join(',',this.aAddressRankList)+")";
        sSQL +=  ") UNION select place_id from location_property_tiger where place_id in ("+join(',',aResultPlaceIDs)+") ";
        sSQL +=  this.iMinAddressRankthis.iMaxAddressRank;
        if (this.aAddressRankList) sSQL +=  " OR 30 in ("+join(',',this.aAddressRankList)+")";
        sSQL +=  ")";
        if (CONST_Debug) var_dump(sSQL);
        aResultPlaceIDs = this.oDB.getCol(sSQL);
      }

      //exit;
      if ((aResultPlaceIDs) && sizeof(aResultPlaceIDs)) break;
      if (iGroupLoop > 4) break;
      if (iQueryLoop > 30) break;
    }

    // Did we find anything?
    if ((aResultPlaceIDs) && sizeof(aResultPlaceIDs)){
      aSearchResults = this.getDetails(aResultPlaceIDs);
    }

  }else{
    // Just interpret as a reverse geocode
    iPlaceID = geocodeReverse(this.aNearPoint[0], this.aNearPoint[1]);
    if (iPlaceID){
      aSearchResults = this.getDetails([iPlaceID]);
    }else{
      aSearchResults = {};
    }

    // No results? Done
    if (sizeof(aSearchResults)){
      if (this.bFallback){
        if (this.fallbackStructuredQuery()){
          return this.lookup();
        }
      }

      return {};
    }

    aClassType = getClassTypesWithImportance();
    aRecheckWords = preg_split('/\b[\s,\\-]*/u',sQuery);
    for (var i in aRecheckWords) {
      sWord = aRecheckWords[i];
      if (sWord) (aRecheckWords[i]);
    }

    for (var iResNum in aSearchResults) {
      aResult = aSearchResults[iResNum];
      if (CONST_Search_AreaPolygons){
        // Get the bounding box and outline polygon
        sSQL = "select place_id,0 as numfeatures,st_area(geometry) as area,";
        sSQL +=  "ST_Y(centroid) as centrelat,ST_X(centroid) as centrelon,";
        sSQL +=  "ST_Y(ST_PointN(ST_ExteriorRing(Box2D(geometry)),4)) as minlat,ST_Y(ST_PointN(ST_ExteriorRing(Box2D(geometry)),2)) as maxlat,";
        sSQL +=  "ST_X(ST_PointN(ST_ExteriorRing(Box2D(geometry)),1)) as minlon,ST_X(ST_PointN(ST_ExteriorRing(Box2D(geometry)),3)) as maxlon";
        if (this.bIncludePolygonAsGeoJSON) sSQL +=  ",ST_AsGeoJSON(geometry) as asgeojson";
        if (this.bIncludePolygonAsKML) sSQL +=  ",ST_AsKML(geometry) as askml";
        if (this.bIncludePolygonAsSVG) sSQL +=  ",ST_AsSVG(geometry) as assvg";
        if (this.bIncludePolygonAsText || this.bIncludePolygonAsPoints) sSQL +=  ",ST_AsText(geometry) as astext";
        sSQL +=  " from placex where place_id = "+aResult['place_id']+' and st_geometrytype(Box2D(geometry)) = \'ST_Polygon\'';
        aPointPolygon = this.oDB.getRow(sSQL);
        if (PEAR.IsError(aPointPolygon))
          {
            failInternalError("Could not get outline.", sSQL, aPointPolygon);
          }

          if (aPointPolygon['place_id'])
            {
              if (this.bIncludePolygonAsGeoJSON) aResult['asgeojson'] = aPointPolygon['asgeojson'];
              if (this.bIncludePolygonAsKML) aResult['askml'] = aPointPolygon['askml'];
              if (this.bIncludePolygonAsSVG) aResult['assvg'] = aPointPolygon['assvg'];
              if (this.bIncludePolygonAsText) aResult['astext'] = aPointPolygon['astext'];

              if (aPointPolygon['centrelon'] !== null && aPointPolygon['centrelat'] !== null ){
                aResult['lat'] = aPointPolygon['centrelat'];
                aResult['lon'] = aPointPolygon['centrelon'];
              }

              if (this.bIncludePolygonAsPoints){
                // Translate geometary string to point array
                if (preg_match('#POLYGON\\(\\(([- 0-9.,]+)#',aPointPolygon['astext'],aMatch)){
                  preg_match_all('/(-?[0-9.]+) (-?[0-9.]+)/',aMatch[1],aPolyPoints,PREG_SET_ORDER);
                }else if (preg_match('#MULTIPOLYGON\\(\\(\\(([- 0-9.,]+)#',aPointPolygon['astext'],aMatch)){
                  preg_match_all('/(-?[0-9.]+) (-?[0-9.]+)/',aMatch[1],aPolyPoints,PREG_SET_ORDER);
                }else if (preg_match('#POINT\\((-?[0-9.]+) (-?[0-9.]+)\\)#',aPointPolygon['astext'],aMatch)){
                  fRadius = ;
                  iSteps = (fRadius * 40000)2;
                  fStepSize = (2*pi())/iSteps;
                  aPolyPoints = {};
                  (f = 0; f < 2*pi(); f += fStepSize)
                  {
                    aPolyPoints[] = {0:'',aMatch[1]+{fRadius*sin{f}},aMatch[2]+{fRadius*cos{f}}};
                  }
                  aPointPolygon['minlat'] = aPointPolygon['minlat'] - fRadius;
                  aPointPolygon['maxlat'] = aPointPolygon['maxlat'] + fRadius;
                  aPointPolygon['minlon'] = aPointPolygon['minlon'] - fRadius;
                  aPointPolygon['maxlon'] = aPointPolygon['maxlon'] + fRadius;
                }
              }

              // Output data suitable for display (points and a bounding box)
              if (this.bIncludePolygonAsPoints && (aPolyPoints)){
                aResult['aPolyPoints'] = {};
                for (var aPointVal in aPolyPoints) {
                  aPoint = aPolyPoints[aPointVal];
                  aResult['aPolyPoints'][] = {aPoint[1], aPoint[2]};
                }
              }
              aResult['aBoundingBox'] = {aPointPolygon['minlat'],aPointPolygon['maxlat'],aPointPolygon['minlon'],aPointPolygon['maxlon']};
            }
          }

          if (aResult['extra_place'] == 'city'){
            aResult['class'] = 'place';
            aResult['type'] = 'city';
            aResult['rank_search'] = 16;
          }

          if ((aResult['aBoundingBox'])){
            // Default
            fDiameter = 0.0001;

            if ((aClassType[aResult['class']+':'+aResult['type']+':'+aResult['admin_level']]['defdiameter']) && aClassType[aResult['class']+':'+aResult['type']+':'+aResult['admin_level']]['defdiameter']){
              fDiameter = aClassType[aResult['class']+':'+aResult['type']+':'+aResult['admin_level']]['defzoom'];
            }else if ((aClassType[aResult['class']+':'+aResult['type']]['defdiameter']) && aClassType[aResult['class']+':'+aResult['type']]['defdiameter']){
              fDiameter = aClassType[aResult['class']+':'+aResult['type']]['defdiameter'];
            }
            fRadius = fDiameter / 2;

            iSteps = max(8,min(100,fRadius *  * 100000));
            fStepSize = (2*pi())/iSteps;
            aPolyPoints = {};
            for(f = 0; f < 2*pi(); f += fStepSize){
              aPolyPoints[] = {0:'',aResult['lon']+{fRadius*sin{f}},aResult['lat']+{fRadius*cos{f}}};
            }
            aPointPolygon['minlat'] = aResult['lat'] - fRadius;
            aPointPolygon['maxlat'] = aResult['lat'] + fRadius;
            aPointPolygon['minlon'] = aResult['lon'] - fRadius;
            aPointPolygon['maxlon'] = aResult['lon'] + fRadius;

            // Output data suitable for display (points and a bounding box)
            if (this.bIncludePolygonAsPoints){
              aResult['aPolyPoints'] = {};
              for (var aPointVal in aPolyPoints) {
                aPoint = aPolyPoints[aPointVal];
                aResult['aPolyPoints'][] = {aPoint[1], aPoint[2]};
              }
            }
            aResult['aBoundingBox'] = {aPointPolygon['minlat'],aPointPolygon['maxlat'],aPointPolygon['minlon'],aPointPolygon['maxlon']};
          }

          // Is there an icon set for this type of result?
          if ((aClassType[aResult['class']+':'+aResult['type']]['icon']) && aClassType[aResult['class']+':'+aResult['type']]['icon']){
            aResult['icon'] = CONST_Website_BaseURL+'images/mapicons/'+aClassType[aResult['class']+':'+aResult['type']]['icon']+'.p.20.png';
          }

          if ((aClassType[aResult['class']+':'+aResult['type']+':'+aResult['admin_level']]['label']) && aClassType[aResult['class']+':'+aResult['type']+':'+aResult['admin_level']]['label']){
            aResult['label'] = aClassType[aResult['class']+':'+aResult['type']+':'+aResult['admin_level']]['label'];
          }else if ((aClassType[aResult['class']+':'+aResult['type']]['label']) && aClassType[aResult['class']+':'+aResult['type']]['label']){
            aResult['label'] = aClassType[aResult['class']+':'+aResult['type']]['label'];
          }

          if (this.bIncludeAddressDetails){
            aResult['address'] = getAddressDetails(this.oDB, sLanguagePrefArraySQL, aResult['place_id'], aResult['country_code']);
            if (aResult['extra_place'] == 'city' && (aResult['address']['city'])){
              aResult['address'] = array_merge({'city' : array_shift{array_values{aResult['address']}}}, aResult['address']};
            }
          }

          // Adjust importance for the number of exact string matches in the result
          aResult['importance'] = max(,aResult['importance']);
          iCountWords = 0;
          sAddress = aResult['langaddress'];
          for (var i in aRecheckWords) {
            sWord = aRecheckWords[i];
            if (stripos(sAddress, sWord)!==false){
              iCountWords++;
              if (preg_match(sWord, sAddress)) iCountWords += 0.1;
            }
          }

          aResult['importance'] = aResult['importance'] + (iCountWords*); // 0.1 is a completely arbitrary number but something in the range 0.1 to 0.5 would seem right

          aResult['name'] = aResult['langaddress'];
          // secondary ordering (for results with same importance (the smaller the better):
          //   - approximate importance of address parts
          aResult['foundorder'] = -aResult['addressimportance']/10;
          //   - number of exact matches from the query
          if ((this.exactMatchCache[aResult['place_id']])){
            aResult['foundorder'] -= this.exactMatchCache[aResult['place_id']];
          }else if ((this.exactMatchCache[aResult['parent_place_id']])){
            aResult['foundorder'] -= this.exactMatchCache[aResult['parent_place_id']];
          }
          //  - importance of the class/type
          if ((aClassType[aResult['class']+':'+aResult['type']]['importance']) && aClassType[aResult['class']+':'+aResult['type']]['importance']){
            aResult['foundorder'] = aResult['foundorder'] +  * aClassType[aResult['class']+':'+aResult['type']]['importance'];
          }else{
            aResult['foundorder'] = aResult['foundorder'] + ;
          }
          aSearchResults[iResNum] = aResult;
        }
        uasort(aSearchResults, 'byImportance');

        aOSMIDDone = {};
        aClassTypeNameDone = {};
        aToFilter = aSearchResults;
        aSearchResults = {};

        bFirst = true;
        for (var iResNum in aToFilter) {
          aResult = aToFilter[iResNum];
          if (aResult['type'] == 'adminitrative') aResult['type'] = 'administrative';
          this.aExcludePlaceIDs[aResult['place_id']] = aResult['place_id'];
          if (bFirst){
            fLat = aResult['lat'];
            fLon = aResult['lon'];
            if ((aResult['zoom'])) iZoom = aResult['zoom'];
            bFirst = false;
          }
          if (this.bDeDupe || ((aOSMIDDone[aResult['osm_type']+aResult['osm_id']]) && (aClassTypeNameDone[aResult['osm_type']+aResult['class']+aResult['type']+aResult['name']+aResult['admin_level']]))){
            aOSMIDDone[aResult['osm_type']+aResult['osm_id']] = true;
            aClassTypeNameDone[aResult['osm_type']+aResult['class']+aResult['type']+aResult['name']+aResult['admin_level']] = true;
            aSearchResults[] = aResult;
          }

          // Absolute limit on number of results
          if (sizeof(aSearchResults) >= this.iFinalLimit) break;
        }

        return aSearchResults;

      } // end lookup()

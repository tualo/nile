(function() {
  var EventEmitter, Geocode, Template,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  Template = require('tualo-template');

  module.exports = Geocode = (function(superClass) {
    extend(Geocode, superClass);

    function Geocode(options) {
      this.db = options.db;
      this.acceptedLanguages = ['de'];
      this.aPlaceID = [];
      this.bReverseInPlan = false;
      this.bIncludeNameDetails = false;
      this.bIncludeAddressDetails = false;
      this.bIncludeExtraTags = false;
      this.bIncludePolygonAsPoints = false;
      this.bIncludePolygonAsText = false;
      this.bIncludePolygonAsGeoJSON = false;
      this.bIncludePolygonAsKML = false;
      this.bIncludePolygonAsSVG = false;
      this.fPolygonSimplificationThreshold = 0.0;
      this.aExcludePlaceIDs = [];
      this.bDeDupe = true;
      this.bReverseInPlan = false;
      this.iLimit = 20;
      this.iFinalLimit = 10;
      this.iOffset = 0;
      this.bFallback = false;
      this.bBoundedSearch = false;
      this.aViewBox = false;
      this.sViewboxSmallSQL = false;
      this.sViewboxLargeSQL = false;
      this.aRoutePoints = false;
      this.iMaxRank = 20;
      this.iMinAddressRank = 0;
      this.iMaxAddressRank = 30;
      this.aAddressRankList = [];
      this.exactMatchCache = [];
      this.sAllowedTypesSQLList = false;
      this.sQuery = false;
      this.aStructuredQuery = false;
    }

    Geocode.prototype.setLanguagePreference = function(acceptedLanguages) {
      return this.acceptedLanguages = acceptedLanguages;
    };

    Geocode.prototype.setReverseInPlan = function(bReverseInPlan) {
      return this.bReverseInPlan = bReverseInPlan;
    };

    Geocode.prototype.setIncludeAddressDetails = function(bIncludeAddressDetails) {
      return this.bIncludeAddressDetails = bIncludeAddressDetails;
    };

    Geocode.prototype.getIncludeAddressDetails = function() {
      return this.bIncludeAddressDetails;
    };

    Geocode.prototype.getIncludeExtraTags = function() {
      return this.bIncludeAddressDetails;
    };

    Geocode.prototype.getIncludeNameDetails = function() {
      return this.bIncludeNameDetails;
    };

    Geocode.prototype.setIncludePolygonAsPoints = function(bIncludePolygonAsPoints) {
      return this.bIncludePolygonAsPoints = bIncludePolygonAsPoints;
    };

    Geocode.prototype.getIncludePolygonAsPoints = function() {
      return this.bIncludePolygonAsPoints;
    };

    Geocode.prototype.setIncludePolygonAsText = function(bIncludePolygonAsText) {
      return this.bIncludePolygonAsText = bIncludePolygonAsText;
    };

    Geocode.prototype.getIncludePolygonAsText = function() {
      return this.bIncludePolygonAsText;
    };

    Geocode.prototype.setIncludePolygonAsGeoJSON = function(bIncludePolygonAsGeoJSON) {
      return this.bIncludePolygonAsGeoJSON = bIncludePolygonAsGeoJSON;
    };

    Geocode.prototype.getIncludePolygonAsGeoJSON = function() {
      return this.bIncludePolygonAsGeoJSON;
    };

    Geocode.prototype.setIncludePolygonAsKML = function(bIncludePolygonAsKML) {
      return this.bIncludePolygonAsKML = bIncludePolygonAsKML;
    };

    Geocode.prototype.getIncludePolygonAsKML = function() {
      return this.bIncludePolygonAsKML;
    };

    Geocode.prototype.setIncludePolygonAsSVG = function(bIncludePolygonAsSVG) {
      return this.bIncludePolygonAsSVG = bIncludePolygonAsSVG;
    };

    Geocode.prototype.getIncludePolygonAsSVG = function() {
      return this.bIncludePolygonAsSVG;
    };

    Geocode.prototype.setPolygonSimplificationThreshold = function(fPolygonSimplificationThreshold) {
      return this.fPolygonSimplificationThreshold = fPolygonSimplificationThreshold;
    };

    Geocode.prototype.getPolygonSimplificationThreshold = function() {
      return this.fPolygonSimplificationThreshold;
    };

    Geocode.prototype.setDeDupe = function(bDeDupe) {
      return this.bDeDupe = bDeDupe;
    };

    Geocode.prototype.getDeDupe = function() {
      return this.bDeDupe;
    };

    Geocode.prototype.setLimit = function(iLimit) {
      if (iLimit > 50) {
        iLimit = 50;
      }
      if (iLimit < 1) {
        iLimit = 1;
      }
      this.iFinalLimit = iLimit;
      return this.iLimit = this.iFinalLimit + Math.min(this.iFinalLimit, 10);
    };

    Geocode.prototype.getLimit = function() {
      return this.iLimit;
    };

    Geocode.prototype.getFinalLimit = function() {
      return this.iFinalLimit;
    };

    Geocode.prototype.setOffset = function(iOffset) {
      return this.iOffset = iOffset;
    };

    Geocode.prototype.getOffset = function() {
      return this.iOffset;
    };

    Geocode.prototype.setFallback = function(bFallback) {
      return this.bFallback = bFallback;
    };

    Geocode.prototype.getFallback = function() {
      return this.bFallback;
    };

    Geocode.prototype.setExcludedPlaceIDs = function(a) {
      var el, i, ids, len;
      ids = [];
      for (i = 0, len = a.length; i < len; i++) {
        el = a[i];
        ids.push(parseInt(el));
      }
      return this.aExcludePlaceIDs = ids;
    };

    Geocode.prototype.getExcludedPlaceIDs = function() {
      return this.aExcludePlaceIDs;
    };

    Geocode.prototype.setBounded = function(bBoundedSearch) {
      if (bBoundedSearch == null) {
        bBoundedSearch = true;
      }
      return this.bBoundedSearch = bBoundedSearch;
    };

    Geocode.prototype.getBounded = function() {
      return this.bBoundedSearch;
    };

    Geocode.prototype.setViewBox = function(left, bottom, right, top) {
      return this.aViewBox = [left, bottom, right, top];
    };

    Geocode.prototype.getViewBox = function() {
      return this.aViewBox;
    };

    Geocode.prototype.getViewBoxString = function() {
      if (this.aViewBox === false) {
        return null;
      } else {
        return [this.aViewBox[0], this.aViewBox[3], this.aViewBox[2], this.aViewBox[1]].join(',');
      }
    };

    Geocode.prototype.setRoute = function(aRoutePoints) {
      return this.aRoutePoints = aRoutePoints;
    };

    Geocode.prototype.getRoute = function() {
      return this.aRoutePoints;
    };

    Geocode.prototype.setFeatureType = function(sFeatureType) {
      if (sFeatureType === 'country') {
        this.setRange(4, 4);
      }
      if (sFeatureType === 'state') {
        this.setRange(8, 8);
      }
      if (sFeatureType === 'city') {
        this.setRange(14, 16);
      }
      if (sFeatureType === 'settlement') {
        return this.setRange(8, 20);
      }
    };

    Geocode.prototype.setRankRange = function(min, max) {
      this.iMinAddressRank = min;
      return this.iMaxAddressRank = max;
    };

    Geocode.prototype.setNearPoint = function(aNearPoint, fRadiusDeg) {
      if (fRadiusDeg == null) {
        fRadiusDeg = 0.1;
      }
      return this.aNearPoint = [parseFloat(aNearPoint[0]), parseFloat(aNearPoint[1]), parseFloat(fRadiusDeg)];
    };

    Geocode.prototype.setCountryCodesList = function(list) {
      return this.countryCodes = list;
    };

    Geocode.prototype.setQuery = function(query) {
      return this.query = query;
    };

    Geocode.prototype.escapeString = function(str) {
      return str;
    };

    Geocode.prototype.getQuoted = function(list) {
      var i, item, len, result;
      result = [];
      for (i = 0, len = list.length; i < len; i++) {
        item = list[i];
        result.push('\'' + this.escapeString(item) + '\'');
      }
      return result;
    };

    Geocode.prototype.loadParamArray = function(params) {
      if (typeof params['addressdetails']) {
        return this.setIncludeAddressDetails(params['addressdetails']);
      }
    };

    Geocode.prototype.lookup = function() {
      var options, sAddressRankList, sImportanceSQL, sLanguagePrefArraySQL, sPlaceIDs, sSQL, sql, template;
      sLanguagePrefArraySQL = 'ARRAY[' + (this.getQuoted(this.acceptedLanguages)).join(',') + ']';
      sPlaceIDs = this.aPlaceID.join(',');
      sImportanceSQL = '';
      if (this.sViewboxSmallSQL) {
        sImportanceSQL += " case when ST_Contains(" + this.sViewboxSmallSQL + ", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * ";
      }
      if (this.sViewboxLargeSQL) {
        sImportanceSQL += " case when ST_Contains(" + this.sViewboxLargeSQL + ", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * ";
      }
      sAddressRankList = this.aAddressRankList.join(',');
      sSQL = "select\n  osm_type,\n  osm_id,\n  class,\n  type,\n  admin_level,\n  rank_search,\n  rank_address,\n  min(place_id) as place_id,\n  min(parent_place_id) as parent_place_id,\n  calculated_country_code as country_code,\n  get_address_by_language(place_id, {sLanguagePrefArraySQL}) as langaddress,\n  get_name_by_language(name, {sLanguagePrefArraySQL}) as placename,\n  get_name_by_language(name, ARRAY['ref']) as ref,\n  <if term=\"istrue(bIncludeExtraTags)\">\n  hstore_to_json(extratags)::text as extra,\n  </if>\n  <if term=\"istrue(bIncludeNameDetails)\">\n  hstore_to_json(name)::text as names,\n  </if>\n  avg(ST_X(centroid)) as lon,avg(ST_Y(centroid)) as lat,\n  {sImportanceSQL}coalesce(importance,0.75-(rank_search::float/40)) as importance,\n  (select max(p.importance*(p.rank_address+2)) from place_addressline s, placex p where s.place_id = min(CASE WHEN placex.rank_search < 28 THEN placex.place_id ELSE placex.parent_place_id END) and p.place_id = s.address_place_id and s.isaddress and p.importance is not null) as addressimportance,\n  (extratags->'place') as extra_place\nfrom placex where place_id in ({sPlaceIDs})\n  and (\n    placex.rank_address between {iMinAddressRank} and {iMaxAddressRank}\n    <if term=\"between(14,iMinAddressRank,iMaxAddressRank)\">\n    OR (extratags->'place') = 'city'\n    </if>\n    <if term=\"isset(aAddressRankList)\">\n    OR placex.rank_address in ({sAddressRankList})\n    </if>\n  )\n  <if term=\"isset(sAllowedTypesSQLList)\">\n    and placex.class in {sAllowedTypesSQLList}\n  </if>\n  and linked_place_id is null\ngroup by\n  osm_type,\n  osm_id,\n  class,\n  type,\n  admin_level,\n  rank_search,\n  rank_address,\n  calculated_country_code,\n  importance,\n  <if term=\"istrue(bDeDupe)\">\n    place_id,\n  </if>\n  langaddress,\n  placename,\n  ref,\n  <if term=\"istrue(bIncludeExtraTags)\">\n  extratags,\n  </if>\n  <if term=\"istrue(bIncludeNameDetails)\">\n   name,\n  </if>\n  extratags->'place'";
      template = new Template(sSQL);
      template.ctx.def('compare', function(a, b) {
        return a === b;
      });
      template.ctx.def('between', function(v, a, b) {
        return v >= a && v <= b;
      });
      template.ctx.def('isset', function(a) {
        var result;
        result = false;
        if (typeof a === 'object' && a.length > 0) {
          result = true;
        }
        if (typeof a === 'string') {
          result = true;
        }
        return result;
      });
      template.ctx.def('istrue', function(a) {
        var result;
        result = false;
        if (a === true) {
          result = true;
        }
        return result;
      });
      options = {
        aAddressRankList: this.aAddressRankList && this.aAddressRankList.length > 0,
        sAddressRankList: sAddressRankList,
        sPlaceIDs: sPlaceIDs,
        sImportanceSQL: sImportanceSQL,
        sLanguagePrefArraySQL: sLanguagePrefArraySQL,
        bIncludeNameDetails: this.bIncludeNameDetails,
        bIncludeExtraTags: this.bIncludeExtraTags,
        sAllowedTypesSQLList: this.sAllowedTypesSQLList,
        iMinAddressRank: this.iMinAddressRank,
        iMaxAddressRank: this.iMaxAddressRank,
        bDeDupe: this.bDeDupe
      };
      sql = template.render(options);
      return console.log(sql);
    };

    return Geocode;

  })(EventEmitter);

}).call(this);

(function() {
  var EventEmitter, Geocode, Template, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs');

  EventEmitter = require('events').EventEmitter;

  Template = require('tualo-template');

  module.exports = Geocode = (function(superClass) {
    extend(Geocode, superClass);

    function Geocode(db) {
      this.db = db;
      this.langPrefOrder = [];
      this.includeAddressDetails = false;
      this.includePolygonAsText = false;
      this.includePolygonAsPoints = false;
      this.includePolygonAsGeoJSON = false;
      this.includePolygonAsKML = false;
      this.includePolygonAsSVG = false;
      this.includePolygonAsPoints = false;
      this.polygonSimplificationThreshold = 0.0;
      this.excludePlaceIDs = [];
      this.deDupe = true;
      this.reverseInPlan = false;
      this.limit = 20;
      this.finalLimit = 10;
      this.offset = 0;
      this.fallback = false;
      this.countryCodes = false;
      this.nearPoint = false;
      this.boundedSearch = false;
      this.viewBox = [0, 0, 0, 0];
      this.viewboxSmallSQL = false;
      this.viewboxLargeSQL = false;
      this.routePoints = false;
      this.maxRank = 20;
      this.minAddressRank = 0;
      this.maxAddressRank = 30;
      this.addressRankList = [];
      this.exactMatchCache = [];
      this.allowedTypesSQLList = false;
      this.query = false;
      this.structuredQuery = {};
      this.aPlaceID = [];
    }

    Geocode.prototype.setReverseInPlan = function(val) {
      return this.reverseInPlan = val;
    };

    Geocode.prototype.setLanguagePreference = function(val) {
      return this.langPrefOrder = val;
    };

    Geocode.prototype.setIncludeAddressDetails = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.includeAddressDetails = val;
    };

    Geocode.prototype.getIncludeAddressDetails = function() {
      return this.includeAddressDetails;
    };

    Geocode.prototype.setIncludePolygonAsPoints = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.includePolygonAsPoints = val;
    };

    Geocode.prototype.getIncludePolygonAsPoints = function() {
      return this.includePolygonAsPoints;
    };

    Geocode.prototype.setIncludePolygonAsText = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.includePolygonAsText = val;
    };

    Geocode.prototype.getIncludePolygonAsText = function() {
      return this.includePolygonAsText;
    };

    Geocode.prototype.setIncludePolygonAsJSON = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.includePolygonAsJSON = val;
    };

    Geocode.prototype.getIncludePolygonAsJSON = function() {
      return this.includePolygonAsJSON;
    };

    Geocode.prototype.setIncludePolygonAsKML = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.includePolygonAsKML = val;
    };

    Geocode.prototype.getIncludePolygonAsKML = function() {
      return this.includePolygonAsKML;
    };

    Geocode.prototype.setIncludePolygonAsSVG = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.includePolygonAsSVG = val;
    };

    Geocode.prototype.getIncludePolygonAsSVG = function() {
      return this.includePolygonAsSVG;
    };

    Geocode.prototype.setPolygonSimplificationThreshold = function(val) {
      return this.polygonSimplificationThreshold = val;
    };

    Geocode.prototype.getPolygonSimplificationThreshold = function() {
      return this.polygonSimplificationThreshold;
    };

    Geocode.prototype.setDeDupe = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.deDupe = val;
    };

    Geocode.prototype.getDeDupe = function() {
      return this.deDupe;
    };

    Geocode.prototype.setLimit = function(val) {
      if (typeof val === 'undefined') {
        val = 10;
      }
      if (val < 1) {
        val = 1;
      }
      if (val > 50) {
        val = 50;
      }
      this.finalLimit = val;
      return this.limit = this.finalLimit + Math.min(this.finalLimit, 10);
    };

    Geocode.prototype.getLimit = function() {
      return this.limit;
    };

    Geocode.prototype.getFinalLimit = function() {
      return this.finalLimit;
    };

    Geocode.prototype.setOffset = function(val) {
      return this.offset = val;
    };

    Geocode.prototype.getOffet = function() {
      return this.offset;
    };

    Geocode.prototype.setFallback = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.fallback = val;
    };

    Geocode.prototype.getFallback = function() {
      return this.fallback;
    };

    Geocode.prototype.setExcludedPlaceIDs = function(val) {
      var j, len, results1, v;
      this.excludePlaceIDs = [];
      results1 = [];
      for (j = 0, len = val.length; j < len; j++) {
        v = val[j];
        if (!isNaN(v)) {
          results1.push(this.excludePlaceIDs.push(v));
        }
      }
      return results1;
    };

    Geocode.prototype.getExcludedPlaceIDs = function() {
      return this.excludePlaceIDs;
    };

    Geocode.prototype.setBounded = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.boundedSearch = val;
    };

    Geocode.prototype.getBounded = function() {
      return this.boundedSearch;
    };

    Geocode.prototype.setViewBox = function(fLeft, fBottom, fRight, fTop) {
      fLeft = parseFloat(fLeft);
      fBottom = parseFloat(fBottom);
      fRight = parseFloat(fRight);
      fTop = parseFloat(fTop);
      return this.viewBox = [fLeft, fBottom, fRight, fTop];
    };

    Geocode.prototype.getViewBoxString = function() {
      var v;
      v = this.viewBox[0] + '.' + this.viewBox[3] + '.' + this.viewBox[2] + '.' + this.viewBox[1];
      return v;
    };

    Geocode.prototype.setRoute = function(val) {
      if (typeof val === 'undefined') {
        val = true;
      }
      return this.routePoints = val;
    };

    Geocode.prototype.getRoute = function() {
      return this.routePoints;
    };

    Geocode.prototype.setFeatureType = function(featureType) {
      if (featureType === 'country') {
        this.setRankRange(4, 4);
      }
      if (featureType === 'state') {
        this.setRankRange(8, 8);
      }
      if (featureType === 'city') {
        this.setRankRange(14, 16);
      }
      if (featureType === 'settlement') {
        return this.setRankRange(8, 20);
      }
    };

    Geocode.prototype.setRankRange = function(min, max) {
      this.minAddressRank = parseInt(min);
      return this.maxAddressRank = parseInt(max);
    };

    Geocode.prototype.setNearPoint = function(nearPoint, radiusDeg) {
      if (typeof radiusDeg === 'undefined') {
        radiusDeg = 0.1;
      }
      return this.nearPoint = [parseFloat(nearPoint[0]), parseFloat(nearPoint[1]), parseFloat(radiusDeg)];
    };

    Geocode.prototype.setCountryCodesList = function(list) {
      return this.countryCodes = list;
    };

    Geocode.prototype.setQuery = function(query) {
      this.query = query;
      return this.structuredQuery = false;
    };

    Geocode.prototype.getQueryString = function() {
      return this.query;
    };

    Geocode.prototype.loadParamArray = function(options) {
      var j, len, p, prevCoord, route, v;
      if (options.addressdetails) {
        this.setIncludeAddressDetails(options.addressdetails);
      }
      if (options.bounded) {
        this.setBounded(options.bounded);
      }
      if (options.dedupe) {
        this.setDeDupe(options.dedupe);
      }
      if (options.limit) {
        this.setLimit(options.limit);
      }
      if (options.offset) {
        this.setOffset(options.offset);
      }
      if (options.fallback) {
        this.setFallback(options.fallback);
      }
      if (options.exclude_place_ids) {
        this.setExcludedPlaceIDs(options.exclude_place_ids.split(','));
      }
      if (options.featureType) {
        this.setFeatureType(options.featureType);
      }
      if (options.countrycodes) {
        this.setCountryCodesList(options.countrycodes.split(','));
      }
      if (options.viewboxlbrt) {
        v = options.viewboxlbrt.split(',');
        this.setViewBox(v[0], v[1], v[2], v[3]);
      }
      if (options.viewbox) {
        v = options.viewbox.split(',');
        this.setViewBox(v[0], v[3], v[2], v[1]);
      }
      if (options.route && options.routewidth) {
        v = options.route.split(',');
        if (v.length % 2 === 0) {
          prevCoord = false;
          route = [];
          for (j = 0, len = v.length; j < len; j++) {
            p = v[j];
            if (i % 2 === 1) {
              route.push([p, prevCoord]);
            } else {
              prevCoord = p;
            }
          }
          this.setRoutePoints(route);
          return setQueryFromParams;
        } else {
          return this.emit('error', 'uneven route point number');
        }
      }
    };

    Geocode.prototype.setQueryFromParams = function(options) {
      if (options.q) {
        return this.setQuery(options.q);
      } else {
        this.setStructuredQuery(options['amenity'], options['street'], options['city'], options['county'], options['state'], options['country'], options['postalcode']);
        return this.setReverseInPlan(false);
      }
    };

    Geocode.prototype.loadStructuredAddressElement = function(value, key, min, max, list) {
      var result;
      result = false;
      if (value) {
        value = value.trim();
        this.structuredQuery[key] = value;
        if (this.minAddressRank === 0 && this.maxAddressRank === 30) {
          this.minAddressRank = min;
          this.maxAddressRank = max;
        }
        if (options.list) {
          this.addressRankList = this.addressRankList.concat(list);
        }
        result = true;
      }
      return result;
    };

    Geocode.prototype.setStructuredQuery = function(amentiy, street, city, county, state, country, postalCode) {
      var name;
      if (amentiy == null) {
        amentiy = false;
      }
      if (street == null) {
        street = false;
      }
      if (city == null) {
        city = false;
      }
      if (county == null) {
        county = false;
      }
      if (state == null) {
        state = false;
      }
      if (country == null) {
        country = false;
      }
      if (postalCode == null) {
        postalCode = false;
      }
      this.query = false;
      this.minAddressRank = 0;
      this.maxAddressRank = 30;
      this.addressRankList = [];
      this.structuredQuery = {};
      this.allowedTypesSQLList = '';
      this.loadStructuredAddressElement(amentiy, 'amenity', 26, 30, false);
      this.loadStructuredAddressElement(street, 'street', 26, 30, false);
      this.loadStructuredAddressElement(city, 'city', 14, 24, false);
      this.loadStructuredAddressElement(county, 'county', 9, 13, false);
      this.loadStructuredAddressElement(state, 'state', 8, 8, false);
      this.loadStructuredAddressElement(postalCode, 'postalcode', 5, 11, [5, 11]);
      this.loadStructuredAddressElement(country, 'country', 4, 4, false);
      if (Object.keys(this.structuredQuery).length > 0) {
        for (name in this.structuredQuery) {
          if (this.query !== false) {
            this.query += ', ';
          }
          this.query += name;
        }
        if (this.maxAddressRank < 30) {
          return this.allowedTypesSQLList = '(\'place\',\'boundary\')';
        }
      }
    };

    Geocode.prototype.fallbackStructuredQuery = function() {
      var j, len, orderToFallback, result, type;
      result = false;
      if (this.structuredQuery === false) {
        result = false;
      } else {
        if (Object.keys(this.structuredQuery).length > 1) {
          orderToFallback = ['postalcode', 'street', 'city', 'county', 'state'];
          for (j = 0, len = orderToFallback.length; j < len; j++) {
            type = orderToFallback[j];
            if (this.structuredQuery[type]) {
              this.setStructuredQuery(this.structuredQuery['amenity'], this.structuredQuery['street'], this.structuredQuery['city'], this.structuredQuery['county'], this.structuredQuery['state'], this.structuredQuery['country'], this.structuredQuery['postalcode']);
              result = true;
            }
          }
        } else {
          result = false;
        }
      }
      return result;
    };

    Geocode.prototype.escapeString = function(str) {
      return str;
    };

    Geocode.prototype.getQuoted = function(list) {
      var item, j, len, result;
      result = [];
      for (j = 0, len = list.length; j < len; j++) {
        item = list[j];
        result.push('\'' + this.escapeString(item) + '\'');
      }
      return result;
    };

    Geocode.prototype.getNumbers = function(list) {
      var item, j, len, result;
      result = [];
      for (j = 0, len = list.length; j < len; j++) {
        item = list[j];
        result.push(parseInt(item));
      }
      return result;
    };

    Geocode.prototype.getDetails = function(ids) {
      this.currentIDS = ids;
      return fs.readFile(path.join(__dirname, '..', '..', 'sql', 'query', 'templates', 'detail.sql'), (function(_this) {
        return function(err, data) {
          return _this.onLoadDetailScript(err, data);
        };
      })(this));
    };

    Geocode.prototype.onLoadDetailScript = function(err, data) {
      var importanceSQL, languagePrefArraySQL, options, placeIDs, quotedPref, sql, template;
      quotedPref = this.getQuoted(this.langPrefOrder);
      languagePrefArraySQL = 'ARRAY[' + quotedPref + ']';
      placeIDs = this.getNumbers(this.currentIDS);
      importanceSQL = '';
      if (this.viewboxSmallSQL !== false) {
        importanceSQL += ' case when ST_Contains(' + this.viewboxSmallSQL + ', ST_Collect(centroid)) THEN 1 ELSE 0.75 END * ';
      }
      if (this.viewboxLargeSQL !== false) {
        importanceSQL += ' case when ST_Contains(' + this.viewboxLargeSQL + ', ST_Collect(centroid)) THEN 1 ELSE 0.75 END * ';
      }
      template = new Template(data.toString('utf-8'));
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
        languagePrefArraySQL: languagePrefArraySQL,
        placeIDs: placeIDs.join(', '),
        importanceSQL: importanceSQL,
        minAddressRank: this.minAddressRank,
        maxAddressRank: this.maxAddressRank,
        allowedTypesSQLList: this.allowedTypesSQLList,
        addressRankList: this.addressRankList.join(','),
        gDeDupe: this.getDeDupe() ? ',place_id' : ''
      };
      sql = template.render(options);
      return this.db.query(sql, (function(_this) {
        return function(err, results) {
          return _this.onGetDetails(err, results);
        };
      })(this));
    };

    Geocode.prototype.onGetDetails = function(err, results) {
      if (err) {
        return this.emit('error', err);
      } else {
        return this.emit('details', results);
      }
    };

    Geocode.prototype.getDBQuotedArray = function(a) {
      var el, j, len, res;
      res = [];
      for (j = 0, len = a.length; j < len; j++) {
        el = a[j];
        res.push(el);
      }
      return res;
    };

    Geocode.prototype.lookup = function() {
      var aAddressRankList, sAddressRankList, sImportanceSQL, sLanguagePrefArraySQL, sPlaceIDs, sSQL, sql, template;
      sLanguagePrefArraySQL = 'ARRAY[' + (this.getQuoted(this.langPrefOrder)).join(',') + ']';
      sPlaceIDs = this.aPlaceID.join(',');
      sImportanceSQL = '';
      if (this.sViewboxSmallSQL) {
        sImportanceSQL += " case when ST_Contains(" + this.sViewboxSmallSQL + ", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * ";
      }
      if (this.sViewboxLargeSQL) {
        sImportanceSQL += " case when ST_Contains(" + this.sViewboxLargeSQL + ", ST_Collect(centroid)) THEN 1 ELSE 0.75 END * ";
      }
      aAddressRankList = [];
      sAddressRankList = aAddressRankList.join(',');
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
      sql = template.render(this);
      return console.log(sql);
    };

    return Geocode;

  })(EventEmitter);

}).call(this);

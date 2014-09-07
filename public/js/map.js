var map = new ol.Map({
  target: 'map',
  layers: [
/*
  new ol.layer.Tile({
    source: new ol.source.OSM({
      attributions: [
        new ol.Attribution({
          html: 'Tiles &copy; <a href="http://www.opencyclemap.org/">' +
              'OpenCycleMap</a>'
        }),
        ol.source.OSM.DATA_ATTRIBUTION
      ],
      url: 'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
    })
  }),
*/
/*
  new ol.layer.Tile({
    source: new ol.source.XYZ({url: './live/osmosnimki/{z}/{x}/{y}.png'})
  }),
*/
  new ol.layer.Tile({
    source: new ol.source.XYZ({url: './live/mapnik/{z}/{x}/{y}.png'})
  }),
/*
  new ol.layer.Tile({
    source: new ol.source.XYZ({url: './live/surface/{z}/{x}/{y}.png'})
  }),
*/
  ],
  view: new ol.View({
    //center: ol.proj.transform([50.973610598531593,10.959229523117047], 'EPSG:4326', 'EPSG:3857'),
    center: [1229413.1629387736,6616694.916475148],
//    center: new ol.LonLat( 50.973610598531593,10.959229523117047 ),
    projection: 'EPSG:3857',
    zoom: 15,
    maxZoom: 23,
    minZoom: 10
  })

});

if (false){
var map = new ol.Map({
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM({
        attributions: [
          new ol.Attribution({
            html: 'Tiles &copy; <a href="http://www.opencyclemap.org/">' +
                'OpenCycleMap</a>'
          }),
          ol.source.OSM.DATA_ATTRIBUTION
        ],
        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
      })
    }),
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        //attributions: [attribution],
        url: 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png'
      })
    })
  ],
  view: new ol.View({
    center: [-472202, 7530279],
    zoom: 12
  })
});
}

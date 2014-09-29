var layers = [
  {
    title: 'Clean',
    style: 'clean',
    visible: false
  },
  {
    title: 'Standard',
    style: 'mystyle',
    visible: true
  },
  {
    title: 'Gebäude',
    style: 'buildings',
    visible: false
  },

  {
    title: 'Strassen-Tags',
    style: 'highwayhelper',
    visible: false
  },
  {
    title: 'Gebäude-Tags',
    style: 'buildinghelper',
    visible: false
  },
  {
    title: 'Wasser-Tags',
    style: 'waterhelper',
    visible: false
  },
  {
    title: 'Grenz-Tags',
    style: 'boundaryhelper',
    visible: false
  },
  {
    title: 'Postleitzahlen-Tags',
    style: 'postalcodehelper',
    visible: false
  },
  {
    title: 'Eisenbahn-Tags',
    style: 'railwayhelper',
    visible: false
  },
  {
    title: 'amenity-Tags',
    style: 'amenityhelper',
    visible: false
  },
  {
    title: 'natural-Tags',
    style: 'naturalhelper',
    visible: false
  }
];

/*
var source = new ol.source.Vector();
var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 255, 255, 0.6)',
      width: 5
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});
*/

var createPolygonStyleFunction = function() {
  return function(feature, resolution) {
    var style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 255, 0.3)',
        width: 5
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 0, 255, 0.1)'
      }),
      //text: createTextStyle(feature, resolution, myDom.polygons)
    });
    return [style];
  };
};

function fillLayerList (layers){
  var i,res = [];
  for(i = 0; i<layers.length; i++){

    layers[i].layer = new ol.layer.Tile({
      //opacity: 0.5,
      visible: layers[i].visible,
      source: new ol.source.XYZ(
        {
          url: './-/'+layers[i].style+'/{z}/{x}/{y}.png',
          //tilePixelRatio: 2, // THIS IS IMPORTANT
          attributions: [
            new ol.Attribution({
              html: layers[i].title+' Tiles &copy; <a target="_blank" href="http://www.tualo.de/">tualo</a>'
            })
          ]
        }
      )
    });
    res.push( layers[i].layer );


  }

  res.push(
    new ol.layer.Vector({
      source: new ol.source.GeoJSON({
        url: '/road'
      }),
      style: createPolygonStyleFunction()
    })
  );

  //res.push(vector);
  return res;
}



var map = new ol.Map({
  target: 'map',

  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  }).extend(
    [
      new ol.control.ScaleLine(),
      new ol.control.MousePosition(),
      //new ol.control.Control({element: document.getElementById('control')}),
      new LayerSwitcher({
        autoHide: false
      }),
      new ZoomDisplay({
        autoHide: false
      })
    ]
  ),

  layers: fillLayerList(layers),
  view: new ol.View({
    center: [1229413.1629387736,6616694.916475148],
    projection: 'EPSG:3857',
    zoom: 16,
    maxZoom: 23,
    minZoom: 5
  })

});

/*
var feature = new ol.Feature({
  geometry: new ol.geom.LineString([[1228452.05,6617444.43],[1228440.74,6617469.61],[1228426.32,6617505.95],[1228420.51,6617520.99],
  [1228405.66,6617564.29],[1228391.27,6617606.23],[1228384.62,6617624.71]]),
  labelPoint: new ol.geom.Point([1228391.27,6617606.23]),
  name: 'My Polygon'
});
source.addFeature(feature);
*/

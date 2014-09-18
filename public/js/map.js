var layers = [
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


function fillLayerList (layers){
  var i,res = [];
  for(i = 0; i<layers.length; i++){

    layers[i].layer = new ol.layer.Tile({
      //opacity: 0.5,
      visible: layers[i].visible,
      source: new ol.source.XYZ(
        {
          url: './-/'+layers[i].style+'/{z}/{x}/{y}.png',
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
  return res;
}


/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
var LayerSwitcher = function(opt_options) {
  var options = opt_options || {},
      form = document.createElement('form'),
      i,
      input,
      field,
      self = this;

  field = document.createElement('h1');
  field.innerHTML = "Ebenen";
  form.appendChild(field);

  for(i = 0; i<layers.length; i++){
    field = document.createElement('p');
    field.innerHTML = layers[i].title;
    input = document.createElement('input');
    input.setAttribute('type','checkbox');
    input.setAttribute('name','layerswitcher-'+layers[i].style);
    input.setAttribute('value',layers[i].style);
    if (layers[i].visible){
      input.setAttribute('checked','checked');
    }
    input.targetLayer = layers[i].layer;
    input.addEventListener('change',function(evt){
      for(var i = 0; i<layers.length; i++){
        if (layers[i].style === evt.srcElement.defaultValue){
          layers[i].layer.setVisible(evt.srcElement.checked);
        }
      }
    });
    field.appendChild(input);
    form.appendChild(field);
  }


  var element = document.createElement('div');
  element.className = 'ol-layerswitcher ol-unselectable ol-control';
  element.appendChild(form);
  //element.innerHTML = "TEXT";
  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};

ol.inherits(LayerSwitcher, ol.control.Control);


var map = new ol.Map({
  target: 'map',

  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  }).extend(
    [
      new ol.control.ScaleLine(),
      //new ol.control.MousePosition(),
      //new ol.control.Control({element: document.getElementById('control')}),
      new LayerSwitcher({
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

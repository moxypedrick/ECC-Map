(function(){

var bounds = [
    [-87.010452, 29.537327],
    [-79.771171, 36.210589] 
  ];

mapboxgl.accessToken = 'pk.eyJ1IjoibW94eXBlZCIsImEiOiJjaWgydGpwdmYweHJydnFtMzZzOXpmNjg3In0.5TXWYv0Z7nsOZHneIQOhxg';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/moxyped/cjn6fq1br115i2snaywee8zce',
    center: [-84.380378, 33.767279],
    zoom: 4,
    maxBounds: bounds,
    customAttribution: ['<a href=https://atlantaregional.org/ target=_blank>Atlanta Regional Commission</a>','<a href=https://www.epa.gov/eco-research/ecoregions target=_blank>EPA Eco-Regions</a>','<a href=https://hdsc.nws.noaa.gov/hdsc/pfds/pfds_map_cont.html?bkmrk=ga target=_blank>NOAA - Storm Data</a>', '<a href=https://www.epa.gov/watersense/water-budget-data-finder target=_blank>EPA - ETP</a>']
});


map.on('load', function() {
  map.addSource('soGeorgia', {
    'type' : 'geojson',
    'data' : 'data/S_Georgia.geojson' 
  })

  map.addLayer({'id' : 'soGeorgiaLayer',
    'type' : 'fill',
    'source': 'soGeorgia', 
    'paint' : {
      'fill-color':'#dbdbdb',
      'fill-opacity':0.01,
      'fill-outline-color' : '#000000'    
    }
  })

  map.addSource('noGeorgia', {
    'type' : 'geojson',
    'data' : 'data/N_Georgia.geojson' 
  })

  map.addLayer({'id' : 'noGeorgiaLayer',
    'type' : 'fill',
    'source': 'noGeorgia', 
    'paint' : {
      'fill-color':'#dbdbdb',
      'fill-opacity':0.01,
      'fill-outline-color' : '#000000'    
    }
  }, 'soGeorgiaLayer')

   map.addSource('isochrone', {
    'type' : 'geojson',
    'data' : 'https://api.mapbox.com/isochrone/v1/mapbox/walking/-84.380378,33.767279?contours_minutes=5,10&contours_colors=6706ce,04e813&polygons=true&access_token=pk.eyJ1IjoibW94eXBlZCIsImEiOiJjaWgydGpwdmYweHJydnFtMzZzOXpmNjg3In0.5TXWYv0Z7nsOZHneIQOhxg' 
  })
 
  map.addLayer({'id' : 'isochroneLayer',
    'type' : 'fill',
    'source': 'isochrone', 
    'paint' : {
      'fill-color':'#00adc5',
      'fill-opacity':0.1,
      'fill-outline-color' : '#000000' 
    }
  }, 'noGeorgiaLayer')

});

map.on('click','soGeorgiaLayer', function(e){
  var features = map.queryRenderedFeatures(e.point);
  console.log(e);
  updateArea(features);
})



map.on('click','noGeorgiaLayer', function(e){
   var features = map.queryRenderedFeatures(e.point);
  updateArea(features);
  //console.log(features);
})

var draw = new MapboxDraw({
    displayControlsDefault: false,

    controls: {
      point: true,
      polygon: true,
      trash: true
    }
});

function updateArea(e){
  var features = e;
  document.getElementById('netET').innerHTML = features[0].properties.Net_ET;
  document.getElementById('oneYear').innerHTML = features[0].properties.Inches_2;
  document.getElementById('ecoRegion').innerHTML = features[0].properties.NA_L3NAME;
  document.getElementById('jobs2housing').innerHTML = features[0].properties.Job2House;
}

map.addControl(new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    country: 'us',
    region: 'Georgia',
    bbox:  [-86.010452, 30.537327, -80.771171, 35.210589] ,
}), 'top-right');

map.on('click', function(e){
  if(event.altKey){
    console.log("The alt was pressed!")
    var urlIsochrone = 'https://api.mapbox.com/isochrone/v1/mapbox/walking/'+e.lngLat.lng+','+e.lngLat.lat+'?contours_minutes=5,10&contours_colors=6706ce,04e813&polygons=true&access_token=pk.eyJ1IjoibW94eXBlZCIsImEiOiJjaWgydGpwdmYweHJydnFtMzZzOXpmNjg3In0.5TXWYv0Z7nsOZHneIQOhxg'
    map.getSource('isochrone').setData(urlIsochrone);
  } 
});

var scale = new mapboxgl.ScaleControl({
    maxWidth: 100,
    unit: 'imperial'
});
map.addControl(scale, 'bottom-right');
scale.setUnit('imperial');
map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(draw, 'top-right');

function addFields(){
  var number = draw.getAll().features.length;
  var json = draw.getAll().features;

  var container = document.getElementById("user-input-container");
    while (container.hasChildNodes()) {
      container.removeChild(container.lastChild);
    }
    for (i=0;i<number;i++){
      container.appendChild(document.createTextNode("Feature " + (i+1) + (" ")));
      var feature_id = "Feature_"+(i+1);
      var input = document.createElement("input");
      input.type = "text";
      input.id = feature_id;
      input.value = json[i].id;
      container.appendChild(input);
      container.appendChild(document.createElement("br"));
    }
}

})();

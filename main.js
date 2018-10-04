/*globals L GlobalMercator MA */

(function(){
      
  var zoom = 14,
      maxCost = 800,
      sidePx = 800,
      halfSidePx = sidePx/2,
      gm = new GlobalMercator(),
      map = L.map('map'),
      layerUrl = 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYXRvZ2xlIiwiYSI6InBDWEFUY3cifQ.0XD7J9ZuFNLrmuNpuKlcnQ',
      attribution = 'Map data &copy; OpenStreetMap contributors, CC-BY-SA <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>',
      layer = L.tileLayer(layerUrl, {maxZoom: 17, attribution: attribution, subdomains: 'abcd'}),
      canvasLayer;

  map
    .setView([32.89, -83.71], 6)
    .addLayer(layer);

  var info = L.control();

  info.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info');
		this.update();
		return this._div;
	};

  info.update = function (props) {
		this._div.innerHTML = '<h4>EarthCraft Communities</h4>' +  (props ?
			props.Job2House + ' Jobs / House'+ '</b><br />' + props.Net_ET + ' Net Evapotranspiration'+ '</b><br />' + props.Inches_2 + ' 1-year 24-hour storm'+ '</b><br />' + props.NA_L3NAME + ' Eco-Region'+ '</b><br />'
			: 'Hover over a local');
	};

	info.addTo(map);

  function resetHighlight(e) {
    info.update = function (props) {
		this._div.innerHTML = '<h4>EarthCraft Communities</h4>' + 'Hover over a local'
	};
  }

	function highlightFeature(e) {
		var layer = e.target;
		info.update(layer.feature.properties);
	}

	var geojson;

	function onEachFeature(feature, layer) {
		layer.on({
     click: highlightFeature,
     mouseover: highlightFeature,
     // mouseout: resetHighlight
		});
	}

  var myStyle = {
    "color": "#ff7800",
    "weight": 1,
    "opacity": 0.1, 
    "fill":false,
    "fillOpacity": 0.1//,
    //"fillColor":*//,
    //"fill": false
  };

  var url2 = "https://rawgit.com/moxypedrick/ECC-Map/master/S_Georgia.geojson"

  geojson = d3.json(url2, function(err, geojson){
      L.geoJson(geojson, {
      style: myStyle,
      onEachFeature : onEachFeature}).addTo(map);
  })

  var url3 = "https://rawgit.com/moxypedrick/ECC-Map/master/N_Georgia.geojson"

  geojson3 = d3.json(url3, function(err, geojson){
      L.geoJson(geojson, {
      style: myStyle,
      onEachFeature : onEachFeature}).addTo(map);
  })
/*
  var url4 = "https://rawgit.com/moxypedrick/ECC-Map/master/SE%20Georgia.geojson"

  geojson4 = d3.json(url4, function(err, geojson){
      L.geoJson(geojson, {
      style: myStyle,
      onEachFeature : onEachFeature}).addTo(map);
  })

  var url1 = "https://rawgit.com/moxypedrick/ECC-Map/master/NW%20Georgia.geojson"

  geojson = d3.json(url1, function(err, geojson){
      L.geoJson(geojson, {
      style: myStyle,
      onEachFeature : onEachFeature}).addTo(map);
  })*/




 /// Stuff for walkshed
  function to2D(array1D, width) {
    var array2D = [],
        i;

    for(i=0; i<width; i++) {
      array2D[i] = Array.prototype.slice.call(array1D, i*width, i*width+width);
    }

    return array2D;
  }

  function getColor(percentage) {
    if (percentage <= 0.2) {
      return [26,150,65,200];
    } else if (percentage <= 0.4) {
      return [166,217,106,200];
    } else if (percentage <= 0.6) {
      return [255,255,191,200];
    } else if (percentage <= 0.8) {
      return [253,174,97,200];
    } else if (percentage <= 0.999) {
      return [244,109,67,200];
    } else {
      return [0,0,0,0];
    }
  }

  function draw(frictionCanvas, mapCanvas, sourcePixel) {
    var mapCtx = mapCanvas.getContext('2d'),
        frictionCtx = frictionCanvas.getContext('2d'),
        w = frictionCanvas.width,
        h = frictionCanvas.height,
        frictionImageData = frictionCtx.getImageData(0, 0, w, h),
        data = frictionImageData.data,
        frictionRaster = [],
        cdData = [],
        sourceRaster = to2D([], w),
        row, col, i, n,
        red, green, blue, alpha, pixel, color,
        costDistanceRaster, cdImageData;

    mapCanvas.width = w;
    mapCanvas.height = h;

    // Init the source raster
    sourceRaster[sourcePixel.y][sourcePixel.x] = 1;

    // Init the friction raster
    row = -1;
    for(i = 0, n = data.length; i < n; i += 4) {
      red = data[i],
      green = data[i + 1],
      blue = data[i + 2],
      alpha = data[i + 3],
      pixel = i / 4;

      if (pixel % w === 0) {
        row++;
        frictionRaster[row] = [];
      }

      frictionRaster[row][pixel - (row * w)] = blue;
    }

    // Calculate the costdistance raster
    costDistanceRaster = MA.costDistance(frictionRaster, sourceRaster, maxCost);

    // Turn cost into pixels to display
    n=0;
    for(row=0; row<h; row++){
      for(col=0; col<w; col++){
        color = getColor((costDistanceRaster[row][col] || maxCost) / maxCost);
        if (costDistanceRaster[row][col] === maxCost) {
          data[4*n] = 0;
          data[4*n + 1] = 0;
          data[4*n + 2] = 0;
          data[4*n + 3] = 255;
        } else {
          data[4*n] = color[0];
          data[4*n + 1] = color[1];
          data[4*n + 2] = color[2];
          data[4*n + 3] = color[3];
        }
        n++;
      }
    }
    frictionImageData.data = data;

    // Draw it on the map layer
    mapCtx.putImageData(frictionImageData, 0, 0);
  }

  map.on('click', function(evt) {
    //var layer = evt.target;
		//info.update(layer.feature.properties);
    
    // The Mapbox static map API buffers an image with pixels, not a bounding box. 
    // This code converts the latlng to mercator meters to pixels, buffers it 
    // (with pixels), and then converts it back to meters and then to a latlng
    // bounding box so it can be used in canvasLayer and put on the map.
    var clickMeters = gm.LatLonToMeters(evt.latlng.lat, evt.latlng.lng),
        clickPixel = gm.MetersToPixels(clickMeters[0], clickMeters[1], zoom),
        swMeters = gm.PixelsToMeters(clickPixel[0]-halfSidePx, clickPixel[1]+halfSidePx, zoom),
        neMeters = gm.PixelsToMeters(clickPixel[0]+halfSidePx, clickPixel[1]-halfSidePx, zoom),
        swLatLngArray = gm.MetersToLatLon(swMeters[0], swMeters[1]),
        neLatLngArray = gm.MetersToLatLon(neMeters[0], neMeters[1]),
        swLatLng = L.latLng(swLatLngArray[0], swLatLngArray[1]),
        neLatLng = L.latLng(neLatLngArray[0], neLatLngArray[1]),
        // Why zoom-1? Is it retina?
        frictionUrl = 'https://api.mapbox.com/styles/v1/atogle/cirjkl8m80000gengl4sxeicn/static/'+evt.latlng.lng+','+evt.latlng.lat+','+(zoom-1)+',0.00,0.00/'+sidePx+'x'+sidePx+'?access_token=pk.eyJ1IjoiYXRvZ2xlIiwiYSI6InBDWEFUY3cifQ.0XD7J9ZuFNLrmuNpuKlcnQ&logo=false&attribution=false',
        // Used to load the image data into the canvas
        image = new Image(),
        frictionCanvas = document.createElement('canvas'),
        // The starting point for the costdistance algorithm
        originPixel = {
          x: halfSidePx,
          y: halfSidePx
        };

    frictionCanvas.width = sidePx;
    frictionCanvas.height = sidePx;

    // TODO: add setBounds() to canvas layer?
    if (canvasLayer) {
      map.removeLayer(canvasLayer);
    }
    canvasLayer = L.imageOverlay.canvas(L.latLngBounds(swLatLng, neLatLng));
    // For debugging:
    // canvasLayer = L.imageOverlay(frictionUrl, L.latLngBounds(swLatLng, neLatLng), {opacity: 0.5});

    canvasLayer.addTo(map);

    // Allows the canvas to manipulate the data
    image.crossOrigin = 'anonymous';
    image.onload = function() {
      var w = this.width,
          h = this.height,
          ctx = frictionCanvas.getContext('2d');

      ctx.drawImage(this, 0, 0);

      draw(frictionCanvas, canvasLayer.canvas, originPixel);
    };
    // Triggers onload
    image.src = frictionUrl;

    // For debugging:
    // canvasLayer.canvas.width = stitchedCanvas.width;
    // canvasLayer.canvas.height = stitchedCanvas.height;
    // canvasLayer.canvas.getContext('2d').drawImage(stitchedCanvas, 0, 0);
  });
})();

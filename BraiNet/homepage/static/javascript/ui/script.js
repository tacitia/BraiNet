(function(mapViz, $, undefined) {

	var data = null;
	var polygons = null;
	var container = null;
	var group = null;
	var xScale = null;
	var yScale = null;
	var locations = null;
	var name = 'mapViz';
	stateManager.register(name, 'initialized', false);

	mapViz.init = function(value1, value2, value3, value4, value5) {
		container = value1;
		data = value2;
		xScale = value3;
		yScale = value4;
		locations = value5;
		stateManager.register(name, 'initialized', true, true);
	};
	
	mapViz.render = function() {

		group = container.append('g');
		
		group.selectAll("polygon")
			.data(data)
		  	.enter().append("polygon")
			.attr("points",function(d) { 
				return d.map(function(d) { 
					return [xScale(d.x), yScale(d.y)].join(","); 
				}).join(" ");
			})
			.attr("stroke","steelblue")
			.attr("stroke-width",2)
			.attr('fill', 'white')
			.attr('fill-opacity', 0);
					
		group.selectAll('text')
			.data(locations)
			.enter().append('svg:text')
			.filter(function(d) { return d.center !== undefined; })
			.attr('text-anchor', 'middle')
			.text(function(d) { return d.location.name; })
			.attr('x', function(d) { return xScale(d.center.x); })
			.attr('y', function(d) { return yScale(d.center.y); })
			.attr('fill', '#aaa')
			.attr('font-size', '20px');
	};

}(window.mapViz = window.mapViz || {}, jQuery));

(function(regionData, $, undefined) {
	var rawData = null;
	var polygonMap = null;
	var polygons = null;
	var xData = null;
	var yData = null;
	var polygonCenters = null;
	var locationMap = null;
	var locationArray = null;
	var name = 'regionData';
	stateManager.register(name, 'initialized', false);
	
	regionData.init = function(data) {
		rawData = {};
		polygonMap = {};
		polygons = [];
		xData = [];
		yData = [];
		polygonCenters = {};
		locationMap = {}
		locationArray = [];
		getRawData(data, rawData);
		convertToPolygons(polygons, polygonMap, xData, yData);
		computePolygonCenters(polygonCenters);
		constructLocationObjects(data, locationMap, locationArray);
		stateManager.register(name, 'initialized', true, true);
	};
	
	regionData.polygons = function(value) {
		if (!arguments.length) {
			stateManager.checkState(name, 'initialized', true);
			return polygons;			
		}
		polygons = value;
		return regionData;
	};
	
	regionData.polygonMap = function(value) {
		if (!arguments.length) {
			stateManager.checkState(name, 'initialized', true);
			return polygonMap;			
		}
		polygonMap = value;
		return regionData;
	};


	regionData.xData = function(value) {
		if (!arguments.length) {
			stateManager.checkState(name, 'initialized', true);
			return xData;			
		}
		xData = value;
		return regionData;
	};
	

	regionData.yData = function(value) {
		if (!arguments.length) {
			stateManager.checkState(name, 'initialized', true);
			return yData;			
		}
		yData = value;
		return regionData;
	};	
	

	regionData.locations = function(value) {
		if (!arguments.length) {
			stateManager.checkState(name, 'initialized', true);
			return locationArray;			
		}
		locationArray = value;
		return regionData;
	};	
	

		
	var getRawData = function(data, rawData) {
		var nodes = data.nodes();
		for (var i = 0; i < nodes.length; ++i) {
			var node = nodes[i];
			if (node.vertexType === 'ATTRIBUTE' && node.attributeType === 'POLYGON') {
				rawData[i] = node;
			}
		}
	};
	
	var constructLocationObjects = function(data, locationMap, locationArray) {
		var nodes = data.nodes();
		var links = data.links();
		for (var i = 0; i < nodes.length; ++i) {
			var node = nodes[i];
			if (node.vertexType === 'ENTITY' && node.entityType === 'geolocation') {
				locationMap[i] = {location: node};
			}
		}
		for (var i = 0; i < links.length; ++i) {
			var link = links[i];
			if (link._label === 'HAS_ATTRIBUTE') {
				var location = locationMap[link.source];
				switch (link.name) {
					case 'coordinates': {
						location.coordinates = nodes[link.target];
						location.center = polygonCenters[link.target];
					}
					case 'daytime_population': {
						location.daytime_population = nodes[link.target];
					}
					case 'population_density': {
						location.population_density = nodes[link.target];
					}
					default: {
						continue;
					}
				}				
			}
		}
		
		for (var key in locationMap) {
			locationArray.push(locationMap[key]);
		}
		
	};
	
	var computePolygonCenters = function(polygonCenters) {
		for (var key in polygonMap) {
			var polygon = polygonMap[key];
			var minX = 180;
			var maxX = -180;
			var minY = 180;
			var maxY = -180;
			for (var i = 0; i < polygon.length; ++i) {
				var curr = polygon[i];
				if (curr.x > maxX) { maxX = curr.x; }
				if (curr.x < minX) { minX = curr.x; }
				if (curr.y > maxY) { maxY = curr.y; }
				if (curr.y < minY) { minY = curr.y; } 
			}
			var center = {x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2};
			polygonCenters[key] = center;
		}
	};
	
	var convertToPolygons = function(polygons, polygonMap) {
		for (var key in rawData) {
			var node = rawData[key];
			var polygonSpec = node.value;
			var strLen = polygonSpec.length;
			polygonSpec = polygonSpec.substring(10, strLen - 3).split(', ');
			var polygonNode = [];
			for (var i = 0; i < polygonSpec.length; ++i) {
				var coords = polygonSpec[i].split(' ');
				var x = parseFloat(coords[0]);
				var y = parseFloat(coords[1]);
				polygonNode.push({x: x, y: y});
				xData.push(x);
				yData.push(y);
			}
			polygons.push(polygonNode);
			polygonMap[key] = polygonNode;
		}
	};
	
}(window.regionData = window.regionData || {}, jQuery));


(function(xScale, $, undefined) {

	var scale = null;
	var xData = null;
	var name = 'xScale';
	stateManager.register(name, 'initialized', false);
		
	xScale.init = function(value) {
		if (arguments.length < 1) {
			alert('Error: xScale.init must be called with a data parameter.');
			return;
		}
		xData = value;
		var minValue = Math.min.apply(Math, xData);
		var maxValue = Math.max.apply(Math, xData);
		scale = d3.scale.linear()
				.domain([minValue, maxValue])
//				.range([canvas.width(), 0]);
				.range([0, canvas.width()]);
		stateManager.register(name, 'initialized', true, true);
	};

	
	xScale.scale = function() {
		stateManager.checkState(name, 'initialized', true); 
		return scale;
	};
	
}(window.xScale = window.xScale || {}, jQuery));

 
(function(yScale, $, undefined) {

	var scale = null;
	var yData = null;
   	var name = 'yScale';
	stateManager.register(name, 'initialized', false);
		
	yScale.init = function(value) {
		if (arguments.length < 1) {
			alert('Error: yScale.init must be called with a data parameter.');
			return;
		}
		yData = value;
		var minValue = Math.min.apply(Math, yData);
		var maxValue = Math.max.apply(Math, yData);
		scale = d3.scale.linear()
				.domain([minValue, maxValue])
				.range([0,canvas.height()]);
		stateManager.register(name, 'initialized', true, true);
	};

	
	yScale.scale = function() {
		stateManager.checkState(name, 'initialized', true); 
		return scale;
	};
	
}(window.yScale = window.yScale || {}, jQuery));

(function(fve, $, undefined) {
	fve.initFuncs = [];
	fve.renderFuncs = [];
	
    var posNodesByLocation = function() {
    	var nodes = networkData.nodes();
    	var locations = regionData.locations();
    	var xS = xScale.scale();
    	var yS = yScale.scale();
    	for (var i = 0; i < nodes.length; ++i) {
  			var currNode = nodes[i];
  			if (currNode.location === undefined) { continue; }
  			for (var j = 0; j < locations.length; ++j) {
  				var location = locations[j];
  				if (location.location.name === currNode.location && location.center !== undefined) {
		  			currNode.x = xS(location.center.x) + Math.random() * 150 - 75;
		  			currNode.y = yS(location.center.y) + Math.random() * 150 - 75;		  							
  				}
  			}
  			currNode.fixed = true;
    	}
    };

    var posNodesByLocationPoint = function() {
    	var nodes = networkData.nodes();
    	for (var i = 0; i < nodes.length; ++i) {
  			var currNode = nodes[i];
  			var point = currNode.locationPoint;
  			if (currNode.locationPoint === undefined) { continue; }
  			var xS = xScale.scale();
  			var yS = yScale.scale();
  			currNode.x = xS(point.x);
  			currNode.y = yS(point.y);
  			currNode.fixed = true;
    	}
    };
    
	fve.initFuncs.push(posNodesByLocation);
	fve.initFuncs.push(posNodesByLocationPoint);

	
}(window.forceVizExt = window.forceVizExt || {}, jQuery));

$(document).ready(function() {
	networkData.init();
});

function dataReady() {
	// Main control logic
	canvas.init(1200, 1200);

//	networkData.markIsolatedNodes();	
	networkData.embedAttrs();
	
	regionData.init(networkData);

	xScale.init(regionData.xData());
	yScale.init(regionData.yData());
	
	mapViz.init(canvas.d3Selector(), regionData.polygons(), xScale.scale(), yScale.scale(), regionData.locations());
	mapViz.render();
	
	timeData.init();

	forceSize.init(canvas.width() - 100, canvas.height() - 150, 10);
	
	forceViz.init(canvas.d3Selector(), networkData, forceVizExt.initFuncs);
	
	timeSlider.init(timeData, forceViz);
	
	forceViz.render();	
}




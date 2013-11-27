// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.circular = (function($, undefined) {

	var doms = {
		canvas: '#circular-pane .canvas',
		controller: '#circular-pane .svg-controller'
	};
	
	var settings = {};
	settings.vis = {
		width: 650,
		height: 650
	};
	settings.arc = {};
	settings.arc.innerRadius = Math.min(settings.vis.width, settings.vis.height) * 0.32,
	settings.arc.outerRadius = settings.arc.innerRadius * 1.2;
	
	var data = {
		nodes: null,
		links: null,
		activeNodes: [],
		activeLinks: []
	};
	
	var svgGens = {
		arcs: null,
		curves: null,
		palette: null
	};
	
	var svgObjs = {
		canvas: null,
		links: null,
		force: null
	};

	var init = function() {
		svgGens.arcs = d3.svg.arc()
				 .innerRadius(settings.arc.innerRadius)
				 .outerRadius(settings.arc.outerRadius)
				 .startAngle(function(d) {return d.circular.startAngle;})
				 .endAngle(function(d) {return d.circular.endAngle;});

		svgGens.curves = d3.svg.line()
				   .x(function(d) {return d.x;})
				   .y(function(d) {return d.y;})
				   .interpolate('basis');

		svgGens.palette = d3.scale.category20b();

		svgObjs.canvas = d3.select(doms.canvas)
				.attr('width', settings.vis.width)
				.attr('height', settings.vis.height)
				.append('g')
				.attr('transform', 'translate(' + (settings.vis.width / 2) + ',' + (settings.vis.height / 2) + ')')
				.append('g');
		
	};
	
	var render = function(d) {
		console.log('svg cirular render called');
		data.nodes = d.structs;
		data.links = d.conns;
		// Initialize data.activeNodes to contain the top level nodes
		initActiveNodes();
		computeNodesParameters();
		assignColor();
		clearCanvas();
//		console.log(data.nodes);
//		console.log(data.links);
//		enterLinks();
		enterNodes();
//		updateCircularTexts();
//		enterMatrixElements();
	};

	var clearCanvas = function() {
		svgObjs.canvas.selectAll('.node').remove();
		svgObjs.canvas.selectAll('.link').remove();
		svgObjs.canvas.selectAll('.text').remove();
	}
	
	var enterNodes = function() {
		console.log('enterNodes:');
		console.log(data.activeNodes);
		svgObjs.canvas.selectAll('.node')
			.data(data.activeNodes, function(d) {return d.pk;})
			.enter().append('svg:path')
			.style('fill', function(d) { return svgGens.palette(d.pk);} )
			.attr('d', svgGens.arcs)
			.attr('class', 'node')
			.attr('id', function(d) { return 'circ-node-' + d.pk; })
			.attr('title', function(d) { return d.fields.name; })
//			.on('click', nodeClick)
//			.on('mouseover', function(d) { nodeMouseOver(d, svg_circular); })
//			.on('mouseout', function(d) { nodeMouseOut(d, svg_circular); });

	$('.node').qtip({
		style: {
			classes: 'qtip-bootstrap'
		}
	});

/*		svgObjs.canvas.selectAll('.text')
		   .data(data.activeNodes, function(d) {return d.pk;})
		   .enter()       
		   .append('svg:text')
		   .attr('x', function(d) {return d.circular.x;})
		   .attr('y', function(d) {return d.circular.y;})
		   .attr('class', 'circular text')
		   .attr('id', function(d) { return 'text-' + d.pk; })
		   .text(function(d) {return d.fields.name}); */
	};

	var initActiveNodes = function(maps) {
		var maps = svg.model.maps();
		console.log(maps.keyToNode);
		for (var key in maps.keyToNode) {
			var n = maps.keyToNode[key];
			if (n.fields.depth === 0) {
				n.circular.isActive = true;
				data.activeNodes.push(n);
			}
		}
	};

	var computeNodesParameters = function() {
		var total = data.activeNodes.length;
		var delta = 2 * Math.PI  / total;
		for (var i = 0; i < total; ++i) {
			var datum = data.activeNodes[i];
			calculateArcPositions(datum, 0, delta, i);
		}
	};

	var calculateArcPositions = function(datum, startAngle, delta, i) {
		datum.circular.startAngle = startAngle + delta * i;
		datum.circular.endAngle = startAngle + delta * (i+1);
		var angle = delta * (i + 0.5) + startAngle;
		var radius = settings.arc.innerRadius + (settings.arc.outerRadius - settings.arc.innerRadius) / 2;
		datum.circular.x = radius * Math.cos(Math.PI / 2 - angle);
		datum.circular.y = -radius * Math.sin(Math.PI / 2 - angle);
	};
	
	var assignColor = function() {
		var pks = [];
		for (var i = 0; i < data.activeNodes.length; ++i) {
			pks.push(data.activeNodes[i].pk);
		}
		svgGens.palette.domain(pks);
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

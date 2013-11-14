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
		activeNodes: null,
		activeLinks: null
	};
	
	var svgGens = {
		arcs: null,
		curves: null
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
				 .startAngle(function(d) {return d.circ.start_angle;})
				 .endAngle(function(d) {return d.circ.end_angle;});

		svgGens.curves = d3.svg.line()
				   .x(function(d) {return d.x;})
				   .y(function(d) {return d.y;})
				   .interpolate('basis');

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
//		svgData.init(datasetKey);
		clearCanvas();
		console.log(data.nodes);
		console.log(data.links);
//		enterLinks();
//		enterNodes();	
//		updateCircularTexts();
//		enterMatrixElements();
	};

	var clearCanvas = function() {
		svgObjs.canvas.selectAll('*').remove();
	}
	
	var enterNodes = function() {
		console.log('enterNodes:');
		svgObjs.canvas.selectAll('.node')
			.data(data.nodes, function(d) {return d.id;})
			.enter().append('svg:path')
			.style('fill', 'darkred')
//			.style('fill', function(d) {return d.color;})
			.attr('d', svgGens.arcs)
			.attr('class', 'node')
			.attr('id', function(d) { return 'circ-node-' + d.pk; })
//			.on('click', nodeClick)
//			.on('mouseover', function(d) { nodeMouseOver(d, svg_circular); })
//			.on('mouseout', function(d) { nodeMouseOut(d, svg_circular); });

		svgObjs.canvas.selectAll('.text')
		   .data(svgData.circNodes, function(d) {return d.key;})
		   .enter()       
		   .append('svg:text')
		   .attr('x', function(d) {return d.circ.x;})
		   .attr('y', function(d) {return d.circ.y;})
		   .attr('class', 'circular text')
		   .attr('id', function(d) { return 'text-' + d.key; })
		   .text(function(d) {return d.name});
	};
	

	var initActiveNodes = function(maps) {
		var maps = svg.model.maps();
		for (var key in maps.nodeMap) {
			var curr_node = maps.node_map[key];
			if (curr_node.depth === 1) {
				curr_node.isActive = true;
				sd.circNodes.push(curr_node);
			}
			var num_links = 0;
			num_links += maps.node_in_neighbor_map[key].length;
			num_links += maps.node_out_neighbor_map[key].length;
		
		}
	}

	var computeNodesParameters = function() {
		var total_num = data.nodes.length;
		var delta = 2 * Math.PI  / total_num;
		for (var i = 0; i < total_num; ++i) {
			var datum = sd.circNodes[i];
			calculateArcPositions(datum, 0, delta, i);
		}
	}

	return {
		init: init,
		render: render
	};

}(jQuery));

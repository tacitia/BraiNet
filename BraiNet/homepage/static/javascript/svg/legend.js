// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.legend = (function($, undefined) {

	var doms = {
		canvas: '#legend-primary #legend-canvas'
	};
	
	var localSettings = {
        vis: {}
    };

    localSettings.vis.width = 500;
    localSettings.vis.height = 60;
	
	var svgObjs = {
		canvas: null
	};

	var init = function() {
		svgObjs.canvas = d3.select(doms.canvas)
			.style('width', localSettings.vis.width)
			.style('height', localSettings.vis.height);
	};

    var appendCircle = function(group, cl, label) {
        group.append('svg:circle')
            .attr('r', 10)
            .attr('fill', 'white')
            .attr('fill-opacity', 0)
            .attr('class', cl)
	    .attr('transform', 'translate(40, 0)');

        group.append('svg:text')
            .text('selected')
            .attr('font-size', '14px')
            .attr('x', 10)
	    .attr('y', 25);

        group.append('svg:text')
            .text(label)
            .attr('font-size', '14px')
            .attr('x', 10)
	    .attr('y', 40);
    };

    var appendLine = function(group, cl, label) {
        group.append('svg:line')
            .attr('x1', 0)
            .attr('y1',0)
            .attr('x2', 60)
            .attr('y2', 0)
            .style('stroke-width', 3)
            .attr('class', cl);

        group.append('svg:text')
            .text(label)
            .attr('font-size', '14px')
            .attr('x', 0)
	    .attr('y', 25);
    };

	var render = function() {
        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(0, 15)');

        appendLine(g, 'link inLink', 'incoming');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(80, 15)');

        appendLine(g, 'link outLink', 'outgoing');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(160, 15)');

        appendLine(g, 'link biLink', 'bidirectional');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(240, 15)');

        appendCircle(g, 'node selected-source', 'source');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(320, 15)');

        appendCircle(g, 'node selected-target', 'target');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(400, 15)');

        appendCircle(g, 'node selected-struct', 'structure');

	};

	return {
		init: init,
		render: render
	};

}(jQuery));

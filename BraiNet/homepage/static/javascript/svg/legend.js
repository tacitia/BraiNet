// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.legend = (function($, undefined) {

	var doms = {
		canvas: '#legend-primary #legend-canvas'
	};
	
	var localSettings = {
        vis: {}
    };

    localSettings.vis.width = 600;
    localSettings.vis.height = 50;
	
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
            .attr('r', 5)
            .attr('fill', 'white')
            .attr('class', cl);

        group.append('svg:text')
            .text(label)
            .attr('font-size', '14px')
            .attr('dx', '20px');
    };

    var appendLine = function(gropu, cl, label) {
        group.append('svg:line')
            .attr('x1', 0)
            .attr('y1',20)
            .attr('x2', 60)
            .attr('y2', 20)
            .style('stroke-width', 3)
            .attr('class', cl);

        group.append('svg:text')
            .text(label)
            .attr('font-size', '14px')
            .attr('dx', '20px');
    };

	var render = function() {
        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(0, 50)');

        appendLine(g, 'link inLink', 'incoming');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(80, 50)');

        appendLine(g, 'link outLink', 'outgoing');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(160, 50)');

        appendLine(g, 'link biLink', 'bidirectional');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(240, 50)');

        appendCircle(g, 'node selected-source', 'selected source');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(280, 50)');

        appendCircle(g, 'node selected-target', 'selected target');

        var g = svgObjs.canvas.append('g')
            .attr('transform', 'translate(320, 50)');

        appendCircle(g, 'node selected-struct', 'selected structure');

	};

	return {
		init: init,
		render: render
	};

}(jQuery));

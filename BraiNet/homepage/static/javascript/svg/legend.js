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
    localSettings.vis.height = 100;
	
	var svgObjs = {
		canvas: null
	};

	var init = function() {
		svgObjs.canvas = d3.select(doms.canvas)
			.style('width', localSettings.vis.width)
			.style('height', localSettings.vis.height);
	};
	
	var render = function() {
        svgObjs.canvas.append('g')
            .attr('transform', 'translate(50, 50)')
            .append('svg:line')
            .attr('stroke-width', 3)
            .classed('inLink');

        svgObjs.canvas.append('g')
            .attr('transform', 'translate(100, 50)')
            .append('svg:line')
            .attr('stroke-width', 3)
            .classed('outLink');

        svgObjs.canvas.append('g')
            .attr('transform', 'translate(150, 50)')
            .append('svg:line')
            .attr('stroke-width', 3)
            .classed('biLink');
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

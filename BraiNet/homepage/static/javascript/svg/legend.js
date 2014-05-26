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
        svgObjs.canvas.append('svg:line')
            .attr('stroke-width', 3)
            .attr('stroke', 'black');
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

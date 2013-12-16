// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.linkAttr = (function($, undefined) {

	var doms = {
		canvas: '#link-pane .canvas'
	};
	
	var settings = {};
	settings.vis = {};
	settings.vis.width = 400;
	settings.vis.height = 500;
	settings.box = {};
	settings.box.width = 50;
	settings.box.height = 450;
	settings.box.margin_h = 50;
	settings.box.margin_v = 50;
	
	var svgObjs = {
		canvas: null,
		links: null,
		force: null
	};

	var init = function() {
		svgObjs.canvas = d3.select(doms.canvas)
			.style('width', settings.vis.width)
			.style('height', settings.vis.height);
	};
	
	var render = function(link) {
	
		d3.select('#link-pane').selectAll('svg').remove();
	
		console.log('svg.attr.render');
		console.log(link);
		var maps = svg.model.maps();

	  	var data = [];
	  	
	  	var csv = [
	  	{Expt: 1, Run: 1, Speed: 850},
	  	{Expt: 2, Run: 1, Speed: 960}
	  	];
	  	
	  	var multipliers = ['normalized_projection_volume', 'projection_volume', 'projection_density'];

	  	link.derived.leaves.forEach(function(l) {
	  		var attrs = maps.keyToLink[l].fields.attributes;
	  		console.log(attrs);
	  		for (var i in attrs) {
				if (!data[i]) data[i] = [];
				for (var j in attrs[i]) {
					if (attrs[i][j] === 0) continue;
					if ($.inArray(i, multipliers) > -1) {
						data[i].push(Math.ceil(attrs[i][j] * 100000));
					}
					else {
						data[i].push(Math.ceil(attrs[i][j]));
					}					
				}
			}
	  	});		
		console.log(data);
		
		var counter = 0;
		for (var i in data) {
			var column = [data[i]];
			
			var min = Infinity,
				max = -Infinity;
				
			column.forEach(function(v) {
				if (v > max) max = v;
				if (v < min) min = v;
			});
			
			var normalizer = $.inArray(i, multipliers) > -1 ? 100000 : 1;

			var chart = d3.box()
				.whiskers(iqr(10))
//				.whiskers([min, max])
				.width(settings.box.width)
				.height(settings.box.height)
				.domain([min, max])
				.label([i])
				.normalizer(normalizer);

			d3.select('#link-pane').selectAll('#svg-' + counter)
				.data(column)
				.enter()
				.append('svg')
				.attr('class', 'box')
				.attr('width', settings.box.width + settings.box.margin_h)
				.attr('height', settings.box.height + settings.box.margin_v)
				.attr('transform', 'translate(' + (settings.box.width + settings.box.margin_h / 2) * counter + ', 0')
				.append('g')
				.call(chart);
			
			counter += 1;
		}
			
//		svgObjs.canvas.selectAll('g')
//			.data(data)
//			.enter()
//			.append("g")
//		  	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
//		  	.call(chart);
	};

		// Returns a function to compute the interquartile range.
	var iqr = function(k) {
		  return function(d, i) {
			var q1 = d.quartiles[0],
				q3 = d.quartiles[2],
				iqr = (q3 - q1) * k,
				i = -1,
				j = d.length;
			while (d[++i] < q1 - iqr);
			while (d[--j] > q3 + iqr);
			return [i, j];
		  };
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

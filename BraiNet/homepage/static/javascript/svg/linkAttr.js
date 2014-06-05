// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.linkAttr = (function($, undefined) {

	var doms = {
		canvas: '#link-pane .canvas'
	};
	
	var settings = {};
	settings.vis = {};
	settings.vis.width = 400;
	settings.vis.height = 300;
	settings.vis.leftMargin = 65;
	settings.vis.rightMargin = 20;
	settings.vis.bottomMargin = 70;
	settings.vis.topMargin = 20;
	
	var svgObjs = {
		canvas: null,
		links: null,
		force: null
	};

	var init = function() {
		svgObjs.canvas = d3.select(doms.canvas)
			.attr("width", settings.vis.width + settings.vis.leftMargin + settings.vis.rightMargin)
			.attr("height", settings.vis.height + settings.vis.topMargin + settings.vis.bottomMargin)
		  .append("g")
			.attr("transform", "translate(" + settings.vis.leftMargin + "," + settings.vis.topMargin + ")");

	};
	
	var render = function(link) {
		
		svgObjs.canvas.selectAll('path').remove();
		svgObjs.canvas.selectAll('line').remove();
		svgObjs.canvas.selectAll('text').remove();
		svgObjs.canvas.selectAll('circle').remove();

		console.log('svg.attr.render');
		console.log(link);
		var maps = svg.model.maps();
	  	
	  	var multipliers = ['normalized_projection_volume', 'projection_volume', 'projection_density'];

		var x = d3.scale.ordinal()
			.rangeRoundBands([10, settings.vis.width], 0.3);

		var y = d3.scale.linear()
			.range([settings.vis.height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(10, "%");

		var data = [
			{cat: 'projection_volume', value: link.fields.attributes['projection_volume'].mean, order: 'width', error: 0.017, pos: 0}, 
//			{cat: 'projection_volume', value: 0.6, order: 'width', error: 0.017, pos: 0}, 
			{cat: 'projection_density', value: 0.775, order: 'width', error: 0.027, pos: 1},
			{cat: 'normalized_projection_volume', value: 0.822, order: 'width', error: 0.017, pos: 2},
			{cat: 'projection_intensity', value: 0.797, order: 'width', error: 0.017, pos: 3},
		];

		var cats = ['projection_volume', 'projection_density', 'normalized_projection_volume', 'projection_intensity'];

		var catLength = 4;

		var cerPalette = {
				projection_volume: '#1f77b4', 
				projection_density: '#ff7f0e', 
				normalized_projection_volume: '#2ca02c',
				projection_intensity: '#d62728'
			};

		  x.domain(data.map(function(d) { return d.order; }));
		  y.domain([0, 1.0]);

		  svgObjs.canvas.append("g")
			  .attr("class", "x axis")
			  .attr("transform", "translate(0," + settings.vis.height + ")")
			  .call(xAxis)
			  .append("text")
			  .attr("transform", "translate(550)")
			  .attr("y", 50)
			  .attr("dy", ".71em")
			  .style("text-anchor", "end")
			  .text("vStrength");

		  svgObjs.canvas.append("g")
			  .attr("class", "y axis")
			  .call(yAxis);

		  svgObjs.canvas.append('line')
			  .attr('x1', settings.vis.leftMargin)
			  .attr('x2', settings.vis.leftMargin)
			  .attr('y1', settings.vis.height)
			  .attr('y2', 0)
			  .style('stroke', 'black'); 

		  svgObjs.canvas.selectAll(".center")
			  .data(data)
			.enter().append("circle")
			  .attr("class", "center")
			  .attr("cx", function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos; })
			  .attr('r', 8)
			  .attr("cy", function(d) { return y(d.value); })
			  .attr('stroke', function(d) { return cerPalette[d.cat]; })
			  .attr('stroke-width', 2)
			  .attr('fill', 'white');

		  svgObjs.canvas.selectAll(".error-m")
			  .data(data)
			.enter().append("line")
			  .attr("class", "error-m")
			  .attr('x1', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos; })
			  .attr('x2', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos; })
			  .attr('y1', function(d) { return y(d.value + d.error); }) 
			  .attr('y2', function(d) { return y(d.value - d.error); }) 
			  .attr("cy", function(d) { return y(d.value); })
			  .attr('stroke-width', 2)
			  .attr('stroke', function(d) { return cerPalette[d.cat]; });

		  svgObjs.canvas.selectAll(".error-t")
			  .data(data)
			.enter().append("line")
			  .attr("class", "error-m")
			  .attr('x1', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos - 6; })
			  .attr('x2', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos + 6; })
			  .attr('y1', function(d) { return y(d.value - d.error); }) 
			  .attr('y2', function(d) { return y(d.value - d.error); }) 
			  .attr('stroke-width', 2)
			  .attr('stroke', function(d) { return cerPalette[d.cat]; });

		  svgObjs.canvas.selectAll(".error-b")
			  .data(data)
			.enter().append("line")
			  .attr("class", "error-m")
			  .attr('x1', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos - 6; })
			  .attr('x2', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos + 6; })
			  .attr('y1', function(d) { return y(d.value + d.error); }) 
			  .attr('y2', function(d) { return y(d.value + d.error); }) 
			  .attr('stroke-width', 2)
			  .attr('stroke', function(d) { return cerPalette[d.cat]; });
	
	  
		var legends = svgObjs.canvas.selectAll(".legend")
			  .data(cats)
			.enter().append("svg:g")
			.attr('transform', function(d, i) { return 'translate(' + i * 30 + ',400)'; });

		legends.append('line')
			  .attr("class", "legend-line")
			  .attr('x1', 0)
			  .attr('x2', 50)
			  .attr('stroke', function(d) { return cerPalette[d]; });
	  
		legends.append('text')
			  .attr("class", "legend-text")
			  .attr('dx', 60)
			  .attr('dy', 5)
			  .text(function(d) { return d;});
	  	  	
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

var margin = {top: 20, right: 20, bottom: 70, left: 65},
    width = 1050 - margin.left - margin.right,
    height = 570 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([10, width], 0.3);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10, "%");

var svg = d3.select("body").select("#canvas")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data = [
	{cat: 'value', value: 0.792, order: 'width', error: 0.017, pos: 0}, 
	{cat: 'fuzziness', value: 0.775, order: 'width', error: 0.027, pos: 1},
	{cat: 'grain', value: 0.822, order: 'width', error: 0.017, pos: 2},
	{cat: 'transparency', value: 0.797, order: 'width', error: 0.017, pos: 3},
];

var cats = ['value', 'fuzziness', 'grain', 'transparency'];

var catLength = 4;

var cerPalette = {
		value: '#1f77b4', 
		fuzziness: '#ff7f0e', 
		grain: '#2ca02c',
		transparency: '#d62728'
	};

  x.domain(data.map(function(d) { return d.order; }));
  y.domain([0.5, 1.0]);
//  y.domain([0.4, d3.max(data, function(d) { return d.frequency; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .attr("transform", "translate(550)")
      .attr("y", 50)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("vStrength");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Accuracy");

  svg.append('line')
  	  .attr('x1', margin.left)
  	  .attr('x2', width)
  	  .attr('y1', height)
  	  .attr('y2', height)
  	  .style('stroke', 'black'); 

  svg.append('line')
  	  .attr('x1', margin.left)
  	  .attr('x2', margin.left)
  	  .attr('y1', height)
  	  .attr('y2', 0)
  	  .style('stroke', 'black'); 

  svg.selectAll(".center")
      .data(data)
    .enter().append("circle")
      .attr("class", "center")
      .attr("cx", function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos; })
      .attr('r', 8)
      .attr("cy", function(d) { return y(d.value); })
      .attr('stroke', function(d) { return cerPalette[d.cat]; })
      .attr('stroke-width', 2)
      .attr('fill', 'white');

  svg.selectAll(".error-m")
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

  svg.selectAll(".error-t")
      .data(data)
    .enter().append("line")
      .attr("class", "error-m")
      .attr('x1', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos - 6; })
      .attr('x2', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos + 6; })
      .attr('y1', function(d) { return y(d.value - d.error); }) 
      .attr('y2', function(d) { return y(d.value - d.error); }) 
      .attr('stroke-width', 2)
      .attr('stroke', function(d) { return cerPalette[d.cat]; });

  svg.selectAll(".error-b")
      .data(data)
    .enter().append("line")
      .attr("class", "error-m")
      .attr('x1', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos - 6; })
      .attr('x2', function(d) { return x(d.order) + x.rangeBand() / (catLength-1) * d.pos + 6; })
      .attr('y1', function(d) { return y(d.value + d.error); }) 
      .attr('y2', function(d) { return y(d.value + d.error); }) 
      .attr('stroke-width', 2)
      .attr('stroke', function(d) { return cerPalette[d.cat]; });
    
      
var legends = svg.selectAll(".legend")
      .data(cats)
    .enter().append("svg:g")
    .attr('transform', function(d, i) { return 'translate(800,' + i * 30 + ')'; });

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
      
var orders = ['width', 'hue'];

	svg.selectAll('divider')
		.data(orders)
		.enter()
		.append('line')
		.attr('class', 'divider')
  	    .attr('x1', function(d,i) { return x(d) + x.rangeBand() + 45; })
  	    .attr('x2', function(d,i) { return x(d) + x.rangeBand() + 45; })
  	    .attr('y1', height)
  	    .attr('y2', 0)
  	    .style('stroke', '#cccccc')
  	    .style("stroke-dasharray", ("3, 3")); 
     

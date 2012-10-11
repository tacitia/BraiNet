/*
 * This .js file contains functions that support the svg elements. There are 
 * three major function groups: 
 * 1) functions that calculate parameters for the svg elements
 * 2) functions that respond to actions on svg elements
 * 3) functions that add or remove svg elements
 */


function fade(opacity) {
   return function(g, i) {
     svg.selectAll("g.chord path")
         .filter(function(d) {
           return d.source.index != i && d.target.index != i;
         })
       .transition()
         .style("opacity", opacity);
   };
}


function expandRegion(d) {
    var child_keys = d.children;
    var total_num = child_keys.length;
    if (total_num < 1) {return;}

    // Add the sub-regions of the original region that has been chosen to be expanded
    var start_angle = d.startAngle;
    var end_angle = d.endAngle;
    
    var delta = (end_angle - start_angle) / total_num;

    var active_neighbors = [];
    var link_length = active_data_links.length;
    for (var i = 0; i < link_length; ++i) {
        var curr_link = active_data_links[i];
        if (curr_link.source === d) {
            active_neighbors.push(curr_link.target);
        }
        if (curr_link.target === d) {
            active_neighbors.push(curr_link.source);
        }   
    }
    
    var neighbor_num = active_neighbors.length;
            
    for (var i = 0; i < total_num; ++i) {
        var datum = node_map[child_keys[i]];
        calculateArcPositions(datum, start_angle, delta, i);
        active_data_nodes.push(datum);
        // Now add the new links
        for (var j = 0; j < neighbor_num; ++j) {
            var neighbor = active_neighbors[j];
            var key_pair = generateKeyForNodeLinkMap(datum, neighbor);
            var link = node_link_map[key_pair];
            if (link !== undefined) {
                active_data_links.push(link);
                console.log(active_data_links);
            }
        }
    }

    // Add the new links and new nodes resulted from the split
    enterNodes();
    enterLinks();
    
    // Remove the expanded node from the data nodes and the corresponding 
    // links from the data links
    var pos = $.inArray(d, active_data_nodes);
    active_data_nodes.splice(pos, 1);
    for (var i = 0; i < neighbor_num; ++i) {
        // Remove the links associated with the expanded node
        var neighbor = active_neighbors[i];
        key_pair = generateKeyForNodeLinkMap(d, neighbor);
        link = node_link_map[key_pair];
        var pos = $.inArray(link, active_data_links);
        active_data_links.splice(pos, 1);
    }

    // Remove the nodes and links from canvas
    svg.selectAll("path")
       .data(active_data_nodes, function(d) {return d.key;})
       .exit().remove();

    svg.selectAll('text')
       .data(active_data_nodes, function(d) {return d.key;})
       .exit().remove();
       
    svg.selectAll("line")
       .data(active_data_links, function(d) {return d.key;})
       .exit().remove();
}

function enterNodes() {
    svg.selectAll("arcs")
        .data(active_data_nodes, function(d) {return d.key;})
        .enter().append("path")
        .style("fill", 'white')
        .style("stroke", 'gray')
        .attr("d", arcs)
        .on("mouseover", fade(.1))
        .on("mouseout", fade(1))
        .on("click", expandRegion);

    svg.selectAll("text")
       .data(active_data_nodes, function(d) {return d.key;})
       .enter().append("text")
       .attr('x', function(d) {return d.x;})
       .attr('y', function(d) {return d.y;})
       .attr('class', 'text visible')
       .text(function(d) {return d.name});
}

function enterLinks() {
    svg.selectAll("links")
        .data(active_data_links, function(d) {return d.key;})
        .enter().append("svg:line")
        .attr("stroke", 'black')
        .attr("fill", 'none')
        .attr("x1", function(d) { return d.source.x; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("y2", function(d) { return d.target.y; });
}


function computeArcParameters(data) {
    var total_num = data.length;
    var delta = 2 * Math.PI  / total_num;
    for (var i = 0; i < total_num; ++i) {
        var datum = data[i];
        calculateArcPositions(datum, 0, delta, i);
    }
}

function calculateArcPositions(datum, start_angle, delta, i) {
    datum.startAngle = start_angle + delta * i;
    datum.endAngle = start_angle + delta * (i+1);
    var angle = delta * (i + 0.5) + start_angle;
    var radius = inner_radius + (outer_radius - inner_radius) / 2;
    datum.x = radius * Math.cos(Math.PI / 2 - angle);
    datum.y = radius * Math.sin(Math.PI / 2 - angle);
}

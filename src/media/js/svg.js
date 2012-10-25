/*
 * This .js file contains functions that support the svg elements. There are 
 * three major function groups: 
 * 1) functions that calculate parameters for the svg elements
 * 2) functions that respond to actions on svg elements
 * 3) functions that add or remove svg elements
 */


function expandRegion(d) {
    // First check the children. If no children, do nothing and return.
    var child_keys = d.children;
    var total_num = child_keys.length;
    if (total_num < 1) {return;}
    
    // Add the sub-regions of the original region that has been chosen to be expanded
    var start_angle = d.startAngle;
    var end_angle = d.endAngle;
    var delta = (end_angle - start_angle) / total_num;

    // Record neighbors of the node being removed
    var in_neighbors = [];
    var out_neighbors = [];
    var old_link_keys = [];
    var link_length = active_data_links.length;
    for (var i = 0; i < link_length; ++i) {
        var curr_link = active_data_links[i];
        if (curr_link.source === d){
            out_neighbors.push(curr_link.target);
            old_link_keys.push(curr_link.source.key + "-" + curr_link.target.key);
        }
        if (curr_link.target === d) {
            in_neighbors.push(curr_link.source);
            old_link_keys.push(curr_link.source.key + "-" + curr_link.target.key);
        }
    }
    var in_neighbor_num = in_neighbors.length;
    var out_neighbor_num = out_neighbors.length;
    var old_link_num = old_link_keys.length;

    // Add the new nodes and new links
    for (var i = 0; i < total_num; ++i) {
        var datum = node_map[child_keys[i]];
        calculateArcPositions(datum, start_angle, delta, i);
        active_data_nodes.push(datum);
        // Now add the new links
        for (var j = 0; j < in_neighbor_num; ++j) {
            var neighbor = in_neighbors[j];
            var key_pair = neighbor.key + "-" + datum.key;
            var link = node_link_map[key_pair];
            if (link !== undefined) {
                active_data_links.push(link);
            }
        }
        for (var j = 0; j < out_neighbor_num; ++j) {
            var neighbor = out_neighbors[j];
            var key_pair = datum.key + "-" + neighbor.key;
            var link = node_link_map[key_pair];
            if (link !== undefined) {
                active_data_links.push(link);
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
    for (var i = 0; i < old_link_num; ++i) {
        // Remove the links associated with the expanded node
        var key_pair = old_link_keys[i];
        link = node_link_map[key_pair];
        console.log(link);
        var pos = $.inArray(link, active_data_links);
        console.log(pos);
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

    console.log(active_data_links);

}

function linkClick(d) {
    console.log(d.source);
    console.log(d.target);
}

function enterNodes() {
    svg.selectAll("arcs")
        .data(active_data_nodes, function(d) {return d.key;})
        .enter().append("path")
        .style("fill", 'white')
        .style("stroke", 'gray')
        .attr("d", arcs)
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
        .attr("y2", function(d) { return d.target.y; })
        .on("click", linkClick);
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
    datum.y = -radius * Math.sin(Math.PI / 2 - angle);
}

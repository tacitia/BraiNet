/*
 * Brain Circuits Viz
 * Authors: Hua and Arthur
 * Script 2: svg functions
 * This .js file contains functions that support the svg elements. There are 
 * three major function groups: 
 * 1) functions that calculate parameters for the svg elements
 * 2) functions that respond to actions on svg elements
 * 3) functions that add or remove svg elements
 */

/*
 * This function gets called when the user clicks on a node. The corresponding
 * object is passed in as d. The function does three things:
 * 1) Add the children of d into active_data_nodes and the links associated with 
 * those children and the other existing nodes into active_data_links
 * 2) Remove d and the associated links
 * 3) Update the svg canvas to propagate the change in active_data_nodes and 
 * active_data_links to the visual elements on the canvas
 */
 /*
  * ! TODO: Need to think how to more efficiently add new links !
 */
function expandRegion(d, sub, svg) {
    //console.log(svg);
    // First check the children. If no children, do nothing and return.
    var sub_num = sub.length;
    if (sub_num < 1) {return;}

    // Add the sub-regions of the original region that has been chosen to be expanded
    var start_angle = d.circ.start_angle;
    var end_angle = d.circ.end_angle;
    var delta = (end_angle - start_angle) / sub_num;

    // Record neighbors of the node being removed
    var in_neighbors = [];
    var out_neighbors = [];
    var link_length = active_data_links.length;
    
    // Iterate through all the ative links and locate those associated with d
    // Remove the expanded node from the data nodes and the corresponding 
    // links from the data links
    while (link_length--) {
        var curr_link = active_data_links[link_length];
        if (curr_link.source === d) {
            out_neighbors.push(curr_link.target);
            active_data_links.splice(link_length, 1);
        }
        else if (curr_link.target === d) {
            in_neighbors.push(curr_link.source);
            active_data_links.splice(link_length, 1);
        }
    }

    var pos = $.inArray(d, active_data_nodes);
    active_data_nodes[pos].isActive = false;
//    active_data_nodes.splice(pos, 1);
    
    var in_neighbor_num = in_neighbors.length;
    var out_neighbor_num = out_neighbors.length;
    var old_num = active_data_nodes.length;
    var new_num = old_num + sub_num - 1;
    var new_delta = 2 * Math.PI / new_num;

    for (var i = new_num-1; i > pos; --i) {
        active_data_nodes[i] = active_data_nodes[i-sub_num+1];
    }

    for (var i = pos; i < pos + sub_num; ++i) {
        var datum = sub[i-pos];
        calculateArcPositions(datum, start_angle, delta, i-pos);
        datum.color = d.color;
        datum.isActive = true;
        active_data_nodes[i] = datum;
//        var datum = active_data_nodes[i];
//        calculateArcPositions(datum, datum.circ.startAngle, new_delta, 0);
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
    enterCircularNodes();
    enterCircularLinks();

    // Remove the nodes and links from canvas
    exitCircularNodes();
    exitCircularLinks();

    for (var i = 0; i < new_num; ++i) {
        var datum = active_data_nodes[i];
        calculateArcPositions(datum, 0, new_delta, i);
    }

    updateCircularNodes();
    updateCircularLinks();
}

function nodeClick(d) {
    var children = [];
    var ids = d.children;
    var length = ids.length;
    for (var i = 0; i < length; ++i) {
        children.push(node_map[ids[i]]);
    }
    expandRegion(d, children, svg_circular);
}

function linkClick(d) {
    d3.select('#self-content #src-name')
        .html('Source: ' + d.source.name);
    d3.select('#self-content #tgt-name')
        .html('Target: ' + d.target.name);

    var paperKeys = d.paper;
    var self_paper_tab = d3.select('#self-record-paper');

    self_paper_tab.selectAll('p').remove();

    var content = self_paper_tab.append('p');

    if (paperKeys.length < 1) {
        content.html('This is a meta link. See the derived connections for more information');
    }
    else {
        content.selectAll('p')
            .data(paperKeys)
            .enter()
            .append('p')
            .html(function(d) { 
                var paper = paper_map[d];
                return '<a href="' +  paper.url + '">' + paper.title + '</a>'; 
            });
    }
}

function linkMouseOver(d, svg) {
    svg.select("#circ-link-" + d.key)
        .classed("focus", true);
    svg.select("#circ-node-" + d.source.key)
        .classed("focus", true);
    svg.select("#circ-node-" + d.target.key)
        .classed("focus", true);
}

function linkMouseOut(d, svg) {
    svg.select("#circ-link-" + d.key)
        .classed("focus", false);
    svg.select("#circ-node-" + d.source.key)
        .classed("focus", false);
    svg.select("#circ-node-" + d.target.key)
        .classed("focus", false);
}

function enterCircularNodes() {

    svg_circular.selectAll(".circular.node")
        .data(active_data_nodes, function(d) {return d.key;})
        .enter().append("svg:path")
        .style("fill", function(d) {return d.color;})
        .style("stroke", 'gray')
        .attr("d", arcs)
        .attr("class", "circular node")
        .attr("id", function(d) { return "circ-node-" + d.key; })        
        .on("click", nodeClick);
//        .each(stash);

    svg_circular.selectAll(".circular.text")
       .data(active_data_nodes, function(d) {return d.key;})
       .enter()       
       .append("svg:text")
       .attr('x', function(d) {return d.circ.x;})
       .attr('y', function(d) {return d.circ.y;})
       .attr('class', 'circular text visible')
       .text(function(d) {return d.name});       
}

function enterCircularLinks() {
    svg_circular.selectAll(".circular.link")
        .data(active_data_links, function(d) {return d.key;})
        .enter().append("svg:path")
        .attr("d", function(d) {
                var coors = [{x: d.source.circ.x, y:d.source.circ.y}, 
                             {x: 0, y: 0},
                             {x: d.target.circ.x, y:d.target.circ.y}];
                return curves(coors);
            })
        .attr("class", "circular link")
        .attr("id", function(d) { return "circ-link-" + d.key; })
        .on("mouseover", function(d) { linkMouseOver(d, svg_circular); })
        .on("mouseout", function(d) { linkMouseOut(d, svg_circular); })
        .on("click", linkClick);
}

function exitCircularNodes() {
    svg_circular.selectAll('.circular.node')
       .data(active_data_nodes, function(d) {return d.key;})
       .exit().remove();

    svg_circular.selectAll('.circular.text')
       .data(active_data_nodes, function(d) {return d.key;})
       .exit().remove();
}

function exitCircularLinks() {
    svg_circular.selectAll('.circular.link')
       .data(active_data_links, function(d) {return d.key;})
       .exit().remove();
}

function updateCircularNodes() {
    svg_circular.selectAll(".circular.node")
        .data(active_data_nodes, function(d) {return d.key;})
        .transition()
        .duration(1000)
        .attr("d", arcs);
//        .attrTween("d", arcTween);

    svg_circular.selectAll(".circular.text")
        .data(active_data_nodes, function(d) {return d.key;})
        .transition()
        .duration(1000)
        .attr('x', function(d) {return d.circ.x;})
        .attr('y', function(d) {return d.circ.y;});
}

function updateCircularLinks() {
    var links = svg_circular.selectAll(".circular.link")
        .data(active_data_links, function(d) {return d.key;});
        
        
    links.transition()
        .duration(1000)
        .attr("d", function(d) {
                var coors = [{x: d.source.circ.x, y:d.source.circ.y}, 
                             {x: 0, y: 0},
                             {x: d.target.circ.x, y:d.target.circ.y}];
                return curves(coors);
            });

}

function updateForceLayout() {
    //this should be incorporated in the node data
    var num_groups = 0,
        group_count = {};
    active_data_nodes_force.forEach(function(d) {
        if (!group_count[d.group]) {
            ++num_groups;
            group_count[d.group] = [num_groups, 1];
        } else {
            //increase group size
            group_count[d.group][1] += 1;
        }
    });

    force = d3.layout.force()
              .nodes(active_data_nodes_force)
              .links(active_data_links_force)
              //.links([])
              .size([vis_width, vis_height])
              //still needs work - link distance determined by group size and if
              //connection are internal
              .linkDistance(function(l) {
                  var s = group_count[l.source.group], t = group_count[l.target.group];
                  return 30 * Math.max(l.source.group != l.target.group ? s[1] : 2/s[1],
                                       l.source.group != l.target.group ? t[1] : 2/t[1]) + 20;
              })
              .linkStrength(1)
              //.gravity(0.01)
              .charge(-600)
              .friction(0.5)
              .start();

    var link = svg_force.selectAll("nodelink.links")
       .data(active_data_links_force)
       .enter().append("svg:line")
       .attr("class", "link")
       .style("stroke-width", 3);

    var node = svg_force.selectAll("nodelink.nodes")
       .data(active_data_nodes_force)
       .enter().append("svg:circle")
       .attr("class", "node")
       .attr("cx", function(d) { return d.x; })
       .attr("cy", function(d) { return d.y; })
       .attr("r", 5)
       .style("fill", function(d) {return d.color;})
       .call(force.drag);

    /*
    svg_force.selectAll("text")
       .data(active_data_nodes, function(d) {return d.key;})
       .enter().append("text")
       .attr('x', function(d) {return d.circ.x;})
       .attr('y', function(d) {return d.circ.y;})
       .attr('class', 'text visible')
       .text(function(d) {return d.name});
   */

  force.on("tick", function(e) {
      // To bundle nodes without links (useful)
      /*
      var k = 8 * e.alpha;

      active_data_nodes_force.forEach(function(o) {
          o.x += group_count[o.group][0] * k;
          o.y += group_count[o.group][0] * -k;
      });
      */

     link.attr("x1", function(d) { return d.source.x; })
         .attr("y1", function(d) { return d.source.y; })
         .attr("x2", function(d) { return d.target.x; })
         .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
  });
}

function highlightNode(node, class_name, value, show_name, svg) {
    if (node === undefined) {
        return;
    }

    svg.select("#circ-node-" + node.key).classed(class_name, value);

    if (show_name) {
        svg.select("#text-" + node.key).classed("selected", value);
    }
}

function expandNode() {

}

function expandLink() {

}

function arcTween(a) {
  var i = d3.interpolate({start_angle: a.circ.old_start_angle, end_angle: a.circ.old_end_angle}, a);
  return function(t) {
    var b = i(t);
    console.log(b);
    a.circ.old_start_angle = b.start_angle;
    a.circ.old_end_angle = b.end_angle;
    b.circ.start_angle = b.start_angle;
    b.circ.end_angle = b.end_angle;
    return arcs(b);
  };
}

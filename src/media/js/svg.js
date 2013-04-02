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
 * 1) Add the children of d into active_data_nodes and the linkfs associated with 
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

    console.log(active_node_link_map);
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
            console.log(key_pair);
            var link = active_node_link_map[key_pair];
            if (link !== undefined) {
                active_data_links.push(link);
            }
        }
        for (var j = 0; j < out_neighbor_num; ++j) {
            var neighbor = out_neighbors[j];
            var key_pair = datum.key + "-" + neighbor.key;
            console.log(key_pair);
            var link = active_node_link_map[key_pair];
            if (link !== undefined) {
                active_data_links.push(link);
            }
        }
    }
    // Add new links between new nodes
    for (var i = 0; i < sub_num; ++i) {
        for (var j = i + 1; j < sub_num; ++j) {
            var key_pair = sub[i].key + '-' + sub[j].key;
            console.log(key_pair);
            var link = active_node_link_map[key_pair];
            if (link !== undefined) {
                active_data_links.push(link);
            }
            key_pair = sub[j].key + '-' + sub[i].key;
            link = active_node_link_map[key_pair];
            if (link !== undefined) {
                active_data_links.push(link);
            }

        }
    }

    updateCircularLayout(new_num, new_delta);
}

function updateCircularLayout(new_num, new_delta) {
    // Remove the nodes and links from canvas
    exitCircularNodes();
    exitCircularLinks();

    // Add the new links and new nodes resulted from the split
    enterCircularLinks();    
    enterCircularNodes();


    for (var i = 0; i < new_num; ++i) {
        var datum = active_data_nodes[i];
        calculateArcPositions(datum, 0, new_delta, i);
    }

    updateCircularLinks();
    updateCircularNodes();
    updateCircularTexts();
}

function dimNonSearchResults() {
    svg_circular.selectAll('.circular.node')
        .classed('nofocus', function(d) {
            return ($.inArray(d, active_data_nodes_force) < 0);
        });
    svg_circular.selectAll('.circular.link')
        .classed('hidden', function(d) {
            return ($.inArray(d, active_data_links_force) < 0);
        });
    svg_circular.selectAll('.circular.text')
        .classed('visible', function(d) {
            return ($.inArray(d, active_data_nodes_force) >= 0) ;
        });    
}


function nodeClick(d) {
	console.log(d3.event);
    if (d3.event.shiftKey) {
        if (enable_piwik) { piwikTracker.trackPageView('Combine node in circular view'); }
        if (enable_owa) { OWATracker.trackAction('Viz', 'Combine circular node', d.name); }
        if (enable_tracking) {
            trackAction('Combine circular node', d.name);
        }
        if (d.parent === undefined || d.parent === null) { return; } // Ignore top level nodes
        var parent = active_node_map[d.parent]; 
        var nodes_to_remove = findActiveDescends(parent);
        combineRegions(parent, nodes_to_remove);
    }
    else if (d3.event.altKey) {
    	if (current_mode === mode.exploration) {
	    	current_mode = mode.fixation;
	    }
	    else if (current_mode === mode.fixation) {
	    	current_mode = mode.exploration;
	    }
    }
    else {
        if (enable_piwik) { piwikTracker.trackPageView('Expand node in circular view'); }
        if (enable_owa) { OWATracker.trackAction('Viz', 'Expand circular node', d.name); }
        if (enable_tracking) {
            trackAction('Expand circular node', d.name);
        }        
        var children = [];
        var ids = d.children;
        var length = ids.length;
        for (var i = 0; i < length; ++i) {
            children.push(active_node_map[ids[i]]);
        }
        expandRegion(d, children, svg_circular);
    }
}

// When mousing over, highlight itself and the neighbors
function nodeMouseOver(node, svg) {
    /* testing */
    console.log(node);
    if (current_mode === mode.search || current_mode === mode.fixation) { return; }
    var brodmann_title = brodmann_map[node.brodmannKey];
    console.log('[title="' + brodmann_title + '"]');
    $('[title="' + brodmann_title + '"]').mouseover();    
    if (current_mode === mode.search) { return; }
    svg.selectAll('.circular.node')
        .classed('nofocus', function(d) {
            var dKey = d.key;
            var nodeKey = node.key;
            var inNeighbors = active_node_in_neighbor_map[nodeKey];
            var outNeighbors = active_node_out_neighbor_map[nodeKey];
            return dKey !== nodeKey && ($.inArray(dKey, inNeighbors) < 0) &&
                ($.inArray(dKey, outNeighbors) < 0);
        });
    svg.selectAll('.circular.link')
        .classed('hidden', function(d) {
            return d.source.key !== node.key && d.target.key !== node.key; 
        });
    svg.selectAll('.circular.link')
    	.classed('outLink', function(d) {
    		var reverted_link = active_node_link_map[d.target.key + '-' + d.source.key];
    		return d.source.key === node.key && reverted_link === undefined;
    	});
    svg.selectAll('.circular.link')
    	.classed('inLink', function(d) {
    		var reverted_link = active_node_link_map[d.target.key + '-' + d.source.key];
    		return d.target.key === node.key && reverted_link === undefined;
    	});
    svg.selectAll('.circular.link')
    	.classed('biLink', function(d) {
    		var reverted_link = active_node_link_map[d.target.key + '-' + d.source.key];
    		return reverted_link !== undefined;
    	});
    svg.selectAll('.circular.text')
        .classed('visible', function(d) {
            var dKey = d.key;
            var nodeKey = node.key;
            var inNeighbors = active_node_in_neighbor_map[nodeKey];
            var outNeighbors = active_node_out_neighbor_map[nodeKey];
            return dKey === nodeKey || ($.inArray(dKey, inNeighbors) >= 0) ||
                ($.inArray(dKey, outNeighbors) >= 0);
        });
}

function nodeMouseOut(node, svg) {
    if (current_mode === mode.search || current_mode === mode.fixation) { return; }
    $('[title="Areas 3, 1 & 2 - Primary Somatosensory Cortex"]').mouseout();    
    if (current_mode === mode.search) { return; }
    svg.selectAll('.circular.node').classed('nofocus', false);
    svg.selectAll('.circular.link').classed('hidden', false);
    svg.selectAll('.circular.link').classed('inLink', false);
    svg.selectAll('.circular.link').classed('outLink', false);
    svg.selectAll('.circular.link').classed('biLink', false);
    updateCircularTexts();
}

function linkClick(d) {
    if (enable_piwik) {
        piwikTracker.trackPageView('Click link in circular view');
    }
    if (enable_owa) {
        OWATracker.trackAction('Viz', 'Click circular link', d.source.name + '-' + d.target.name);
    }
    if (enable_tracking) {
        trackAction('Click circular link', d.source.name + '-' + d.target.name);
    }
    displayConnectionInfo(d);
}

function linkMouseOver(link, svg) {
    if (current_mode === mode.search || current_mode === mode.fixation) { return; }
    svg.selectAll('.circular.node')
        .classed('nofocus', function(d) {
            return d.key !== link.source.key && d.key !== link.target.key;
        });
    svg.selectAll('.circular.link')
        .classed('hidden', function(d) {
            return d.key !== link.key;
        }); 	
    svg.selectAll('.circular.text')
        .classed('visible', function(d) {
            return d.key === link.source.key || d.key === link.target.key;
        });    
}

function linkMouseOut(link, svg) {
    if (current_mode === mode.search || current_mode === mode.fixation) { return; }
    svg.selectAll('.circular.node').classed('nofocus', false);
    svg.selectAll('.circular.link').classed('hidden', false);
    updateCircularTexts();
}

function forceNodeClick(d) {
    if (enable_piwik) {
        piwikTracker.trackPageView('Click link in nodelink view');
    }
    if (enable_owa) {
        OWATracker.trackAction('Viz', 'Click force node', d.name);
    }
    if (enable_tracking) {
        trackAction('Click force node', d.name);
    }
}

function forceNodeMouseOver(node) {
    if (current_mode === mode.search) { return; }
    svg_force.selectAll('.nodelink.node')
        .classed('nofocus', function(d) {
            var dKey = d.key;
            var nodeKey = node.key;
            var inNeighbors = active_node_in_neighbor_map[nodeKey];
            var outNeighbors = active_node_out_neighbor_map[nodeKey];
            return dKey !== nodeKey && ($.inArray(dKey, inNeighbors) < 0) &&
                ($.inArray(dKey, outNeighbors) < 0);
        });
    svg_force.selectAll('.nodelink.link')
        .classed('nofocus', function(d) {
            return d.source.key !== node.key && d.target.key !== node.key; 
        });
    svg_force.selectAll('.nodelink.text')
        .classed('visible', function(d) {
            var dKey = d.key;
            var nodeKey = node.key;
            var inNeighbors = active_node_in_neighbor_map[nodeKey];
            var outNeighbors = active_node_out_neighbor_map[nodeKey];
            return dKey === nodeKey || ($.inArray(dKey, inNeighbors) >= 0) ||
                ($.inArray(dKey, outNeighbors) >= 0);
        });
}

function forceNodeMouseOut(d) {
    if (current_mode === mode.search) { return; }
    svg_force.selectAll('.circular.node').classed('nofocus', false);
    svg_force.selectAll('.circular.link').classed('nofocus', false);
    svg_force.selectAll('.nodelink.text').classed('visible', true);
}

function forceLinkClick(d) {
    if (enable_piwik) {
        piwikTracker.trackPageView('Click link in nodelink view');
    }
    if (enable_owa) {
        OWATracker.trackAction('Viz', 'Click force link', d.source.name + '-' + d.target.name);
    }
    if (enable_tracking) {
        trackAction('Click force link', d.source.name + '-' + d.target.name);
    }    
    displayConnectionInfo(d);
}

function forceLinkMouseOver(link) {
    svg_force.selectAll('.nodelink.node')
        .classed('nofocus', function(d) {
            return d.key !== link.source.key && d.key !== link.target.key;
        });
    svg_force.selectAll('.nodelink.link')
        .classed('nofocus', function(d) {
            return d.key !== link.key;
        });
    svg_force.selectAll('.nodelink.text')
        .classed('visible', function(d) {
            return d.key === link.source.key || d.key === link.target.key;
        });    
}

function forceLinkMouseOut(d) {
    if (current_mode === mode.search) { return; }
    svg_force.selectAll('.nodelink.node').classed('nofocus', false);
    svg_force.selectAll('.nodelink.link').classed('nofocus', false);
    svg_force.selectAll('.nodelink.text').classed('visible', true);
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
        .on("click", nodeClick)
        .on('mouseover', function(d) { nodeMouseOver(d, svg_circular); })
        .on('mouseout', function(d) { nodeMouseOut(d, svg_circular); });

    svg_circular.selectAll(".circular.text")
       .data(active_data_nodes, function(d) {return d.key;})
       .enter()       
       .append("svg:text")
       .attr('x', function(d) {return d.circ.x;})
       .attr('y', function(d) {return d.circ.y;})
       .attr('class', 'circular text')
       .attr('id', function(d) { return 'text-' + d.key; })
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
        .attr('stroke-width', function(d) { return Math.max(1,  Math.ceil(d.base_children.length / 100)) + 'px'; })
/*        .attr('opacity', function(d) {
        	if (d.strength === "strong") {
        		return 0.8;
        	}
        	else if (d.strength === "moderate") {
        		return 0.4;
        	}
        	else {
        		return 0.2;
        	} 
        }) */
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

// Update the visibility of the texts, depending on the current number of 
// active arcs
function updateCircularTexts() {
    svg_circular.selectAll(".circular.text")
        .classed('visible', function(d) {
            var circ = d.circ;
            return (circ.end_angle - circ.start_angle) > Math.PI / 12;
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

    // Set the selected source and selected target to have fixed positions, and 
    // set their locations
    selected_source.fixed = true;
    selected_target.fixed = true;
    selected_source.x = 200;
    selected_source.y = 400;
    selected_target.x = 600;
    selected_target.y = 400; 

    force = d3.layout.force()
              .nodes(active_data_nodes_force)
              .links(active_data_links_force)
              //.links([])
              .size([vis_width, vis_height])
              //still needs work - link distance determined by group size and if
              //connection are internal
              .linkDistance(function(l) {
                  var s = group_count[l.source.group], t = group_count[l.target.group];
                  return 10 * Math.max(l.source.group != l.target.group ? s[1] : 2/s[1],
                                       l.source.group != l.target.group ? t[1] : 2/t[1]) + 20;
              })
              .linkStrength(1)
              //.gravity(0.01)
              .charge(-6000)
              .friction(0.5)
              .start();

    // Clear up visual elements from previous search
    svg_force.selectAll('.link').remove();
    svg_force.selectAll(".node").remove();
    svg_force.selectAll(".text").remove();
    
    var link = svg_force.selectAll(".nodelink.link")    
       .data(active_data_links_force, function(d) { return d.key; })
       .enter().append("svg:line")
       .attr("class", "nodelink link")
       .style("stroke-width", 3)
       .on('click', forceLinkClick)
       .on('mouseover', forceLinkMouseOver)
       .on('mouseout', forceLinkMouseOut);


    var node = svg_force.selectAll(".nodelink.node")
       .data(active_data_nodes_force, function(d) { return d.key; })
       .enter().append("svg:circle")
       .attr("class", "nodelink node")
       .attr("cx", function(d) { return d.x; })
       .attr("cy", function(d) { return d.y; })
       .attr("r", function(d) { return (d === selected_source || d === selected_target) ? 20 : 10; })
       .style("fill", function(d) {return d.color;})
       .on('click', forceNodeClick)
       .on('mouseover', forceNodeMouseOver)
       .on('mouseout', forceNodeMouseOut)
       .call(force.drag);

    var text = svg_force.append('svg:g')
        .selectAll('g')
        .data(force.nodes())
        .enter().append('g')
        .append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .attr('class', 'nodelink text visible')
        .text(function(d) { return d.name; });
    
/*    svg_force.selectAll(".nodelink.text")
       .data(active_data_nodes, function(d) {return d.key;})
       .enter().append("text")
       .attr('x', function(d) {return d.circ.x;})
       .attr('y', function(d) {return d.circ.y;})
       .attr('class', 'nodelink text visible')
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

      text.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
      });
  });
}

function highlightNode(node, class_name, value, show_name, svg) {
    if (node === undefined) {
        return;
    }

    svg.selectAll('.circular.node')
        .classed(class_name, function(d) {
            return d.key === node.key;
        })

    if (show_name) {
        svg.select("#text-" + node.key).classed("visible", value);
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

/*
 * Brain Circuits Viz
 * Authors: Hua and Arthur
 * Script 2: auxilary functions
 * This file contains functions that perform calculations which don't directly
 * affect the visual appearance of the canvas
 */

/*
    This function should be used to determine if an array contains a given 
    element if that object might differ slightly from the version stored in 
    the array (but will still have the same key)
*/
function contains(array, element) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (element.key === array[i].key) {
            return i;
        }
    }
    return -1;
}

/*
function generateKeyForNodeLinkMap(a, b) {
    var min_key = Math.min(a.key, b.key);
    var max_key = Math.max(a.key, b.key);
    return min_key + "-" + max_key;
}
*/

function initActiveNodes() {
    active_data_nodes = [];
    active_data_nodes_force = [];
    for (var key in node_map) {
        var curr_node = node_map[key];
        if (curr_node.depth === 1) {
            active_data_nodes.push(curr_node);
        }
        var num_links = 0;
        num_links += node_in_neighbor_map[key].length;
        num_links += node_out_neighbor_map[key].length;
        if (curr_node.depth === 2 && num_links > 0) {
            active_data_nodes_force.push(curr_node);
        }
    }
    active_data_nodes_force[0].isSource = true;
    active_data_nodes_force[1].isTarget = true;
}

function initActiveLinks() {
    active_data_links = [];
    active_data_links_force = [];
    for (var key in link_map) {
        var curr_link = link_map[key];
        if (curr_link.source.depth === 1 && curr_link.target.depth === 1) {
            active_data_links.push(curr_link);
        }
        if (curr_link.source.depth === 2 && curr_link.target.depth === 2) {
            active_data_links_force.push(curr_link);
        }
    }
}

/*
 * This function is called before rendering the canvas to assign colors to the 
 * top level nodes
 */
function assignColors() {
    var num_level1_nodes = 0;
    var level1_nodes = [];
    for (var key in node_map) {
        var node = node_map[key];
        if (node.depth === 1) {
            num_level1_nodes += 1;
            level1_nodes.push(node);
        }
    }
    var currentPalette = [];
    for (var i = 0; i < num_level1_nodes; ++i) {
        currentPalette.push(colorPalette[i]);
    }
    var nodesFill = d3.scale.ordinal()
                      .domain(d3.range(num_level1_nodes))
                      .range(currentPalette);
    for (var i = 0; i < num_level1_nodes; ++i) {
        level1_nodes[i].color = currentPalette[i];
        for (var j = 0; j < level1_nodes[i].children.length; ++j) {
            var child = node_map[level1_nodes[i].children[j]];
            child.color = currentPalette[i];
            child.group = level1_nodes[i].key;
        }
    }
}

function computeCircularNodesParameters(data) {
    var total_num = data.length;
    var delta = 2 * Math.PI  / total_num;
    for (var i = 0; i < total_num; ++i) {
        var datum = data[i];
        calculateArcPositions(datum, 0, delta, i);
    }
}

function calculateArcPositions(datum, start_angle, delta, i) {
    datum.circ.startAngle = start_angle + delta * i;
    datum.circ.endAngle = start_angle + delta * (i+1);
    var angle = delta * (i + 0.5) + start_angle;
    var radius = inner_radius + (outer_radius - inner_radius) / 2;
    datum.circ.x = radius * Math.cos(Math.PI / 2 - angle);
    datum.circ.y = -radius * Math.sin(Math.PI / 2 - angle);
}

/*
 * Brain Circuits Viz
 * Authors: Hua and Arthur
 * Script 2: auxilary functions
 * This file contains functions that perform calculations which don't directly
 * affect the visual appearance of the canvas
 */


function findActiveParent(node) {
    var result = node;
    while (result !== undefined && result !== null) {
        if (result.isActive) {
            return result;
        }
        result = node_map[result.parent];
    }
    return result;
}

function findDescAtDepth(node, depth) {
    var result = [node];
    while (result[0].depth < depth) {
        var curr_node = result[0];
        var children = curr_node.children;
        var child_num = children.length;
        for (var i = 0; i < child_num; ++i) {
            result.push(node_map[children[i]]);
        }
        result.splice(0, 1);
    }
    return result;
}

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
    for (var key in node_map) {
        var curr_node = node_map[key];
        if (curr_node.depth === 1) {
            curr_node.isActive = true;
            active_data_nodes.push(curr_node);
        }
        var num_links = 0;
        num_links += node_in_neighbor_map[key].length;
        num_links += node_out_neighbor_map[key].length;
        
    }
}

function initActiveLinks() {
    active_data_links = [];
    for (var key in link_map) {
        var curr_link = link_map[key];
        if (curr_link.source.depth === 1 && curr_link.target.depth === 1) {
            active_data_links.push(curr_link);
        }
    }
}

function calculatePaths(num_hop) {
    var paths = [];
    var results = [];
    paths[0] = [selected_source];
    while (paths.length > 0 && paths[0].length <= num_hop + 2) {
        var current_path = paths[0];
        paths.splice(0, 1);
        var anchor_node = current_path[current_path.length - 1];
        if (anchor_node.key === selected_target.key) {
            results.push(current_path);
            continue;
        }
        var neighbors = node_out_neighbor_map[anchor_node.key];
        var neighbor_num = neighbors.length;
        for (var i = 0; i < neighbor_num; ++i) {
            var neighbor_id = neighbors[i];
            var neighbor_node = node_map[neighbor_id];
            paths.push(current_path.concat(neighbor_node));
        }
    }
    return results;
}

function populateForceElements(paths) {
    var num_path = paths.length;
    active_data_nodes_force = [];
    active_data_links_force = [];
    for (var i = 0; i < num_path; ++i) {
        var path = paths[i];
        var num_link = path.length - 1;
        for (var j = 0; j < num_link - 1; ++j) {
            var current_source = path[j];
            var current_target = path[j+1];
            var key_pair = current_source.key + "-" + current_target.key;
            var link = node_link_map[key_pair];
            if ($.inArray(link, active_data_links_force) < 0) {
                active_data_links_force.push(link);
            }
            if ($.inArray(current_source, active_data_nodes_force) < 0) {
                active_data_nodes_force.push(current_source);
            }
            if ($.inArray(current_target, active_data_nodes_force) < 0) {
                active_data_nodes_force.push(current_target);
            }
        }
    }
    console.log(active_data_nodes_force);
    console.log(active_data_links_force);
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
    datum.circ.start_angle = start_angle + delta * i;
    datum.circ.end_angle = start_angle + delta * (i+1);
    var angle = delta * (i + 0.5) + start_angle;
    var radius = inner_radius + (outer_radius - inner_radius) / 2;
    datum.circ.x = radius * Math.cos(Math.PI / 2 - angle);
    datum.circ.y = -radius * Math.sin(Math.PI / 2 - angle);
}

function stash(d) {
    d.circ.old_start_angle = d.circ.start_angle;
    d.circ.old_end_angle = d.circ.end_angle;
}

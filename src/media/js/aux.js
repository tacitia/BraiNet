/*
 * Brain Circuits Viz
 * Authors: Hua and Arthur
 * Script 2: auxilary functions
 * This file contains functions that perform calculations which don't directly
 * affect the visual appearance of the canvas
 */


function combineNodes(node) {
    // If no parent, return
    if (node.parent === undefined || node.parent === null) { return; }
    var nodesToRemove = findActiveSiblings(node);
    // Iterate through all the active nodes and remove the links associated 
    // with the nodes to be removed
    var numToRemove = nodesToRemove.length;
    var link_length = active_data_links.length;
    while (link_length--) {
        var curr_link = active_data_links[link_length];
        // Iterate through all the siblings and remove associated links
        for (var i = 0; i < numToRemove; ++i) {
            var d = nodesToRemove[i];
            if (curr_link.source === d || curr_link.target === d) {
                active_data_links.splice(link_length, 1);
            }
        }
    }
    // Remove the nodes and add the parent node
    var old_num = active_data_nodes.length;
    var parent = node_map[node.parent];
    var firstPos = $.inArray(nodesToRemove[0], active_data_nodes);
    active_data_nodes[firstPos] = parent;
    for (var i = 1; i < numToRemove; ++i) {
        var curr_node = nodesToRemove[i];
        var pos = $.inArray(curr_node, active_data_nodes);
        active_data_nodes.splice(pos, 1);
    }
    // Update the positions of the nodes

    // Update the layout
    updateCircularLayout(old_num, 2 * Math.PI / old_num);
}

function findActiveSiblings(node) {
    var parent = node_map[node.parent];
    var sibling_ids = parent.children;
    var result = [];
    var numSibling = sibling_ids.length;
    for (var i = 0; i < numSibling; ++i) {
        result.push(node_map[sibling_ids[i]]);
    }
    return result;
}

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
    while (result.length > 0 && result[0].depth < depth) {
        var curr_node = result[0];
        var children = curr_node.children;
        var child_num = children.length;
        for (var i = 0; i < child_num; ++i) {
            result.push(node_map[children[i]]);
        }
        result.splice(0, 1);
        console.log(result[0]);
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
    var counter = 0;
    var paths = [];
    var results = [];
    paths[0] = [selected_source];
    // Set the min / max depth
    var depth1 = selected_source.depth;
    var depth2 = selected_target.depth;
    var min_depth = Math.min(depth1, depth2);
    var max_depth = Math.max(depth1, depth2);
    while (paths.length > 0 && paths[0].length <= num_hop + 2) {
        var current_path = paths[0];
        paths.splice(0, 1);
        var anchor_node = current_path[current_path.length - 1];
        if (anchor_node.key === selected_target.key) {
            results.push(current_path);
            continue;
        }
        // If already reaches the maximum length, don't continue counting neighbors
        if (current_path.length >= num_hop + 2) { continue; }
        var neighbors = node_out_neighbor_map[anchor_node.key];
        var neighbor_num = neighbors.length;
        for (var i = 0; i < neighbor_num; ++i) {
            var neighbor_id = neighbors[i];
            var neighbor_node = node_map[neighbor_id];
            if (neighbor_node.depth >= min_depth && neighbor_node.depth <= max_depth) {
                paths.push(current_path.concat(neighbor_node));
            }
        }
        counter++;
        if (counter > 5000) { 
            if (enable_owa) {
                console.log(selected_source);
                console.log(selected_target);
                OWATracker.trackAction('Warning', 'Path size limit reached', selected_source.name + '-' + selected_target + '-' + max_hop);
            }
            console.log("Reached path limit."); break;
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
        for (var j = 0; j < num_link; ++j) {
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
}


/*
 * This function is called before rendering the canvas to assign colors to the 
 * top level nodes
 * Also assigns group
 * TODO: Assign the groups when formatting the data, and then assign the colors
 * based on the group IDs
 */
function assignColors() {
    var num_level1_nodes = 0;
    var queue = [];
    for (var key in node_map) {
        var node = node_map[key];
        if (node.depth === 1) {
            num_level1_nodes += 1;
            node.group = node.key;
            queue.push(node);
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
        queue[i].color = currentPalette[i];
    }
    while (queue.length > 0) {
        var curr_node = queue[0];
        var children = curr_node.children;
        var child_num = children.length;
        for (var i = 0; i < child_num; ++i) {
            var child = node_map[children[i]];
            child.color = curr_node.color;
            child.group = curr_node.group;
            queue.push(child);
        }
        queue.splice(0, 1);
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

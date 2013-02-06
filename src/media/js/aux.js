/*
 * Brain Circuits Viz
 * Authors: Hua and Arthur
 * Script 2: auxilary functions
 * This file contains functions that perform calculations which don't directly
 * affect the visual appearance of the canvas
 */


function combineRegions(new_node, nodes_to_remove) {
    // Iterate through all the active nodes and remove the links associated 
    // with the nodes to be removed
    var numToRemove = nodes_to_remove.length;
    var link_length = active_data_links.length;
    while (link_length--) {
        var curr_link = active_data_links[link_length];
        // Iterate through all the siblings and remove associated links
        for (var i = 0; i < numToRemove; ++i) {
            var d = nodes_to_remove[i];
            if (curr_link.source === d || curr_link.target === d) {
                active_data_links.splice(link_length, 1);
            }
        }
    }
    // Remove the nodes and add the parent node
    var first_pos = $.inArray(nodes_to_remove[0], active_data_nodes);
    var remove_first = active_data_nodes[first_pos];
    remove_first.isActive = false;
    new_node.circ = remove_first.circ;
    new_node.isActive = true;
    active_data_nodes[first_pos] = new_node;
    for (var i = 1; i < numToRemove; ++i) {
        var curr_node = nodes_to_remove[i];
        curr_node.isActive = false;
        var pos = $.inArray(curr_node, active_data_nodes);
        active_data_nodes.splice(pos, 1);
    }
    // Update the positions of the nodes
    var new_num = active_data_nodes.length;
    var new_delta = 2 * Math.PI / new_num;
    // Add in links for the parent
    var new_key = new_node.key;
    for (var i = 0; i < new_num; ++i) {
        var curr_key = active_data_nodes[i].key;
        var key_pair = new_key + '-' + curr_key;
        var link = node_link_map[key_pair];
        if (link !== undefined) {
            active_data_links.push(link);
        }
        key_pair = curr_key + '-' + new_key;
        link = node_link_map[key_pair];
        if (link !== undefined) {
            active_data_links.push(link);
        }
    }
    // Update the layout
    updateCircularLayout(new_num, new_delta);
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

function findActiveDescends(node) {
    var num_active_nodes = active_data_nodes.length;
    var results = [];
    for (var i = 0; i < num_active_nodes; ++i) {
        var curr_node = active_data_nodes[i];
        if (curr_node.parent === undefined || curr_node.parent === null) { continue; }
        // Check if the input node is a parent of the current active node
        var parent = node_map[curr_node.parent];
        while (parent !== undefined && parent !== null) {
            if (parent === node) {
                results.push(curr_node);
                break;
            }
            parent = node_map[parent.parent];
        }
    }
    return results;
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

function saveSessionData() {
    sessionEndTime = new Date();
    var sessionLength = sessionEndTime - sessionStartTime;
    sessionLength /= 1000;
    $.ajax({        
       type: "POST",
       url: "media/php/writeActionData.php",
       data: {actionDataArray : actionData, sessionLength : sessionLength, userID: uid},
       error: function(data) {
            console.log("Failed");
            console.log(data);
       },
       success: function(data) {
            console.log("Successfully passed data to php.");
            console.log(data);
       },
       async: false
    });
}

function populateUserId() {
    $.ajax({
        type: "POST",
        url: "media/php/getUserID.php",
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(data) {
            console.log("Success");
            uid = data;
        },
        async: false
    });
}

function populateDatasets() {
    $.ajax({
        type: "POST",
        url: "media/php/getDatasetByUserId.php",
        data: {userID: 2},
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(data) {
            console.log("Success");
            dataset_list = $.parseJSON(data);
            populateDatasetUI();
        },
        async: false
    });
}

/*
 * 1. Add the dataset in the dabase
 * 2. Add the dataset in the 
 */
function createDataset(datasetName, userID) {
    $.ajax({
        type: "POST",
        url: "media/php/addDataset.php",
        data: {datasetName: datasetName, userID: userID},
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(datasetID) {
            console.log("Success");
            console.log(datasetID);
//            var option=document.createElement("option");
//option.text="Kiwi";
            $('#dataSelect').append(new Option(datasetName, datasetID));
            $('#dataSelect').trigger('liszt:updated');
            $('#createDatasetSuccessAlert').css('display', 'block');
        },
        async: true
    });
}

function startSession() {
    sessionStartTime = new Date();
    startTime = new Date();
    document.onmousemove = recordMouseMovement;
}

function recordActionData() {
    actionData.push({
        timeElapsed: currentActionData.timeElapsed,
        mouseTrace: currentActionData.mouseTrace,
        actionBasic: currentActionData.actionBasic,
        actionDetail: currentActionData.actionDetail,
        time: currentActionData.time
    });
    startTime = new Date();
    currentActionData = {timeElapsed: -1, mouseTrace: "", actionBasic: "", actionDetail: "", time: -1};
}


function recordMouseMovement(e) {
    if (currentActionData.mouseTrace.length > 2950) { return; }
    var currentTime = new Date();
    currentActionData.mouseTrace += "x:" + e.pageX + ",y:" + e.pageY + 
                                    ",time:" + (currentTime - startTime) + ";";
}

function trackAction(actionBasicStr, actionDetailStr) {
    currentActionData.actionBasic = actionBasicStr;
    currentActionData.actionDetail = actionDetailStr;
    endTime = new Date();
    currentActionData.timeElapsed = (endTime - startTime) / 1000;
    currentActionData.time = endTime.toString();
    recordActionData();
}

function paperClick() {
    var paperName = $(this).text();
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Click paper', paperName);
    }
    if (enable_tracking) {
        console.log("tracking paper click");
        trackAction('Click paper', paperName);
    }
}

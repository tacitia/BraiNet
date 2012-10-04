/*
    Brain Circuits Viz
    Authors: Hua and Arthur
    Script 1: main routine
*/

/*******
    Data declaration section
*******/
// Raw connectivity data
var node_link_map; // Key: source node id - target node id. Value: an array of link id.
var link_map; // Key: link id. Value: link details.
var record_map; // Key: paper id. Value: paper details.
var node_map;
var node_neighbor_map; // Key: node id; value: an array of neighbors

// User specific data
var link_rating_map; // Key: link id. Value: user rating for the link.
var record_rating_map; // Key: record id. Value: user rating for the record. 

// SVG data variables
// var data_nodes;
var active_data_nodes;
var active_data_links;

// SVG display variables
var svg;
var arcs;
var links;

// SVG display parameters
var vis_width = 800;
var vis_height = 800;
var inner_radius = Math.min(vis_width, vis_height) * .3;
var outer_radius = inner_radius * 1.5;

// Enumerations
var directionType = {
    "in": 1,
    "out": 2,
    "bi": 3
}

/*******
    End of data declaration section
*******/

/*******
    Data initialization section
*******/
// Ok, assume that we already have the data for now.
node_map = {};
node_map[1] = {key: 1, name: "apple", depth: 0, children:[2,3]};
node_map[2] = {key: 2, name: "banana", depth: 1, children: [4,5]};
node_map[3] = {key: 3, name: "plum", depth: 1, children: [6,7]};
node_map[4] = {key: 4, name: "grape", depth: 2, children: []};
node_map[5] = {key: 5, name: "watermelon", depth: 2, children: []};
node_map[6] = {key: 6, name: "orange", depth: 2, children: []};
node_map[7] = {key: 7, name: "pineapple", depth: 2, children: []};

link_map = {};
link_map[1] = {source: node_map[2], target: node_map[3]};
link_map[2] = {source: node_map[4], target: node_map[6]};
link_map[3] = {source: node_map[5], target: node_map[7]};
link_map[4] = {source: node_map[4], target: node_map[3]};
link_map[5] = {source: node_map[5], target: node_map[3]};
link_map[6] = {source: node_map[3], target: node_map[6]};
link_map[7] = {source: node_map[3], target: node_map[7]};

node_link_map = {};
node_link_map["2-3"] = link_map[1];
node_link_map["4-6"] = link_map[2];
node_link_map["5-7"] = link_map[3];
node_link_map["3-4"] = link_map[4];
node_link_map["3-5"] = link_map[5];
node_link_map["2-6"] = link_map[6];
node_link_map["2-7"] = link_map[7];

node_neighbor_map = {};
node_neighbor_map[2] = [{node: node_map[3]}];
node_neighbor_map[4] = [{node: node_map[5]}];
node_neighbor_map[6] = [{node: node_map[7]}];
node_neighbor_map[3] = [{node: node_map[2]}];
node_neighbor_map[5] = [{node: node_map[4]}];
node_neighbor_map[7] = [{node: node_map[6]}];


// Initialize the active nodes to be the highest level ones
active_data_nodes = [];
for (var key in node_map) {
    var curr_node = node_map[key];
    if (curr_node.depth === 1) {
        active_data_nodes.push(curr_node);
    }
}

computeArcParameters(active_data_nodes);

// Initialize the active links according to the active nodes
active_data_links = [];
for (var key in link_map) {
    var curr_link = link_map[key];
    if (curr_link.source.depth === 1 && curr_link.target.depth === 1) {
        active_data_links.push(curr_link);
    }
}
/*******
    End of data initialization section
*******/

/*******
    SVG rendering section
*******/
// Setup the arc function object
arcs = d3.svg.arc()
         .innerRadius(inner_radius)
         .outerRadius(outer_radius);

diagonal = d3.svg.diagonal();

// Initialize the background svg canvas
svg = d3.select("#canvas")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .append('g')
        .attr("transform", "translate(" + (vis_width  * 2 / 3) + "," + (vis_height / 2) + ")")
        .append('g');

// Render the arcs
enterNodes();

// Render the links
enterLinks();


/*******
    End of the SVG rendering section
*******/

function computeArcParameters(data) {
    var total_num = data.length;
    var delta = 2 * Math.PI  / total_num;
    for (var i = 0; i < total_num; ++i) {
        var datum = data[i];
        calculateArcPositions(datum, 0, delta, i);
    }
}

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

function expandRegion(d) {
    var child_keys = d.children;
    var total_num = child_keys.length;
    if (total_num < 1) {return;}

    // Add the sub-regions of the original region that has been chosen to be expanded
    var start_angle = d.startAngle;
    var end_angle = d.endAngle;
    
    var delta = (end_angle - start_angle) / total_num;

    var original_neighbors = node_neighbor_map[d.key];
    
    for (var i = 0; i < total_num; ++i) {
        var datum = node_map[child_keys[i]];
        calculateArcPositions(datum, start_angle, delta, i);
        active_data_nodes.push(datum);
        // Now add the new links

        var length = original_neighbors.length;
        console.log(length);
        
        for (var j = 0; j < length; ++j) {
            var neighbor = original_neighbors[j].node;
            var key_pair = generateKeyForNodeLinkMap(datum, neighbor);
            var links = node_link_map[key_pair];
            console.log(key_pair);
            if (links !== undefined) {
                var link_num = links.length;
                for (var l = 0; l < link_num; ++l) {
                    active_data_links.push(links[l]);
                }
            }
            console.log(active_data_links);
            console.log(active_data_nodes);
            
        }
    }

    enterNodes();
    
    // Remove the expanded node from SVG
    var pos = $.inArray(d, active_data_nodes);
    active_data_nodes.splice(pos, 1);

    svg.selectAll("path")
        .data(active_data_nodes, function(d) {return d.key;})
        .exit().remove();

    // Add the new links resulted from the split

    
    enterLinks();

    // Remove the links that are associated with the expanded node 
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
}

function enterLinks() {
    svg.selectAll("links")
        .data(active_data_links, function(d) {return d.key;})
        .enter().append("path")
        .attr("stroke", 'black')
        .attr("d", diagonal);
}

function generateKeyForNodeLinkMap(a, b) {
    var min_key = Math.min(a.key, b.key);
    var max_key = Math.max(a.key, b.key);
    return min_key + "-" + max_key;
}

function calculateArcPositions(datum, start_angle, delta, i) {
    datum.startAngle = start_angle + delta * i;
    datum.endAngle = start_angle + delta * (i+1);
    var angle = delta * (i + 0.5) + Math.PI / 2;
    var radius = inner_radius + (outer_radius - inner_radius) / 2;
    datum.x = radius * Math.cos(angle);
    datum.y = radius * Math.sin(angle);
}



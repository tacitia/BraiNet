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
var paper_map; // Key: paper id. Value: paper details.
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
var linkGenerator;
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

// Misc program control variables
var mutex = 2;

/*******
    End of data declaration section
*******/

/*******
    Data loading section
*******/

d3.json("media/data/test_node.json", function (data) {
    node_map = {};
    var num_nodes = data.length;
    for (var i = 0; i < num_nodes; ++i) {
        var node = data[i];
        node_map[data[i].key] = node;
    }
    mutex -= 1;
});

d3.json("media/data/test_link.json", function (data) {
    link_map = {};
    node_link_map = {}
    var num_links = data.length;
    for (var i = 0; i < num_links; ++i) {
        var raw_link = data[i];
        var link = {key: raw_link.key, source: node_map[raw_link.sourceKey], 
                    target: node_map[raw_link.targetKey]};
        link_map[link.key] = link;
//        var key_pair = generateKeyForNodeLinkMap(link.source, link.target);
        var key_pair = link.source.key + "-" + link.target.key;
        node_link_map[key_pair] = link;
    }
    mutex -= 1;
});

waitForDataLoading();

/*******
    End of data loading section
*******/
/*
node_neighbor_map = {};
node_neighbor_map[2] = [{node: node_map[3]}, {node: node_map[6]}, {node: node_map[7]}];
node_neighbor_map[3] = [{node: node_map[2]}, {node: node_map[4]}, {node: node_map[5]}];
node_neighbor_map[4] = [{node: node_map[6]}, {node: node_map[3]}];
node_neighbor_map[5] = [{node: node_map[7]}, {node: node_map[3]}];
node_neighbor_map[6] = [{node: node_map[4]}, {node: node_map[2]}];
node_neighbor_map[7] = [{node: node_map[5]}, {node: node_map[2]}];

paper_map = {};
paper_map[1] = {key: 1, title: "paper 1", url: "http://pubmed"};
paper_map[2] = {key: 2, title: "paper 2", url: "http://pubmed"};

bams_map = {};
bams_map[1] = {key: 1, url: ""};
*/

function renderCanvas() {
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

    // Setup the arc function object
    arcs = d3.svg.arc()
             .innerRadius(inner_radius)
             .outerRadius(outer_radius);

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
}

function waitForDataLoading() {
    if (mutex > 0) {
        setTimeout(function() {waitForDataLoading();}, 1000);
    }
    else {
        renderCanvas();
    }
}





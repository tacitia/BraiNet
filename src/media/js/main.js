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
link_map[1] = {key: 1, source: node_map[2], target: node_map[3], paper: [1,2], bams_records: []};
link_map[2] = {key: 2, source: node_map[4], target: node_map[6]};
link_map[3] = {key: 3, source: node_map[5], target: node_map[7]};
link_map[4] = {key: 4, source: node_map[4], target: node_map[3]};
link_map[5] = {key: 5, source: node_map[5], target: node_map[3]};
link_map[6] = {key: 6, source: node_map[2], target: node_map[6]};
link_map[7] = {key: 7, source: node_map[2], target: node_map[7]};

node_link_map = {};
node_link_map["2-3"] = link_map[1];
node_link_map["4-6"] = link_map[2];
node_link_map["5-7"] = link_map[3];
node_link_map["3-4"] = link_map[4];
node_link_map["3-5"] = link_map[5];
node_link_map["2-6"] = link_map[6];
node_link_map["2-7"] = link_map[7];

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
bams_map[1] = {key: 1, url: "", };

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





/*
    Brain Circuits Viz
    Authors: Hua and Arthur
    Script 1: main routine
*/

/*
    Data declaration section
*/
// Raw connectivity data
var node_link_map; // Key: source node id - target node id. Value: an array of link id.
var link_map; // Key: link id. Value: link details.
var record_map; // Key: paper id. Value: paper details.
// User specific data
var link_rating_map; // Key: link id. Value: user rating for the link.
var record_rating_map; // Key: record id. Value: user rating for the record. 
// SVG data variables
var data_nodes;
var data_links;
// SVG display variables
var arc;
var links;

/*
    Data importing section
*/
// Ok, assume that we already have the data for now.
data_nodes = [];
data_nodes.push({key: 1, name: "apple", children:[2,3]});
data_nodes.push({key: 2, name: "banana", children: [4,5]});
data_nodes.push({key: 3, name: "plum", children: [6,7]});
data_nodes.push({key: 4, name: "grape", children: []});
data_nodes.push({key: 5, name: "watermelon", children: []});
data_nodes.push({key: 6, name: "orange", children: []});
data_nodes.push({key: 7, name: "pineapple", children: []});

node_link_map = {};
node_link_map["2-3"] = 1;



/*
    SVG rendering section
*/

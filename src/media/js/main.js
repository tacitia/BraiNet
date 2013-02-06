/*
    Brain Circuits Viz
    Authors: Hua and Arthur
    Script 1: main routine
*/

/*******
    Data loading section
*******/

// Read in the nodes data and build the node map
d3.json("media/data/test_node.json", function (data) {
    node_map = {};
    node_in_neighbor_map = {};
    node_out_neighbor_map = {};
    var num_nodes = data.length;
    for (var i = 0; i < num_nodes; ++i) {
        var node = data[i];
        node.circ = {};
        node_map[node.key] = node;
        node_in_neighbor_map[node.key] = [];
        node_out_neighbor_map[node.key] = [];
    }
    // !! Change Java code later so that parent field is assigned in json file
    
    for (var key in node_map) {
        var node = node_map[key];
        for (var i = 0; i < node.children.length; ++i) {
            var child_key = node.children[i];
            var child = node_map[child_key];
            if (child !== undefined) {
                child.parent = key;
//                child.group = key;
            }
        }
    } 
    
    mutex -= 1;
});


d3.json("media/data/test_paper.json", function(data) {
    
    paper_map = {};
    var num_paper = data.length;
    for (var i = 0; i < num_paper; ++i) {
        var paper = data[i];
        paper_map[paper.key] = paper;
    } 
    mutex -= 1;
});


d3.json("media/data/test_link.json", function (data) {
    link_map = {};
    node_link_map = {};
    var num_links = data.length;
    console.log(num_links);
    for (var i = 0; i < num_links; ++i) {
        var raw_link = data[i];
        var link = {key: raw_link.key, source: node_map[raw_link.sourceKey], 
                    target: node_map[raw_link.targetKey], paper: raw_link.paper,
                    children: raw_link.children, isDerived: raw_link.isDerived};
        link_map[link.key] = link;
        var key_pair = link.source.key + "-" + link.target.key;
        node_link_map[key_pair] = link;
        node_in_neighbor_map[raw_link.targetKey].push(raw_link.sourceKey);
        node_out_neighbor_map[raw_link.sourceKey].push(raw_link.targetKey);
    }
    mutex -= 1;
});

populateUserId();
populateDatasets();
waitForDataLoading();

/*******
    End of data loading section
*******/


/*******
    UI elements action binding section
*******/
d3.select("#bt-search").on("click", searchButtonClick);
d3.select("#bt-clear").on("click", clearButtonClick);
d3.select('#bt-createDatasets').on('click', createDatasetButtonClick);
d3.select('#bt-manageDatasets').on('click', manageDatasetButtonClick);
d3.select("#maxHop").on("change", setMaxHop);
$('#sourceSelect').change(sourceSearchInput);
$('#targetSelect').change(targetSearchInput);
window.onbeforeunload=saveSessionData;
window.onload=startSession;
/*******
    End of UI elements action binding section
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
    // Assign colors to
    assignColors();
    // Initialize the active nodes to be the highest level ones
    initActiveNodes();
    computeCircularNodesParameters(active_data_nodes);
    // Initialize the active links according to the active nodes
    initActiveLinks();

    // Setup the arc function object
    arcs = d3.svg.arc()
             .innerRadius(inner_radius)
             .outerRadius(outer_radius)
             .startAngle(function(d) {return d.circ.start_angle;})
             .endAngle(function(d) {return d.circ.end_angle;});

    curves = d3.svg.line()
               .x(function(d) {return d.x;})
               .y(function(d) {return d.y;})
               .interpolate("basis");

    // Initialize the background svg canvas
    svg_circular = d3.select("#canvas-circular")
            .append("svg")
            .attr("width", vis_width)
            .attr("height", vis_height)
            .append('g')
            .attr("transform", "translate(" + (vis_width / 2) + "," + (vis_height / 2) + ")")
            .append('g');

    svg_force = d3.select("#canvas-force")
            .append("svg")
            .attr("width", vis_width)
            .attr("height", vis_height)
            .append('g');

    // Render the arcs
    enterCircularNodes();
    // Render the links
    enterCircularLinks();
    updateCircularTexts();

//    updateForceLayout();
}

function setupUIElements() {
    appendNodesAsOptions(node_map);
    console.log("about to bind chzn-select");
    $('.chzn-select').chosen({allow_single_deselect: true});
}

function waitForDataLoading() {
    if (mutex > 0) {
        setTimeout(function() {waitForDataLoading();}, 1000);
    }
    else {
        renderCanvas();
        setupUIElements();
    }
}

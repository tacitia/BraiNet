/*
    Brain Circuits Viz
    Authors: Hua and Arthur
    Script 1: main routine
*/


(function(cn, $, undefined){
	var notesDisplay = $('conn-note-display');
	var notesInput = $('conn-note-input');
	var saveButton = $('conn-note-save');
	
	var updateNotes = function() {

	};
	
	cn.editButtonClick = function() {
		console.log("???");
		notesDisplay.css('display', 'none');
		notesInput.css('display', 'block');
		saveButton.css('visibility', 'visible');		
	};
	
	cn.saveButtonClick = function() {
		var notes = notesInput.value();
		// Update notes for the connection
		// Update notes in the database
		notesDisplay.css('display', 'block');
		notesInput.css('display', 'none');
		saveButton.css('visibility', 'hidden');
		notesDisplay.value(notes);
		updateNotes();	
	};
	
})(window.connNotes = window.connNotes || {}, jQuery);

/*******
    Data loading section
*******/
var pre_nodes;
var pre_links;

// Read in the nodes data and build the node map
d3.json("media/data/test_node.json", function (data) {
/*
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
    } */
    pre_nodes = data;
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
    pre_links = data;
/*    link_map = {};
    node_link_map = {};
    var num_links = data.length;
    for (var i = 0; i < num_links; ++i) {
        var raw_link = data[i];
        var link = {key: raw_link.key, source: node_map[raw_link.sourceKey], 
                    target: node_map[raw_link.targetKey], paper: raw_link.paper,
                    children: raw_link.children};
        link_map[link.key] = link;
        var key_pair = link.source.key + "-" + link.target.key;
        node_link_map[key_pair] = link;
        node_in_neighbor_map[raw_link.targetKey].push(raw_link.sourceKey);
        node_out_neighbor_map[raw_link.sourceKey].push(raw_link.targetKey);
    } */
    
    mutex -= 1;
});

database.populateUserId();
database.getBrodmannAreas();
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
d3.select('#bt-cloneDatasets').on('click', cloneDatasetButtonClick);
d3.select('#bt-applyDataset').on('click', applyDatasetButtonClick);
d3.select("#maxHop").on("change", setMaxHop);
$('#conn-note-edit').onclick(connNotes.editButtonClick);
$('#conn-note-save').onclick(connNotes.saveButtonClick);
//d3.selectAll('area').attr('data-map-highlight', '{"stroke":false,"fillColor":"ff0000","fillOpacity":0.6}');
$('#sourceSelect').change(sourceSearchInput);
$('#targetSelect').change(targetSearchInput);
$('#dataSelect').change(datasetSelect);
$('.map').maphilight();
window.onbeforeunload=database.saveSessionData;
window.onload=startSession;
/*******
    End of UI elements action binding section
*******/

function renderCanvas() {
    // Assign colors to
    assignColors(active_node_map);
    // Initialize the active nodes to be the highest level ones
    initActiveNodes(active_node_map);
    computeCircularNodesParameters(active_data_nodes);
    // Initialize the active links according to the active nodes
    initActiveLinks(active_link_map);

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

    // Render the links
    enterCircularLinks();
    // Render the arcs
    enterCircularNodes();
    updateCircularTexts();

//    updateForceLayout();
}

function setupUIElements() {
    appendNodesAsOptions(active_node_map);
    d3.selectAll('area').attr('data-map-highlight', '{"stroke":false,"fillColor":"ff0000","fillOpacity":0.6}');
}

function waitForDataLoading() {
    if (mutex > 0) {
        setTimeout(function() {waitForDataLoading();}, 1000);
    }
    else {
/*        active_node_map = node_map;
        active_node_link_map = node_link_map;
        active_node_in_neighbor_map = node_in_neighbor_map;
        active_node_out_neighbor_map = node_out_neighbor_map;
       active_link_map = link_map; */
        var datasetKey = 'pre_1'; 
        user_datasets[datasetKey] = {};
        dataModel.constructUserNodesMaps(datasetKey, pre_nodes);
        dataModel.constructUserLinksMaps(datasetKey, pre_links);
        dataModel.constructLinkHierarchy(datasetKey, pre_links);
//        assignColors(user_datasets[datasetKey].node_map);
        active_node_map = user_datasets['pre_1'].node_map;
        active_node_link_map = user_datasets['pre_1'].node_link_map;
        active_node_in_neighbor_map = user_datasets['pre_1'].node_in_neighbor_map;
        active_node_out_neighbor_map = user_datasets['pre_1'].node_out_neighbor_map;
        active_link_map = user_datasets['pre_1'].link_map;
        console.log(active_link_map);
        renderCanvas();
        setupUIElements();
    }
}

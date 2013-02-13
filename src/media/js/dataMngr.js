var datasetName = $('#datasetName').text();
var datasetKey = parseInt($('#datasetID').text());
var nodes;
var links;
var key_node_map = {};
var name_node_map = {};
var userId = 3;
var mutex = 1;
getBrainData(datasetKey);
$('.chzn-select').chosen({allow_single_deselect: true});
d3.select("#bt-addNode").on("click", displayAddBrainNodeField);
d3.select("#bt-addLink").on("click", displayAddBrainLinkField);
d3.select("#bt-addBatch").on("click", displayAddFromFileField);
d3.select("#bt-addNodeSubmit").on("click", addBrainNode);
d3.select("#bt-addLinkSubmit").on("click", addBrainLink);


// ================ Misc Processing Functions ================ //

function waitForDataLoading() {
    if (mutex > 0) {
        setTimeout(function() {waitForDataLoading();}, 1000);
    }
    else {
        renderPage();
    }
}

function constructNodesTable() {
    var num_nodes = nodes.length;
    for (var i = 0; i < num_nodes; ++i) {
        var curr_node = nodes[i];    
        key_node_map[curr_node.key] = curr_node;
        name_node_map[curr_node.name] = curr_node;
    }
}


// ================ User Interface Functions ================ //

/*
 * 1. Retrieve node information from the UI
 * 2. Add node to the database
 * 3. Update the display
 */
function addBrainNode() {
    var nodeName = $('[name="nodeName"]').val();
    var nodeDepth = parseInt($('[name="nodeDepth"]').val());
    var parentKey = $('#nodeParent').val();
    if (parentKey === "") {
        parentKey = -1;
    }
    var notes = $('[name="nodeNotes"]').val();
    var newData = {userID: userId, datasetKey: datasetKey, nodeName: nodeName, parentKey: parentKey, depth: nodeDepth, notes: notes};
    $.ajax({        
        type: "POST",
        url: "../php/addBrainNode.php",
        data: newData,
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(node) {
            console.log("Successfully passed data to php.");
            console.log($.parseJSON(node));
            addNodeToDisplay($.parseJSON(node));
        },
        async: false
    });
}

/*
 * 1. Retrieve link information from the UI
   2. Retrieve the keys for the nodes
 * 3. Add link to the database
 * 4. Update the display
 */
function addBrainLink() {
    var sourceKey = $('#sourceName').val();
    var targetKey = $('#targetName').val();
    var notes = $('[name="linkNotes"]').val();
    var linkData = {user: userId, dataset: datasetKey, source: sourceKey, target: targetKey, notes: notes};
    $.ajax({        
        type: "POST",
        url: "../php/addBrainLink.php",
        data: linkData,
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(link) {
            console.log("Successfully passed data to php.");
            console.log($.parseJSON(link));
            addLinkToDisplay($.parseJSON(link));
        },
        async: false
    });    
}
/*
 * [TODO]
 */
function addFromFile() {

}


function populateBrainDataTable() {
    populateNodesTable();
    populateLinksTable();
}

function populateNodesTable() {
    var nodesTable = d3.select('#nodesTable').select('tbody');
    var length = nodes.length;
    for (var i = 0; i < length; ++i) {
        var node = nodes[i];
        $('#nodesTable > tbody:last').append('<tr><td>' + node.name + '</td><td>' + 
            node.depth + '</td><td>' + node.parentName + '</td><td>' + node.notes +
            '</td></tr>');    
    }
}

function addNodeEntry(node) {
    $('#nodesTable > tbody:last').append('<tr><td>' + node.name + '</td><td>' + 
        node.depth + '</td><td>' + node.parentName + '</td><td>' + node.notes + 
        '</td></tr>');
}

function addLinkEntry(link) {
    var source_node = key_node_map[parseInt(link.sourceKey)];
    var target_node = key_node_map[parseInt(link.targetKey)];
    $('#linksTable > tbody:last').append('<tr><td>' + source_node.name + '</td><td>' + 
        target_node.name + '</td><td>' + link.notes + '</td></tr>');
}

function populateLinksTable() {
    var linksTable = d3.select('#linksTable').select('tbody');
    var length = links.length;
    for (var i = 0; i < length; ++i) {
        var link = links[i];
        var source_node = key_node_map[parseInt(link.sourceKey)];
        var target_node = key_node_map[parseInt(link.targetKey)];
        $('#linksTable > tbody:last').append('<tr><td>' + source_node.name + '</td><td>' + 
            target_node.name + '</td><td>' + link.notes + '</td></tr>');        
    }
    /* Can't get this to work - works with a 'tr' selector
    linksTable.selectAll(':not(.tableTitle)')
        .data(links)
        .enter()
        .append('tr')
        .html(function(d) {
            console.log(d);
            var source_node = key_node_map[parseInt(d.sourceKey)];
            var target_node = key_node_map[parseInt(d.targetKey)];
            return '<td>' + source_node.name + '</td><td>' + target_node.name + '</td>';
        }); */
}

function populateOptions() {
    for (var key in key_node_map) {
        var node = key_node_map[key];
        $('#nodeParent').append(new Option(node.name, key, false, false));
        $('#sourceName').append(new Option(node.name, key, false, false));        
        $('#targetName').append(new Option(node.name, key, false, false));
    }
    $('.chzn-select').chosen({allow_single_deselect: true});
}

function addNodeToDisplay(node) {
    var parent = key_node_map[parseInt(node.parentKey)];
    node.parentName = (parent === null || parent === undefined) ? null : parent.name;
/*    if (parent !== null && parent !== undefined) {
        key_node_map[parent.key] = parent;
        name_node_map[parent.name] = parent;
    } */
    nodes.push(node);
    key_node_map[node.key] = node;
    name_node_map[node.name] = node;
    addNodeEntry(node);
    addNodeToOptions(node);
}

function addLinkToDisplay(link) {
    links.push(link);
    addLinkEntry(link);
}

function addNodeToOptions(node) {
    $('#nodeParent').append(new Option(node.name, parseInt(node.key)));
    $('#nodeParent').trigger('liszt:updated');
    $('#sourceName').append(new Option(node.name, parseInt(node.key)));
    $('#sourceName').trigger('liszt:updated');
    $('#targetName').append(new Option(node.name, parseInt(node.key)));
    $('#targetName').trigger('liszt:updated');
}

function displayAddBrainNodeField() {
    d3.select('bt-addNode').classed('btn-primary', true);
    d3.select('bt-addLink').classed('btn-primary', false);
    d3.select('bt-addBatch').classed('btn-primary', false);
    $('#addNodeField').css('display', 'block');
    $('#addLinkField').css('display', 'none');
    $('#addBatchField').css('display', 'none');
}

function displayAddBrainLinkField() {
    d3.select('bt-addNode').classed('btn-primary', false);
    d3.select('bt-addLink').classed('btn-primary', true);
    d3.select('bt-addBatch').classed('btn-primary', false);
    $('#addNodeField').css('display', 'none');
    $('#addLinkField').css('display', 'block');
    $('#addBatchField').css('display', 'none');
}

function displayAddFromFileField() {
    d3.select('bt-addNode').classed('btn-primary', false);
    d3.select('bt-addLink').classed('btn-primary', false);
    d3.select('bt-addBatch').classed('btn-primary', true);
    $('#addNodeField').css('display', 'none');
    $('#addLinkField').css('display', 'none');
    $('#addBatchField').css('display', 'block');
}

// ================ Database Query Functions ================ //

function getUserId() {
    var uid;
    $.ajax({
        type: "POST",
        url: "../php/getUserID.php",
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
    return uid;
}

function getBrainData(datasetKey) {
    $.ajax({
        type: "POST",
        url: "../php/getBrainData.php",
        data: {datasetKey: datasetKey},
        error: function(data) {
        console.log("Failed");
            console.log(data);
        },
        success: function(result) {
            console.log("Successfully passed data to php.");
            var data = $.parseJSON(result);
            nodes = data.nodes;
            links = data.links;
            constructNodesTable();
            populateBrainDataTable();
            populateOptions();
        },
        async: false
    });
}




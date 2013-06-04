var datasetName = $('#datasetName').text();
var datasetKey = parseInt($('#datasetID').text());
var nodes;
var links;
var key_node_map = {};
var name_node_map = {};
var key_link_map = {};
var brodmann_map = {};
var userId = 0;
var nodesTable = $('#nodesDisplay').dataTable();
var linksTable = $('#linksDisplay').dataTable();
var selectMutex = 3;

//on tr hover append delete button on last th
var deleteIcon;
$('table').on("mouseenter", "tr", function() {
	var tableID = $(this).context.parentNode.parentNode.id;
	var content;
	if (tableID === "nodesDisplay") {
		var nodeName = $(this).context.children[0].innerText;
		if (name_node_map[nodeName] === undefined) { return; }
		var nodeID = name_node_map[nodeName].key;
		content = '<span onclick="deleteNodeRow(this,' + nodeID + ')"><i class="icon-trash"></i> Delete</span>';
		console.log(content);
	}
	else if (tableID === "linksDisplay") {
		var startName = $(this).context.children[0].innerText;
		var endName = $(this).context.children[1].innerText;
		if (name_node_map[startName] === undefined) { return; }
		if (name_node_map[endName] === undefined) { return; }
		var startID = name_node_map[startName].key;
		var endID = name_node_map[endName].key;
		var linkID = key_link_map[startID + "-" + endID].key;
		content = '<span onclick="deleteLinkRow(this,' + linkID + ')"><i class="icon-trash"></i> Delete</span>'; 
	}
//	deleteIcon = $(this).find('td:last').append('<span onclick="deleteRow(this)"><i class="icon-trash"></i> Delete</span>');
	deleteIcon = $(this).find('td:last').append(content);
});

$('table').on("mouseleave", "tr", function() {
    $(deleteIcon).find('span').remove();
});
getBrodmannAreas();
getBrainData(datasetKey, userId);
getLinkAttrs();
d3.select("#bt-addNode").on("click", displayAddBrainNodeField);
d3.select("#bt-addLink").on("click", displayAddBrainLinkField);
d3.select("#bt-addBatch").on("click", displayAddFromFileField);
d3.select("#bt-addNodeSubmit").on("click", addBrainNode);
d3.select("#bt-addLinkSubmit").on("click", addBrainLink);
d3.select('#bt-addLinkAttrSubmit').on('click', addBrainLinkAttr);

// ================ Misc Processing Functions ================ //

function constructMaps() {
    var num_nodes = nodes.length;
    for (var i = 0; i < num_nodes; ++i) {
        var curr_node = nodes[i];
        key_node_map[curr_node.key] = curr_node;
        name_node_map[curr_node.name] = curr_node;
    }
    var num_links = links.length;
    for (var i = 0; i < num_links; ++i) {
    	var curr_link = links[i];
    	var key_pair = curr_link.sourceKey + "-" + curr_link.targetKey;
    	key_link_map[key_pair] = curr_link;
    }
}

function constructBrodmannMap(data) {
	var num_area = data.length;
	for (var i = 0; i < num_area; ++i) {
		var area = data[i];
		brodmann_map[area.id] = area.name;
	}
}

function bindSelections() {
	if (selectMutex === 0) {
		console.log("111");
		$('.chzn-select').chosen({allow_single_deselect: true});
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
    if (nodeName === "") {
    	alert("Cannot add node: empty node name is not allowed.");
    	return;	
    }
    var nodeDepth = parseInt($('[name="nodeDepth"]').val());
    var parentKey = $('#nodeParent').val();
    if (parentKey === "") {
        parentKey = -1;
    }
    var brodmannKey = $('#brodmannArea').val();
    if (brodmannKey === "") {
    	brodmannKey = -1;
    }
    var notes = $('[name="nodeNotes"]').val();
    var newData = {userID: userId, datasetKey: datasetKey, nodeName: nodeName, parentKey: parentKey, depth: nodeDepth, notes: notes, brodmannKey: parseInt(brodmannKey)};
    console.log(newData);
    $.ajax({
        type: "POST",
        url: "../php/addBrainNode.php",
        data: newData,
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(result) {
            console.log("Successfully passed data to php.");
            console.log(result);
            // duplication: 1062
            console.log(parseInt(result));
            if (parseInt(result) === 1062) {
            	alert("Cannot add node: a node with the same name already exists in the dataset."); }
            else {
            	try {
		            console.log($.parseJSON(result));
    		        addNodeToDisplay($.parseJSON(result));
//    		        $('#addNodeField').find("input").val('');
//    		        $('#addNodeField').find("select").val('');
    		    } catch(e) {
    		    	alert("Cannot add node: unknown database error occurred during node insertion.");
    		    }
    		}
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
    var attrKey = $('#attrName').val();
    var attrValue = $('#attrValue').val();
    var linkData = {user: userId, dataset: datasetKey, source: sourceKey, target: targetKey, notes: notes, attrKey: attrKey, attrValue: attrValue};
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
            console.log(link);
            addLinkToDisplay($.parseJSON(link));
//            $('#addLinkField').find("input").val('');
//    		$('#addLinkField').find("select").val('');
        },
        async: false
        
    });
}

function addBrainLinkAttr() {
	var attrName = $('[name="newAttrName"]').val();
	var attrType = $('#attrType').val();
	console.log(attrName);
	console.log(attrType);	
    $.ajax({
        type: "POST",
        url: "../php/addLinkAttr.php",
        data: {datasetKey: datasetKey, attrName: attrName, attrType: attrType},
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(data) {
            console.log("Successfully passed data to php.");
            console.log(data);
            updateLinkAttrOptions($.parseJSON(data));
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
    nodesLength = nodes.length;
    for (var i = 0; i < nodesLength; ++i) {
        var node = nodes[i];
        nodesTable.fnAddData([String(node.name),
                         String(node.depth),
                         String(node.parentName),
                         String(node.notes),
                         String(node.brodmannKey)]);
    }
}

/*
 * TODO: need to be updated to work with dataTable
 */
function addNodeEntry(node) {
	console.log(brodmann_map[node.brodmannKey]);
    $('#nodesTable > tbody:last').append('<tr><td>' + node.name + '</td><td>' +
        node.depth + '</td><td>' + node.parentName + '</td><td>' + node.notes + 
        '</td></td>' + brodmann_map[node.brodmannKey] +
        '</td></tr>');
}

function addLinkEntry(link) {
    var source_node = key_node_map[parseInt(link.sourceKey)];
    var target_node = key_node_map[parseInt(link.targetKey)];
    $('#linksTable > tbody:last').append('<tr><td>' + source_node.name + '</td><td>' +
        target_node.name + '</td><td>' + link.notes + '</td></tr>');
}

function populateLinksTable() {
    var linksLength = links.length;
    for (var i = 0; i < linksLength; ++i) {
        var link = links[i];
        var source_node = key_node_map[parseInt(link.sourceKey)];
        var target_node = key_node_map[parseInt(link.targetKey)];
        linksTable.fnAddData([String(source_node.name),
                              String(target_node.name),
                              String(link.notes)]);
    }
}

function populateOptions() {
    for (var key in key_node_map) {
        var node = key_node_map[key];
        $('#nodeParent').append(new Option(node.name, key, false, false));
        $('#sourceName').append(new Option(node.name, key, false, false));
        $('#targetName').append(new Option(node.name, key, false, false));
    }
    selectMutex -= 1;
    bindSelections();
}

function populateLinkAttrOptions(linkAttrs) {
	var num_attr = linkAttrs.length;
	for (var i = 0; i < num_attr; ++i) {
		var attr = linkAttrs[i];
		$('#attrName').append(new Option(attr.name, attr.key, false, false));
	}
	
	selectMutex -= 1;
	bindSelections();
}

function updateLinkAttrOptions(linkAttrs) {
	var num_attr = linkAttrs.length;
	for (var i = 0; i < num_attr; ++i) {
		var attr = linkAttrs[i];
		$('#attrName').append(new Option(attr.name, attr.key, false, false));
	}
    $('#attrName').trigger('liszt:updated');
}

function populateBrodmannAreas(brodmannAreas) {
//	console.log(brodmannAreas);
	var num_area = brodmannAreas.length;
	for (var i = 0; i < num_area; ++i) {
		var area = brodmannAreas[i];
		$('#brodmannArea').append(new Option(area.name, area.id, false, false));
	}
    selectMutex -= 1;
    bindSelections();
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
    //addNodeEntry(node);
    nodesTable.fnAddData([String(node.name), 
    					  String(node.depth), 
    					  String(node.parentName), 
    					  String(node.notes), 
    					  String(node.brodmannKey)]);
    addNodeToOptions(node);
}

function addLinkToDisplay(link) {
    links.push(link);
//    addLinkEntry(link);
    var source_node = key_node_map[parseInt(link.sourceKey)];
    var target_node = key_node_map[parseInt(link.targetKey)];
    console.log(link);
    console.log(link.sourceKey);
    console.log(key_node_map);
    console.log(source_node);
    linksTable.fnAddData([String(source_node.name),
                          String(target_node.name),
                          String(link.notes)]);
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

//pass tr element
/*
 * 1. display a warning
 * 2. remove the element from the database
 * 3. remove the element from the display
 */
function deleteNodeRow(row, nodeKey) {
	var choice = confirm("Are you sure you want to delete the selected node? If a node is deleted, the associated links will also be deleted. Click OK to confirm.");
	if (choice) {
	    nodesTable.fnDeleteRow($(row).closest('tr').get()[0]);
	    deleteNode(nodeKey);
	}
}

function deleteLinkRow(row, linkKey) {
	var choice = confirm("Are you sure you want to delete the selected link? Click OK to confirm.");
	if (choice) {
	    linksTable.fnDeleteRow($(row).closest('tr').get()[0]);
	    deleteLink(linkKey);
	}
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
            console.log(data);
            uid = data;
        },
        async: false
    });
    return uid;
}

function getBrainData(datasetKey, userID) {
    $.ajax({
        type: "POST",
        url: "../php/getBrainData.php",
        data: {datasetKey: datasetKey, userID: userID},
        error: function(data) {
        console.log("Failed");
            console.log(data);
        },
        success: function(result) {
            console.log("GetBrainData.php: successfully passed data to php.");
            console.log(result);
            var data = $.parseJSON(result);
            console.log(data);
            nodes = data.nodes;
            links = data.links;
            constructMaps();
            populateBrainDataTable();
            populateOptions();
        },
        async: false
    });
}

function getBrodmannAreas() {
    $.ajax({
        type: "GET",
        url: "../php/getBrodmannAreas.php",
        error: function(data) {
        console.log("Failed");
            console.log(data);
        },
        success: function(result) {
            console.log("GetBordmannAreas: successfully passed data to php.");
//            console.log(result);
            var data = $.parseJSON(result);
            populateBrodmannAreas(data);
            constructBrodmannMap(data);
        },
        async: true
    });
}

function getLinkAttrs() {
    $.ajax({
        type: "POST",
        url: "../php/getLinkAttr.php",
        data: {datasetKey: datasetKey},
        error: function(data) {
        console.log("Failed");
            console.log(data);
        },
        success: function(result) {
            console.log("Successfully passed data to php.");
            console.log(result);
            var data = $.parseJSON(result);
            populateLinkAttrOptions(data);
        },
        async: true
    });
}	


function deleteNode(nodeKey) {
	console.log(nodeKey);
    $.ajax({
        type: "POST",
        url: "../php/deleteBrainNode.php",
        data: {nodeKey: nodeKey},
        error: function(data) {
        console.log("Failed");
            console.log(data);
        },
        success: function(result) {
            console.log("Successfully deleted brain node.");
            console.log(result);
        },
        async: false
    });	
}

function deleteLink(linkKey) {
	console.log(linkKey);
    $.ajax({
        type: "POST",
        url: "../php/deleteBrainLink.php",
        data: {linkKey: linkKey},
        error: function(data) {
        console.log("Failed");
            console.log(data);
        },
        success: function(result) {
            console.log("Successfully deleted brain link.");
            console.log(result);

        },
        async: false
    });	
}
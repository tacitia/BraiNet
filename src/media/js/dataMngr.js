// TODO: switch to using getURLParams

(function(dsp, $, undefined) {
	dsp.name = $('#datasetName').text(); 
	dsp.key = parseInt($('#datasetID').text());
	dsp.userID = 0;
	dsp.isClone = 0; // TODO: work with real data from database
	dsp.origin = 2130;	
}(window.datasetProperties = window.datasetProperties || {}, jQuery));

(function(state, $, undefined) {
	state.currEditNode = null;
	state.currEditLink = null;
	state.currEditRow = null;
	state.currEditTable = null;
	state.oldNodeName = null;
}(window.state = window.state || {}, jQuery));

(function(data, $, undefined) {
	data.nodes = null;
	data.links = null;
	data.key_node_map = {};
	data.key_pair_link_map = {};
	data.key_link_map = {};
	data.name_node_map = {};
	
	data.constructMaps = function() {
	    var num_nodes = data.nodes.length;
    	for (var i = 0; i < num_nodes; ++i) {
        	var curr_node = data.nodes[i];
        	data.key_node_map[curr_node.key] = curr_node;
        	data.name_node_map[curr_node.name] = curr_node;
    	}
    	var num_links = data.links.length;
    	for (var i = 0; i < num_links; ++i) {
    		var curr_link = data.links[i];
    		var key_pair = curr_link.sourceKey + "-" + curr_link.targetKey;
    		data.key_pair_link_map[key_pair] = curr_link;
    		data.key_link_map[curr_link.key] = curr_link;
    	};
	};
	
}(window.data = window.data || {}, jQuery));

(function(dt, $, undefined) {

	/* Private variables */
	var nodesTable = $('#nodesDisplay').dataTable();
	var linksTable = $('#linksDisplay').dataTable();
	var deleteIcon = null;
	var editIcon = null;
	var cellEditing = null;

	//on tr hover append delete button on last th
	$('table').on("mouseenter", "tr", function() {
		var tableID = $(this).context.parentNode.parentNode.id;
		var content = null;
		if (tableID === "nodesDisplay") {
			var nodeName = $(this).context.children[0].innerText;
			if (data.name_node_map[nodeName] === undefined) { return; }
			var nodeID = data.name_node_map[nodeName].key;
			contentD = '<span onclick="dataTable.deleteNodeRow(this,' + nodeID + ')"><i class="icon-trash"></i> Delete</span>';
			contentE = '<span onclick="dataTable.editNodeRow(this,' + nodeID + ')"><i class="icon-pencil"></i> Edit</span>';
		}
		else if (tableID === "linksDisplay") {
			var startName = $(this).context.children[0].innerText;
			var endName = $(this).context.children[1].innerText;
			if (data.name_node_map[startName] === undefined) { return; }
			if (data.name_node_map[endName] === undefined) { return; }
			var startID = data.name_node_map[startName].key;
			var endID = data.name_node_map[endName].key;
			var linkID = data.key_pair_link_map[startID + "-" + endID].key;
			contentD = '<span onclick="dataTable.deleteLinkRow(this,' + linkID + ')"><i class="icon-trash"></i> Delete</span>'; 
			contentE = '<span onclick="dataTable.editLinkRow(this,' + linkID + ')"><i class="icon-pencil"></i> Edit</span>';
		}
		deleteIcon = $(this).find('td:last').append(contentD);
		editIcon = $(this).find('td:last').append(contentE);
	});

	$('table').on("mouseleave", "tr", function() {
    	$(deleteIcon).find('span').remove();
    	$(editIcon).find('span').remove();
	});
	
	/* */


	/* Public methods */
	/*
	 * 1. display a warning
	 * 2. remove the element from the database
	 * 3. remove the element from the display
	 */
	dt.deleteNodeRow = function(row, nodeKey) {
		var choice = confirm("Are you sure you want to delete the selected node? If a node is deleted, the associated links will also be deleted. Click OK to confirm.");
		if (choice) {
			nodesTable.fnDeleteRow($(row).closest('tr').get()[0]);
			database.deleteNode(nodeKey);
		}
	};

	dt.deleteLinkRow = function(row, linkKey) {
		var choice = confirm("Are you sure you want to delete the selected link? Click OK to confirm.");
		if (choice) {
			linksTable.fnDeleteRow($(row).closest('tr').get()[0]);
			database.deleteLink(linkKey);
		}
	}

	function restoreRow() {
		var table = state.currEditTable;
		var row = state.currEditRow;
		
		var data = $table.fnGetData(row);
		var jqTds = $('>td', row);

		for ( var i=0, iLen=jqTds.length ; i<iLen ; i++ ) {
			$table.fnUpdate( data[i], row, i, false );
		}

		$table.fnDraw();
	}
	
	function saveNodeUpdates(nodeKey, jqInputs) {
		var nodeName = null;
		var notes = null;
		var node = state.currEditNode;
		if (jqInputs[0].value !== node.name) {
			nodeName = jqInputs[0].value;
			node.name = nodeName;
			data.name_node_map[nodeName] = node;
			// Warning: the original name is still a key to the node
		}
		if (jqInputs[3].value !== node.notes) {
			notes = jqInputs[3].value;
			node.notes = jqInputs[3].value;
		}
		
		database.updateNode(nodeKey, nodeName, notes);	
	}

	function saveLinkUpdates(linkKey, jqInputs) {
		var notes = null;
		var link = state.currEditLink;
		if (jqInputs[2].value !== link.notes) {
			notes = jqInputs[2].value;
			link.notes = jqInputs[2].value;
		}
		
		database.updateLink(linkKey, notes);	
	}
	
	dt.editNodeRow = function(icon, nodeKey) {
		if (state.currEditRow !== null) {
			restoreRow();
		}
		var row = $(icon).parents('tr')[0];
    	var nodeData = nodesTable.fnGetData(row);
    	state.currEditNode = data.name_node_map[nodeData[0]];
    	state.currEditLink = null;
    	state.currEditRow = row;
    	state.currEditTable = nodesTable;
    	
    	/* TODO: let the user modify location and depth */
   	 	var jqTds = $('>td', row);
    	jqTds[0].innerHTML = '<input type="text" value="'+nodeData[0]+'">';
     	jqTds[1].innerHTML = '<input type="text" value="'+nodeData[1]+'">';
	   	jqTds[2].innerHTML = '<input type="text" value="'+nodeData[2]+'">';
    	jqTds[3].innerHTML = '<input type="text" value="'+nodeData[3]+'">';
		jqTds[4].innerHTML = '<button class="btn btn-link" onclick="dataTable.saveNodeRow(this,' + nodeKey + ')">Save</button>';
	};
	
	dt.editLinkRow = function(icon, linkKey) {
		if (state.currEditRow !== null) {
			restoreRow();
		}
		var row = $(icon).parents('tr')[0];
    	var linkData = linksTable.fnGetData(row);
    	state.currEditNode = null;
    	state.currEditLink = data.key_link_map[linkKey];
    	console.log(linkKey);
    	console.log(data.key_link_map);
    	state.currEditRow = row;
    	state.currEditTable = linksTable;
    	
    	/* TODO: let the user modify location and depth */
   	 	var jqTds = $('>td', row);
    	jqTds[0].innerHTML = '<input type="text" value="'+linkData[0]+'">';
     	jqTds[1].innerHTML = '<input type="text" value="'+linkData[1]+'">';
	   	jqTds[2].innerHTML = '<input type="text" value="'+linkData[2]+'">';
		jqTds[3].innerHTML = '<button class="btn btn-link" onclick="dataTable.saveLinkRow(this,' + linkKey + ')">Save</button>';
	};	
	
	dt.saveNodeRow = function(icon, nodeKey) {
		var row = $(icon).parents('tr')[0];
		var jqInputs = $('input', row);
		nodesTable.fnUpdate( jqInputs[0].value, row, 0, false );
		nodesTable.fnUpdate( jqInputs[1].value, row, 1, false );
		nodesTable.fnUpdate( jqInputs[2].value, row, 2, false );
		nodesTable.fnUpdate( jqInputs[3].value, row, 3, false );
		nodesTable.fnUpdate( '', row, 4, false );
		saveNodeUpdates(nodeKey, jqInputs);
		state.currEditNode = null;
		state.currEditRow = null;
		state.currEditTable = null;
	};

	dt.saveLinkRow = function(icon, linkKey) {
		var row = $(icon).parents('tr')[0];
		var jqInputs = $('input', row);
		linksTable.fnUpdate( jqInputs[0].value, row, 0, false );
		linksTable.fnUpdate( jqInputs[1].value, row, 1, false );
		linksTable.fnUpdate( jqInputs[2].value, row, 2, false );
		linksTable.fnUpdate( '', row, 3, false );
		saveLinkUpdates(linkKey, jqInputs);
		state.currEditLink = null;
		state.currEditRow = null;
		state.currEditTable = null;
	};
	
	dt.addNodeRow = function(node) {
		nodesTable.fnAddData([String(node.name), 
							  String(node.depth), 
							  String(node.parentName), 
							  String(node.notes),
							  ""]);	
	};
	
	dt.addLinkRow = function(link) {
		var source_node = data.key_node_map[parseInt(link.sourceKey)];
		var target_node = data.key_node_map[parseInt(link.targetKey)];
		linksTable.fnAddData([String(source_node.name),
							  String(target_node.name),
							  String(link.notes),
							  ""]);
	};

	dt.populateBrainDataTable = function() {
		populateNodesTable();
		populateLinksTable();
	};

	/* Private methods */
	function populateNodesTable() {
		nodesLength = data.nodes.length;
		for (var i = 0; i < nodesLength; ++i) {
			var node = data.nodes[i];
			nodesTable.fnAddData([String(node.name),
							 String(node.depth),
							 String(node.parentName),
							 String(node.notes),
							 ""]);
		}
	}

	function populateLinksTable() {
		var linksLength = data.links.length;
		for (var i = 0; i < linksLength; ++i) {
			var link = data.links[i];
			var source_node = data.key_node_map[parseInt(link.sourceKey)];
			var target_node = data.key_node_map[parseInt(link.targetKey)];
			linksTable.fnAddData([String(source_node.name),
								  String(target_node.name),
								  String(link.notes),
								  ""]);
		}
	}


}(window.dataTable = window.dataTable || {}, jQuery));

/* General interface controller */
(function() {
	// Display the add node field
	d3.select("#bt-addNode").on("click", function() {
		d3.select('bt-addNode').classed('btn-primary', true);
		d3.select('bt-addLink').classed('btn-primary', false);
		d3.select('bt-addBatch').classed('btn-primary', false);
		$('#addNodeField').css('display', 'block');
		$('#addLinkField').css('display', 'none');
		$('#addBatchField').css('display', 'none');
	});	
	
	// Display the add link field
	d3.select("#bt-addLink").on("click", function() {
		d3.select('bt-addNode').classed('btn-primary', false);
		d3.select('bt-addLink').classed('btn-primary', true);
		d3.select('bt-addBatch').classed('btn-primary', false);
		$('#addNodeField').css('display', 'none');
		$('#addLinkField').css('display', 'block');
		$('#addBatchField').css('display', 'none');
	});
	
	// Display the add from file field
	d3.select("#bt-addBatch").on("click", function() {
		d3.select('bt-addNode').classed('btn-primary', false);
		d3.select('bt-addLink').classed('btn-primary', false);
		d3.select('bt-addBatch').classed('btn-primary', true);
		$('#addNodeField').css('display', 'none');
		$('#addLinkField').css('display', 'none');
		$('#addBatchField').css('display', 'block');	
	});

}());

/* User inputs handler */
(function() {
	d3.select("#bt-addNodeSubmit").on("click", addBrainNode);
	d3.select("#bt-addLinkSubmit").on("click", addBrainLink);
	d3.select('#bt-addLinkAttrSubmit').on('click', addLinkAttr);

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
		if (parentKey === "") parentKey = -1;
		var notes = $('[name="nodeNotes"]').val();
		var nodeData = {userID: datasetProperties.userID, datasetKey: datasetProperties.key, nodeName: nodeName, parentKey: parentKey, depth: nodeDepth, notes: notes, brodmannKey: -1};
		database.addBrainNode(nodeData);
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
		var linkData = {userID: datasetProperties.userID, datasetKey: datasetProperties.key, source: sourceKey, target: targetKey, notes: notes, attrKey: attrKey, attrValue: attrValue};
		database.addBrainLink(linkData);
	}
	
	function addLinkAttr() {
		var attrName = $('[name="newAttrName"]').val();
		var attrType = $('#attrType').val();
		database.addLinkAttr(attrName, attrType);		
	}


}());

/* Populate UI elements using dataset specific information*/
(function(uic, $, undefined) {

	var selectMutex = 2;

	uic.populateOptions = function() {
		for (var key in data.key_node_map) {
			var node = data.key_node_map[key];
			$('#nodeParent').append(new Option(node.name, key, false, false));
			$('#sourceName').append(new Option(node.name, key, false, false));
			$('#targetName').append(new Option(node.name, key, false, false));
		}
		selectMutex -= 1;
		bindSelections();
	}

	uic.populateLinkAttrOptions = function(linkAttrs) {
		var num_attr = linkAttrs.length;
		for (var i = 0; i < num_attr; ++i) {
			var attr = linkAttrs[i];
			$('#attrName').append(new Option(attr.name, attr.key, false, false));
		}
	
		selectMutex -= 1;
		bindSelections();
	}

	uic.updateLinkAttrOptions = function(linkAttrs) {
		var num_attr = linkAttrs.length;
		for (var i = 0; i < num_attr; ++i) {
			var attr = linkAttrs[i];
			$('#attrName').append(new Option(attr.name, attr.key, false, false));
		}
		$('#attrName').trigger('liszt:updated');
	}

	uic.addNodeToDisplay = function(node) {
		var parent = data.key_node_map[parseInt(node.parentKey)];
		node.parentName = (parent === null || parent === undefined) ? null : parent.name;
		data.nodes.push(node);
		data.key_node_map[node.key] = node;
		data.name_node_map[node.name] = node;
		dataTable.addNodeRow(node);
		addNodeToOptions(node);
	}

	uic.addLinkToDisplay = function(link) {
		links.push(link);
		dataTable.addLinkRow(link);
	}

	/* Private methods */
	function bindSelections() {
		if (selectMutex === 0) {
			$('.chzn-select').chosen({allow_single_deselect: true});
		}
	}

	function addNodeToOptions(node) {
		$('#nodeParent').append(new Option(node.name, parseInt(node.key)));
		$('#nodeParent').trigger('liszt:updated');
		$('#sourceName').append(new Option(node.name, parseInt(node.key)));
		$('#sourceName').trigger('liszt:updated');
		$('#targetName').append(new Option(node.name, parseInt(node.key)));
		$('#targetName').trigger('liszt:updated');
	}
	
}(window.uiControl = window.uiControls || {}, jQuery));

(function(db, $, undefined) {
	var postToPhp = function(file, data, successFun, async) {
		$.ajax({
			type: "POST",
			url: "../php/" + file,
			data: data,
			error: function(data) {
				console.log("Failed when calling " + file);
				console.log(data);
			},
			success: function(result) {
				console.log("Successfully called " + file);
				if (successFun) successFun(result);
			},
			async: async
		});	
	};

	// TODO: implement the php used for function
	db.setUserId = function() {
		var successFun = function(result) {
			datasetProperties.userID = result;
		};
		postToPhp("getUserID.php",
				{datasetKey: datasetProperties.key},
				successFun,
				false);
	};

	db.getBrainData = function() {
		var successFun = function(result) {
			var parsedResult = $.parseJSON(result);
			data.nodes = parsedResult.nodes;
			data.links = parsedResult.links;
			data.constructMaps();
			dataTable.populateBrainDataTable();
			uiControl.populateOptions();
		};
		postToPhp("getBrainData.php",
				{datasetKey: datasetProperties.key, userID: datasetProperties.userID},
				successFun,
				false);
	};
	
	db.addBrainNode = function(nodeData) {
		var successFun = function(result) {
			if (parseInt(result) === 1062) {
				alert("Cannot add node: a node with the same name already exists in the dataset."); }
			else {
				try {
					uiControl.addNodeToDisplay($.parseJSON(result));
				} catch(e) {
					alert("Cannot add node: unknown database error occurred during node insertion.");
				}
			}
		};
		postToPhp("addBrainNode.php",
						nodeData,
						successFun,
						false);	
	};
		
	db.addBrainLink = function(linkData) {
		var successFun = function(result) {
			uiControl.addLinkToDisplay($.parseJSON(result));
		};
		postToPhp("addBrainLink.php",
						linkData,
						successFun,
						false
						);	
	};

	db.getLinkAttrs = function() {
		var successFun = function(result) {
			var data = $.parseJSON(result);
			uiControl.populateLinkAttrOptions(data);	
		};
		postToPhp("getLinkAttr.php",
				{datasetKey: datasetProperties.key},
				successFun,
				true);
	};

	db.addLinkAttr = function(attrName, attrType) {
		var successFun = function(result) {
			uiControl.updateLinkAttrOptions($.parseJSON(result));
		};
		postToPhp("addLinkAttr.php",
				{datasetKey: datasetKey, attrName: attrName, attrType: attrType},
				successFun,
				false
				);
	};

	db.deleteNode = function(nodeKey) {
		postToPhp("deleteBrainNode.php",
				{nodeKey: nodeKey, isClone: datasetProperties.isClone, origin: datasetProperties.origin, userID: datasetProperties.userID},
				null,
				false);
	};

	db.deleteLink = function(linkKey) {
		postToPhp("deleteBrainLink.php", 
				{linkKey: linkKey, isClone: datasetProperties.isClone, origin: datasetProperties.origin}, 
				null, 
				false);
	};
	
	db.updateNode = function(nodeKey, nodeName, notes) {
		postToPhp("updateBrainNode.php",
				{nodeKey: nodeKey, nodeName: nodeName, userID: datasetProperties.userID, notes: notes, isClone: datasetProperties.isClone, origin: datasetProperties.origin},
				null,
				true);
	};
	
	db.updateLink = function(linkKey, notes) {
		postToPhp("updateBrainLink.php",
				{linkKey: linkKey, userID: datasetProperties.userID, notes: notes, isClone: datasetProperties.isClone, origin: datasetProperties.origin},
				null,
				true);
	};

}(window.database = window.database || {}, jQuery));

$(document).ready(function() {
	database.getBrainData(datasetProperties.key, datasetProperties.userID);
//	database.getLinkAttrs();
});

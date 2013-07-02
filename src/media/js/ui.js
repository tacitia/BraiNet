(function(ui, $, undefined) {

	ui.bind = function() {
		d3.select("#bt-search").on("click", searchUI.searchButtonClick);
		d3.select("#bt-clear").on("click", searchUI.clearButtonClick);
		d3.select('#bt-createDatasets').on('click', datasetManager.createDatasetButtonClick);
		d3.select('#bt-manageDatasets').on('click', datasetManager.manageDatasetButtonClick);
		d3.select('#bt-cloneDatasets').on('click', datasetManager.cloneDatasetButtonClick);
		d3.select('#bt-applyDataset').on('click', datasetManager.applyDatasetButtonClick);
		d3.select('#addNode').on('click', dataUI.addNodeButtonClick);
		d3.select('#addLink').on('click', dataUI.addLinkButtonClick);
		d3.select("#maxHop").on("change", searchUI.setMaxHop);
		$('#conn-note-edit').click(chosenLink.editNotes);
		$('#conn-note-save').click(chosenLink.saveNotes);
		$('#sourceSelect').change(searchUI.sourceSearchInput);
		$('#targetSelect').change(searchUI.targetSearchInput);
		$('#dataSelect').change(datasetManager.datasetSelect);
		window.onbeforeunload=database.saveSessionData;
		window.onload=userAction.startSession;
	};

	ui.setupUIElements = function() {
		$('sourceSelect-Manage').find('option').remove();
		$('targetSelect-Manage').find('option').remove();
		$('sourceSelect').find('option').remove();
		$('targetSelect').find('option').remove();
		$('parentSelect').find('option').remove();
		$('.chzn-select').trigger('liszt:updated');
		searchUI.appendNodesAsOptions(activeDataset.maps.node_map);
		dataUI.appendNodesAsOptions(activeDataset.maps.node_map);
	};

}(window.ui = window.ui || {}, jQuery));

(function(dui, $, undefined) {

	dui.appendNodesAsOptions = function(node_map) {
		for (var key in node_map) {
			var d = node_map[key];
			$('#sourceSelect-Manage').append(new Option(d.name, key, false, false));
			$('#targetSelect-Manage').append(new Option(d.name, key, false, false));
			$('#parentSelect').append(new Option(d.name, key, false, false));
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		$('#sourceSelect-Manage').trigger('liszt:updated');
		$('#targetSelect-Manage').trigger('liszt:updated');
		$('#parentSelect').trigger('liszt:updated');
	};
	
	dui.addNodeButtonClick = function() {
		alert("New brain region added.");
	};
	
	dui.addLinkButtonClick = function() {
		alert("New connection added.");
	};

}(window.dataUI = window.dataUI || {}, jQuery));

(function(sui, $, undefined) {

	sui.max_hop = 1;
	// State variables
	sui.selected_source = null;
	sui.selected_target = null;

	sui.appendNodesAsOptions = function(node_map) {
		for (var key in node_map) {
			var d = node_map[key];
			$('#sourceSelect').append(new Option(d.name, key, false, false));
			$('#targetSelect').append(new Option(d.name, key, false, false));
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		$('#sourceSelect').trigger('liszt:updated');
		$('#targetSelect').trigger('liszt:updated');
	};

	sui.updateOptions = function() {
		$('#sourceSelect').find('option').remove();
		$('#targetSelect').find('option').remove();
		$('#sourceSelect').trigger('liszt:updated');
		$('#targetSelect').trigger('liszt:updated');
		sui.appendNodesAsOptions(activeDataset.maps.node_map);
	};

	sui.searchButtonClick = function() {
		userAction.trackAction('Search:' + sui.selected_source.name + '-' + sui.selected_target.name, 'UI', 'Search', sui.selected_source.name + '-' + sui.selected_target.name, "Search", sui.selected_source.name + '-' + sui.selected_target.name );
		
		state.currMode = customEnum.mode.search;
		var paths = svgData.calculatePaths(sui.max_hop);
		svgData.populateForceElements(paths);
//		svgRenderer.updateForceLayout();
		svgRenderer.dimNonSearchResults();
	};

	sui.clearButtonClick = function() {
		//if (enable_piwik) {
		//	piwikTracker.trackPageView('Click clear button');
		//}
		userAction.trackAction('Click clear button');
		current_mode = mode.exploration;
		svg_circular.selectAll('.circular.node').classed('nofocus', false);
		svg_circular.selectAll('.circular.link').classed('hidden', false);
		updateCircularTexts();
	};

	/* TODO: Also need to handle the case that the input is the parent of some of the 
	 * active nodes
	 */
	sui.sourceSearchInput = function() {
	
		var svg_circular = svgRenderer.svg_circular;
	
		// If there exists an old selected_source, reset its status
		if (sui.selected_source != undefined) {
			sui.selected_source.fixed = false;
			highlightNode(sui.selected_source, "focus", false, true, svgRenderer.svg_circular);
			clearSearchResult();
		}
		var input_key = this.value;
		var input_node = activeDataset.maps.node_map[input_key];
		sui.selected_source = input_node;
		svgData.displayInvisibleNode(input_node);
		svg_circular.selectAll('.circular.node')
			.classed('nofocus', function(d) {
				return d !== sui.selected_source && d !== sui.selected_target;
			});
		svg_circular.selectAll('.circular.text')
			.classed('visible', function(d) {
				return d === sui.selected_source || d === sui.selected_target;
			});
	//    highlightNode(input_node, "focus", true, true, svg_circular);
		userAction.trackAction('Set search source', 'UI', 'Set source', sui.selected_source.name, 'Set source', sui.selected_source.name);
		
	};

	sui.targetSearchInput = function() {

		var svg_circular = svgRenderer.svg_circular;

		userAction.trackAction('Set search target');
		if (sui.selected_target != undefined) {
			sui.selected_target.fixed = false;
			highlightNode(sui.selected_target, "focus", false, true, svg_circular);
			clearSearchResult();
		}
		var input_key = this.value;
		var input_node = activeDataset.maps.node_map[input_key];
		sui.selected_target = input_node;
		svgData.displayInvisibleNode(input_node);
		svg_circular.selectAll('.circular.link')
			.classed('hidden', function(d) {
				return d.source.key !== sui.selected_source.key && d.target.key !== sui.selected_target.key; 
			});
		svg_circular.selectAll('.circular.node')
			.classed('nofocus', function(d) {
				return d !== sui.selected_source && d !== sui.selected_target;
			});
		svg_circular.selectAll('.circular.text')
			.classed('visible', function(d) {
				return d === sui.selected_source || d === sui.selected_target;
			});
			
		userAction.trackAction(null, 'UI', 'Set target', sui.selected_target.name, 'Set target', sui.selected_target.name);
	};

	sui.clearSearchResult = function() {

	};

	sui.setMaxHop = function() {
		userAction.trackAction('Set max hop', 'UI', 'Set max hop', this.value, 'Set max hop', this.value);   
		max_hop = this.value;
		document.getElementById("maxHopValue").innerHTML = max_hop;

	};


}(window.searchUI = window.searchUI || {}, jQuery));

(function(dm, $, undefined) {

	/*
	 * Hide the clone dataset button if the dataset is not public
	 */
	dm.datasetSelect = function() {
		var datasetName = $('#dataSelect :selected').text();
		if (generic.endsWith(datasetName, '(public)')) {
			$('#bt-cloneDatasets').css('display', 'block');
			$('#bt-manageDatasets').css('display', 'none');
		}
		else {
			$('#bt-cloneDatasets').css('display', 'none');
			$('#bt-manageDatasets').css('display', 'block');
		}
	}

	dm.populateDatasetUI = function() {
		var dataset_list = user.dataset_list;
		$('#dataSelect').append(new Option('BAMS (public)', 2130));
		$('#dataSelect').append(new Option('Pubmed (public)', 1000002));
		var num_datasets = dataset_list.length;
		for (var i = 0; i < num_datasets; ++i) {
			var curr_dataset = dataset_list[i];
			$('#dataSelect').append(new Option(curr_dataset[1], curr_dataset[0]));
			console.log(curr_dataset);
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		$('#dataSelect').trigger('liszt:updated');
	};


	dm.createDatasetButtonClick = function() {
		database.createDataset($('[name="datasetName"]').val(), uid, 0);
	};


	dm.manageDatasetButtonClick = function() {
		var datasetName = $('#dataSelect :selected').text();
		var datasetID = $('#dataSelect').val();
		var isClone = endsWith(datasetName, '(personal copy)') ? 1 : 0;
		var url = "media/php/manageDataset.php?datasetName=" + datasetName + 
					"&datasetID=" + datasetID + "&isClone=" + isClone;
		window.open(url, '_blank', 'width=800, height=800');
		return;
	};


	dm.cloneDatasetButtonClick = function() {
		var datasetName = $('#dataSelect :selected').text().replace('(public)', '(personal copy)');
		var datasetID = $('#dataSelect').val();
		database.cloneDataset(datasetName, uid, datasetID);	
	};

	/*
	 * 1. Get the name of the selected dataset
	 * 2. Get the content of the selected dataset
	 * 3. Construct local maps for the selected dataset
	 * 4. Update the visualization [TODO]
	 */
	dm.applyDatasetButtonClick = function() {
		var datasetID = parseInt($('#dataSelect').val());
		if (datasetID === "") {
			return;
		}
		if (user_datasets[datasetID] === undefined) {
			database.getBrainData(datasetID, uid);
		}
		else {
		}
	};

}(window.datasetManager = window.datasetManager || {}, jQuery));


(function(cl, $, undefined){
	
	cl.link = null;
	var isBi = false;
	var numPub = 0;
	var pubTable = null;
	
	/* notes variables*/
	var notesDisplay = $('#conn-note-display');
	var notesInput = $('#conn-note-input');
	var saveButton = $('#conn-note-save');
	
	function switchMode(mode) {
		switch (mode) {
			case "edit":
				notesDisplay.addClass('removed');
				notesInput.removeClass('removed');
				saveButton.removeClass('removed');
				break;				
			case "display":
				notesDisplay.removeClass('removed');
				notesInput.addClass('removed');
				saveButton.addClass('removed');
				break;
		}	
	}
	
	cl.editNotes = function() {
		switchMode('edit');
	};
	
	cl.saveNotes = function() {
		cl.link.notes = notesInput.value;
		switchMode('display');
		notesDisplay.text('Important connection');
		database.updateLink(cl.link.key, cl.link.notes);
	};
	
	cl.updateChosenLink = function(d) {
		cl.link = d;
		displayMetadata();
		displayNotes();
		switchMode('display');
		displayPublications();
		displayLinkChildren();
	};
	
	function displayMetadata() {
		d3.selectAll('#conn-info .exp').remove();
		d3.select('#conn-info #src-name')
			.html('Source: ' + cl.link.source.name);
		d3.select('#conn-info #tgt-name')
			.html('Target: ' + cl.link.target.name);
	}
	
	function displayNotes() {
		$('#conn-notes').removeClass('removed');
	}
	
	function reverseLink() {
		var mirrorLink = activeDataset.maps.node_link_map[cl.link.target.key + '-' + cl.link.source.key];
		cl.link = mirrorLink;
	}
	
	function displayLinkChildren() {
		var children_tab = d3.select('#sub-con-list');
		children_tab.selectAll('div').remove();
		children_tab.selectAll('p').remove();
		var content = children_tab.append('div');
		var content_html = '<p>Children links:</p>';
		content_html += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Notes</td></tr>';
		var num_child = cl.link.base_children.length;
		for (var i = 0; i < num_child; ++i) {
			var child = activeDataset.maps.link_map[cl.link.base_children[i]];
			content_html += '<tr class="childRow" id="childRow-' + i + '"><td>' + child.source.name + '</td><td>' + child.target.name +
				'</td><td>' + child.notes + '</td></tr>';
		}
		content_html += '</table>';
		content.html(content_html);
		
		d3.selectAll('.childRow').on('click', childLinkClick);
	}

	function childLinkClick() {
		var id = $(this).attr('id');
		var id_num = id.substring(9);
		//console.log(id_num);
		//console.log(cl.link.base_children);
		var childLink = activeDataset.maps.link_map[cl.link.base_children[id_num]];
		cl.updateChosenLink(childLink);
	}

	function displayPublications() {	
		// Add the list of papers 
		var link_paper_map = activeDataset.maps.link_paper_map;
		var paper_map = activeDataset.maps.paper_map;
		var paperKeys = link_paper_map[cl.link.key];
		var self_paper_tab = d3.select('#paper-list');
		self_paper_tab.selectAll('div').remove();
		self_paper_tab.selectAll('p').remove();
		var content = self_paper_tab.append('div');
		var content_html = '';
		if (cl.link.isDerived) {
			content_html += '<p>This is a meta link. See the derived connections for more information.</p>';
		}
		else {
			content_html += '<table id="pubTable" class="table table-bordered table-striped table-condensed">';

			content_html += '<thead><tr class="tableTitle"><th>Publication</th><th>Authors</th><th>Source</th><th>Notes</th><th></th></tr></thead><tbody></tbody></table>';
			content.html(content_html);
		/*	$('#exportButton').css(
			'position','absolute';
			'left','50%';
			'border-radius','10px 10px 10px 10px'
			 );
		*/
			$('#exportButton').click(function(){
				console.log("export button was clicked");
			
				});
			$('#pubTable').dataTable({
				'bAutoWidth': false,
				'sDom':'T<"clear">lfrtip',
				'oTableTools':{
					'sSwfPath':'media/lib/TableTools/media/swf/copy_csv_xls_pdf.swf'
					
					},
				'aoColumns': [
					{sWidth: '300px'},
					{sWidth: '120px'},
					{sWidth: '50px'},
					{sWidth: '120px'},
					{sWidth: '60px'} 
				]
			});
			pubTable = $('#pubTable').dataTable();
			var num_paper = paperKeys.length;
			for (var i = 0; i < num_paper; ++i) {
				var paper = paper_map[paperKeys[i]];
				var url = 'http://www.ncbi.nlm.nih.gov/pubmed?term=' + paper.pmid;
				var title = '<a href="' + url + '" target="_blank" class="paperLink">' + paper.title + '</a>';
				var notes = '';
				pubTable.fnAddData([title,
									paper.authors,
									paper.source,
									notes,
									""]);				
			}
			
				//on tr hover append delete button on last th
			var deleteIcon = null;
			var editIcon = null;
			$('#pubTable').on("mouseenter", "tr", function() {
				//console.log($(this));
				var pmid = $(this).context.children[0];
				//console.log(pmid);
				// Imp TODO: pass in pmid as parameter
				var contentD = '<span onclick="chosenLink.deletePaper(this)"><i class="icon-trash"></i> Delete</span>';
				var contentE = '<span onclick="chosenLink.editPaperNotes(this)"><i class="icon-pencil"></i> Edit</span>';
				deleteIcon = $(this).find('td:last').append(contentD);
				editIcon = $(this).find('td:last').append(contentE);
			});

			$('table').on("mouseleave", "tr", function() {
				$(deleteIcon).find('span').remove();
				$(editIcon).find('span').remove();
			});
		}

		d3.selectAll('.paperLink').on('click', paperClick);

		// Add the list of dataset-specific records
		var bams_records_tab = d3.select('#bams-list');
		bams_records_tab.selectAll('p').remove();
		content = bams_records_tab.append('p');
		content.html('Links to BAMS records will be added in future updates');		
	}
	
	/* Imp TODO: hook up to the backend database operations */
	cl.deletePaper = function(icon) {
		var choice = confirm("Are you sure you want to delete the paper for this connection? Click OK to confirm.");
		if (choice) {
			pubTable.fnDeleteRow($(icon).closest('tr').get()[0]);
		}
	};
	
	cl.editPaperNotes = function(icon) {
		var row = $(icon).parents('tr')[0];
    	var pubData = pubTable.fnGetData(row);
   	 	var jqTds = $('>td', row);
    	jqTds[0].innerHTML = pubData[0];
     	jqTds[1].innerHTML = pubData[1];
	   	jqTds[2].innerHTML = pubData[2];
    	jqTds[3].innerHTML = '<textarea rows="3" style="width:120px" value="'+pubData[3]+'"></textarea>';
		jqTds[4].innerHTML = '<button class="btn btn-link" onclick="chosenLink.savePaperNotes(this)">Save</button>';
	};
	
	cl.savePaperNotes = function(icon) {
		var row = $(icon).parents('tr')[0];
		var jqInputs = $('textarea', row);
		pubTable.fnUpdate( jqInputs[0].value, row, 3, false );
		pubTable.fnUpdate( '', row, 4, false );
	};

	function paperClick() {
		var paperName = $(this).text();
		userAction.trackAction(null, 'UI', 'Click paper', paperName, 'Click paper', paperName);
	}


	
})(window.chosenLink = window.chosenLink || {}, jQuery);
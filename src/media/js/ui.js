(function(ui, $, undefined) {

	ui.bind = function() {
		d3.select("#bt-search").on("click", searchUI.searchButtonClick);
		d3.select("#bt-clear").on("click", searchUI.clearButtonClick);
		d3.select('#bt-createDatasets').on('click', datasetManager.createDatasetButtonClick);
		d3.select('#bt-manageDatasets').on('click', datasetManager.manageDatasetButtonClick);
		d3.select('#bt-cloneDatasets').on('click', datasetManager.cloneDatasetButtonClick);
		d3.select('#bt-applyDataset').on('click', datasetManager.applyDatasetButtonClick);
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
		searchUI.appendNodesAsOptions(active_node_map);
	};

}(window.ui = window.ui || {}, jQuery));

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
		if (enable_piwik) {
			piwikTracker.trackPageView('Search:' + selected_source.name + '-' + selected_target.name);
		}
		if (enable_owa) {
			OWATracker.trackAction('UI', 'Search', selected_source.name + '-' + selected_target.name);
		}
		if (enable_tracking) {
			trackAction("Search", selected_source.name + '-' + selected_target.name);
		}
		current_mode = mode.search;
		var paths = calculatePaths(max_hop);
		populateForceElements(paths);
		updateForceLayout();
		dimNonSearchResults();
	};

	sui.clearButtonClick = function() {
		if (enable_piwik) {
			piwikTracker.trackPageView('Click clear button');
		}
		current_mode = mode.exploration;
		svg_circular.selectAll('.circular.node').classed('nofocus', false);
		svg_circular.selectAll('.circular.link').classed('hidden', false);
		updateCircularTexts();
	};

	/* TODO: Also need to handle the case that the input is the parent of some of the 
	 * active nodes
	 */
	sui.sourceSearchInput = function() {
		if (enable_piwik) {
			piwikTracker.trackPageView('Set search source');
		}
	
		// If there exists an old selected_source, reset its status
		if (selected_source != undefined) {
			selected_source.fixed = false;
			highlightNode(selected_source, "focus", false, true, svg_circular);
			clearSearchResult();
		}
		var input_key = this.value;
		var input_node = active_node_map[input_key];
		selected_source = input_node;
		if (!input_node.isActive) {
			var parent = findActiveParent(input_node);
			// In this case, the input is on a level higher than the visible nodes
			if (parent === undefined) {
				var activeDescs = findActiveDescends(input_node);
				combineRegions(input_node, activeDescs);
			}
			else {
				var siblings = findDescAtDepth(parent, input_node.depth);
				expandRegion(parent, siblings, svg_circular);
			}
		}
		svg_circular.selectAll('.circular.node')
			.classed('nofocus', function(d) {
				return d !== selected_source && d !== selected_target;
			});
		svg_circular.selectAll('.circular.text')
			.classed('visible', function(d) {
				return d === selected_source || d === selected_target;
			});
	//    highlightNode(input_node, "focus", true, true, svg_circular);
		if (enable_owa) {
			OWATracker.trackAction('UI', 'Set source', selected_source.name);
		}
		if (enable_tracking) {
			trackAction('Set source', selected_source.name);
		}
	};

	sui.targetSearchInput = function() {
		if (enable_piwik) {
			piwikTracker.trackPageView('Set search target');
		}
	
		if (selected_target != undefined) {
			selected_target.fixed = false;
			highlightNode(selected_target, "focus", false, true, svg_circular);
			clearSearchResult();
		}
		var input_key = this.value;
		var input_node = active_node_map[input_key];
		selected_target = input_node;
		if (!input_node.isActive) {
			var parent = findActiveParent(input_node);
			// In this case, the input is on a level higher than the visible nodes
			if (parent === undefined) {
				var activeDescs = findActiveDescends(input_node);
				combineRegions(input_node, activeDescs);
			}
			else {
				var siblings = findDescAtDepth(parent, input_node.depth);
				expandRegion(parent, siblings, svg_circular);
			}
		}
		svg_circular.selectAll('.circular.link')
			.classed('hidden', function(d) {
				return d.source.key !== selected_source.key && d.target.key !== selected_target.key; 
			});
		svg_circular.selectAll('.circular.node')
			.classed('nofocus', function(d) {
				return d !== selected_source && d !== selected_target;
			});
		svg_circular.selectAll('.circular.text')
			.classed('visible', function(d) {
				return d === selected_source || d === selected_target;
			});
	//    highlightNode(input_node, "focus", true, true, svg_circular);
		if (enable_owa) {
			OWATracker.trackAction('UI', 'Set target', selected_target.name);
		}
		if (enable_tracking) {
			trackAction('Set target', selected_target.name);
		}
	};

	sui.clearSearchResult = function() {

	};

	sui.setMaxHop = function() {
		if (enable_piwik) {
			piwikTracker.trackPageView('Set max hop');
		}
		if (enable_owa) {
			OWATracker.trackAction('UI', 'Set max hop', this.value);
		}
		if (enable_tracking) {
			trackAction('Set max hop', this.value);
		}    
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
		if (endsWith(datasetName, '(public)')) {
			$('#bt-cloneDatasets').css('display', 'block');
			$('#bt-manageDatasets').css('display', 'none');
		}
		else {
			$('#bt-cloneDatasets').css('display', 'none');
			$('#bt-manageDatasets').css('display', 'block');
		}
	}

	dm.populateDatasetUI = function() {
		$('#dataSelect').append(new Option('BAMS (public)', 2130));
		$('#dataSelect').append(new Option('Pubmed (public)', 1000002));
		var num_datasets = dataset_list.length;
		for (var i = 0; i < num_datasets; ++i) {
			var curr_dataset = dataset_list[i];
			$('#dataSelect').append(new Option(curr_dataset[1], curr_dataset[0]));
		}
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
	
	/* notes variables*/
	var notesDisplay = $('#conn-note-display');
	var notesInput = $('#conn-note-input');
	var saveButton = $('#conn-note-save');
	
	function switchMode(mode) {
		switch (mode) {
			case "edit":
				notesDisplay.css('display', display);
				notesInput.css('display', edit);
				saveButton.css('display', edit);
				break;				
			case "display":
				notesDisplay.css('display', display);
				notesInput.css('display', edit);
				saveButton.css('display', edit);
				break;
		}	
	}
	
	cl.editNotes = function() {
		switchMode('edit');
	};
	
	cl.saveNotes = function() {
		cl.link.notes = notesInput.value();
		switchMode('display');
		notesDisplay.text(cl.link.notes);
		database.updateLink(cl.link.key, cl.link.notes);
	};
	
	cl.updateChosenLink = function(d) {
		cl.link = d;
		displayMetadata();
		displayPublications();
	};
	
	function displayMetadata() {
		d3.selectAll('#conn-info .exp').remove();
		d3.select('#conn-info #src-name')
			.html('Source: ' + cl.link.source.name);
		d3.select('#conn-info #tgt-name')
			.html('Target: ' + cl.link.target.name);
	}

	function displayPublications() {
	
		var mirror_link = activeDataset.maps.ode_link_map[d.target.key + '-' + d.source.key];

		if (!is_preloaded_data) {
			var notes_tab = d3.select('#notes');
			notes_tab.selectAll('div').remove();
			notes_tab.selectAll('p').remove();
			var content = notes_tab.append('div');
			var content_html = '<p>Current link: ' + d.source.name + '-' + d.target.name + '</p>';
			if (d.isDerived) {
				content_html += '<p>This is a meta link. See the derived connections for user entered notes.</p>';
			}
			else {
				content_html += '<p>' + d.notes + '</p>';
			}
			content_html += '<p>Children links:</p>';
			content_html += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Notes</td></tr>';
			var num_child = d.base_children.length;
			for (var i = 0; i < num_child; ++i) {
				var child = active_link_map[d.base_children[i]];
				content_html += '<tr><td>' + child.source.name + '</td><td>' + child.target.name +
					'</td><td>' + child.notes + '</td></tr>';
			}
			content_html += '</table>';

			if (mirror_link !== undefined) {
				content_html += '<p>Current link: ' + d.target.name + '-' + d.source.name + '</p>';
				if (mirror_link.isDerived) {
					content_html += '<p>This is a meta link. See the derived connections for user entered notes.</p>';
				}
				else {
				  content_html += '<p>' + mirror_link.notes + '</p>';
				}
				content_html += '<p>Children links:</p>';
				content_html += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Notes</td></tr>';
				var num_child = mirror_link.base_children.length;
				for (var i = 0; i < num_child; ++i) {
				var child = active_link_map[mirror_link.base_children[i]];
					content_html += '<tr><td>' + child.source.name + '</td><td>' + child.target.name +
					'</td><td>' + child.notes + '</td></tr>';
				}
				content_html += '</table>';     
			}
			content.html(content_html);
		}

		if (is_preloaded_data) {
			// Add the list of papers 
			var paperKeys = d.paper;
			var self_paper_tab = d3.select('#paper-list');
			self_paper_tab.selectAll('div').remove();
			self_paper_tab.selectAll('p').remove();
			var content = self_paper_tab.append('div');
			var content_html = '<p>Current link: ' + d.source.name + '-' + d.target.name + '</p>';
			if (d.isDerived) {
				content_html += '<p>This is a meta link. See the derived connections for more information.</p>';
			}
			else {
				content_html += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Publication</td></tr>';
				var num_paper = paperKeys.length;
				for (var i = 0; i < num_paper; ++i) {
					var paper = paper_map[paperKeys[i]];
					content_html += '<tr><td>' + '<a href="' +  paper.url + '" target="_blank" class="paperLink">' + paper.title + '</a>' + '</td></tr>';
				}
			}
			content_html += '</table>';
			content_html += '<p>Children links:</p>';
			content_html += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Publication</td></tr>';
			var num_child = d.base_children.length;
			for (var i = 0; i < num_child; ++i) {
				var child = active_link_map[d.base_children[i]];
				var paperKey = child.paper;
				var num_paper = paperKey.length;
				for (var j = 0; j < num_paper; ++j) {
					var paper = paper_map[paperKey[j]];
					content_html += '<tr><td>' + child.source.name + '</td><td>' + child.target.name +
						'</td><td>' + '<a href="' +  paper.url + '" target="_blank" class="paperLink">' + paper.title + '</a>' + '</td></tr>';
				}
			}
			content_html += '</table>';
			content.html(content_html);

			d3.selectAll('.paperLink').on('click', paperClick);
	
			// Add the list of dataset-specific records
			var bams_records_tab = d3.select('#bams-list');
			bams_records_tab.selectAll('p').remove();
			content = bams_records_tab.append('p');
			content.html('Links to BAMS records will be added in future updates');
		}

		// Add the sub-connections
		var sub_link_keys = d.children;
		var subcon_tab = d3.select('#sub-con-list');
		subcon_tab.selectAll('p').remove();
		content = subcon_tab.append('p');
		if (sub_link_keys.length < 1) {
			content.html('There are no sub-connections for this link.');
		}
		else {
			content.selectAll('p').data(sub_link_keys)
				.enter()
				.append('p')
				.html(function(d) {
					var sub_link = active_link_map[d];
					return 'Source: ' + sub_link.source.name + '; Target: ' + sub_link.target.name;
				})
		}
	}

	function paperClick() {
		var paperName = $(this).text();
		if (enable_owa) {
			OWATracker.trackAction('UI', 'Click paper', paperName);
		}
		if (enable_tracking) {
			console.log("tracking paper click");
			trackAction('Click paper', paperName);
		}
	}

	
})(window.chosenLink = window.chosenLink || {}, jQuery);
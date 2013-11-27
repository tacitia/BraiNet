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
		$('sourceSelect').find('option').remove();
		$('targetSelect').find('option').remove();
		$('.chzn-select').trigger('liszt:updated');
		searchUI.appendNodesAsOptions(activeDataset.maps.node_map);
		dataUI.setupUIElements();
		edgeUI.setupUIElements();
		
		//Website Tour Start from here 
		ui.firstTime = false;

//		websiteTour();
	};
	
	websiteTour = function(){
		
		var config = [{
			"name" : "step1",
			"bgcolor" : "black",
			"color"	:	"white",
			"position"	:	"BL",
			"text"	:	"Step1 : Click here to expand the node!",
			"time"	: 5000
			},
			
			{
				"name" : "step2",
				"text" : "Step2 : Shift-key + mouseclick to combine circular node!",
				"time" : 5000	
			},
			
			{
				"name" : "step3",
				"text" : "Step3 : Alt-key + mouse click to fix on the clicked node!",
				"time" : 5000	
			},
			{
				"name" : "step4",
				"text" : "Step4 : Meta-key + mouse click to remove the selected node and link!",
				"time" : 5000	
			}
			];
		//Cufon.replace('h1',{ textShadow: '1px 1px #fff'});
		//define if steps should change automatically

				autoplay	= false,

				//timeout for the step

				showtime = 0,

				//current step of the tour

				ui.step		= 0,

				//total number of steps

				total_steps	= config.length;

				//current and previous step name
				ui.currStep = "";
				ui.prevStep = "";				

				//show the tour controls

				showControls();
				//
				/*

				we can restart or stop the tour,

				and also navigate through the steps

				 */

				$('#activatetour').live('click',startTour);
				$('#canceltour').live('click',endTour);
				$('#endtour').live('click',endTour);
				$('#restarttour').live('click',restartTour);

				function startTour(){
					ui.firstTime = true;
					

					$('#activatetour').remove();

					$('#endtour,#restarttour').show();

					

					showOverlay();

					++ui.step;
					

					ui.showTooltip();

				}

				

				

				

				function endTour(){

					ui.step = 0;

					if(autoplay) clearTimeout(showtime);

					removeTooltip();

					hideControls();

					hideOverlay();
					ui.firstTime = false;

				}

				

				function restartTour(){

					ui.step = 0;
					ui.firstTime = true;

					if(autoplay) clearTimeout(showtime);

					++ui.step;
					ui.currStep = "";
				    ui.prevStep = "";	

					ui.showTooltip();

				}

				

				ui.showTooltip = function showTooltip(){

					//remove current tooltip
					

					removeTooltip();

					var step_config		= config[ui.step -1];
					var bgcolor 		= step_config.bgcolor;
					var color	 		= step_config.color;
	
					var tooltip = '<div id="tour_tooltip" class="toolTip" >';
					tooltip += '<p>' + step_config.text+'</p><span class="tooltip_arrow"></span>';
					
					$('BODY').prepend(tooltip);
					$("#tour_tooltip").flip({
						"direction" : 'tb',
						 "color" : 'black'
					});
					//position the tooltip correctly:
				}

				

				function removeTooltip(){
					$('#tour_tooltip').remove();
				}

				

				function showControls(){

					/*

					we can restart or stop the tour,

					and also navigate through the steps

					 */
					 

					var $tourcontrols  = '<div id="tourcontrols" class="tourcontrols">';

					$tourcontrols += '<p>First time here?</p>';

					$tourcontrols += '<span class="button" id="activatetour">Start the tour</span>';

			

						$tourcontrols += '<a id="restarttour" style="display:none;">Restart the tour</span>';

						$tourcontrols += '<a id="endtour" style="display:none;">End the tour</a>';

						$tourcontrols += '<span class="close" id="canceltour"></span>';

					$tourcontrols += '</div>';

					

					$('BODY').prepend($tourcontrols);

					$('#tourcontrols').animate({'right':'30px'},500);

				}

				

				function hideControls(){

					$('#tourcontrols').remove();

				}

				
				
				
				function showOverlay(){
					

					var $overlayTop	= '<div id="tour_overlay1" class="overlayTop"></div>';
					var $overlayBottom	= '<div id="tour_overlay2" class="overlayBottom"></div>';
					var $overlayLeft	= '<div id="tour_overlay3" class="overlayLeft"></div>';
					var $overlayRight	= '<div id="tour_overlay4" class="overlayRight"></div>';


					$('BODY').prepend($overlayTop);
					$('BODY').prepend($overlayBottom);
					$('BODY').prepend($overlayLeft);
					$('BODY').prepend($overlayRight);

				}

				

				function hideOverlay(){

					$('#tour_overlay1').remove();
					$('#tour_overlay2').remove();
					$('#tour_overlay3').remove();
					$('#tour_overlay4').remove();

				}
				
				ui.showMessage = function showMessage(){
										
					jSuccess(
					   'Yes! You made it!',
					   {
						 	ShowOverlay : false,
						 	TimeShown : 2000
					 	});
					
						setTimeout(function(){
							
							if(ui.currStep !== ui.prevStep){
								
								ui.step++;
								if(ui.step > 4)
									endTour();
								else
									ui.showTooltip();
								ui.prevStep = ui.currStep;
							}
						}, 3000);
				}
				
 			//end		
	};
	
	ui.displayWelcomeMessage = function() {
		var userStatusDiv = $('#userStatus');
		userStatusDiv.empty();
		userStatusDiv.append('<b>Welcome!</b> Your are using access code: <b>' + user.id + '</b>');
	};

}(window.ui = window.ui || {}, jQuery));

(function(dui, $, undefined) {

	var rootDiv = $('#info');
	var addNodeBtn = rootDiv.find('#addNode');
	var addLinkBtn = rootDiv.find('#addLink');
	
	addNodeBtn.qtip({
		content: 'Cannot edit public datasets. Please clone and select a personal copy using "Manage Data" panel for editing.',
		events: {
			show: function(e, api) {
				if (!$(e.originalEvent.currentTarget).hasClass('disabled')) {
					e.preventDefault();
				}
			}
		}
	});

	addLinkBtn.qtip({
		content: 'Cannot edit public datasets. Please clone a personal copy using "Manage Data" panel for editing.',
		events: {
			show: function(e, api) {
				if (!$(e.originalEvent.currentTarget).hasClass('disabled')) {
					e.preventDefault();
				}
			}
		}
	});

	dui.setupUIElements = function() {
		removeSelectOptions();
		if (activeDataset.isClone || activeDataset.isCustom) {
			enableInputs();
			updateSelectOptions();
		}
		else {
			disableInputs();
		}
	};
	
	var removeSelectOptions = function() {
		$('sourceSelect-Manage').find('option').remove();
		$('targetSelect-Manage').find('option').remove();
		$('parentSelect').find('option').remove();
		$('#sourceSelect-Manage').trigger('liszt:updated');
		$('#targetSelect-Manage').trigger('liszt:updated');
		$('#parentSelect').trigger('liszt:updated');
	};

	var updateSelectOptions = function() {
		var node_map = activeDataset.maps.node_map;
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
	
	var disableInputs = function() {
		rootDiv.find('input').prop('disabled', true);
		rootDiv.find('.btn').addClass('disabled');
	};
	
	var enableInputs = function() {
		rootDiv.find('input').prop('disabled', false);
		rootDiv.find('.btn').removeClass('disabled');
	};
	
	dui.addNodeButtonClick = function() {
		if (addNodeBtn.hasClass('disabled')) { return; }		
		var nodeName = $('#nodeNameInput').val();
		if (nodeName === "") {
			alert("Cannot add node: empty node name is not allowed.");
			return;	
		}
		var parentName = $('#parentSelect :selected').text();
		var parent = (parentName === '') ? null : activeDataset.maps.name_node_map[parentName];
		var parentKey = (parent === null) ? -1 : parent.key;
		console.log("parent key: " + parentKey);
		var depth = (parent === null) ? 1 : parent.depth　+ 1; 
		var nodeData = {userID: user.id, datasetKey: activeDataset.key, nodeName: nodeName, parentKey: parentKey, depth: depth, notes: null, isClone: activeDataset.isClone};
		database.addBrainNode(nodeData);
	};
	
	dui.addLinkButtonClick = function() {
		if (addLinkBtn.hasClass('disabled')) { return; }
		var sourceName = $('#sourceSelect-Manage :selected').text();
		var targetName = $('#targetSelect-Manage :selected').text();
		var pubmedLink = $('#pubmedLink').val();
		var name_node_map = activeDataset.maps.name_node_map;
		var sourceKey = name_node_map[sourceName].key;
		var targetKey = name_node_map[targetName].key;
		var linkData = {userID: user.id, datasetKey: activeDataset.key, sourceKey: sourceKey, targetKey: targetKey, notes: pubmedLink, attrKey: null, attrValue: null, isClone: activeDataset.isClone};
		database.addBrainLink(linkData);
	};
	
	dui.updateVisButtonClick = function() {
		svgRenderer.renderData(activeDataset.key);
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
		svgRenderer.updateForceLayout();
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
			svg_circular.selectAll('.circular.node').classed('nofocus', false);
			svg_circular.selectAll('.circular.text').classed('visible', false);
			svg_circular.selectAll('.circular.link').classed('hidden', false);
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
		selectStructure(input_node.name, false);
		userAction.trackAction('Set search source', 'UI', 'Set source', sui.selected_source.name, 'Set source', sui.selected_source.name);
		
	};

	sui.targetSearchInput = function() {

		var svg_circular = svgRenderer.svg_circular;

		userAction.trackAction('Set search target');
		if (sui.selected_target != undefined) {
			sui.selected_target.fixed = false;
			svg_circular.selectAll('.circular.node').classed('nofocus', false);
			svg_circular.selectAll('.circular.text').classed('visible', false);
			svg_circular.selectAll('.circular.link').classed('hidden', false);
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
		selectStructure(input_node.name, false);			
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

(function(eui, $, undefined) {
	var attrSelect = $('attrSelect');
	var aggrSelect = $('#aggrSelect');
	var attrMap = null;
	var activeAttr = null;
	
	eui.setupUIElements = function() {
		initAttrMap();
		appendAttrOptions();
		appendAggrSchemes();
		appendEdgeLegends();
	};
	
	var initAttrMap = function() {
		attrMap = activeDataset.maps.attr_map;
	};
	
	var appendAttrOptions = function() {
		for (var key in attrMap) {
			var attrInfo = attrMap[key];
			$('#attrSelect').append(new Option(attrInfo.name, key, false, false));
			if (activeAttr === null) { activeAttr = attrInfo; }
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		$('#attrSelect').trigger('liszt:updated');	
				
	};
	
	/* At last this function should be called every time a new attribute is selected */
	var appendAggrSchemes = function() {
		if (activeAttr.type === 'ordinal' || activeAttr.type === 'nominal') {
			$('#aggrSelect').append(new Option('Mode', 0, false, false));	
		}
		else {
			$('#aggrSelect').append(new Option('Sum', 0, false, false));	
			$('#aggrSelect').append(new Option('Min', 0, false, false));	
			$('#aggrSelect').append(new Option('Max', 0, false, false));	
			$('#aggrSelect').append(new Option('Avg', 0, false, false));	
			$('#aggrSelect').append(new Option('Mode', 0, false, false));	
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		$('#aggrSelect').trigger('liszt:updated');	
	};
	
	var appendEdgeLegends = function() {
		var attrValues = activeAttr.values;
		var colorPalette = d3.scale.category20().domain(attrValues);
		for (var i = 0; i < attrValues.length; ++i) {
			var container = d3.select('#legend-feature')
				.selectAll('div.lv1')
				.data(attrValues)
				.enter()
				.append('div')
				.attr('class', 'lv1');
			container.append('div')
				.attr('class', 'legend-block multi-col')
				.style('background-color', function(d, i) {
					return (colorPalette(d));
				});
			container.append('div')
				.attr('class', 'legend-label multi-col')
				.append('p')
				.text(function(d) { return d; });
			container.append('div')
				.attr('class', 'clear');
		}
	};
	
}(window.edgeUI = window.edgeUI || {}, jQuery));

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
		var datasetList = user.datasetList;
		for (var key in datasetList) {
			var curr_dataset = datasetList[key];
			$('#dataSelect').append(new Option(curr_dataset.name, key));
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


	// #Tested for v3.0#
	dm.cloneDatasetButtonClick = function() {
		var datasetName = $('#dataSelect :selected').text().replace('(public)', '(personal copy)');
		var datasetID = $('#dataSelect').val();
		database.cloneDataset(datasetName, user.id, datasetID);	
	};

	/*
	 * 1. Get the name of the selected dataset
	 * 2. Get the content of the selected dataset
	 * 3. Construct local maps for the selected dataset
	 * 4. Update the visualization [TODO]
	 */
	dm.applyDatasetButtonClick = function() {
		var datasetKey = parseInt($('#dataSelect').val());
		if (datasetKey === "") {
			return;
		}
		if (user.datasets[datasetKey] === undefined) {
			database.getBrainData(datasetKey, user.id);
		}
		else {
			activeDataset.switchActiveDataset(datasetKey);
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
	var editButton = $('#conn-note-edit');
	var saveButton = $('#conn-note-save');
	var no_note_msg = $('#no-note-msg');
	var notesDiv = $('#conn-notes');

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
		cl.link.notes = notesInput.val();
		switchMode('display');
		notesDisplay.text(cl.link.notes);
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
		notesDisplay.text('No notes found.');
	}
	
	function displayNotes() {
		if (!(activeDataset.isClone || activeDataset.isCustom)) {
			no_note_msg.removeClass('removed');
			notesDiv.addClass('removed');
			no_note_msg.text('Cannot add notes for public datasets. Please clone and select a personal copy using "Manage Data" panel to add notes.');
		}
		else if (cl.link.isDerived) {
			no_note_msg.removeClass('removed');
			notesDiv.addClass('removed');
			no_note_msg.text('Cannot edit derived connections. Please add notes directly to a sub-connection.');
		}	
		else {
			no_note_msg.addClass('removed');
			notesDiv.removeClass('removed');
			notesDisplay.text(cl.link.notes === null ? "No notes found." : cl.link.notes);
		}
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
		var link_map = activeDataset.maps.link_map;
		var paperKeys = [];
		if (cl.link.isDerived) {
			var base_children = cl.link.base_children;
			for (var i = 0; i < base_children.length; ++i) {
				var base_link = base_children[i];
				paperKeys = paperKeys.concat(link_paper_map[base_link]);
			}
			paperKeys = generic.removeDuplicates(paperKeys);
		}
		else {
			paperKeys = link_paper_map[cl.link.key];
		}
		console.log(paperKeys);
		var self_paper_tab = d3.select('#paper-list');
		self_paper_tab.selectAll('div').remove();
		self_paper_tab.selectAll('p').remove();
		var content = self_paper_tab.append('div');
		var content_html = '';
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
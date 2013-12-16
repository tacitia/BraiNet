// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.pathSearch = (function($, undefined) {

	var doms = {
		sourceList: $('#path-search #source-list'),
		targetList: $('#path-search #target-list'),
		searchButton: $('#path-search #search-button')
	};
	
	var setting = {
		maxHop: 3
		// TODO: add max hop slider
	};
	
	var state = {
		source: null,
		target: null
	};
	
	var init = function() {
		doms.sourceList.change(selectSource);
		doms.targetList.change(selectTarget);
		doms.searchButton.click(searchButtonClick);
	};
	
	var selectSource = function() {
		var inputKey = this.value;
		processSelection(inputKey, 'source');
	};
	
	var selectTarget = function() {
		var inputKey = this.value;
		processSelection(inputKey, 'target');
	};
	
	var processSelection = function(inputKey, id) {
		// If there exists an old selected_source, reset its status
		if (state[id] !== null) {
			cancelSelection(id);
		}	
		if (inputKey === '') { 
			state[id] === null;
			svg.circular.setMode('exploration');
			return; 
		}
		var inputNode = svg.model.maps().keyToNode[inputKey];
		setSelection(id, inputNode);
	};
	
	var cancelSelection = function(id) {
		state[id].fixed = false;
		svg.circular.highlightNode(state[id], true);
//		svg.anatomy.emphStructure(state[id], false);
	};
	
	var setSelection = function(id, node) {
		state[id] = node;
		if (state.source !== null && state.target !== null) {
			svg.showRegionMulti([state.source.pk, state.target.pk]);
		}
		else {
			svg.showRegion(node.pk);
		}
//		svg.anatomy.selectStructure(node.name, false);
	};
	
	var searchButtonClick = function() {
		svg.circular.setMode('search');
		var paths = svg.model.calculatePaths(state.source, state.target, setting.maxHop);
		svg.force.populateActiveElements();
		svg.force.updateLayout(state.source, state.target);
		svg.circular.dimNonSearchResults();
	};
	
	var render = function(regionList) {
		doms.sourceList.find('option').remove();
		doms.targetList.find('option').remove();
		for (i = 0; i < regionList.length; ++i) {
			var r = regionList[i];
			doms.sourceList.append(new Option(r.fields.name, r.pk));
			doms.targetList.append(new Option(r.fields.name, r.pk));
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		doms.sourceList.trigger('liszt:updated');	
		doms.targetList.trigger('liszt:updated');	
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

// This module indexes all the ui modules.

var svg = svg || {};

svg.circular = svg.circular || {};
svg.force = svg.force || {};
svg.anatomy = svg.anatomy || {};
svg.linkAttr = svg.linkAttr || {};
svg.model = svg.model || {};

//TODO: run selected svg modules using requireJS

svg.state = {
	rendering: false,
	renderCompleted: 0	
};

svg.render = function(datasetId, maxDepth) {
	ui.loadingModal.message('Loading connectivity datasets...');
	ui.loadingModal.show();
	svg.model.getDataset(datasetId, maxDepth);
};

// A shortcut for rendering using all the available svg modules
svg.renderViews = function(data, datasetId) {
	svg.state.rendering = true;
	ui.loadingModal.message('Rendering visualizations...');
	ui.loadingModal.show();	
	svg.circular.render(data, datasetId);
	svg.force.render(data, datasetId);
	svg.anatomy.render();
};

svg.updateLinkColor = function(attr, colorMap) {
	svg.circular.updateLinkColor(attr, colorMap);
};

// A shortcut for showing the selected region in all available svg modules
svg.showRegion = function(regionPk,callback) {
	svg.circular.showRegion(regionPk, callback);
	svg.force.showRegion(regionPk, callback);
};

svg.showRegionMulti = function(regionPk, callback) {
	svg.circular.showRegionMulti(regionPk, callback);
};

svg.highlightInput = function(id, node, isCancel) {
	svg.circular.highlightInput(id, node, isCancel);
	svg.force.highlightInput(id, node, isCancel);
};

svg.clearAllHighlight = function() {
	svg.circular.clearAllHighlight();
	svg.force.clearAllHighlight();
};

svg.displaySearchResult = function(source, target, paths) {
	svg.circular.displaySearchResult(source, target, paths);
	svg.force.displaySearchResult(source, target, paths);
};

svg.clearSearchResult = function() {
	svg.circular.clearSearchResult();
	svg.force.clearSearchResult();
};

svg.renderComplete = function() {
	if (!svg.state.rendering) { return; }
	svg.state.renderCompleted += 1;
	console.log(svg.state.renderCompleted);
	if (svg.state.renderCompleted === 3) {
		console.log('I called hide');
		ui.loadingModal.hide();
		svg.state.renderCompleted = 0;
	}
};
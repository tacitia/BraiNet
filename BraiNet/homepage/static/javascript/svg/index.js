// This module indexes all the ui modules.

var svg = svg || {};

svg.circular = svg.circular || {};
svg.anatomy = svg.anatomy || {};
svg.model = svg.model || {};

//TODO: run selected svg modules using requireJS

svg.render = function(userId, datasetId, maxDepth) {
	svg.model.getDataset(userId, datasetId, maxDepth);
};

// A shortcut for rendering using all the available svg modules
svg.renderViews = function(data) {
	svg.circular.render(data);
	svg.anatomy.render();
};

// A shortcut for showing the selected region in all available svg modules
svg.showRegion = function(regionPk) {
	svg.circular.showRegion(regionPk);
};
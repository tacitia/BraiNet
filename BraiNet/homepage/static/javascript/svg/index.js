// This module indexes all the ui modules.

var svg = svg || {};

svg.circular = svg.circular || {};
svg.model = svg.model || {};

//TODO: run selected svg modules using requireJS

svg.render = function(userId, datasetId) {
	svg.model.getDataset(userId, datasetId);
};

// A shortcut for rendering using all the available svg modules
svg.renderViews = function(data) {
	svg.circular.render(data);
};
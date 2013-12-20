// This module takes care of the main control logic


$(document).ready(function() {

	user.init();
	ui.datasetSelector.init(user.model.id());
	ui.regionSelector.init();
	ui.pathSearch.init();
	ui.canvasReset.init();
	ui.linkInfo.init();
	ui.loadingModal.init();
	svg.circular.init();
	svg.force.init();
	svg.anatomy.init();
	svg.linkAttr.init();
	
	ui.loadingModal.message('Loading connectivity datasets...');
	ui.loadingModal.show();
	svg.render(user.model.id(), 2, 5);
});
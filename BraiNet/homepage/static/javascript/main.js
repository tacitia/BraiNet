// This module takes care of the main control logic


$(document).ready(function() {

	user.init();
	ui.datasetSelector.init(user.model.id());
	ui.regionSelector.init();
	svg.circular.init();
	svg.anatomy.init();

	svg.render(user.model.id(), 2, 5);
});
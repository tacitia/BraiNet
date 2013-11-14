// This module takes care of the main control logic


$(document).ready(function() {

	user.init();
	ui.datasetSelector.init(user.model.id());
	svg.circular.init();

	svg.render(user.model.id(), 1);
});

/*
 * When the app is loaded, populate the visualization with the default BAMS dataset
 */
$(document).ready(function() {
	user.getUser();
	user.addPublicDatasets();
	ui.bind();
	svgRenderer.prepareCanvas();
	database.getBrainData(2130, 1);
	database.populateDatasets(user.id);
});

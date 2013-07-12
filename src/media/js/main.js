
/*
 * When the app is loaded, populate the visualization with the default BAMS dataset
 */
$(document).ready(function() {
	database.getBrainData(activeDataset.key, 1);
	user.addPublicDatasets();
	ui.bind();
	svgRenderer.prepareCanvas();
	database.populateDatasets(1);
});

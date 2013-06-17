
/*
 * When the app is loaded, populate the visualization with the default BAMS dataset
 */
$(document).ready(function() {
	database.getBrainData(datasetProperties.key, 0);
	ui.bind();
	svgRenderer.prepareCanvas();
});

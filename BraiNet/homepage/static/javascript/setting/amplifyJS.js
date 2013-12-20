// This file contains settings for AmplifyJS

/* Request definitions */

amplify.request.define('getDatasetList', 'ajax', {
	url: '/connectivity/datasets/{userId}',
//	url: 'http://brainconnect.cs.brown.edu/connectivity/datasets/{userId}',
	type: 'GET'
})

amplify.request.define('getDataset', 'ajax', {
	url: '/connectivity/dataset/{userId}/{datasetId}/{maxDepth}',
//	url: 'http://brainconnect.cs.brown.edu/connectivity/dataset/{userId}/{datasetId}/{maxDepth}',
	type: 'GET'
})

amplify.request.define('getStructImgMap', 'ajax', {
	url: '/anatomy/structImgMap',
//	url: 'http://brainconnect.cs.brown.edu/anatomy/structImgMap',
	type: 'GET'
})


/* Subscriptions */

amplify.subscribe('datasetReady', function(data, datasetId) {
	console.log("Dataset " + datasetId + " received.");
	ui.regionSelector.render(data.nodes);
	ui.pathSearch.render(data.nodes);
//	ui.loadingModal.hide();
	svg.renderViews(data, datasetId);
})

amplify.subscribe('renderComplete', function() {
	svg.renderComplete();
})

amplify.subscribe('resetComplete', function() {
	ui.canvasReset.resetComplete();
	ui.pathSearch.resetComplete();
})

amplify.subscribe('modalShow', function() {
})
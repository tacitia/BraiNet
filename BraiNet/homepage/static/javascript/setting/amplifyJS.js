// This file contains settings for AmplifyJS

/* Request definitions */

amplify.request.define('getDatasetList', 'ajax', {
	url: '/connectivity/datasets/{userId}',
	type: 'GET'
})

amplify.request.define('getDataset', 'ajax', {
	url: '/connectivity/dataset/{userId}/{datasetId}/{maxDepth}',
	type: 'GET'
})

amplify.request.define('getStructImgMap', 'ajax', {
	url: '/anatomy/structImgMap',
	type: 'GET'
})


/* Subscriptions */

amplify.subscribe('datasetReady', function(data, datasetId) {
	console.log('amplify');
	console.log(datasetId);
	ui.regionSelector.render(data.nodes);
	ui.pathSearch.render(data.nodes);
	svg.renderViews(data, datasetId);
})
// This file contains settings for AmplifyJS

/* Request definitions */

amplify.request.define('getDatasetList', 'ajax', {
	url: '/connectivity/datasets/{userId}',
	type: 'GET'
})

amplify.request.define('getDataset', 'ajax', {
	url: '/connectivity/dataset/{userId}/{datasetId}',
	type: 'GET'
})


/* Subscriptions */

amplify.subscribe('datasetReady', function(data) {
	svg.renderViews(data);
})
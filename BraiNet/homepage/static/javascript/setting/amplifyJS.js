// This file contains settings for AmplifyJS

/* Request definitions */

amplify.request.define('getDatasetList', 'ajax', {
	url: '/connectivity/datasets/{userId}/',
//	url: 'http://brainconnect.cs.brown.edu/connectivity/datasets/{userId}',
	type: 'GET'
})

amplify.request.define('getDataset', 'ajax', {
	url: '/connectivity/dataset/{userId}/{datasetId}/{maxDepth}/',
//	url: 'http://brainconnect.cs.brown.edu/connectivity/dataset/{userId}/{datasetId}/{maxDepth}',
	type: 'GET'
})

amplify.request.define('getSubConnections', 'ajax', {
	url: '/connectivity/connections/subs/{connId}/',
	type: 'GET'
})

amplify.request.define('getLeaves', 'ajax', {
	url: '/connectivity/connections/leaves/{connId}/',
	type: 'GET'
})

amplify.request.define('getLocalConnections', 'ajax', {
	url: '/connectivity/connections/local/{structId}/{depth}',
	type: 'GET'
})

amplify.request.define('getPaths', 'ajax', {
	url: '/connectivity/connections/paths/{sourceId}/{targetId}/{maxHop}/',
	type: 'GET'
})

amplify.request.define('getStructImgMap', 'ajax', {
	url: '/anatomy/structImgMap/',
//	url: 'http://brainconnect.cs.brown.edu/anatomy/structImgMap',
	type: 'GET'
})

amplify.request.define('getConnectionNotes', 'ajax', {
	url: '/account/notes/connection/{userId}/{datasetId}/',
	type: 'GET'
})

amplify.request.define('addConnectionNote', 'ajax', {
	url: '/account/notes/connection/add/',
	type: 'POST'
})

amplify.request.define('addAction', 'ajax', {
	url: '/action/add/',
	type: 'POST'
})


/* Subscriptions */

amplify.subscribe('datasetReady', function(data, datasetId) {
	console.log("Dataset " + datasetId + " received.");
	ui.regionSelector.render(data.nodes);
	ui.attrSelector.render(data.links);
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

amplify.subscribe('userValidationComplete', function() {
	window.userValidated();
})
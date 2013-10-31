
(function(state, $, undefined) {

	state.currMode = customEnum.mode.exploration;
	state.ignored_nodes = [];

	// User specific data
	var link_rating_map; // Key: link id. Value: user rating for the link.
	var record_rating_map; // Key: record id. Value: user rating for the record.
	var brodmann_map;

}(window.state = window.state || {}, jQuery));

(function(user, $, undefined) {
	user.isAnonymous = true;
	user.datasetList = {};
	user.id = 1;
	user.datasets = {};	
	
	user.getUser = function() {
		var userID = generic.getURLParams().accesscode;
		if (userID) {
			user.isAnonymous = false;
			user.id = userID;
			ui.displayWelcomeMessage();
		}	
	};
	
	user.addPublicDatasets = function() {
		user.datasetList[2130] = {
			key: 2130,
			name: 'BAMS (public)',
			isClone: 0,
			isCustom: 0,
			origin: 2130,
			attributes: [
				{
					name: 'Connection strength',
					type: 'categorical',
					domain: ['Strong', 'Moderate', 'Weak'],
				},
			],
		};
		user.datasetList[1000002] = {
			key: 1000002,
			name: 'Pubmed (public)',
			isClone: 0,
			isCustom: 0,
			origin: 1000002,
			attributes: [],
		};
	};
	
	user.addDataset = function(dataset) {
		user.datasetList[dataset.key] = dataset;
	}
	
}(window.user = window.user || {}, jQuery));

(function(ad, $, undefined) {

	ad.maps = null;
	
	ad.switchActiveDataset = function(datasetKey) {
		ad.maps = user.datasets[datasetKey];
		var dp = user.datasetList[datasetKey];
		ad.name = dp.name;
		ad.key = dp.key;
		ad.isClone = dp.isClone;
		ad.isCustom = dp.isCustom;
		ad.origin = dp.origin; 
		ad.attributes = dp.attributes;
		ui.setupUIElements();
		svgRenderer.renderData(datasetKey);
	};
	
}(window.activeDataset = window.activeDataset || {}, jQuery));


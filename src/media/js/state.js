
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
	user.dataset_list = null;
	user.id = 0;
	user.datasets = {};	
}(window.user = window.user || {}, jQuery));

(function(ad, $, undefined) {
	
	ad.nodes = null;
	ad.links = null;
	ad.nodes_force = null;
	ad.links_force = null;
	ad.maps = null;
	
}(window.activeDataset = window.activeDataset || {}, jQuery));


(function(dsp, $, undefined) {

	dsp.name = "BAMS(Public)"; 
	dsp.key = 2130;
	dsp.isClone = 0;
	dsp.origin = 2130;

}(window.datasetProperties = window.datasetProperties || {}, jQuery));

// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.datasetSelector = (function($, undefined) {

	var dom = {
		datasetList: $('#dataset-selector #dataset-list'),
		loadButton: $('#dataset-selector #load-button')
	};
	
	var state = {
		selectedDatasetId: null
	};

// TODO: check user module for the userId first and fall back to use default if user module does not have user inputs
	var init = function(userId) {
		getDatasetList(userId);
		dom.datasetList.change(selectDataset);
		dom.loadButton.click(loadDataset);
		console.log('Dataset selector initialized.');
	};
	
	var getDatasetList = function(userId) {
		console.log('Requesting dataset list...');
		amplify.request('getDatasetList',
			{
				userId: userId,
			},
			function(data) {
				updateDatasetList($.parseJSON(data));
			}
		);
	};
	
	var loadDataset = function() {
		svg.render(state.selectedDatasetId, 5);
		util.action.add('load dataset', {datasetId: state.selectedDatasetId});
	};
	
	var selectDataset = function() {
		state.selectedDatasetId = this.value;
		util.action.add('select dataset', {datasetId: this.value});
	};
	
	var updateDatasetList = function(datasetList) {
		dom.datasetList.find('option').remove();
		for (i = 0; i < datasetList.length; ++i) {
			var currDataset = datasetList[i];
			dom.datasetList.append(new Option(currDataset.fields.name, currDataset.pk, false, false));
		}
		$('#dataset-list option[value="2"]').attr("selected",true);
		$('.chzn-select').chosen({allow_single_deselect: true});
		dom.datasetList.trigger('liszt:updated');	
	};
	
	var update = function(userId) {
		getDatasetList(userId);
	};

	return {
		init: init,
		update: update
	};

}(jQuery));

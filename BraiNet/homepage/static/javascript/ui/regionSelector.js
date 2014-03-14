// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.regionSelector = (function($, undefined) {

	var dom = {
		regionList: $('#region-selector #region-list')
	};
	
	var init = function() {
		dom.regionList.change(selectRegion);
	};
	
	var selectRegion = function() {
		svg.showRegion(this.value);
		var maps = svg.model.maps();
		var node = maps.keyToNode[this.value];
		var regionName = node.fields.name;
		console.log(regionName);
		svg.anatomy.selectStructure(regionName, false);
		svg.highlightInput('struct', node, false);
		util.action.add('select region using dropdown', {region: regionName});
	};
	
	var render = function(regionList) {
		dom.regionList.find('option').remove();
		for (i = 0; i < regionList.length; ++i) {
			var r = regionList[i];
			dom.regionList.append(new Option(r.fields.name, r.pk, false, false));
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		dom.regionList.trigger('liszt:updated');	
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

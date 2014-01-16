// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.attrSelector = (function($, undefined) {

	var dom = {
		attrList: $('#legend-feature #attr-list'),
		attrLegend: d3.select('#legend-feature #attr-legend')
	};
	
	var state = {
		selectedAttr: null
	};

	var init = function(userId) {
		dom.attrList.change(selectAttr);

		console.log('Attribute selector initialized.');
	};
	
	var selectAttr = function() {
	};
	
	var render = function(links) {
		dom.attrList.find('option').remove();
		var l = links[0];
		console.log(l);
		var attrs = l.fields.attributes;
		var counter = 1;
		for (var key in attrs) {
			dom.attrList.append(new Option(key, counter, false, false));
			counter++;
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		dom.attrList.trigger('liszt:updated');
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

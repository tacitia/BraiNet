// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.attrSelector = (function($, undefined) {

	var dom = {
		attrList: $('#legend-feature #attr-list'),
		attrLegend: d3.select('#legend-feature #attr-legend'),
		gradient: null
	};
	
	var state = {
		selectedAttr: null
	};
	
	var data = {
		attrList: null,
		attrSummary: null,
		attrColorMap: null
	};

	var init = function(userId) {
		dom.attrList.change(selectAttr);
		dom.gradient = dom.attrLegend.append("svg:defs")
			  .append("svg:linearGradient")
				.attr("id", "gradient")
				.attr("x1", "0%")
				.attr("y1", "0%")
				.attr("x2", "100%")
				.attr("y2", "0%")
				.attr("spreadMethod", "pad");
		console.log('Attribute selector initialized.');
	};
	
	var selectAttr = function() {
		var attr = $("#attr-list option:selected").text();
		updateAttrLegend(attr);
		updateLinkColor(attr);
		util.action.add('select attribute for visualization', {attribute: attr})
	};
	
	var render = function(links) {
		buildAttrMap(links);
		assignAttrColor();
		dom.attrList.find('option').remove();
		var l = links[0];
		var attrs = l.fields.attributes;
		var counter = 1;
		dom.attrList.append(new Option('(None)', 0, false, false));
		for (var key in attrs) {
			if (data.attrSummary[key].type !== 'numeric') { continue; }
			dom.attrList.append(new Option(key, counter, false, false));
			counter++;
		}
		$('#attr-list option[value="0"]').attr("selected",true);
		$('.chzn-select').chosen({allow_single_deselect: true});
		dom.attrList.trigger('liszt:updated');
	};
	
	var buildAttrMap = function(links) {
		data.attrList = [];
		data.attrSummary = {};
		var attrs = links[0].fields.attributes;
		buildAttrMapHelper[window.settings.activeDataset](links, attrs);
	}
	
	var buildAttrMapHelper = {};
	buildAttrMapHelper[1] = function(links, attrs) {
		for (var key in attrs) {
			data.attrList.push(key);
			data.attrSummary[key] = {type: 'nominal'};
		}
	};
	buildAttrMapHelper[2] = function(links, attrs) {
		for (var key in attrs) {
			data.attrList.push(key);
			data.attrSummary[key] = {min: Number.MAX_VALUE, max: Number.MIN_VALUE, type: 'numeric'};
		}
		for (var i in links) {
			var linkAttrs = links[i].fields.attributes;
			for (var key in linkAttrs) {
				data.attrSummary[key].min = Math.min(data.attrSummary[key].min, linkAttrs[key].mean);
				data.attrSummary[key].max = Math.max(data.attrSummary[key].max, linkAttrs[key].mean);
			}
		}
	};
	
	var assignAttrColor = function() {
		var colorMap = d3.scale.category10().domain(data.attrList);
		data.attrColorMap = {};
		for (var key in data.attrSummary) {
			data.attrColorMap[key] = colorMap(key);
		}
	};
	
	var updateAttrLegend = function(attrKey) {
		console.log(data.attrSummary);
		console.log(attrKey);
		dom.attrLegend.selectAll('stop').remove();
		dom.attrLegend.selectAll('g').remove();
		dom.attrLegend.selectAll('rect').remove();
		dom.attrLegend.selectAll('text').remove();
		
		if (attrKey === '(None)') { return; }
		
		var endColor = data.attrColorMap[attrKey];
		var startColor = d3.hsl(endColor).brighter(1.8);
		
		dom.gradient.append("svg:stop")
			.attr("offset", "0%")
			.attr("stop-color", startColor)
			.attr("stop-opacity", 1);

		dom.gradient.append("svg:stop")
			.attr("offset", "100%")
			.attr("stop-color", endColor)
			.attr("stop-opacity", 1);

		dom.attrLegend.append("svg:rect")
			.attr("width", 280)
			.attr("height", 20)
			.attr('transform', 'translate(0,10)')
			.style("fill", "url(#gradient)");
		
		dom.attrLegend.append('g')
			.attr('transform', 'translate(0,40)')
			.append('svg:text')
			.text(data.attrSummary[attrKey].min);

		dom.attrLegend.append('g')
			.attr('transform', 'translate(240,40)')
			.append('svg:text')
			.text(data.attrSummary[attrKey].max);
	};
	
	var updateLinkColor = function(attr) {
		if (attr === '(None)' ) {
			svg.updateLinkColor(null, null);
			return;
		}
		var endColor = data.attrColorMap[attr];
		var startColor = d3.hsl(endColor).brighter(1.8);
		var colorMap = d3.scale.sqrt().domain([data.attrSummary[attr].min, data.attrSummary[attr].max]).range([startColor, endColor]);
		svg.updateLinkColor(attr, colorMap);
	};

	return {
		init: init,
		render: render
	};

}(jQuery));

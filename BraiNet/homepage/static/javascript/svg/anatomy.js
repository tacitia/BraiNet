// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.anatomy = (function($, undefined) {

	var cons = {
		API_PATH: "http://api.brain-map.org/api/v2/"
	};
	cons.SVG_DOWNLOAD_PATH = cons.API_PATH + "svg/";
	cons.IMG_DOWNLOAD_PATH = cons.API_PATH + "section_image_download/";
	cons.STRUCTURES_URL = cons.API_PATH + "data/Structure/query.json?criteria=[graph_id$eq1]&num_rows=all";

	var settings = {
		DOWNSAMPLE: 5,
	};
	settings.args = { downsample: settings.DOWNSAMPLE };
	
	var doms = {
		canvas: '#anatomy-pane .canvas',
		svg: '#anatomy-pane .canvas #svg',
		img: '#anatomy-pane .canvas #img',
		path: '#anatomy-pane .canvas #svg path',
		lArrow: '#anatomy-pane #left-arrow',
		rArrow: '#anatomy-pane #right-arrow'
	};
	
	var state = {
		activeTitle: null,
		allActiveStructs: [],
		emphStructs: [],
		currImgKey: null,
		currImgId: 100960224,
		originColor: {},
		selPath: null
	};
	
	var data = {
		structs: {},
		structToImg: {},
		images: {},
		maps: null
	};
	
	var svgGens = {
		arcs: null,
		curves: null,
		palette: null
	};
	
	var svgObjs = {
		canvas: null,
		links: null,
		force: null
	};

	var init = function() {
		// When the page is read, download the structures.  When that's finished, download the SVG 
		// and image.
		$(doms.canvas).css("background","no-repeat center url(\"static/image/loading.gif\")");
		retrieveStructImageMap();
	
		$(doms.lArrow).click(leftArrowClick);
		$(doms.rArrow).click(rightArrowClick);

		console.log('Anatomy view initialized.');
	};
	
	var render = function(d) {
		downloadStructures(function() {
			$(doms.canvas).css("background","");
			updateImages(settings.args);
		});
	};
	
	/* SVG Objects Interaction */
	
	var pathClick = function() {
		var title = $(this).attr('oldtitle');
		var maps = svg.model.maps();
		var node = maps.nameToNode[title];
		var circular = svg.circular;
				
		if ($(this).attr('isFixed') === "true") {
//			circular.highlightNode(node, svg, maps, true);	
			svg.clearAllHighlight();
			emphStructure($(this), true);
			$(this).attr('isFixed', false);
			state.activeTitle = null;
			state.allActiveStructs.splice(state.allActiveStructs.indexOf(title), 1);
			svg.circular.setMode('exploration');
		}			
		else {
			svg.showRegion(node.pk);
			var oldSel = $("#anatomy-pane path[oldtitle='" + state.activeTitle + "']");
			emphStructure(oldSel, true);
			state.activeTitle = title;
			state.allActiveStructs.push(title);
			svg.circular.setMode('fixation');
			$(this).attr('isFixed', true);
		}
	};

	function hoverStructure(target, isCancel) {
		var title = target.attr('oldtitle');
		if (target.attr('isFixed') === "true") { return; }
		if (isCancel && $.inArray(title, state.allActiveStructs) > 0) { return; }
		emphStructure(target, isCancel);
	}

	function selectStructure(title, isCancel) {
		state.activeTitle = title;
		if (isCancel) {
//			emphStructure($(state.selPath), true);
//			state.selPath = "#anatomy-map path[oldtitle='" + title + "']";
			$(doms.path).qtip('toggle', false);
			for (i in state.allActiveStructs) {
				var selector = $("#anatomy-pane path[oldtitle='" + state.allActiveStructs[i] + "']");
				emphStructure(selector, true);
			}
			state.activeTitle = null;
			state.allActiveStructs = [];
			return;
		}
		
		console.log(title);
		var maps = svg.model.maps()
		var node = maps.nameToNode[title];
		var id = node.fields.struct_id;			
		
		var newImgId = data.structToImg[id];
		var queue = [node.pk];
		while (newImgId === undefined) {
			var queueLen = queue.length;
			for (var i in queue) {
				var n = maps.keyToNode[queue[i]];
				newImgId = data.structToImg[n.fields.struct_id];
				queue = $.merge(queue, n.derived.children);
			}
			queue.splice(0, queueLen);
			if (queue.length < 1) { break; }
		}
		
		console.log(id);
		console.log(data.structToImg);
		console.log(data.structToImg[id]);
		console.log(state.currImgId);
	
		if (data.structToImg[id] !== state.currImgId) {
			state.currImgId = data.structToImg[id];
			if (state.currImgId !== undefined) { // Will be undefined for structures that are not included in Allen
				args = { downsample: settings.DOWNSAMPLE };
				updateImages(args);
			}
		}
		else {
			highlightStructure(title);
		}
	}

	var leftArrowClick = function() {
		state.currImgKey = state.currImgKey - 1;
		state.currImgId = data.images[state.currImgKey];
		$(doms.canvas).css("background","");
		updateImages(settings.args);
	};
	
	var rightArrowClick = function() {
		state.currImgKey = state.currImgKey + 1;
		state.currImgId = data.images[state.currImgKey];
		$(doms.canvas).css("background","");
		updateImages(settings.args);
	};
	
	/* End of SVG Objects Interaction */
	
	/* Canvas Update */
	
	// Possibly highlighting related children regions
	function highlightStructure(structName) {
		var structSelector = $("#anatomy-pane path[oldtitle='" + structName + "']");
		if (structSelector.length > 0) {
			state.allActiveStructs.push(structName);
			structSelector.attr('isFixed', true);
			emphStructure(structSelector, false);
			structSelector.qtip('toggle', true);		
		}
	
		var maps = svg.model.maps();
		var structNode = maps.nameToNode[structName];
		var descs = svg.circular.findAllDesc(structNode);
		for (var i in descs) {
			var desc = descs[i];
			var descSelector = $("#anatomy-pane path[oldtitle='" + desc.fields.name + "']");
			if (descSelector.length > 0) {
				state.allActiveStructs.push(desc.fields.name);
				descSelector.attr('isFixed', true);
				emphStructure(descSelector, false);
				descSelector.qtip('toggle', true);
			}
		}
		
		if (state.allActiveStructs.length === 0) {
			// No selectable area for this structure; try to find its ancestor
			var parentNode = structNode.derived.parent;
			while (parentNode !== null && parentNode !== undefined) {
				var parentSelector = $("#anatomy-pane path[oldtitle='" + parentNode.fields.name + "']");
				if (parentSelector.length > 0) {
					console.log(parentSelector);
					emphStructure(parentSelector, false);
					state.allActiveStructs.push(parentNode.fields.name);
					parentSelector.attr('isFixed', true);
					parentSelector.qtip('toggle', true);
					break;
				}
				parentNode = parentNode.derived.parent;
			}
		}
	}
	
	// Highlight a single structure
	function emphStructure(target, isCancel) {
		var title = target.attr('oldtitle');

		if (isCancel) {
			target.css('fill', state.originColor[title]);
			target.css('fill-opacity', '1');
			target.css('stroke-width', '0');
			target.attr('isEmph', false);
			state.emphStructs.splice( $.inArray(target, state.emphStructs), 1 );
		}
		else {
			state.originColor[title] = target.css('fill');
			target.css('fill', '#9900ff');
			target.css('fill-opacity', '0.5');
			target.css('stroke-width', '24');
			target.attr('isEmph', true);
			state.emphStructs.push(target);
		}
	}
	
	var reset = function() {
		console.log('Reset anatomy');
		$("#anatomy-pane path").qtip('toggle', false);
		while (state.emphStructs.length > 0) {
			emphStructure(state.emphStructs[0], true);
		}
		state.activeTitle = null;
		state.allActiveStructs = [];
	};
	
	/* End of Canvas Update*/
	
	/* SVG Data Update */

	/* End of SVG Data Update */
	
	/* Computation */

	// A helper function that makes a url out of a path, database id, 
	// and argument array.
	function formatUrl(path, id, args) {
		return path + id + "?" + $.map(args, function(value, key) {
			return key + "=" + value;
		}).join("&");
	}

	function getUrlVars(){
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	}
	
	var storeStructImgMap = function(result) {
		var temp = $.parseJSON(result);
		for (var i = 0; i < temp.length; ++i) {
			var pair = temp[i];
			data.structToImg[pair.fields.struct_id] = pair.fields.image_id;
			data.images[i+1] = pair.fields.image_id;
		}
		state.currImgKey = retrieveImageKey();
	};

	/* End of Computation */
	
	/* Network */

	// Make an AJAX query to download all of the structures in the adult mouse 
	// structure graph.  
	function downloadStructures(onSuccess) {
		$.getJSON(cons.STRUCTURES_URL, function(response) {
			for (var i = 0; i < response.msg.length; i++) {
				var s = response.msg[i];
				data.structs[s.id] = s;
			}
			onSuccess();
		});
	}

	// Make an AJAX query to download the SVG for a section image.
	function downloadSvg(url) {
		$(doms.svg).load(url, function() {
			console.log('SVG loaded.');
			// Retrieve all paths in the SVG and add a 'title' attribute.  The
			// 'title' attribute is displayed in the qtip2 tooltip.
			$(doms.path)
				.attr('title', function() {
//					console.log($(this)); 
					var id = $(this).attr('structure_id');
					return data.structs[id].name; 
				});
			
			$(doms.path).qtip();
		
			$(doms.path).hover(
			function() {
				//addClass not working for this for some reason
				hoverStructure($(this), false);
			}, 
			function() {
				hoverStructure($(this), true);
			});
	
		
			$(doms.path).click(pathClick);
				
			if (state.activeTitle !== null) {
				highlightStructure(state.activeTitle);
			}
		});
	}

	// Make an AJAX query to download the section image and append it to the DOM.
	function downloadImg(url) {
		var image = new Image;
		image.onload = function() {
			console.log('Image loaded.');
			console.log(image);
			$(doms.img).empty();
			$(doms.img).append(image);
			console.log($(doms.img));
		};
		image.src = url;
	}

	function retrieveStructImageMap() {
		amplify.request('getStructImgMap',
			{},
			storeStructImgMap
		);			
	};

	function retrieveImageKey(){
		for (var key in data.images){
			if(data.images[key] === state.currImgId){
				return key;
			}
		}	
		return null;
	};
	function updateImages(args) {
		downloadSvg(formatUrl(cons.SVG_DOWNLOAD_PATH, state.currImgId, settings.args));
		downloadImg(formatUrl(cons.IMG_DOWNLOAD_PATH, state.currImgId, settings.args));
		console.log("Anatomical images updated.");		
	};
	
	/* End of Network*/

	return {
		init: init,
		render: render,
		selectStructure: selectStructure,
		emphStructure: emphStructure,
		reset: reset
	};

}(jQuery));

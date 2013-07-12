// Copyright 2012 Allen Institute for Brain Science
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This page downloads the SVG file associated with a SectionImage and
// overlays them on top of image.  

// URLS pointing to the SVG and section image download API controllers.
var API_PATH = "http://api.brain-map.org/api/v2/";
var SVG_DOWNLOAD_PATH = API_PATH + "svg/";
var IMG_DOWNLOAD_PATH = API_PATH + "section_image_download/";
var STRUCTURES_URL = API_PATH + "data/Structure/query.json?criteria=[graph_id$eq1]&num_rows=all";

// Default parameters for the demo.  Change these via the URL string.
var curr_image_id = 100960224;
var curr_image_key;
var DOWNSAMPLE = 5;

var urlVars = getUrlVars();
if ('id' in urlVars)
	curr_image_id =  urlVars.id;
if ('downsample' in urlVars)
	DOWNSAMPLE = urlVars.downsample;

// A hash from structure id to structure meta info, which will be 
// initialized later.
var _structures = {};
var struct_img_map = {};
var _images = {};

var tempSelPath = null;

// A helper function that makes a url out of a path, database id, 
// and argument array.
function format_url(path, id, args) {
	return path + id + "?" + $.map(args, function(value, key) {
		return key + "=" + value;
	}).join("&");
}

// Make an AJAX query to download all of the structures in the adult mouse 
// structure graph.  
function download_structures(on_success) {
	$.getJSON(STRUCTURES_URL, function(response) {
		for (var i = 0; i < response.msg.length; i++) {
			var s = response.msg[i];
			_structures[s.id] = s;
		}
		on_success();
	});
}

// Make an AJAX query to download the SVG for a section image.
function download_svg(url) {
	$("#anatomy-map #svg").load(url, function() {

		// Retrieve all paths in the SVG and add a 'title' attribute.  The
		// 'title' attribute is displayed in the jQuery UI tooltip.
		$("#anatomy-map path")
			.attr('title', function() { 
				var id = $(this).attr('structure_id');
				return _structures[id].name; 
			});

		$('#anatomy-map path').qtip();

		// When hovering over a path, add the 'hover' class, which just makes
		// the outline thicker.
		$("#anatomy-map path").hover(function() {
			console.log($(this));
			$(this).attr("class","hover")
		}, function() {
			$(this).attr("class","");
		});
		
		$("#anatomy-map path").click(function() {
			console.log("click");
			console.log($(this).attr('oldTitle'));
			// Imp TODO: Change this to work with input data
			var input_node = activeDataset.maps.name_node_map['Thalamus'];
			svgData.displayInvisibleNode(input_node);

			var node = input_node;
			var svg = svgRenderer.svg_circular;
			var maps = activeDataset.maps;
			svg.selectAll('.circular.link')
				.classed('hidden', function(d) {
					return d.source.key !== node.key && d.target.key !== node.key; 
				});
			svg.selectAll('.circular.link')
				.classed('outLink', function(d) {
					var reverted_link = maps.node_link_map[d.target.key + '-' + d.source.key];
					return d.source.key === node.key && reverted_link === undefined;
				});
			svg.selectAll('.circular.link')
				.classed('inLink', function(d) {
					var reverted_link = maps.node_link_map[d.target.key + '-' + d.source.key];
					return d.target.key === node.key && reverted_link === undefined;
				});
			svg.selectAll('.circular.link')
				.classed('biLink', function(d) {
					var reverted_link = maps.node_link_map[d.target.key + '-' + d.source.key];
					return reverted_link !== undefined;
				});
			svg.selectAll('.circular.node')
				.classed('nofocus', function(d) {
					var dKey = d.key;
					var nodeKey = node.key;
					var inNeighbors = maps.node_in_neighbor_map[nodeKey];
					var outNeighbors = maps.node_out_neighbor_map[nodeKey];
					return dKey !== nodeKey && ($.inArray(dKey, inNeighbors) < 0) &&
						($.inArray(dKey, outNeighbors) < 0);
				});    	
			svg.selectAll('.circular.text')
				.classed('visible', function(d) {
					var dKey = d.key;
					var nodeKey = node.key;
					var inNeighbors = maps.node_in_neighbor_map[nodeKey];
					var outNeighbors = maps.node_out_neighbor_map[nodeKey];
					return dKey === nodeKey || ($.inArray(dKey, inNeighbors) >= 0) ||
						($.inArray(dKey, outNeighbors) >= 0);
				});

			state.currMode = customEnum.mode.fixation;
			
		});
		
		if (tempSelPath !== null) {
			$(tempSelPath).attr('class', 'hover');
			$(tempSelPath).qtip('toggle', true);
			tempSelPath = null;			
		}
	});
}

// Make an AJAX query to download the section image and append it to the DOM.
function download_img(url) {

	var image = new Image;

	image.onload = function() {
		$("#anatomy-map #img").empty();
		$("#anatomy-map #img").append(image);
	};

	image.src = url;
}


// Splits the URL parameter string into a JavaScript hash.
function getUrlVars()
{
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

function selectStructure(title, isCancel) {
	console.log("selectStructure");
	console.log(title);
	var selPath = "path[oldtitle='" + title + "']";
	if (isCancel) {
		$(selPath).attr('class', '');
		$(selPath).qtip('toggle', false);
		selPath = null;		
		return;
	}
	
	// Get the structure id for the given title
	var id = null;
	for (var key in _structures) {
		if (_structures[key].name === title) {
			id = key;
			break;
		}
	}
	
	if (struct_img_map[id] !== curr_image_id) {
		curr_image_id = struct_img_map[id];
		tempSelPath = selPath;
		updateImages(args);
	}
	else {
		$(selPath).attr('class', 'hover');
		$(selPath).qtip('toggle', true);
	}
}

function retrieveStructImageMap() {
	        
	$.ajax({
		type: "GET",
		url: "media/php/getStructImgMap.php",
        error: function(data) {
            console.log("Failed");
            console.log(data);
        },
        success: function(data) {
           
            var temp_map = $.parseJSON(data);
            for (var i = 0; i < temp_map.length; ++i) {
            	var pair = temp_map[i];
            	struct_img_map[pair.structKey] = pair.imageKey;
            	_images[i+1] = pair.imageKey;
            }
            curr_image_key = retrieveImageKey();
             console.log("Success");
        }		
	});
}

function retrieveImageKey(){
	for(var key in _images){
		if(_images[key] == curr_image_id){
			return key;
		}
	}	
	return null;
}
function updateImages(args) {
		download_svg(format_url(SVG_DOWNLOAD_PATH, curr_image_id, args));
		download_img(format_url(IMG_DOWNLOAD_PATH, curr_image_id, args));
		
}

// When the page is read, download the structures.  When that's finished, download the SVG 
// and image.
$(function() {
	$("#anatomy-map").css("background","no-repeat center url(\"media//img/loading.gif\")");
	retrieveStructImageMap();
	
	download_structures(function() {
		$("#anatomy-map").css("background","");
		args = { downsample: DOWNSAMPLE };
		updateImages(args);
	});
	
	$('#leftArrow').on('click',  function(){
		curr_image_key = curr_image_key - 1;
		curr_image_id = _images[curr_image_key];
		$("#anatomy-map").css("background","");
		updateImages(args);
	 });
	 
	 $('#rightArrow').on('click',  function(){
		curr_image_key = curr_image_key + 1;
		curr_image_id = _images[curr_image_key];
		$("#anatomy-map").css("background","");
		updateImages(args);
	 });

		
	
});
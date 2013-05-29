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
var SECTION_IMAGE_ID = 100960224;
var DOWNSAMPLE = 5;

var urlVars = getUrlVars();
if ('id' in urlVars)
	SECTION_IMAGE_ID =  urlVars.id;
if ('downsample' in urlVars)
	DOWNSAMPLE = urlVars.downsample;

// A hash from structure id to structure meta info, which will be 
// initialized later.
var _structures = {};
var struct_img_map = {};

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
		appendStructuresAsOptions();
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
			$(this).attr("class","hover")
		}, function() {
			$(this).attr("class","");
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
		if (_structures[id].name === title) {
			id = key;
			break;
		}
	}
	
	if (struct_img_map[id] !== curr_image_id) {
		curr_image_id = struct_img_map[id];
		tempSelPath = selPath;
		updateImages();
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
            console.log("Success");
            var temp_map = $.parseJSON(data);
            for (var i = 0; i < temp_map.length; ++i) {
            	var pair = temp_map[i];
            	struct_img_map[pair.structKey] = pair.imageKey;
            }
        }		
	});
}

function updateImages() {
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
		updateImages();
	});
});
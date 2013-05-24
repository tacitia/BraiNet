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
var DOWNSAMPLE = 4;

var urlVars = getUrlVars();
if ('id' in urlVars)
	SECTION_IMAGE_ID =  urlVars.id;
if ('downsample' in urlVars)
	DOWNSAMPLE = urlVars.downsample;

// A hash from structure id to structure meta info, which will be 
// initialized later.
var _structures = {};
var struct_img_map = {};

// State variables
var prevSel = null;

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
	$("#svg").load(url, function() {

		// Retrieve all paths in the SVG and add a 'title' attribute.  The
		// 'title' attribute is displayed in the jQuery UI tooltip.
		$("path")
			.attr('title', function() { 
				var id = $(this).attr('structure_id');
				return _structures[$(this).attr('structure_id')].name; 
			});
/*			.tooltip({
				show: false,
				hide: false,
				track: true,
			});*/
		$('path').qtip();

		// When hovering over a path, add the 'hover' class, which just makes
		// the outline thicker.
		$("path").hover(function() {
			$(this).attr("class","hover")
		}, function() {
			$(this).attr("class","");
		});
	});
}

// Make an AJAX query to download the section image and append it to the DOM.
function download_img(url) {
	var image = new Image;

	image.onload = function() {
		$("#img").append(image);
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

function appendStructuresAsOptions() {
    for (var key in _structures) {
        var d = _structures[key];
        $('#structSelect').append(new Option(d.name, key, false, false));
    }
    $('.chzn-select').chosen({allow_single_deselect: true});
}

function selectStructure() {
	var id = this.value;
	var title = _structures[id].name;
	selPath = $("path[oldtitle='" + title + "']");
	selPath.attr('class', 'hover');
	selPath.qtip('toggle', true);
	if (prevSel !== null) {
		prevSel.attr('class', '');
		prevSel.qtip('toggle', false);
	}
	prevSel = selPath;
}

function retrieveStructImageMap() {
	$.ajax({
		type: "GET",
		url: "./getStructImgMap.php",
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
            console.log(struct_img_map);
        }		
	});
}

// When the page is read, download the structures.  When that's finished, download the SVG 
// and image.
$(function() {
	$("#chart").css("background","no-repeat center url(\"images/loading.gif\")");
	retrieveStructImageMap();
	download_structures(function() {
		$("#chart").css("background","");
		args = { downsample: DOWNSAMPLE };
		download_svg(format_url(SVG_DOWNLOAD_PATH, SECTION_IMAGE_ID, args));
		download_img(format_url(IMG_DOWNLOAD_PATH, SECTION_IMAGE_ID, args));
	});
});
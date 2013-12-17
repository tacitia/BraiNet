// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

util.generic = (function($, undefined) {

	// Copy the items in the src into dest, skipping duplicated items
	var copySimpleArray = function(src, dest) {
		for (var i = 0; i < src.length; ++i) {
			if ($.inArray(src[i], dest) < 0) dest.push(src[i]);
		}
	};
	
	return {
		copySimpleArray: copySimpleArray
	};

}(jQuery));
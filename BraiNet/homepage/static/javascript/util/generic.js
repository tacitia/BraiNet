// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

util.generic = (function($, undefined) {

	// Copy the items in the src into dest, skipping duplicated items
	var copySimpleArray = function(src, dest) {
		for (var i = 0; i < src.length; ++i) {
			if ($.inArray(src[i], dest) < 0) dest.push(src[i]);
		}
	};
	
	var createSortedUniqueArray = function(data, sortFunc) {
		var arr;
		// input must be sorted for this to work
		arr = data.sort(sortFunc);
		for (var i = arr.length; i--; i > -1) {
			arr[i] && arr[i-1] && arr[i].pk === arr[i-1].pk && arr.splice(i,1); // remove duplicate item
		}

		return arr;
	};
	
	return {
		copySimpleArray: copySimpleArray,
		createSortedUniqueArray: createSortedUniqueArray
	};

}(jQuery));
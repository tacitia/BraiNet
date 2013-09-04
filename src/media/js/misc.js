
(function(ce, $, undefined) {

	ce.directionType = {
		"in": 1,
		"out": 2,
		"bi": 3
	};

	ce.mode = {
		exploration: 1, //browsing
		search: 2,      //when search button is clicked
		fixation: 3     //when clicked on a node
	};

}(window.customEnum = window.customEnum || {}, jQuery));

(function(g, $, undefined) {
	/*
		This function should be used to determine if an array contains a given
		element if that object might differ slightly from the version stored in
		the array (but will still have the same key)
	*/
	g.contains = function(array, element) {
		var length = array.length;
		for (var i = 0; i < length; ++i) {
			if (element.key === array[i].key) {
				return i;
			}
		}
		return -1;
	};

	g.endsWith = function(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	};

	g.findMaxElement = function(array, key) {
		var max = 0;
		var length = array.length;
		for (var i = 0; i < length; ++i) {
			var elem = array[i][key];
			console.log(elem);
			max = (elem > max) ? elem : max;
		}
		return max;
	};

	g.getURLParams = function() {
		var params = {};
		var m = window.location.href.match(/[\\?&]([^=]+)=([^&#]*)/g);
		if (m) {
			for (var i = 0; i < m.length; i++) {
				var a = m[i].match(/.([^=]+)=(.*)/);
				params[unescapeURL(a[1])] = unescapeURL(a[2]);
			}
		}
		return params;
	};
	
	g.removeDuplicates = function(array) {
		return $.grep(array,function(el,index){
			return index == $.inArray(el,array);
		});
	};

	function unescapeURL(s) {
		return decodeURIComponent(s.replace(/\+/g, "%20"))
	}

})(window.generic = window.generic || {}, jQuery);

Array.prototype.remove = function(elem) {
    var match = -1;

    while( (match = this.indexOf(elem)) > -1 ) {
        this.splice(match, 1);
    }
};
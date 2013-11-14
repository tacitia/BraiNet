// This module indexes all the utility modules.

user.model = (function($, undefined) {

	var data = {
		id: null 
	};
	
	var id = function() {
		return id;
	};
	
	// TODO: get userId from url; if no value, fall back to use the default in settings
	var setUserId = function() {
		id = settings.userId;
	};
	
	var init = function() {
		setUserId();
	};

	return {
		init: init,
		id: id
	};

}(jQuery));

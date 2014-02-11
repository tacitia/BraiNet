// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

util.action = (function($, undefined) {

	var userId = null;
	
	var init = function(id) {
		userId = id;
	};

	// Copy the items in the src into dest, skipping duplicated items
	var add = function(name, parameters) {
		var timestamp = new Date();
		postAction({
			name: name,
			timestamp: timestamp,
			userId: userId,
			parameters: JSON.stringify(parameters)
		});
	};
	
	var postAction = function(data) {
		amplify.request('addAction',
			data,
			function(data) {
				console.log('Action tracked');
			}
		);
	};
	
	return {
		init: init,
		add: add
	};

}(jQuery));
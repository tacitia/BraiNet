// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.canvasReset = (function($, undefined) {

	var dom = {
		resetBtn: $('#resetDiv #reset')
	};

// TODO: check user module for the userId first and fall back to use default if user module does not have user inputs
	var init = function(userId) {
		dom.resetBtn.click(reset);
	};
	
	var reset = function() {
		console.log('reset button click');
		svg.circular.reset();
		svg.force.reset();
		svg.anatomy.reset();
		ui.pathSearch.reset();
	};

	return {
		init: init,
		reset: reset
	};

}(jQuery));

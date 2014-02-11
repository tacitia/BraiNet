// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.canvasReset = (function($, undefined) {

	var dom = {
		resetBtn: $('#resetDiv #reset')
	};
	
	var state = {
		reset: null,
		resetCompleted: null
	};

// TODO: check user module for the userId first and fall back to use default if user module does not have user inputs
	var init = function(userId) {
		dom.resetBtn.click(reset);
		state.reset = false;
		state.resetCompleted = 0;
	};
	
	var reset = function() {
		state.reset = true;
		ui.loadingModal.message('Resetting...');
		ui.loadingModal.show();
		setTimeout(function() {
			svg.circular.reset();
			svg.force.reset();
			svg.anatomy.reset();
			ui.pathSearch.reset();
		}, 500);
		util.action.add('reset canvas', {});
	};
	
	var resetComplete = function() {
		if (!state.reset) { return; }
		state.resetCompleted += 1;
		console.log(state.resetCompleted);
		if (state.resetCompleted === 2) {
			ui.loadingModal.hide();
			state.reset = false;
			state.resetCompleted = 0;
		}
	};

	return {
		init: init,
		reset: reset,
		resetComplete: resetComplete,
	};

}(jQuery));

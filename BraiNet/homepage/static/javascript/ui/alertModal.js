// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.alertModal = (function($, undefined) {

	var doms = {
		modal: $('#alert-modal'),
		message: $('#alert-modal #message')
	};
	
	var setting = {
	};
	
	var state = {
		message: null
	};
	
	var init = function() {
		doms.modal.modal({
			backdrop: false
		});
		doms.modal.modal('hide');
		doms.modal.on('show', function() { 
			amplify.publish('modalShow');
		})
	};
	
	var message = function(msg) {
		if (!msg) return state.message; 
		console.log('message called');
		console.log(msg);
		doms.message.text(msg);
		state.message = msg;
	};
	
	var show = function() {
		doms.modal.modal('show');
//		$('.modal-backdrop').remove();
	};
	
	var hide = function() {
//		$('.modal-backdrop').remove();
		doms.modal.modal('hide');
	};

	return {
		init: init,
		message: message,
		show: show,
		hide: hide
	};

}(jQuery));

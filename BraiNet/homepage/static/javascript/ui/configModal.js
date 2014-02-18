// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.configModal = (function($, undefined) {

	var doms = {
		modal: $('#config-modal'),
		body: $('#config-modal #option-body #option-table'),
		cancel: $('#config-modal #cancel'),
		apply: $('#config-modal #apply'),
	};
	
	var setting = {
	};
	
	var data = {
		options: {}
	};
	
	var state = {
	};
	
	
	var init = function() {
		doms.modal.modal({
			backdrop: false
		});
		doms.modal.modal('hide');
		doms.apply.click(applyOptions);
	};
	
	var applyOptions = function() {
		for (name in data.options) {
			var input = $('#' + name);
			var type = input.attr('type');
			switch (type) {
				case 'checkbox': {
					var value = input.is(':checked');
					data.options[name].callback(value);
				}
			}
			doms.modal.modal('hide');
		}
	};
	
	var addOption = function(name, content, type, callback, param) {
		console.log(type);
		switch (type) {
			case 'check': {
				var checked = param ? ' checked="checked"' : '';
				doms.body.append('<tr><td>' + content + '</td><td style="width:15%"><input id="' + name + '" type="checkbox"' + checked + '></td></tr>')
				data.options[name] = {};
				data.options[name].callback = callback;
			}	
		}
	};
		
	var show = function() {
		doms.modal.modal('show');
	};
	
	var hide = function() {
		doms.modal.modal('hide');
	};
	
	var clear = function() {
		doms.body.empty();
	};

	return {
		init: init,
		addOption: addOption,
		clear: clear,
		show: show,
		hide: hide
	};

}(jQuery));

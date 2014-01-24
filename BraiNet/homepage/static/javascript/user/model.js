// This module indexes all the utility modules.

user.model = (function($, undefined) {

	var data = {
		id: null 
	};
	
	var id = function(input) {
		if (input) {data.id === input;}
		return data.id;
	};

	var setUserId = function(userId) {	
		data.id = userId ? userId : settings.userId;
	};
	
	var init = function(userId) {
		setUserId(userId);
	};
	
	// TODO: add a real user validation function
	var validate = function() {
		amplify.request('getDatasetList',
			{
				userId: data.id,
			},
			function(data) {
				parseValidationResult($.parseJSON(data));
			}
		);
	};
	
	var parseValidationResult = function(d) {
		if (d.error === 'InvalidAccessCode') { 
			ui.alertModal.message('The access link is invalid. Will use the default datasets instead.');
			ui.alertModal.show();
			data.id = settings.userId;
		}	
		amplify.publish('userValidationComplete');
	};

	return {
		init: init,
		id: id,
		validate: validate
	};

}(jQuery));

// This module indexes all user management modules

var user = user || {};

user.model = user.model || {};

user.init = function(userId) {
	user.model.init(userId);
};

user.id = function() {
	return user.model.id();
};

user.validate = function() {
	user.model.validate();
};
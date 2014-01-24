// This module takes care of the main control logic

$(document).ready(function() {

	var accesscode = getURLParams().accesscode;
	
	user.init(accesscode);

	ui.loadingModal.init();
	ui.alertModal.init();

	user.validate();
});

function userValidated() {
	ui.datasetSelector.init(user.id());
	ui.regionSelector.init();
	ui.pathSearch.init();
	ui.canvasReset.init();
	ui.linkInfo.init();
	ui.attrSelector.init();
	
	svg.circular.init();
	svg.force.init();
	svg.anatomy.init();
	svg.linkAttr.init();
	
	svg.render(2, 6);
};

function getURLParams() {
	var params = {};
	var m = window.location.href.match(/[\\?&]([^=]+)=([^&#]*)/g);
	if (m) {
		for (var i = 0; i < m.length; i++) {
			var a = m[i].match(/.([^=]+)=(.*)/);
			params[unescapeURL(a[1])] = unescapeURL(a[2]);
		}
	}
	return params;
}

function unescapeURL(s) {
	return decodeURIComponent(s.replace(/\+/g, "%20"))
}
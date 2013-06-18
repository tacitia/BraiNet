
(function(ua, $, undefined) {
	var actionData = [];
	var generalData = [];
	var startTime = null;
	var endTime = null;
	var sessionStartTime;
	var sessionEndTime;
	var currentActionData = {timeElapsed: -1, mouseTrace: "", actionBasic: "", actionDetail: "", time: -1};
	
	var enable_piwik = false;
	var enable_owa = false;
	var enable_tracking = true;	
	
	userAction.trackAction = function(piwik, owaCategory, owaAction, owaObject, customAction, customObject) {
		if (enable_piwik) {
			piwikTracker.trackPageView(piwik);
		}
		if (enable_owa) {
			OWATracker.trackAction(owaCategory, owaAction, owaObject);
		}
		if (enable_tracking) {
			trackActionCustom(customAction, customObject);
		}
	};	
	var trackActionCustom = function(actionBasicStr, actionDetailStr) {
		currentActionData.actionBasic = actionBasicStr;
		currentActionData.actionDetail = actionDetailStr;
		endTime = new Date();
		currentActionData.timeElapsed = (endTime - startTime) / 1000;
		currentActionData.time = endTime.toString();
		recordActionData();
	};

	function recordActionData() {
		actionData.push({
			timeElapsed: currentActionData.timeElapsed,
			mouseTrace: currentActionData.mouseTrace,
			actionBasic: currentActionData.actionBasic,
			actionDetail: currentActionData.actionDetail,
			time: currentActionData.time
		});
		startTime = new Date();
		currentActionData = {timeElapsed: -1, mouseTrace: "", actionBasic: "", actionDetail: "", time: -1};
	}


	function recordMouseMovement(e) {
		if (currentActionData.mouseTrace.length > 2950) { return; }
		var currentTime = new Date();
		currentActionData.mouseTrace += "x:" + e.pageX + ",y:" + e.pageY + 
										",time:" + (currentTime - startTime) + ";";
	}

	ua.startSession = function() {
		sessionStartTime = new Date();
		startTime = new Date();
		document.onmousemove = recordMouseMovement;
	};
	
}(window.userAction = window.userAction || {}, jQuery));
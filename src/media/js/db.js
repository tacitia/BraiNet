(function(db, $, undefined) {
	var postToPhp = function(file, data, successFun, async) {
		$.ajax({
			type: "POST",
			url: "media/php/" + file,
			data: data,
			error: function(data) {
				console.log("Failed when calling " + file);
				console.log(data);
			},
			success: function(result) {
				console.log("Successfully called " + file);
				if (successFun) successFun(result);
			},
			async: async
		});	
	};
	
	var getFromPhp = function(file, successFun, async) {
		$.ajax({
			type: "GET",
			url: "media/php/" + file,
			error: function(data) {
				console.log("Failed when calling " + file);
				console.log(data);
			},
			success: function(result) {
				console.log("Successfully called " + file);
				if (successFun) successFun(result);
			},
			async: async
		});	
	};	
	
	db.createDataset = function(datasetName, userID, origDatasetID) {
		var successFun = function(datasetID) {
			$('#dataSelect').append(new Option(datasetName, datasetID));
			$('#dataSelect').trigger('liszt:updated');
			$('#createDatasetSuccessAlert').show();
		};
		postToPhp("addDataset.php",
				{datasetName: datasetName, userID: userID, isClone: false, origDatasetID: origDatasetID},
				successFun,
				true);
	};

	db.cloneDataset = function(datasetName, userID, origDatasetID) {
		var successFun = function(datasetID) {
			$('#dataSelect').append(new Option(datasetName, datasetID));
			$('#dataSelect').trigger('liszt:updated');
			$('#createDatasetSuccessAlert').show();
		};
		postToPhp("addDataset.php",
				{datasetName: datasetName, userID: userID, isClone: true, origDatasetID: origDatasetID},
				successFun,
				true);

	}	

	db.saveSessionData = function() {
		sessionEndTime = new Date();
		var sessionLength = sessionEndTime - sessionStartTime;
		sessionLength /= 1000;
		postToPhp("writeActionData.php",
				{actionDataArray : actionData, sessionLength : sessionLength, userID: uid},
				null,
				false);
	}

	db.populateUserID = function() {
		var successFun = function(result) {
			user.id = result;
			db.populateDatasets(user.id);
		};
		postToPhp('getUserID.php',
				null,
				successFun,
				true);
	}

	db.populateDatasets = function(uid) {
		var successFun = function(result) {
			dataset_list = $.parseJSON(result);
			populateDatasetUI();
		};
		postToPhp('getDatasetByUserId.php',
				{userID: uid},
				successFun,
				false);
	}



	db.getBrainData = function(datasetKey, userID) {
		var successFun = function(result) {
			var data = $.parseJSON(result);
			dataModel.constructDataModel(datasetKey, data.nodes, data.links, data.diff_nodes, data.diff_links);
			activeDataset.maps = user.datasets[datasetKey];
			searchUI.updateOptions();
			svgRenderer.renderData(datasetKey);
		};
		postToPhp('getBrainData.php',
				{datasetKey: datasetKey, userID: userID}, 
				successFun,
				true);
	}

	db.getBrodmannAreas = function() {
		var successFun = function(result) {
			var data = $.parseJSON(result);
			constructBrodmannMap(data);
		};
		getFromPhp('getBrodmannAreas.php',
				successFun,
				true);
	}

	db.updateLink = function(linkKey, notes) {
		postToPhp("updateBrainLink.php",
				{linkKey: linkKey, userID: datasetProperties.userID, notes: notes, isClone: datasetProperties.isClone, origin: datasetProperties.origin},
				null,
				true);
	};
	
}(window.database = window.database || {}, jQuery));
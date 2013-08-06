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
			var dataset = {
				key: datasetID,
				name: datasetName,
				isClone: 1,
				isCustom: 0,
				origin: origDatasetID				
			};
			user.addDataset(dataset);
		};
		postToPhp("addDataset.php",
				{datasetName: datasetName, userID: userID, isClone: 1, origDatasetID: origDatasetID},
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
			var datasetList = $.parseJSON(result);
			for (var i = 0; i < datasetList.length; ++i) {
				var dataset = datasetList[i];
				user.datasetList[dataset.key] = dataset;
			}
			datasetManager.populateDatasetUI();
		};
		postToPhp('getDatasetByUserId.php',
				{userID: uid},
				successFun,
				false);
	}

	db.getBrainData = function(datasetKey, userID) {
		var successFun = function(result) {
			var data = $.parseJSON(result);
			console.log(data);
			dataModel.constructDataModel(datasetKey, data);
			activeDataset.switchActiveDataset(datasetKey);
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
				{linkKey: linkKey, userID: user.id, notes: notes, isClone: activeDataset.isClone, origin: activeDataset.origin},
				null,
				true);
	};
	
	db.addBrainNode = function(nodeData) {
		var successFun = function(result) {
			if (parseInt(result) === 1062) {
				alert("Cannot add node: a node with the same name already exists in the dataset."); }
			else {
				try {
					var node = $.parseJSON(result);
				} catch(e) {
					console.log(e);
					alert("Cannot add node: unknown database error occurred during node insertion.");
					return;
				}
				var maps = activeDataset.maps;
				dataModel.addNode(node, maps.node_map, maps.name_node_map, maps.node_in_neighbor_map, maps.node_out_neighbor_map);
				alert("New brain region added.");
			}
		};
		postToPhp("addBrainNode.php",
						nodeData,
						successFun,
						false);	
	};

	db.addBrainLink = function(linkData) {
		var successFun = function(result) {
			var link = $.parseJSON(result);
			var maps = activeDataset.maps;
			dataModel.addLink(link, maps.link_map, maps.node_link_map, maps.node_in_neighbor_map, maps.node_out_neighbor_map, maps.node_map, maps.link_paper_map);
		};
		postToPhp("addBrainLink.php",
						linkData,
						successFun,
						false
						);	
	};

}(window.database = window.database || {}, jQuery));
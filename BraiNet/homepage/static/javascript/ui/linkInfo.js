// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.linkInfo = (function($, undefined) {

	var dom = {
		srcName: '#conn-info #src-name',
		tgtName: '#conn-info #tgt-name',
		paperContainer: '#conn-details #paper-list',
		recordContainer: '#conn-details #origin-list',
		leavesContainer: '#conn-details #sub-con-list',
		notesDiv: '#conn-notes',
		notesDisplay: '#conn-notes #conn-note-display',
		notesInput: '#conn-notes #conn-note-input',
		editButton: '#conn-notes #conn-note-edit',
		saveButton: '#conn-notes #conn-note-save',
		noNoteMsg: '#conn-notes #no-note-msg'
	};
	
	var state = {
		mode: null,
		selectedLink: null
	};

	var init = function(userId) {
		state.mode = 'display';
	};

	function switchMode(mode) {
		switch (mode) {
			case "edit":
				$(dom.notesDisplay).addClass('removed');
				$(dom.dom.notesInput).removeClass('removed');
				$(dom.saveButton).removeClass('removed');
				break;				
			case "display":
				$(dom.notesDisplay).removeClass('removed');
				$(dom.notesInput).addClass('removed');
				$(dom.saveButton).addClass('removed');
				break;
		}	
	}
	
	var displayLinkInfo = function(link) {
		state.selectedLink = link;
		displayMetadata(link);
//		displayNotes();
		switchMode('display');
//		displayPublications();
		displayOriginRecords();
		displayLinkChildren();
	};

	var displayMetadata = function(link) {
		$(dom.srcName).text('Source: ' + link.derived.source.fields.name);
		$(dom.tgtName).text('Target: ' + link.derived.target.fields.name);
		$(dom.notesDisplay).text('No notes found.');
	};
	
	var displayNotes = function() {
		if (!(activeDataset.isClone || activeDataset.isCustom)) {
			$(dom.noNoteMsg).removeClass('removed');
			$(dom.notesDiv).addClass('removed');
			$(dom.noNoteMsg).text('Cannot add notes for public datasets. Please clone and select a personal copy using "Manage Data" panel to add notes.');
		}
		else if (cl.link.isDerived) {
			$(dom.noNoteMsg).removeClass('removed');
			$(dom.notesDiv).addClass('removed');
			$(dom.noNoteMsg).text('Cannot edit derived connections. Please add notes directly to a sub-connection.');
		}	
		else {
			$(dom.noNoteMsg).addClass('removed');
			$(dom.notesDiv).removeClass('removed');
			$(dom.notesDisplay).text(cl.link.notes === null ? "No notes found." : cl.link.notes);
		}
	};
	
	var displayOriginRecords = function() {
		d3.select(dom.recordContainer).selectAll('div').remove();
		var content = d3.select(dom.recordContainer).append('div');
		var contentHtml = '<p>Connection statistics:</p>';
		contentHtml += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle">';
		var maps = svg.model.maps();
		var attrKeys = [];
		var avgs = {};
		if (state.selectedLink.derived.isDerived) {
			var leaves = state.selectedLink.derived.leaves;
			var attributes = maps.keyToLink[leaves[0]].fields.attributes;
			for (var key in attributes) {
				attrKeys.push(key);
				avgs[key] = [];
			}
			for (i in leaves) {
				var subLink = maps.keyToLink[leaves[i]];
				for (var key in attributes) {
					$.merge(avgs[key], subLink.fields.attributes[key]);
				}
			}
		}
		else {
			var attributes = state.selectedLink.fields.attributes;
			for (var key in attributes) {
				attrKeys.push(key);
				avgs[key] = $.merge([], attributes[key]);
			} 
		}
		
		for (var i in attrKeys) {
			contentHtml += '<td>';
			contentHtml += attrKeys[i];
			contentHtml += '</td>';
		}
		contentHtml += '</tr>';
		contentHtml += '<tr>'
		for (var key in attributes) {
			contentHtml += '<td>';
			var avg = 0;
			for (var i in avgs[key]) {
				avg += avgs[key][i];
			}
			avg /= avgs[key].length;
			contentHtml += avg;
			contentHtml += '</td>';
		}
		contentHtml += '</tr>';
		content.html(contentHtml);
	};

	var displayLinkChildren = function() {
		d3.select(dom.leavesContainer).selectAll('div').remove();
		d3.select(dom.leavesContainer).selectAll('p').remove();
		var content = d3.select(dom.leavesContainer).append('div');
		var maps = svg.model.maps();
		var contentHtml = '<p>Children links:</p>';
		contentHtml += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Notes</td></tr>';
		var numLeaves = state.selectedLink.derived.leaves.length;
		for (var i = 0; i < numLeaves; ++i) {
			var child = maps.keyToLink[state.selectedLink.derived.leaves[i]];
			contentHtml += '<tr class="childRow" id="childRow-' + i + '"><td>' + child.derived.source.fields.name + '</td><td>' + child.derived.target.fields.name +
				'</td><td>' + ' ' + '</td></tr>';
		}
		contentHtml += '</table>';
		content.html(contentHtml);
		
		d3.selectAll('.childRow').on('click', childLinkClick);
	}

	var childLinkClick = function() {
		var id = $(this).attr('id');
		var id_num = id.substring(9);
		var maps = svg.model.maps();
		//console.log(id_num);
		//console.log(cl.link.base_children);
		var childLink = maps.keyToLink[state.selectedLink.derived.leaves[id_num]];
		displayLinkInfo(childLink);
	}

	return {
		init: init,
		displayLinkInfo: displayLinkInfo
	};

}(jQuery));

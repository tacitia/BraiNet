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
		noNoteMsg: '#conn-info #no-note-msg',
	};
	
	var state = {
		mode: null,
		selectedLink: null
	};

	var init = function() {
		state.mode = 'display';
		$(dom.editButton).click(editNotes);
		$(dom.saveButton).click(saveNotes);
	};

	function switchMode(mode) {
		switch (mode) {
			case "edit":
				$(dom.notesDisplay).addClass('removed');
				$(dom.notesInput).removeClass('removed');
				$(dom.saveButton).removeClass('removed');
				break;				
			case "display":
				$(dom.notesDisplay).removeClass('removed');
				$(dom.notesInput).addClass('removed');
				$(dom.saveButton).addClass('removed');
				break;
		}	
	}

	var editNotes = function() {
		switchMode('edit');
		util.action.add('edit link notes', {
			linkSource: state.selectedLink.derived.source.fields.name, 
			linkTarget: state.selectedLink.derived.target.fields.name
		});
	};
	
	var saveNotes = function() {
		var notes = $(dom.notesInput).val();
		state.selectedLink.derived.notes = notes;
		switchMode('display');
		$(dom.notesDisplay).text(notes);
		svg.model.addConnNote(state.selectedLink.pk, notes);
		util.action.add('save link notes', {
			linkSource: state.selectedLink.derived.source.fields.name, 
			linkTarget: state.selectedLink.derived.target.fields.name
		});
	};
	
	var displayLinkInfo = function(link, leaves) {
		state.selectedLink = link;
		displayMetadata(link);
		displayNotes();
		switchMode('display');
		displayPubMedInfo();
		displayOriginRecords(leaves);
		displayLinkChildren(leaves);
	};
	

	var displayMetadata = function(link) {
		$(dom.srcName).text('Source: ' + link.derived.source.fields.name);
		$(dom.tgtName).text('Target: ' + link.derived.target.fields.name);
		$(dom.notesDisplay).text('No notes found.');
	};
	
	var displayNotes = function() {
		console.log('displayNotes');
		if (state.selectedLink.derived.isDerived) {
			$(dom.noNoteMsg).removeClass('removed');
			$(dom.notesDiv).addClass('removed');
			$(dom.noNoteMsg).text('Notes: Cannot edit derived connections. Please add notes directly to a sub-connection.');
		}	
		else {
			$(dom.noNoteMsg).addClass('removed');
			$(dom.notesDiv).removeClass('removed');
			console.log(state.selectedLink.derived.note);
			$(dom.notesDisplay).text(state.selectedLink.derived.note === undefined ? "No notes found." : state.selectedLink.derived.note);
		}
	};

	var displayOriginRecords = function(leaves) {
		d3.select(dom.recordContainer).selectAll('div').remove();
		var content = d3.select(dom.recordContainer).append('div');
		var contentHtml = '<p>Connection statistics:</p>';
		contentHtml += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle">';
		var maps = svg.model.maps();
		var attrKeys = [];
		var avgs = {};
		var attributes = state.selectedLink.fields.attributes;
		for (var key in attributes) {
			attrKeys.push(key);
		}
        if (state.selectedLink.derived.isDerived) {
            contentHtml += '<tr><td></td><td>Mean</td><td>Median</td><td>Standard deviation</td></tr>'
            for (var i in attrKeys) {
                contentHtml += '<tr><td>' + attrKeys[i] + '</td><td>';
                contentHtml += state.selectedLink.fields.attributes[attrKeys[i]].mean;
                contentHtml += '</td><td>';
                contentHtml += state.selectedLink.fields.attributes[attrKeys[i]].median;
                contentHtml += '</td><td>';
                contentHtml += state.selectedLink.fields.attributes[attrKeys[i]].sd;
                contentHtml += '</td></tr>';
            }
        }
        else {
            contentHtml += '<tr>';
            for (var i in attrKeys) {
                contentHtml += '<td>';
                contentHtml += attrKeys[i];
                contentHtml += '</td>';
            }
            contentHtml += '</tr><tr>';
            for (var i in attrKeys) {
                contentHtml += '<td>';
                contentHtml += state.selectedLink.fields.attributes[attrKeys[i]];
                contentHtml += '</td>';
            }
            contentHtml += '</tr>';
        }
		content.html(contentHtml);
	};
	
	
	/* Deprecated */
	/*
	var displayOriginRecords = function() {
		d3.select(dom.recordContainer).selectAll('div').remove();
		var content = d3.select(dom.recordContainer).append('div');
		var contentHtml = '<p>Connection statistics:</p>';
		contentHtml += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle">';
		var maps = svg.model.maps();
		var attrKeys = [];
		var avgs = {};
		var attributes = null;
		if (state.selectedLink.derived.isDerived) {
			var leaves = state.selectedLink.derived.leaves;
			attributes = maps.keyToLink[leaves[0]].fields.attributes;
			for (var key in attributes) {
				attrKeys.push(key);
				avgs[key] = [];
			}
			for (i in leaves) {
				var subLink = maps.keyToLink[leaves[i]];
				for (var key in attributes) {
					avgs[key].push(subLink.fields.attributes[key]);
				}
			}
		}
		else {
			attributes = state.selectedLink.fields.attributes;
			for (var key in attributes) {
				attrKeys.push(key);
				avgs[key] = [attributes[key]];
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
			if (isNaN(attributes[key])) {
				contentHtml += state.selectedLink.derived.isDerived ? 'N/A' : attributes[key];
			}
			else {
				var avg = 0;
				for (var i in avgs[key]) {
					avg += avgs[key][i];
				}
				avg /= avgs[key].length;
				contentHtml += avg;
			}
			contentHtml += '</td>';
		}
		contentHtml += '</tr>';
		content.html(contentHtml);
	};
	*/
	
	var displayPubMedInfo = function() {
		// Clear previous contents and initialize new contents
		d3.select(dom.paperContainer).selectAll('div').remove();
		var content = d3.select(dom.paperContainer).append('div');

		// Add a link to PubMed
		var contentHtml = '<p>PubMed links:</p>';
		var searchTerm = state.selectedLink.derived.source.fields.name + '+' + state.selectedLink.derived.target.fields.name + '+projection';
		searchTerm.replace(' ', '+');
		contentHtml += '<a target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed?term=' +
			searchTerm + 
			'">Access publication search result page on PubMed</a>';
		
		// Display the button for add new publications
		contentHtml += '<div><button class="btn right-align" title="Suggest a publication for this connection"><i class="icon-plus"></i></button></div>'
		
		// Display publications added by other users
		var publicPubRecords = [];
		contentHtml += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Publication</td><td>Contributor</td></tr>';
		for (var i in publicPubRecords) {
			contentHtml += '<tr>';
			if (publicRecords.link !== undefined) {
				contentHtml += '<td><a target="_blank" href="' + publicRecords.link + '">' + publicPubRecords.title + '</td>'
			}
			else {
				contentHtml += '<td>' + publicRecords.title + '</td>';
			}
			contentHtml += '<td>' + publicRecords.contributor + '</td>';			
			contentHtml += '</tr>';
		}
		if (publicPubRecords.length === 0) {
			contentHtml += '<tr><td><i>No user tagged publications found.</i></td></tr>';
		}
		contentHtml += '</table>';
		

		// Update the div
		content.html(contentHtml);
	};


	var displayLinkChildren = function(leaves) {
		d3.select(dom.leavesContainer).selectAll('div').remove();
		d3.select(dom.leavesContainer).selectAll('p').remove();
		var content = d3.select(dom.leavesContainer).append('div');
		var maps = svg.model.maps();

		if (!leaves) { // There is no leaves for, well, leaf links
           content.html('<p>This is an actual connection record with no sub-connections.</p>');
            return;
        }

        var contentHtml = '<p>Children links:</p>';
        contentHtml += '<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Notes</td></tr>';
        var numLeaves = leaves.length;
		for (var i = 0; i < numLeaves; ++i) {
			var l = leaves[i];
			var source = l.derived.source;
			var target = l.derived.target;
			contentHtml += '<tr class="childRow" id="childRow-' + i + '"><td>' + source.fields.name + '</td><td>' + target.fields.name +
				'</td><td>' + ' ' + '</td></tr>';
		}
		contentHtml += '</table>';
		content.html(contentHtml);
		
		d3.selectAll('.childRow').on('click', childLinkClick);
	}

	/*
	 * Deprecated
	 */
	/*	var displayLinkChildren = function(leaves) {
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
	} */

	var childLinkClick = function() {
		var id = $(this).attr('id');
		var id_num = id.substring(9);
		var maps = svg.model.maps();
		//console.log(id_num);
		//console.log(cl.link.base_children);
		var childLink = maps.keyToLink[state.selectedLink.derived.leaves[id_num]];
		displayLinkInfo(childLink, null);
		util.action.add('click child link', {
			linkSource: childLink.derived.source.fields.name, 
			linkTarget: childLink.derived.target.fields.name
		});
	}

	return {
		init: init,
		displayLinkInfo: displayLinkInfo
	};

}(jQuery));

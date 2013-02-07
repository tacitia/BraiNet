function appendNodesAsOptions(node_map) {
    //console.log(node_map);
    for (var key in node_map) {
        var d = node_map[key];
        $('#sourceSelect').append(new Option(d.name, key, false, false));
        $('#targetSelect').append(new Option(d.name, key, false, false));
    }
}

function populateDatasetUI() {
    console.log("testing user id");
    console.log(uid);
    var num_datasets = dataset_list.length;
    for (var i = 0; i < num_datasets; ++i) {
        var curr_dataset = dataset_list[i];
        console.log(curr_dataset);
        $('#dataSelect').append(new Option(curr_dataset[1], curr_dataset[0]));
    }
}

/*
 * 1. Get the dataset name
 * 2. Call the corresponding backend function
 */
function createDatasetButtonClick() {
    createDataset($('[name="datasetName"]').val(), uid);
}

/*
 * 
 */
function manageDatasetButtonClick() {
    var datasetName = $('#dataSelect :selected').text();
    var datasetID = $('#dataSelect').val();
    var url = "media/php/manageDataset.php?datasetName=" + datasetName + 
                "&datasetID=" + datasetID;
    window.open(url, 'Manage Datasets', 'width=800, height=800');
}

/*
 * 1. Get the name of the selected dataset
 * 2. Get the content of the selected dataset
 * 3. Construct local maps for the selected dataset
 * 4. Update the visualization [TODO]
 */
function applyDatasetButtonClick() {
    var datasetID = parseInt($('#dataSelect').val());
    if (user_datasets[datasetID] === undefined) {
	    getBrainData(datasetID);
    }
    else {
    }
}

function searchButtonClick() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Search:' + selected_source.name + '-' + selected_target.name);
    }
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Search', selected_source.name + '-' + selected_target.name);
    }
    if (enable_tracking) {
        trackAction("Search", selected_source.name + '-' + selected_target.name);
/*        currentActionData.actionBasic = "Search";
        currentActionData.actionDetail = selected_source.name + '-' + selected_target.name;
        endTime = new Date();
        currentActionData.timeElapsed = (endTime - startTime) / 1000;
        currentActionData.time = endTime.toString();
        recordActionData();*/
    }
    var paths = calculatePaths(max_hop);
    populateForceElements(paths);
    updateForceLayout();
}

function clearButtonClick() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Click clear button');
    }
}

/* TODO: Also need to handle the case that the input is the parent of some of the 
 * active nodes
 */
function sourceSearchInput() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Set search source');
    }
    
    // If there exists an old selected_source, reset its status
    if (selected_source != undefined) {
        selected_source.fixed = false;
        highlightNode(selected_source, "focus", false, true, svg_circular);
        clearSearchResult();
    }
    var input_key = this.value;
    var input_node = node_map[input_key];
    selected_source = input_node;
    if (!input_node.isActive) {
        var parent = findActiveParent(input_node);
        // In this case, the input is on a level higher than the visible nodes
        if (parent === undefined) {
            var activeDescs = findActiveDescends(input_node);
            combineRegions(input_node, activeDescs);
        }
        else {
            var siblings = findDescAtDepth(parent, input_node.depth);
            expandRegion(parent, siblings, svg_circular);
        }
    }
    highlightNode(input_node, "focus", true, true, svg_circular);
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Set source', selected_source.name);
    }
    if (enable_tracking) {
        trackAction('Set source', selected_source.name);
    }
}

function targetSearchInput() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Set search target');
    }
    
    if (selected_target != undefined) {
        selected_target.fixed = false;
        highlightNode(selected_target, "focus", false, true, svg_circular);
        clearSearchResult();
    }
    var input_key = this.value;
    var input_node = node_map[input_key];
    selected_target = input_node;
    if (!input_node.isActive) {
        var parent = findActiveParent(input_node);
        // In this case, the input is on a level higher than the visible nodes
        if (parent === undefined) {
            var activeDescs = findActiveDescends(input_node);
            combineRegions(input_node, activeDescs);
        }
        else {
            var siblings = findDescAtDepth(parent, input_node.depth);
            expandRegion(parent, siblings, svg_circular);
        }
    }
    highlightNode(input_node, "focus", true, true, svg_circular);
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Set target', selected_target.name);
    }
    if (enable_tracking) {
        trackAction('Set target', selected_target.name);
    }
}

function clearSearchResult() {

}

function setMaxHop() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Set max hop');
    }
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Set max hop', this.value);
    }
    if (enable_tracking) {
        trackAction('Set max hop', this.value);
    }    
    max_hop = this.value;
    document.getElementById("maxHopValue").innerHTML = max_hop;

}

function displayConnectionInfo(d) {
    d3.selectAll('#conn-info .exp').remove();
    d3.select('#conn-info #src-name')
        .html('Source: ' + d.source.name);
    d3.select('#conn-info #tgt-name')
        .html('Target: ' + d.target.name);

    // Add the list of papers 
    var paperKeys = d.paper;
    var self_paper_tab = d3.select('#paper-list');
    self_paper_tab.selectAll('p').remove();
    var content = self_paper_tab.append('p');
    // Add the list of papers associated
    if (paperKeys.length < 1) {
        content.html('This is a meta link. See the derived connections for more information');
    }
    else {
        content.selectAll('p').data(paperKeys)
            .enter()
            .append('p')
            .html(function(d) { 
                var paper = paper_map[d];
                return '<a href="' +  paper.url + '" target="_blank" class="paperLink">' + paper.title + '</a>'; 
            });
        d3.selectAll('.paperLink').on('click', paperClick);
    }

    // Add the list of dataset-specific records
    var bams_records_tab = d3.select('#bams-list');
    bams_records_tab.selectAll('p').remove();
    content = bams_records_tab.append('p');
    content.html('Links to BAMS records will be added in future updates');

    // Add the sub-connections
    var sub_link_keys = d.children;
    var subcon_tab = d3.select('#sub-con-list');
    subcon_tab.selectAll('p').remove();
    content = subcon_tab.append('p');
    if (sub_link_keys.length < 1) {
        content.html('There are no sub-connections for this link.');
    }
    else {
        content.selectAll('p').data(sub_link_keys)
            .enter()
            .append('p')
            .html(function(d) {
                var sub_link = link_map[d];
                return 'Source: ' + sub_link.source.name + '; Target: ' + sub_link.target.name;
            })
    }
}


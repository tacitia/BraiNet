function appendNodesAsOptions(node_map) {
    //console.log(node_map);
    for (var key in node_map) {
        var d = node_map[key];
        $('#sourceSelect').append(new Option(d.name, key, false, false));
        $('#targetSelect').append(new Option(d.name, key, false, false));
    }
}

function searchButtonClick() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Search:' + selected_source.name + '-' + selected_target.name);
    }
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Search', selected_source.name + '-' + selected_target.name);
    }
    console.log(max_hop);
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
        var siblings = findDescAtDepth(parent, input_node.depth);
        expandRegion(parent, siblings, svg_circular);
    }
    highlightNode(input_node, "focus", true, true, svg_circular);
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Set source', selected_source.name);
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
        var siblings = findDescAtDepth(parent, input_node.depth);
        expandRegion(parent, siblings, svg_circular);
    }
    highlightNode(input_node, "focus", true, true, svg_circular);
    if (enable_owa) {
        OWATracker.trackAction('UI', 'Set target', selected_target.name);
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
    
    max_hop = this.value;
    document.getElementById("maxHopValue").innerHTML = max_hop;
//    path.classed("dimmed", false);
//    highlightSelectedLinks(false);
//    selected_links = [];
    //displayConnections(false);
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
    if (paperKeys.length < 1) {
        content.html('This is a meta link. See the derived connections for more information');
    }
    else {
        content.selectAll('p').data(paperKeys)
            .enter()
            .append('p')
            .html(function(d) { 
                var paper = paper_map[d];
                return '<a href="' +  paper.url + '" target="_blank">' + paper.title + '</a>'; 
            });
    }

    // Add the list of dataset-specific records
    var bams_records_tab = d3.select('#bams-list');
    bams_records_tab.selectAll('p').remove();
    content = bams_records_tab.append('p');
    content.html('Links to BAMS records will be added in future updates');

    console.log(d);
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


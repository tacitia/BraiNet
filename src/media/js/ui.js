function appendNodesAsOptions(node_map) {
    //console.log(node_map);
    for (var key in node_map) {
        var d = node_map[key];
        $('#sourceSelect').append(new Option(d.name, key, false, false));
        $('#targetSelect').append(new Option(d.name, key, false, false));
    }
}

function searchButtonClick() {
    var num_hop = 1;
    var paths = calculatePaths(num_hop);
    populateForceElements(paths);
    updateForceLayout();
}

function clearButtonClick() {

}

function sourceSearchInput() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Set source for search');
    }

    if (selected_source != undefined) {
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
}

function targetSearchInput() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Set source for search');
    }

    if (selected_target != undefined) {
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
}

function clearSearchResult() {

}

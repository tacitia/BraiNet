function appendNodesAsOptions(node_map) {
    console.log(node_map);
    for (var key in node_map) {
        var d = node_map[key];
        $('#sourceSelect').append(new Option(d.name, d.name, false, false));
        $('#targetSelect').append(new Option(d.name, d.name, false, false));        
    }
}

function searchButtonClick() {
}

function clearButtonClick() {

}

function sourceSearchInput() {
    if (enable_piwik) {
        piwikTracker.trackPageView('Set source for search');
    }

    /*
    if (selected_source != undefined) {
        highlightNode(selected_source, "selected-source", false, true);
        clearSearchResult();
        if (selected_local_node_1 !== null) { 
            svg.select("#arc-" + selected_local_node_1.key).classed("search-selected", false);
            selected_local_node_1 = null;
        }
        if (selected_local_node_2 !== null) { 
            svg.select("#arc-" + selected_local_node_2.key).classed("search-selected", false);
            selected_local_node_2 = null;
        }
    }
    var input_region = this.value.toLowerCase();
    // TODO: Highlight the search item. If the item is currently invisible, need to 
    // be able to expand it
    var num_elem = active_data_nodes.length;
    for (var i = 0; i < num_elem; ++i) {
        var d = active_data_nodes[i];
        if (d.name === input_region) {
            selected_source = d.node;
            highlightNode(d.node, "selected-source", true, true);
        }
    }
    */
}

function targetSearchInput() {
}

function clearSearchResult() {

}

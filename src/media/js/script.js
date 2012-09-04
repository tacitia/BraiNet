/**
 * script.js
 *
 * Brain Circus
 * Heirararchical Edge Bundles
 *
 * Authors: Hua & Arthur
 *
 */

/*global brainMap: false, rx, ry */

"use strict";

// Display parameters
var w = 800,
    h = 800,
    rotate = 0,
    radius = Math.min(w, h) / 2.7;

// Graph elements
var nodes,
    path,
    splines, //used to set the tension
    tooltips;

var cluster = d3.layout.cluster()
    .size([360, radius - 100])
    .sort(null)
    .value(function (d) { return d.size; });

var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function (d) { return 1; });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(0.85)
    .radius(function (d) { return d.y; })
    .angle(function (d) {
        return (d.x) * (Math.PI / 180);
    });

var zoom = d3.behavior.zoom()
    .scaleExtent([0.8, 3])
    .on("zoom", redraw);

var svg = d3.select("#canvas")
    .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "0 0 " + w + " " + h)
    .append('g')
      .attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")")
      .call(zoom)
    .append('g');

//background for zoom
svg.append('rect')
    .attr('width', w)
    .attr('height', h)
    .attr('fill', 'white')
    .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");


//TODO: remove max depth
var max_hop = 1,
    max_depth = 8;

//TODO: [arthur] convert this to a html tag with the name of node
var highlight_text = svg.append("text").attr("id", "highlight_text").attr("x", -400).attr("y", 350).text("");

// USER STUDY
// User goal state variables
var taskType = {
    interLink: 1,
    actualLink: 2,
    ref: 3
};
var task = {
    type: null,
    object: null
};
var previousTask;
var externalWorkingTime = [];
var startTime;
var endTime;

//Legend
var legend = d3.select("#legend-feature")
            .append("svg")
            .attr("width", "350px")
            .attr("height", "100px")
            .append("g");

for (var i = 0; i < 4; ++i) {
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 50)
        .attr('y1', 10 + i * 20)
        .attr('y2', 10 + i * 20)
        .attr('class', 'q' + i + '-4');

    legend.append('text')
        .attr('x', 75)
        .attr('y', 15 + i * 20)
        .attr('id', 'color' + i)
        .text("TBD");
}

// Possible visualization interaction state
var mode = {
    exploration: 1, //browsing
    search: 2,      //when search button is clicked
    fixation: 3     //when clicked on a node
};

// State variables
var current_mode = mode.exploration,
    selected_source,
    selected_target,
    selected_singleNode = null,
    selected_links = [],
    grouped_selected_links = [],
    selected_nodes = [],
    old_focused_source = null,
    old_focused_target = null,
    interParents = [],
    interLinks = [];

// Map containing node data and information
var con_map,
    display_node_map,
    name_node_map;

//TODO: [HUA] simplified search mode graph
var local_vis = d3.select("#localCon").append("svg").attr("width", 300).attr("height", 300).attr("id", "localConVisual");

//defines properties for the edge color
var attrRange = {};

//TODO: [arthur] change font size on resize
// Redraws on zoom change
function redraw() {
    svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    //if (d3.event.sourceEvent.type !== "mousemove") {
        //tooltips.selectAll(".text").style("font-size", (10 / d3.event.scale));
        //tooltips.selectAll(".tooltip").attr("d", function (d) {
            //var text = svg.select("#text-" + d.key)[0][0],
            //w = text.scrollWidth,
            //h = text.scrollHeight;
            //return tooltip(w, h);
        //});
    //}
}

//Defines svg path for tooltip
var tooltip_path = function (w, h) {
    return "M 0 0 L 10 -5 L 20 " + -h + " L " + (w + 55) + " " + -h + " L " +
    (w + 55) + " " + h + " L 20 " + h + " L 10 5 Z";
};


////////////////////////////////////////////////////////////////////////////////
// Draw Bundle
////////////////////////////////////////////////////////////////////////////////


d3.json("../media/data/bamsBrainDataSimp.json", function (data) {

    var nodes_for_link,
        links_visible,
        links,
        node,
        arc;

    var data_for_link = [];
    for (var i = 0; i < data.length; i++) {
        data_for_link[i] = Object.create(data[i]);
    }

    nodes = cluster.nodes(brainMap.root(data));
    nodes_for_link = cluster.nodes(brainMap.root(data_for_link));

    nodes = partition.nodes(brainMap.root(data));
    nodes = nodes.filter(filterRoot);

    node = svg.selectAll("path.link")
      .data(nodes)
      .enter();

    //con_map = brainMap.evidence(nodes);
    name_node_map = brainMap.nameNodeMap(nodes);
    display_node_map = brainMap.displayNameNodeMap(nodes);

    for (i = 0; i < nodes.length; i++) {
        var d = nodes[i];
        d.px = d.x;
        d.py = d.y;
        d.x = (d.px + d.dx / 2) * 180 / Math.PI;
        d.y = Math.sqrt(d.py + (radius * radius) - d.dy * (d.depth - 2) * 2 + d.dy / 2);
    }

    links = brainMap.connections(nodes);
    links_visible = brainMap.connections(nodes_for_link);
    splines = bundle(links_visible, links);

    arc = d3.svg.arc()
        .innerRadius(function (d) {
            return Math.sqrt(d.py + (radius * radius) - d.dy * (d.depth - 2) * 2);
        })
        .outerRadius(function (d) {
            return Math.sqrt(d.py + (radius * radius) - d.dy * (d.depth - 2) * 2 + d.dy);

        })
        .startAngle(function (d) {
            return d.px;

        })
        .endAngle(function (d) {
            return d.px + d.dx;
        });

    //
    // Connections
    //
    path = svg.selectAll("path.link")
        .data(links)
        .enter()
        .append("svg:path")
        .attr("class", function (d) {
            return (d.bi === false) ?
                "link source-" + d.source.key +
                " target-" + d.target.key :
                "link bi-" + d.source.key +
                " bi-" + d.target.key;
        })
        .attr("d", function (d, i) { return line(splines[i]); })
        .on("mouseover", linkMouseOver)
        .on("mouseout", linkMouseOut)
        .on("click", function (d) { linkClick(d, 0); });

    //
    // Set UI input options
    //
    computeAttrRange(attrRange, links);
    appendAttrsAsOptions(links);
    appendNodesAsOptions(nodes);
    $('.chzn-select').chosen({allow_single_deselect: true});


    //
    // Arcs
    //
    node.append("svg:path")
        .attr("d", arc)
        .attr("id", function (d) { return "arc-" + d.key; })
        .attr("class", "arc")
        .attr("fill", "white")
        .attr("stroke", "white")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .on("click", nodeClick);

    tooltips = svg.selectAll("tooltext")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "tooltext");

    //text
    tooltips.append("text")
        .attr("id", function (d) { return "text-" + d.key; })
        .attr("class", function (d) {
            return (d.depth === 2 ? "text visible" : "text");
        })
        .attr("dy", ".31em")
        .attr("dx", function (d) { return d.x < 180 ? 35 : -35; })
        .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function (d) {
            var trans = "translate(" + arc.outerCenter(d) + ")",
                rotation = (d.x < 180 ? "rotate(" + (d.x - 90) + ")" : "rotate(" + (d.x + 90) + ")");
            return trans + rotation;
        })
        .text(function (d) { return d.displayName; });

    //tooltip
    tooltips.insert("path", "text")
        .attr("id", function (d) { return "tooltip-" + d.key; })
        .attr("class", "tooltip hidden")
        .attr("d", function (d) {
            var text = svg.select("#text-" + d.key)[0][0],
                w = text.scrollWidth,
                h = text.scrollHeight;
            return tooltip_path(w, h);
        })
        .attr("transform", function (d) { return "translate(" + arc.outerCenter(d) + ")rotate(" + (d.x - 90) + ")"; });
});




////////////////////////////////////////////////////////////////////////////////
// Mouse & Click Events
////////////////////////////////////////////////////////////////////////////////


d3.select("#bt-search")
    .on("click", searchButtonClick);

d3.select("#bt-clear")
    .on("click", clearButtonClick);

d3.select("#maxHop")
    .on("change", setMaxHop);

d3.select("#maxDepth")
    .on("change", setMaxDepth);

d3.select("#tension")
    .on("change", setTension);

//TODO: convert to D3 selector if possible
$('#sourceSelect').change(sourceSearchInput);
$('#targetSelect').change(targetSearchInput);
$('#attrSelect').change(attrSearchInput);
$(window).focus(windowGainsFocus);
$(window).blur(windowLosesFocus);

/* USER STUDY
 * When the window gains focus:
 * 1) End the citation count timer and records its value
 * 2) Highlight the trigger for the next task
 *
 */
function windowGainsFocus() {
    console.log("windowGainsFocus");
}

/* USER STUDY
 * When the window loses focus:
 * 1) Start a citation count timer to record the time it takes for the user to check the citation count for a single reference
 * 2) Record the next task
 *
 */
function windowLosesFocus() {
    console.log("windowLosesFocus");
}

/*
 * Mouse Position
 */
function mouse(e) {
    return [e.pageX - rx, e.pageY - ry];
}

/*
 * Mouse Over Arc
 *
 *
 */
function mouseOver(d) {
    highlight_text.text(d.displayName);
    //svg.select("#node-" + d.key).append("svg:path")
        //.attr("d", tooltip())
        //.attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; });
    if (current_mode === mode.exploration) {
        focusOnNode(d, true);
    }
}


/*
 * Mouse Out Arc
 *
 */
function mouseOut(d) {
    highlight_text.text("");
    //svg.selectAll("path.link").classed("non-selected", false);
    if (current_mode === mode.exploration) {
        focusOnNode(d, false);
    }
}

/* Search Results Mouse Over
 *
 */
function localNodeMouseOver(d) {
    svg.select("#localText-" + d.key).classed("text visible", true);
}

/* Search Results Mouse Out
 *
 */
function localNodeMouseOut(d) {
    svg.select("#localText-" + d.key).classed("text visible", false);
}

/*
 * Mouse over for link
 *
 */
function linkMouseOver(d) {
    if ($(this).is(".dimmed")) {
        return;
    }
    if (d.bi === true) {
        svg.select("path.link.bi-" + d.source.key + ".bi-" + d.target.key)
            .classed("selected", true);
        highlightNode(d.source, "bi", true, true);
        highlightNode(d.target, "bi", true, true);
    }
    else {
        svg.select("path.link.source-" + d.source.key + ".target-" + d.target.key)
            .classed("selected", true);
        highlightNode(d.source, "source", true, true);
        highlightNode(d.target, "target", true, true);
    }
}


/*
 * Mouse out for link
 *
 */
function linkMouseOut(d) {
    if ($(this).is(".dimmed")) {
        return;
    }
    svg.select("path.link.bi-" + d.source.key + ".bi-" + d.target.key)
        .classed("selected", false);
    svg.select("path.link.source-" + d.source.key + ".target-" + d.target.key)
        .classed("selected", false);
    if (d.bi === true) {
        highlightNode(d.source, "bi", false, true);
        highlightNode(d.target, "bi", false, true);
    }
    else {
        highlightNode(d.source, "source", false, true);
        highlightNode(d.target, "target", false, true);
    }
}


/*
 * Link Click
 *
 * TODO: to be implemented as separate gui element
 *
 */
function linkClick(d, value) {
    //checks if the link is active or dim
    if (!d.bi && svg.select("path.link.source-" + d.source.key + ".target-" + d.target.key).classed("dimmed")) return;
    if (d.bi && svg.select("path.link.bi-" + d.source.key + ".bi-" + d.target.key).classed("dimmed")) return;
    if (value === 0) piwikTracker.trackPageView('Click a link');
    else piwikTracker.trackPageView('Click a table link entry');

    var detail_tab = $("#detail-tab");
    var detail_content_pane = $("#detail-content-pane");
    detail_tab.empty();
    detail_content_pane.empty();
    // Iterate through all the details
    for (var i = 0; i < d.detail.length; ++i) {
        // Append the container
        if (i === 0) {
            detail_tab.append('<li class="active"><a href="#tab1" data-toggle="tab">Ref 1</a></li>');
            detail_content_pane.append('<div class="tab-pane active" id="tab1"></div>');
        }
        else {
            detail_tab.append('<li><a href="#tab' + (i + 1) + '" data-toggle="tab">Ref ' +
                              (i + 1) + '</a></li>');

            detail_content_pane.append('<div class="tab-pane" id="tab' + (i + 1) +
                                       '"></div>');
        }

        // Append the link information
        $("#ref-src").text("Source: " + d.source.displayName);
        $("#ref-tgt").text("Target: " + d.target.displayName);
        $("#tab" + (i + 1)).append('<p>Strength: ' + d.detail[i].strength +
                                   '<br/>Technique: ' + d.detail[i].technique +
                                   '<br/>Ref: ' + d.detail[i].ref +
                                   '<br/>BAMS record: <a href="' +
                                   d.detail[i].bams_link +
                                   '" target="_blank">Click</a><br/>Pubmed link: <a href="' +
                                   d.detail[i].pubmed_link + '" target="_blank">Click</a><br/></p>');
    }
}


/*
 * Node Click - for selection
 *
 * TODO: debug node selection
 *
 */
function nodeClick(d) {
    d3.event.preventDefault();
    if (current_mode === mode.exploration || current_mode === mode.fixation) {
        piwikTracker.trackPageView('Fix a node');
        if (selected_singleNode === d) {
            focusOnNode(d, false);
            path.classed("dimmed", false);
            selected_singleNode = null;
            current_mode = mode.exploration;
        }
        else {
            if (selected_singleNode == null) {
                path.classed("dimmed", true);
            }
            else {
                focusOnNode(selected_singleNode, false);
            }
            selected_singleNode = d;
            focusOnNode(d, true);
            current_mode = mode.fixation;
        }
    }
    // Search mode
    else {
        console.log("search mode");
        return; //For now, does not allow click in search mode
        if (selected_source !== undefined && selected_target !== undefined) {
            clearSelection();
        }
        if (d3.event.shiftKey === true) {
            if (selected_target !== undefined) {
                piwikTracker.trackPageView('SelectTarget');
                highlightNode(selected_target, "selected-target", false, true);
            }
            selected_target = d;
            highlightNode(selected_target, "selected-target", true, true);
        } else {
            if (selected_source !== undefined) {
                piwikTracker.trackPageView('SelectSource');
                highlightNode(selected_source, "selected-source", false, true);
            }
            selected_source = d;
            highlightNode(selected_source, "selected-source", true, true);
        }
    }
}

/*
 * Search Button
 *
 *
 */
function searchButtonClick() {
    piwikTracker.trackPageView('Click search button');
    if (current_mode === mode.fixation) {
        clearSingleSelection(selected_singleNode);
    }
    selected_links = [];
    piwikTracker.trackPageView('SearchConnection');
    if (selected_source !== undefined && selected_target !== undefined) {
        current_mode = mode.search;
        computeLinksForSelection(max_hop, selected_source, selected_target, [], selected_links);
        groupSelectedLinks();
        if (selected_links.length > 1) {
            path.classed("dimmed", true);
        }
        highlightSelectedLinks(true);
        displayInterParents(true);
        displayConnections(true);
    }
}

/*
 * Clear Button
 * The behavior of this function depends on the current interaction state
 *
 */
function clearButtonClick() {
    piwikTracker.trackPageView('Click clear button');
    if (current_mode === mode.search) {
        clearSearchResult();
        if (selected_source !== undefined) highlightNode(selected_source, "selected-source", false, true);
        if (selected_target !== undefined) highlightNode(selected_target, "selected-target", false, true);
    }
    else if (current_mode === mode.fixation) {
        clearSingleSelection();
    }
    /*
    selected_nodes.forEach(function (d) {
        highlightNodeFixed(d, "selected-source", false);
    });
    */

    current_mode = mode.exploration;
}

/*
 * Given the source specified by a user through the source search dropdown, set
 * the selected_target variable and highlight the corresponding source elements
 *
 */
function sourceSearchInput() {
    piwikTracker.trackPageView('Set source for search');
    if (selected_source != undefined) {
        highlightNode(selected_source, "selected-source", false, true);
        clearSearchResult();
    }
    var inputRegion = this.value.toLowerCase();
    display_node_map.forEach(function (d) {
        if (d.name === inputRegion) {
            selected_source = d.node;
            highlightNode(d.node, "selected-source", true, true);
        }
    });
}

/*
 * Given the target specified by a user through the target search dropdown, set
 * the selected_target variable and highlight the corresponding target elements
 *
 */
function targetSearchInput() {
    piwikTracker.trackPageView('Set target for search');
    if (selected_target != undefined) {
        highlightNode(selected_target, "selected-target", false, true);
        clearSearchResult();
    }
    var inputRegion = this.value.toLowerCase();
    display_node_map.forEach(function (d) {
        if (d.name === inputRegion) {
            selected_target = d.node;
            highlightNode(d.node, "selected-target", true, true);
        }
    });
}


/*
 * Given the attribute selected for edge coloring, compute the corresponding
 * value range for each color and update the legend accordingly
 *
 */
function attrSearchInput() {
    piwikTracker.trackPageView('Set attr for edge color coding');
    var attrName = this.value;

    if (attrName === "") {
        path = svg.selectAll("path.link")
        .classed("q0-4", false)
        .classed("q1-4", false)
        .classed("q2-4", false)
        .classed("q3-4", false);
    }

    if (attrName != "strength") {
        return;
    }


    //
    //
    // TODO: remove legend - should be in html
    //
    //
    var quantile = d3.scale.quantile().domain(attrRange[attrName]).range(d3.range(4));


    path = svg.selectAll("path.link")
        .attr("class", function (d) {
            var attrValue = 0;
            if (d.detail[0][attrName] === "Weak") {
                attrValue = 1;
            }
            else if (d.detail[0][attrName] === "Moderate") {
                attrValue = 2;
            }
            else if (d.detail[0][attrName] === "Heavy") {
                attrValue = 3;
            }

            return (d.bi === false) ?
                "link source-" + d.source.key + " target-" + d.target.key +
                " q" + quantile(attrValue) + "-4"
                :
                "link bi-" + d.source.key + " bi-" + d.target.key +
                " q" + quantile(attrValue) + "-4";
        });

    /*
    path = svg.selectAll("path.link")
        .attr("class", function (d) {
            return (d.bi == false)
                    ? "link source-" + d.source.key + " target-" + d.target.key + " q" + quantile(d.detail[attrName]) + "-4"
                    : "link bi-" + d.source.key + " bi-" + d.target.key + " q" + quantile(d.detail[attrName]) + "-4";
        })
    */

    var ticks = quantile.quantiles();

    /*
    svg.select("#color0")
        .text("[" + round(attrRange[attrName][0]) + ", " + round(ticks[0]) + "]");

    for (var i = 1; i < 3; ++i) {
        svg.select("#color" + i)
            .text("[" + round(ticks[i-1]) + ", " + round(ticks[i]) + "]");
    }

    svg.select("#color3")
        .text("[" + round(ticks[2]) + ", " + round(attrRange[attrName][1]) + "]");
    */

    var featureLegend = d3.select("#legend")
        .select("#legend2")
        .select("svg");

    featureLegend.select("#color0")
        .text("Exists");

    featureLegend.select("#color1")
        .text("Weak");

    featureLegend.select("#color2")
        .text("Moderate");

    featureLegend.select("#color3")
        .text("Heavy");
}

/*
 * Set Max Hop
 *
 *
 */
function setMaxHop() {
    piwikTracker.trackPageView('Set max hop');
    max_hop = this.value;
    document.getElementById("maxHopValue").innerHTML = max_hop - 1;
    path.classed("dimmed", false);
    highlightSelectedLinks(false);
    selected_links = [];
    displayConnections(false);
}

/*
 * Set Max Depth
 *
 *
 */
function setMaxDepth() {
    piwikTracker.trackPageView('Set max depth');
    max_depth = this.value;
    document.getElementById("maxDepthValue").innerHTML = max_depth;
    nodes.forEach(function (d) {
        if (d.depth <= parseInt(max_depth, 10) + 1) {
            svg.select("#arc-" + d.key).classed("hidden", false);
            svg.selectAll("path.link.source-" + d.key)
                .classed("hidden", false);
            svg.selectAll("path.link.target-" + d.key)
                .classed("hidden", false);
        }
    });
    nodes.forEach(function (d) {
        if (d.depth > parseInt(max_depth, 10) + 1) {
            svg.select("#arc-" + d.key).classed("hidden", true);
            svg.selectAll("path.link.source-" + d.key)
                .classed("hidden", true);
            svg.selectAll("path.link.target-" + d.key)
                .classed("hidden", true);
        }
    });
}

/*
 * Set Tension
 *
 */
function setTension() {
    piwikTracker.trackPageView('Set tension');
    line.tension(this.value / 100);
    path.attr("d", function (d, i) { return line(splines[i]); });
}

/*
 * Clears selected_links
 * Reverts selected arc and paths
 * Clear search result panel
 * Should only be called under search mode
 * Will change interaction state to exploration state
 */
function clearSearchResult() {
    if (current_mode !== mode.search) {
        console.log("Warning: request to clear search result when not in search mode.");
        return;
    }
    path.classed("dimmed", false);
    highlightSelectedLinks(false);
    selected_links = [];
    displayConnections(false);
    displayInterParents(false);
    if (old_focused_source !== null) svg.select("#arc-" + old_focused_source.key).classed("highlighted", false);
    if (old_focused_target !== null) svg.select("#arc-" + old_focused_target.key).classed("highlighted", false);
    current_mode = mode.exploration;
}


/*
* Clear the current node fixation
* Should only be called under fixation mode
* Will change interaction state to exploration state
*/
function clearSingleSelection() {
    if (current_mode !== mode.fixation) {
        console.log("Warning: request to clear single selection when not in fixation mode.");
        return;
    }
    path.classed("dimmed", false);
    focusOnNode(selected_singleNode, false);
    selected_singleNode = null;
    current_mode = mode.exploration;
}

/////////////////////////////////////
// Node and link highlighting
/////////////////////////////////////

function focusOnNode(node, value) {

    if (node === undefined || node === null) {
        return;
    }

    svg.selectAll("path.link.target-" + node.key)
        .classed("target", value)
        .classed("dimmed", false)
        .each(function(d) {highlightNode(d.source, "source", value, true)});

    svg.selectAll("path.link.source-" + node.key)
        .classed("source", value)
        .classed("dimmed", false)
        .classed("fixed", value)
        .each(function(d) {highlightNode(d.target, "target", value, true)});

    svg.selectAll("path.link.bi-" + node.key)
        .classed("bi", value)
        .classed("dimmed", false)
        .classed("fixed", value)
        .each(function(d) {highlightNode(d.source, "bi", value, true);
                           highlightNode(d.target, "bi", value, true);});

    highlightNode(node, "selected", value, true);
}


function highlightNode(node, className, value, showName) {
    if (node === undefined) return;
    svg.select("#arc-" + node.key).classed(className, value);

    if (node.depth > 2 && showName) {
        svg.select("#text-" + node.key).classed("selected", value);
        svg.select("#tooltip-" + node.key).classed("hidden", !value);
//        svg.select("#tooltip-" + node.key).classed("selected-hidden", !value);
//        node.showName = showName;
    }
}

//This is for the search results
function highlightSelectedLinks(value) {
    selected_links.forEach(function (d) {
        d.forEach(function (i) {
            svg.select("path.link.source-" + i.source.key + ".target-" + i.target.key).classed("dimmed", !value);
            svg.select("path.link.bi-" + i.source.key + ".bi-" + i.target.key).classed("dimmed", !value);
            svg.select("path.link.source-" + i.source.key + ".target-" + i.target.key).classed("selected", value);
            svg.select("path.link.bi-" + i.source.key + ".bi-" + i.target.key).classed("selected", value);
            if (i.source != selected_source && i.source != selected_target)
                highlightNode(i.source, "selected-secondary", value, false);
            if (i.target != selected_source && i.target != selected_target)
                highlightNode(i.target, "selected-secondary", value, false);
        });
    });
}

// higher level intermediate nodes
function displayInterParents(value) {
    if (current_mode !== mode.search) return;
    if (value) {
        var parentLevel = Math.max(selected_source.depth, selected_target.depth);
        parentLevel = Math.min(parentLevel, 4);
        getInterParents(parentLevel);
    }
    interParents.forEach(function(d) {
        var sourceDec = [],
            targetDec = [];
        getDecendants(selected_source, sourceDec);
        getDecendants(selected_target, targetDec);
        if (d != selected_source && d != selected_target && $.inArray(d, sourceDec) < 0 && $.inArray(d, targetDec) < 0) {
            highlightNode(d, "selected", value, true);
        }
    });
}


/////////////////////////////////////
// UI element content population
/////////////////////////////////////

function appendAttrsAsOptions(links) {
    for (var key in links[0].detail[0]) {
        $('#attrSelect').append(new Option(key, key, false, false));
    }
}

function appendNodesAsOptions(nodes) {
    nodes.forEach(function(d) {
        $('#sourceSelect').append(new Option(d.displayName, d.displayName, false, false));
        $('#targetSelect').append(new Option(d.displayName, d.displayName, false, false));
    });
}

function interLinkClicked(d) {
    var connectionPanel = $("#connections");
    connectionPanel.empty();
    console.log(d.actualLinks);
    for (var i = 0; i < d.actualLinks.length; ++i) {
        $('<table id = "conTable" class="table table-condensed table-custom"><tbody></tbody></table>').appendTo(connectionPanel);
        $('#conTable').append('<tr><td id="linkCell' + i + '"></td></tr>');
        var linkCell = $('#linkCell' + i);
        var button;
        linkCell.append('<img src="media/css/sourceIcon.png" height="16px" width="16px"/> '
                        + d.actualLinks[i].source.displayName + '<br/>'
                        + '<img src="media/css/targetIcon.png" height="16px" width="16px"/> '
                        + d.actualLinks[i].target.displayName) + '<br/>';
        linkCell.data(d.actualLinks[i]);
        linkCell.on("click", function() {
            linkClick($(this).data(), 1);
                if (old_focused_source != null) svg.select("#arc-" + old_focused_source.key).classed("highlighted", false);
                if (old_focused_target != null) svg.select("#arc-" + old_focused_target.key).classed("highlighted", false);
                svg.select("#arc-" + $(this).data().source.key).classed("highlighted", true);
                svg.select("#arc-" + $(this).data().target.key).classed("highlighted", true);
                old_focused_source = $(this).data().source;
                old_focused_target = $(this).data().target;
        });
    }
}

function displayConnections(value) {
    var connectionPanel = $("#connections");

    if (value) {
        var counter = 0;
        var numOfInterParents = interParents.length;
        var row_length = Math.round(Math.sqrt(numOfInterParents));
        var rect_width = 10;
        var rect_spacing = 2;
        var left_border = 150 - row_length 
        interParents.forEach(function(d) {
            d.cx = 150;
            d.cy = 300 / (numOfInterParents+1) * (counter+1);
            ++counter;
        });

        selected_source.cx = 10;
        selected_source.cy = 150;
        selected_target.cx = 290;
        selected_target.cy = 150;
        interParents.push(selected_source);
        interParents.push(selected_target);
        
        var displayLinks = [];
        displayLinks.push({x1:selected_source.cx, y1:150, x2:150, y2:150});
        displayLinks.push({x1:150, y1:150, x2:selected_target.cx, y2:150});
        
        var local_node = local_vis.selectAll("g.node").data(interParents).enter()
                            .append("rect").attr("width", rect_width).attr("height", 10).style("fill", "#555").style("stroke", "#FFF")
                            .style("stroke-width", 3)
                            .attr("x", function(d) { return d.cx; })
                            .attr("y", function(d) { return d.cy; })
                            .on("mouseover", localNodeMouseOver)
                            .on("mouseout", localNodeMouseOut)
                            .attr("id", function(d) { return "#localText-" + d.key ;})
                            .attr("class","local_node");

        var local_text = local_vis.selectAll("g.node").data(interParents).enter()
                            .append("text")
                            .attr("x", function(d) { return d.cx; })
                            .attr("y", function(d) { return d.cy; })
                            .attr("class", "text")
                            .text(function(d) { return d.displayName; });

        var local_link = local_vis.selectAll("line.link").data(displayLinks).enter().append("line")
                        .attr("class", "local_link")
                        .attr("x1", function(d) { return d.x1; })
                        .attr("y1", function(d) { return d.y1; })
                        .attr("x2", function(d) { return d.x2; })
                        .attr("y2", function(d) { return d.y2; })
                        .on("click", interLinkClicked);        
        
        
        /*
        var counter = 0;
        var numOfInterParents = interParents.length;
        interParents.forEach(function(d) {
            d.cx = 300 / (numOfInterParents+1) * (counter+1);
            d.cy = 150;
            ++counter;
        });

        selected_source.cx = 150;
        selected_source.cy = 75;
        selected_target.cx = 150;
        selected_target.cy = 225;
        interParents.push(selected_source);
        interParents.push(selected_target);

        var local_node = local_vis.selectAll("g.node").data(interParents).enter()
                            .append("circle").attr("r", 5).style("fill", "#555").style("stroke", "#FFF")
                            .style("stroke-width", 3)
                            .attr("cx", function(d) { return d.cx; })
                            .attr("cy", function(d) { return d.cy; })
                            .on("mouseover", localNodeMouseOver)
                            .on("mouseout", localNodeMouseOut)
                            .attr("id", function(d) { return "#localText-" + d.key ;})
                            .attr("class","local_node");

        var local_text = local_vis.selectAll("g.node").data(interParents).enter()
                            .append("text")
                            .attr("x", function(d) { return d.cx; })
                            .attr("y", function(d) { return d.cy; })
                            .attr("class", "text")
                            .text(function(d) { return d.displayName; });

        var local_link = local_vis.selectAll("line.link").data(interLinks).enter().append("line")
                        .attr("class", "local_link")
                        .attr("x1", function(d) { return d.source.cx; })
                        .attr("y1", function(d) { return d.source.cy; })
                        .attr("x2", function(d) { return d.target.cx; })
                        .attr("y2", function(d) { return d.target.cy; })
                        .on("click", interLinkClicked);
        */
    }
    else {
        $("#localCon").empty();
        $("#localCon").append('<h3>Search Results</h3>');
        local_vis = d3.select("#localCon").append("svg").attr("width", 300).attr("height", 300).attr("id", "localConVisual");
        connectionPanel.empty();
    }
}


/////////////////////////////////////
// Backend Computation
/////////////////////////////////////

function linkExists(link, linkArray) {
    var ret = false;
    linkArray.forEach(function(d) {
        if (d.source.key === link.source.key && d.target.key === link.target.key) {
            ret = true;
        }
    });
    return ret;
}

function addLink(linkArray, link, sourceParent, targetParent) {
    linkArray.forEach(function(d) {
        if (d.source.key === sourceParent.key && d.target.key === targetParent.key
                && $.inArray(link, d.actualLinks) < 0) {
            d.actualLinks.push(link);;
        }
    });
}

function getInterParents(depth) {
    interParents = [];
    interLinks = [];
    var sourceDecendants = [];
    var targetDecendants = [];
    getDecendants(selected_source, sourceDecendants);
    getDecendants(selected_target, targetDecendants);
    selected_links.forEach(function(d) {
        for (var i = 0; i < d.length; ++i) {
            var sourceParent = findParentAtDepth(d[i].source, depth);
            var targetParent = findParentAtDepth(d[i].target, depth);
            //if (sourceParent == null || targetParent == null) continue;
            var interLink = {source:sourceParent, target:targetParent, actualLinks:[d[i]]};
            if ($.inArray(sourceParent, interParents) < 0 && $.inArray(sourceParent, sourceDecendants) < 0) interParents.push(sourceParent);
            if ($.inArray(targetParent, interParents) < 0 && $.inArray(targetParent, targetDecendants) < 0) interParents.push(targetParent);
            if (!linkExists(interLink, interLinks)) {
                interLinks.push(interLink);
            }
            else {
                addLink(interLinks, d[i], sourceParent, targetParent);
            }
        }
    });
}

function findParentAtDepth(node, depth) {
    if (node === selected_source || node === selected_target) return node;
    var parent = node;
    while (parent.depth > depth && parent.parent != selected_source.parent
            && parent.parent != selected_target.parent && parent.parent != undefined) {
        parent = parent.parent;
    }
    return parent;
}

function groupSelectedLinks() {
    grouped_selected_links = [];
    for (var i = 0; i < max_hop; ++i) {
        grouped_selected_links[i] = [];
    }
    for (var i = 0; i < selected_links.length; ++i) {
        var hop = selected_links[i].length;
        grouped_selected_links[hop-1].push(selected_links[i]);
    }
}

function computeLinksForSelection(hop, source, target, currLink, selected_links) {
    if (selected_links.length > 1000) {
        return;
    }

    var augmentedLinks = [],
        augmentedTargets = [],
        descendants = [];

    source.links.forEach(function (d) {
        if (name_node_map[d.name] != undefined) {
            augmentedLinks.push({source: source, target: name_node_map[d.name], detail: d.detail});
        }
    });

    getDecendants(source, descendants);

    descendants.forEach(function (d) {
        d.links.forEach(function (i) {
            if (name_node_map[i.name] != undefined && $.inArray(name_node_map[i.name], descendants) < 0) {
                augmentedLinks.push({source: d, target: name_node_map[i.name], detail: i.detail});
            }
        });
    });
    augmentedTargets.push(target);
    getDecendants(target, augmentedTargets);
    augmentedLinks.forEach(function (d) {
        var newLink = currLink.slice();
        newLink.push({source: d.source, target: d.target, detail: d.detail});
        augmentedTargets.forEach(function (i) {
            if (d.target === i) {
                selected_links.push(newLink);
            }
        });
        if (hop > 1 && $.inArray(d.target, augmentedTargets) < 0) {
            computeLinksForSelection(hop - 1, d.target, target, newLink, selected_links);
        }
    });
}

function getDecendants(node, decendants) {
    node.children.forEach(function (d) {
        decendants.push(d);
        getDecendants(d, decendants);
    });
}

function filterRoot(element) {
    if (element.depth > 1) {
        return element;
    }
}

// Need to make this more general
function computeAttrRange(attrRange, links) {
    attrRange["strength"] = [0, 3];
    /*
    for (var key in links[0].detail[0]) {
        attrRange[key] = [500, -500];
    }
    links.forEach(function(d) {
        d.detail.forEach(function(e) {
            for (var key in e) {
                attrRange[key][0] = attrRange[key][0] < e[key] ? attrRange[key][0] : e[key];
                attrRange[key][1] = attrRange[key][1] > e[key] ? attrRange[key][1] : e[key];
            }
        });
    });
    */
}


function round(num) {
    return Math.round(num * 100) / 100;
}

function isSelected(node) {
    selected_nodes.forEach(function(d) {if (node === d) return true});
    return (node === selected_source) || (node === selected_target);
}

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

//display
var w = 800,
    h = 800,
    rotate = 0,
    radius = Math.min(w, h) / 2.7;

//ineraction state variables
var mode = 1; // 1: exploration mode, 2: search mode

//user selected data variables
var selected_source = null,
    selected_target = null,
    selected_singleNode = null,
    selected_links = [],
    grouped_selected_links = [],
    selected_nodes = [],
    interParents = [];

//user selected svg variables
var highlighted_elems = {};

//maps
var con_map,
    display_node_map,
    name_node_map,
    node_nghbr_map = {};


//other data-specific parameters
var attrRange = {};


//user specified parameters
var max_hop = 1,
    max_depth = 8;

//svg elements
var nodes,
    path,
    splines,
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

var gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "gradient");

gradient.append("stop")
    .attr("offset", "3%")
    .attr("stop-color", "#33E31B");
gradient.append("stop")
    .attr("offset", "97%")
    .attr("stop-color", "#DB1D33");

//background for zoom
svg.append('rect')
    .attr('width', w)
    .attr('height', h)
    .attr('fill', 'white')
    .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");

// let's not mix the graph with other elements
// this should be in the html - not necessary for it to be in svg

//legend
var legend = d3.select("#legend1")
                .append("svg")
                .attr("width", "350px")
                .attr("height", "100px")
                .append("g");

legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', '#2ca02c');

legend.append('text')
    .attr('x', 40)
    .attr('y', 10)
    .text("Source region / Outgoing connection");

legend.append('rect')
    .attr('x', 0)
    .attr('y', 30)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', '#d62728');

legend.append('text')
    .attr('x', 40)
    .attr('y', 40)
    .text("Target region / Incoming connection");

legend.append('rect')
    .attr('x', 0)
    .attr('y', 60)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', '#062db8');

legend.append('text')
    .attr('x', 40)
    .attr('y', 70)
    .text("bi connection");
    
    
legend = d3.select("#legend2")
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


function redraw() {
    //if (d3.event.scale > 2.5 || d3.event.scale < 0.9) {
        //return;
    //}
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

var tooltip = function (w, h) {
    return "M 0 0 L 10 -5 L 20 " + -h + " L " + (w + 55) + " " + -h + " L " +
    (w + 55) + " " + h + " L 20 " + h + " L 10 5 Z";
};

var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;


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
            return (d.bi == false)
                    ? "link source-" + d.source.key + " target-" + d.target.key
                    : "link bi-" + d.source.key + " bi-" + d.target.key;
        })
        .attr("d", function (d, i) { return line(splines[i]); })
//        .attr("stroke", "url(#gradient)")
//        .attr("stroke", function (d) {
//            return (d.bi == false) ? "url(#gradient)" : "blue";
//        })
        .on("mouseover", linkMouseOver)
        .on("mouseout", linkMouseOut)
        .on("click", function(d) {linkClick(d, 0);});

    //
    // Set UI input options
    computeAttrRange(attrRange, links);
    appendAttrsAsOptions(links);
    appendNodesAsOptions(nodes);
    $('.chzn-select').chosen({allow_single_deselect: true});


    //
    // Arcs
    //
    if (!is_firefox) {
        node.append("svg:path")
            .attr("d", arc)
            .attr("id", function (d) { return "arc-" + d.key; })
            .attr("class", "arc")
            .attr("fill", "white")
            .attr("stroke", "white")
            .on("mouseover", nodeMouseOver)
            .on("mouseout", nodeMouseOut)
            .on("click", nodeClick);
    } else {
        node.append("svg:circle")
            .attr("r", function (d) { return 2; })
            .attr("transform", function (d) {
                return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
            })
            .on("mouseover", mouseOver)
            .on("mouseout", mouseOut)
            .on("click", nodeClick);
    }

    tooltips = svg.selectAll("tooltext")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "tooltext");

    /*
    node.append("text")
        .attr("class", "text visible")
        .attr("transform", function(d) {return "translate(" + arc.outerCenter(d) + ")";})
        .attr("textPath", function(d) {console.log(arc(d)); return arc(d)})
        .text(function(d) {return d.displayName});
    */

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

        //.attr("transform", function (d) { return "translate(" + arc.outerCenter(d) + ")"; })
        //.attr("text-anchor", "middle")
        //.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        //.attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
        //.attr("transform", function(d) {
            //return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })


    //tooltip
    tooltips.insert("path", "text")
        .attr("id", function (d) { return "tooltip-" + d.key; })
        .attr("class", "tooltip hidden")
        .attr("d", function (d) {
            var text = svg.select("#text-" + d.key)[0][0],
                w = text.scrollWidth,
                h = text.scrollHeight;
            return tooltip(w, h);
        })
        .attr("transform", function (d) { return "translate(" + arc.outerCenter(d) + ")rotate(" + (d.x - 90) + ")"; });
        //.attr("transform", "translate(0,0)");
        
    createNodeNghbrMap();
    console.log(node_nghbr_map);
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


//d3.select("#search")
//    .on("input", searchInput);

/*
 * Mouse Position
 */
function mouse(e) {
    return [e.pageX - rx, e.pageY - ry];
}

/*
 * Mouse Over
 *
 *
 */
function nodeMouseOver(d) {
    //svg.select("#node-" + d.key).append("svg:path")
        //.attr("d", tooltip())
        //.attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; });
    if (selected_singleNode != d) {
        focusOnNodeTemp(d, true);
    }
}


/*
 * Mouse Out
 *
 */
function nodeMouseOut(d) {
    //svg.selectAll("path.link").classed("non-selected", false);
    if (selected_singleNode != d) {
        focusOnNodeTemp(d, false);
    }
}


/*
 * Mouse over for link
 */
function linkMouseOver(d) {
    if ($(this).is(".dimmed")) {
        return;
    }
    if (d.bi == true) {
        svg.select("path.link.bi-" + d.source.key + ".bi-" + d.target.key)
            .classed("selected", true);
        highlightNodeTemp(d.source, "bi", true);
        highlightNodeTemp(d.target, "bi", true);
    }
    else {
        svg.select("path.link.source-" + d.source.key + ".target-" + d.target.key)
            .classed("selected", true);
        highlightNodeTemp(d.source, "source", true);
        highlightNodeTemp(d.target, "target", true);
    }
}


/*
 * Mouse out for link
 *
 *
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
    if (d.bi == true) {
        highlightNodeTemp(d.source, "bi", false);
        highlightNodeTemp(d.target, "bi", false);
    }
    else {
        highlightNodeTemp(d.source, "source", false);
        highlightNodeTemp(d.target, "target", false);
    }
}


/*
 * Link Click
 *
 * TODO: to be implemented as separate gui element
 *
 */
function linkClick(d, value) {
    if (value == 0) {
        piwikTracker.trackPageView('Click a link');
    }
    else {
        piwikTracker.trackPageView('Click a table link entry');

    }
    if (!$(this).is(".dimmed")) {
        var detail_tab = $("#detail-tab");
        var detail_content_pane = $("#detail-content-pane");        
        detail_tab.empty();
        detail_content_pane.empty();
        for (var i = 0; i < d.detail.length; ++i) {
            if (i == 0) {
                detail_tab.append('<li class="active"><a href="#tab1" data-toggle="tab">Ref 1</a></li>');
                detail_content_pane.append('<div class="tab-pane active" id="tab1"></div>');
            }
            else {
                detail_tab.append('<li><a href="#tab' + (i+1) + '" data-toggle="tab">Ref ' + (i+1) + '</a></li>');
                detail_content_pane.append('<div class="tab-pane" id="tab' + (i+1) + '"></div>');
            }
            $("#ref-src").text("Source: " + d.source.displayName);
            $("#ref-tgt").text("Target: " + d.target.displayName);            
/*            $("#tab" + (i+1)).append('<p>Source:' + d.source.displayName + '<br/>Target: ' + d.target.displayName + 
            '<br/>Strength: ' + d.detail[i].strength + '<br/>Technique: ' + d.detail[i].technique + '<br/>Reference: ' + d.detail[i].ref + 
            '<br/>BAMS record: <a href="' + d.detail[i].bams_link + '" target="_blank">Click</a><br/>Pubmed link: <a href="' + 
            d.detail[i].pubmed_link +'" target="_blank">Click</a><br/></p>');
*/
            $("#tab" + (i+1)).append('<p>Strength: ' + d.detail[i].strength + '<br/>Technique: ' + d.detail[i].technique + '<br/>Ref: ' + d.detail[i].ref + '<br/>BAMS record: <a href="' + d.detail[i].bams_link + '" target="_blank">Click</a><br/>Pubmed link: <a href="' + d.detail[i].pubmed_link +'" target="_blank">Click</a><br/></p>');
        }

    }
}


/*
 * Node Click - for selection
 *
 */
function nodeClick(d) {
    d3.event.preventDefault();
    if (mode == 1) {
        piwikTracker.trackPageView('Fix a node');
        if (selected_singleNode == d) {
            focusOnNodeFixed(d, false, false);
            path.classed("dimmed", false);
            selected_singleNode = null;
        }
        else {
            if (selected_singleNode == null) {
                path.classed("dimmed", true);
            }
            else {
                focusOnNodeFixed(selected_singleNode, false, true);
            }
            selected_singleNode = d;
            focusOnNodeFixed(d, true, false);
        }
    }
    else {
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
    selected_links = [];
    piwikTracker.trackPageView('SearchConnection');
    if (selected_source !== undefined && selected_target !== undefined) {
        mode = 2;
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
 *
 *
 */
function clearButtonClick() {
    piwikTracker.trackPageView('Click clear button');
    clearSearchResult();
    clearSingleSelection();
    /*
    selected_nodes.forEach(function (d) {
        highlightNodeFixed(d, "selected-source", false);
    });
    */
    if (selected_source !== undefined) {
        highlightNodeFixed(selected_source, "selected-source", false, true);
    }
    if (selected_target !== undefined) {
        highlightNodeFixed(selected_target, "selected-target", false, true);
    }
    mode = 1;
}

function sourceSearchInput() {
    piwikTracker.trackPageView('Set source for search');
    if (selected_source != undefined) {
        highlightNodeFixed(selected_source, "selected-source", false, true);
        clearSearchResult();
    }
    var inputRegion = this.value.toLowerCase();
    display_node_map.forEach(function (d) {
        if (d.name == inputRegion) {
            selected_source = d.node;
            highlightNodeFixed(d.node, "selected-source", true, true);
        }
    });
}

function targetSearchInput() {
    piwikTracker.trackPageView('Set target for search');
    if (selected_target != undefined) {
        highlightNodeFixed(selected_target, "selected-target", false, true);
        clearSearchResult();
    }
    var inputRegion = this.value.toLowerCase();
    display_node_map.forEach(function (d) {
        if (d.name == inputRegion) {
            selected_target = d.node;
            highlightNodeFixed(d.node, "selected-target", true, true);
        }
    });
}

function attrSearchInput() {
    piwikTracker.trackPageView('Set attr for edge color coding');
    var attrName = this.value;


    if (attrName == "") {
        path = svg.selectAll("path.link")
        .classed("q0-4", false)
        .classed("q1-4", false)
        .classed("q2-4", false)
        .classed("q3-4", false);
    }
    if (attrName != "strength") {
        return ;
    }
    
    var quantile = d3.scale.quantile().domain(attrRange[attrName]).range(d3.range(4));


    path = svg.selectAll("path.link")
        .attr("class", function (d) {
            var attrValue = 0;
            if (d.detail[0][attrName] == "Weak") {
                attrValue = 1;
            }
            else if (d.detail[0][attrName] == "Moderate") {
                attrValue = 2;
            }
            else if (d.detail[0][attrName] == "Heavy") {
                attrValue = 3;
            }
            return (d.bi == false)
                    ? "link source-" + d.source.key + " target-" + d.target.key + " q" + quantile(attrValue) + "-4"
                    : "link bi-" + d.source.key + " bi-" + d.target.key + " q" + quantile(attrValue) + "-4";
        })
        
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
    
    var featureLegend = d3.select("#legend").select("#legend2").select("svg")
    
    featureLegend.select("#color0").text("Exists");
    featureLegend.select("#color1").text("Weak");
    featureLegend.select("#color2").text("Moderate");
    featureLegend.select("#color3").text("Heavy");
}

/*
 * Set Max Hop
 *
 *
 */
function setMaxHop() {
    piwikTracker.trackPageView('Set max hop');
    max_hop = this.value;
    document.getElementById("maxHopValue").innerHTML = max_hop;
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


function setTension() {
    piwikTracker.trackPageView('Set tension');
    line.tension(this.value / 100);
    path.attr("d", function (d, i) { return line(splines[i]); });
}

/*
 * Clear Selection
 *
 * Clears selected_links
 * Reverts selected arc and paths
 */
function clearSearchResult() {
    path.classed("dimmed", false);
    highlightSelectedLinks(false);
    selected_links = [];
    displayConnections(false);
    displayInterParents(false);
}

function clearSingleSelection() {
    path.classed("dimmed", false);
    focusOnNodeFixed(selected_singleNode, false, false);
    selected_singleNode = null;
}

////////////////////////////////////////////////////////////////////////////////
// UTILITIES & NAVIGATION
////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////
// Node and link highlighting
/////////////////////////////////////
function createNodeNghbrMap() {
    for (var i = 0; i < nodes.length; ++i) {
        var node = nodes[i];
        node_nghbr_map[node.key + " selected arc"] = svg.select("#arc-" + node.key);
        node_nghbr_map[node.key + " target link"] = svg.selectAll("path.link.target-" + node.key);
        node_nghbr_map[node.key + " source link"] = svg.selectAll("path.link.source-" + node.key);
        node_nghbr_map[node.key + " bi link"] = svg.selectAll("path.link.bi-" + node.key);    
        node_nghbr_map[node.key + " text"] = [];
        node_nghbr_map[node.key + " tooltip"] = [];
        node_nghbr_map[node.key + " target arc"] = [];
        node_nghbr_map[node.key + " source arc"] = [];
        node_nghbr_map[node.key + " bi arc"] = [];
        if (node.depth > 2) node_nghbr_map[node.key + " text"].push(svg.select("#text-" + node.key));
        if (node.depth > 2) node_nghbr_map[node.key + " tooltip"].push(svg.select("#tooltip-" + node.key));
        node_nghbr_map[node.key + " target link"].each(function(d) {addNghborNodes(d.source, node.key, node_nghbr_map[node.key + " source arc"]);});
        node_nghbr_map[node.key + " source link"].each(function(d) {addNghborNodes(d.target, node.key, node_nghbr_map[node.key + " target arc"]);});
        node_nghbr_map[node.key + " bi link"].each(function(d) {addNghborNodes(d.source, node.key, node_nghbr_map[node.key + " bi arc"]);});
        node_nghbr_map[node.key + " bi link"].each(function(d) {addNghborNodes(d.target, node.key, node_nghbr_map[node.key + " bi arc"]);});
    }
}

function addNghborNodes(node, i, array) {
    if (node.depth > 2) {
        node_nghbr_map[i + " text"].push(svg.select("#text-" + node.key));
        node_nghbr_map[i + " tooltip"].push(svg.select("#tooltip-" + node.key));
    }
    array.push(svg.select("#arc-" + node.key));
}

function focusOnNodeTemp(node, value) {
    /*
    svg.selectAll("path.link.target-" + node.key)
        .classed("target", value)
        .each(function(d) {highlightNodeTemp(d.source, "source", value)});

    svg.selectAll("path.link.source-" + node.key)
        .classed("source", value)
        .each(function(d) {highlightNodeTemp(d.target, "target", value)});

    svg.selectAll("path.link.bi-" + node.key)
        .classed("bi", value)
        .each(function(d) {highlightNodeTemp(d.source, "bi", value);
                            highlightNodeTemp(d.target, "bi", value);});

    highlightNodeTemp(node, "selected", value);
    */
    /*
    highlighted_elems["temp target link"] = svg.selectAll("path.link.target-" + node.key);
    highlighted_elems["temp source link"] = svg.selectAll("path.link.source-" + node.key);
    highlighted_elems["temp bi link"] = svg.selectAll("path.link.bi-" + node.key);
    */
    node_nghbr_map[node.key + " selected arc"].classed("selected", function(d) {!value && d.fixed ? true : value});
    node_nghbr_map[node.key + " target link"].classed("target", value);
    node_nghbr_map[node.key + " source link"].classed("source", value);
    node_nghbr_map[node.key + " bi link"].classed("bi", value);
    node_nghbr_map[node.key + " text"].forEach(function(d) {d.fixed ? null : d.classed("selected", value);});
    node_nghbr_map[node.key + " tooltip"].forEach(function(d) {d.fixed ? null : d.classed("hidden", !value);});
    node_nghbr_map[node.key + " target arc"].forEach(function(d) {d.fixed ? null : d.classed("target", value);});
    node_nghbr_map[node.key + " source arc"].forEach(function(d) {d.fixed ? null : d.classed("source", value);});   
    node_nghbr_map[node.key + " bi arc"].forEach(function(d) {d.fixed ? null : d.classed("bi", value);}); 
}

function focusOnNodeFixed(node, value, dimmed) {
    /*
    if (node == undefined || node == null) return;
    svg.selectAll("path.link.target-" + node.key)
        .classed("target", value)
        .classed("dimmed", dimmed)
        .classed("fixed", value)
        .each(function(d) {highlightNodeFixed(d.source, "source", value, true)});

    svg.selectAll("path.link.source-" + node.key)
        .classed("source", value)
        .classed("dimmed", dimmed)
        .classed("fixed", value)
        .each(function(d) {highlightNodeFixed(d.target, "target", value, true)});

    svg.selectAll("path.link.bi-" + node.key)
        .classed("bi", value)
        .classed("dimmed", dimmed)
        .classed("fixed", value)
        .each(function(d) {highlightNodeFixed(d.source, "bi", value, true);
                            highlightNodeFixed(d.target, "bi", value, true);});

    highlightNodeFixed(node, "selected", value, true);
    */
    node_nghbr_map[node.key + " selected arc"].classed("selected", value).each(function(d) {d.fixed = value;});
    node_nghbr_map[node.key + " target link"].classed("target", value).classed("dimmed", dimmed);
    node_nghbr_map[node.key + " source link"].classed("source", value).classed("dimmed", dimmed);
    node_nghbr_map[node.key + " bi link"].classed("bi", value).classed("dimmed", dimmed);
    node_nghbr_map[node.key + " text"].forEach(function(d) {d.fixed = value; d.classed("selected", value);});
    node_nghbr_map[node.key + " tooltip"].forEach(function(d) {d.fixed = value; d.classed("hidden", !value);});
    node_nghbr_map[node.key + " target arc"].forEach(function(d) {d.fixed = value; d.classed("target", value);});
    node_nghbr_map[node.key + " source arc"].forEach(function(d) {d.fixed = value; d.classed("source", value);});   
    node_nghbr_map[node.key + " bi arc"].forEach(function(d) {d.fixed = value; d.classed("bi", value);}); 
}

function highlightNodeTemp(node, className, value) {
    if (node.fixed == true && node.showName == true) return;
    svg.select("#arc-" + node.key).classed(className, value);
        
    if (node.depth > 2) {
        svg.select("#text-" + node.key).classed(className, value);
        svg.select("#tooltip-" + node.key).classed("hidden", !value);
    }   
}

function highlightNodeFixed(node, className, value, showName) {
    if (node == undefined) return;
    svg.select("#arc-" + node.key).classed(className, value);
    node.fixed = value;
        
    if (node.depth > 2 && showName) {
        svg.select("#text-" + node.key).classed(className, value);
        svg.select("#tooltip-" + node.key).classed("hidden", !value);
        svg.select("#tooltip-" + node.key).classed("selected-hidden", !value);
        node.showName = showName;
    }  
}

function highlightSelectedLinks(value) {
    selected_links.forEach(function (d) {
        d.forEach(function (i) {
            svg.select("path.link.source-" + i.source.key + ".target-" + i.target.key).classed("dimmed", value);
            svg.select("path.link.bi-" + i.source.key + ".bi-" + i.target.key).classed("dimmed", value);
            svg.select("path.link.source-" + i.source.key + ".target-" + i.target.key).classed("selected", value);
            svg.select("path.link.bi-" + i.source.key + ".bi-" + i.target.key).classed("selected", value);
            highlightNodeFixed(i.source, "source", value, false);
            highlightNodeFixed(i.target, "target", value, false);
        });
    });    
    
}

function displayInterParents(value) {
    if (mode != 2) return;
    var parentLevel = Math.min(selected_source.depth, selected_target.depth);
    getInterParents(parentLevel);
    interParents.forEach(function(d) {
        if (d != selected_source && d != selected_target) {
            highlightNodeFixed(d, "selected", value, true);
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

function displayConnections(value) {
    var connectionPanel = $("#connections");
    if (value) {
        for (var i = 0; i < grouped_selected_links.length; ++i) {
            connectionPanel.append('<h4 style="position:absolute; left:20px; top:' + (30 + 340 * i) + 'px">Level of indirection: ' + i + '</h4></br>');
            var currPanel = $('<div id=conn-hop' + (i+1) + '" class="conn-level1' + '" style="top:' + (50 + 340 * i) + 'px"></div>').appendTo(connectionPanel);
            var currLinks = grouped_selected_links[i];
            $('<table id = "table' + (i+1) + '" class="table table-condensed"><tbody></tbody></table>').appendTo(currPanel);
            for (var j = 0; j < currLinks.length; ++j) {
                // i+1 is the max number of hops == the max number of items in each link array-1
                $('#table' + (i+1)).append('<tr><td id="linkCell' + i + '' + j + '"></td><td id="detailCell' + i + '' + j + '"></td></tr>');
                var linkCell = $('#linkCell' + i + '' + j);
                for (var k = 0; k < i+1; ++k) {
                    var button;
                    if (k == i) {
                        linkCell.append('<img src="media/css/sourceIcon.png" height="16px" width="16px"/> ' 
                        + currLinks[j][k].source.displayName + '<br/>' 
                        + '<img src="media/css/targetIcon.png" height="16px" width="16px"/> '
                        + currLinks[j][k].target.displayName);
                        button = $('<button type="button" class="btn btn-info btn-mini">Detail</button><br/>').appendTo('#detailCell' + i + '' + j);                        
                    }
                    else {
                        linkCell.append('<img src="media/css/sourceIcon.png" height="16px" width="16px"/> ' 
                        + currLinks[j][k].source.displayName + '<br/>' 
                        + '<img src="media/css/targetIcon.png" height="16px" width="16px"/> '
                        + currLinks[j][k].target.displayName + '<br/>');
                        button = $('<button type="button" class="btn btn-info btn-mini">Detail</button><br/><br/>').appendTo('#detailCell' + i + '' + j);
                    }
                    button.data(currLinks[j][k]);
                    button.on("click", function() {linkClick($(this).data(), 1);});
                } 
            }
        }
    }
    else {
        connectionPanel.empty();
        connectionPanel.append('<h3>Search Results</h3>');
    }
}


/////////////////////////////////////
// Backend Computation
/////////////////////////////////////
function getInterParents(depth) {
    selected_links.forEach(function(d) {
        for (var i = 0; i < d.length; ++i) {
            interParents.push(findParentAtDepth(d[i].source, depth));
            interParents.push(findParentAtDepth(d[i].target, depth));
        }
    });
}

function findParentAtDepth(node, depth) {
    var parent = node;
    while (parent.depth > depth) {
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
    console.log(grouped_selected_links);
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
            if (name_node_map[i.name] != undefined) {
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
        if (hop > 1) {
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
    selected_nodes.forEach(function(d) {if (node == d) return true});
    return (node == selected_source) || (node == selected_target);
}

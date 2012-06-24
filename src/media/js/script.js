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
var w = 1440,
    h = 900,
    rotate = 0,
    radius = Math.min(w, h) / 2;

//bundle graph
var nodes,
    con_map,
    display_node_map,
    name_node_map;

//ui
var max_hop = 1,
    max_depth = 1,
    selected_source,
    selected_target,
    selected_links = [],
    selected_nodes = [];

var cluster = d3.layout.cluster()
    .size([360, h / 2.5 ])
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

var svg = d3.select("body")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h + 100)
    .append("svg:g")
    .attr("transform", "translate(" + ((w / 2) - 150) + "," + ((h / 2) + 50) + ")");


////////////////////////////////////////////////////////////////////////////////
// Draw Bundle
////////////////////////////////////////////////////////////////////////////////


d3.json("../media/data/brainData.json", function (data) {

    var nodes_flip,
        nodes_forLink,
        links,
        links_flip,
        links_visible,
        splines,
        path,
        node,
        arc;

    nodes = cluster.nodes(brainMap.root(data));
    var data_forLink = [];

    for (var i = 0; i < data.length; i++) {
        data_forLink[i] = Object.create(data[i]);
    }

    nodes = partition.nodes(brainMap.root(data));
    nodes_forLink = cluster.nodes(brainMap.root(data_forLink));
    node = svg.selectAll("g.node")
              .data(nodes.filter(filterRoot))
              .enter()
              .append("svg:g")
              .attr("class", "nodes");

    //nodes = cluster.nodes(brainMap.root(data));

    /*
    nodes_flip = [];
    for (var i = 0; i < nodes.length; i += 1) {
        nodes_flip[i] = Object.create(nodes[i]); //nodes_flip inherits from nodes
        nodes_flip[i].y = 25 * (20 - nodes_flip[i].depth); //overrides y value
        nodes[i].y -= 30;
    }
    */

    //con_map = brainMap.evidence(nodes);
    name_node_map = brainMap.nameNodeMap(nodes);
    display_node_map = brainMap.displayNameNodeMap(nodes);

    /*
    node = svg.selectAll("g.node")
        .data(nodes_flip.filter(filterRoot))
        .enter()
        .append("svg:g")
        .attr("id", function (d) { return "node-" + d.key; })
        .attr("class", "node"); //target and source are added by the css
        //.attr("transform", function(d) {
            //return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });
    */

    //
    // ARCS
    //
    arc = d3.svg.arc()
        .innerRadius(function (d) {
            return Math.sqrt(d.py + 150000 - d.dy * (d.depth - 2) * 2);
        })
        .outerRadius(function (d) {
            return Math.sqrt(d.py + 150000 - d.dy * (d.depth - 2) * 2 + d.dy);

        })
        .startAngle(function (d) {
            return d.px;

        })
        .endAngle(function (d) {
            return d.px + d.dx;
        });

    nodes.forEach(function (d) {
        d.px = d.x;
        d.py = d.y;
        d.x = (d.px + d.dx / 2) * 180 / Math.PI;
        d.y = Math.sqrt(d.py + 150000 - d.dy * (d.depth - 2) * 2 + d.dy / 2);
    });

    links = brainMap.connections(nodes);
    links_visible = brainMap.connections(nodes_forLink);
    //links_flip = brainMap.connections(nodes_flip);
    //splines = bundle(links, links_flip);
    splines = bundle(links_visible, links);

    //
    // Connections
    //
    path = svg.selectAll("path.link")
        .data(links)
        .enter().append("svg:path")
        .attr("class", function (d) {
            return "link source-" + d.source.key + " target-" + d.target.key;
        })
        .attr("d", function (d, i) { return line(splines[i]); })
        .on("click", linkClick);

    //node.append("circle")
        //.data(nodes_flip)
        //.attr("r", function(d) {return 2})
        //.attr("transform", function(d) {
            //return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
        //.on("mouseover", mouseover)
        //.on("mouseout", mouseout)
        //.on("click", nodeClick)

    //WARNING - partition will destroy both nodes_flip and nodes

    //partition.nodes(nodes[0]);

    node.append("path")
        //.data(nodes.filter(filterRoot))
        .attr("d", arc)
        .attr("fill", "white")
        .attr("stroke", "white")
        .attr("id", function (d) { return "arc-" + d.key; })
        .attr("class", "arc")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("click", nodeClick);

    //node.append("svg:text")
        ////.attr("dx", function(d) { return d.x < 180 ? 15 : -15; })
        //.data(nodesArc.filter(filterRoot))
        //.attr("dy", ".31em")
        //.attr("class", function(d) {
            //return "text source-" + d.key + " target-" + d.key})
        //.attr("text-anchor", "middle")
        //.attr("transform", function(d) {return "translate(" + arc.centroid(d) + ")";})
        ////.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        ////.attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
        ////.attr("transform", function(d) {
            ////return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
        //.text(function(d) { return d.displayName; })
        //.on("mouseover", mouseover)
        //.on("mouseout", mouseout)
        //.on("click", nodeClick);

});


////////////////////////////////////////////////////////////////////////////////
// Mouse & Click Events
////////////////////////////////////////////////////////////////////////////////


d3.select("#search")
    .on("click", searchButtonClick);

d3.select("#clear")
    .on("click", clearButtonClick);

d3.select("#maxHop")
    .on("change", setMaxHop);

d3.select("#maxDepth")
    .on("change", setMaxDepth);

d3.selectAll(".searchBox")
    .on("input", searchInput);


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
function mouseover(d) {

    svg.selectAll("path").classed("non-selected", true);

    svg.selectAll("path.link.target-" + d.key)
        .classed("target", true)
        .classed("hidden", false)
        .each(highlightAll("source", true));

    svg.selectAll("path.link.source-" + d.key)
        .classed("source", true)
        .classed("hidden", false)
        .each(highlightAll("target", true));

    svg.selectAll("text.target-" + d.key)
        .classed("target", true)
        .classed("hidden", false)
        .each(highlightAll("source", true));

    svg.selectAll("text.source-" + d.key)
        .classed("source", true)
        .classed("hidden", false)
        .each(highlightAll("target", true));
}

/*
 * Mouse Out
 *
 */
function mouseout(d) {

    svg.selectAll("path").classed("non-selected", false);

    svg.selectAll("path.link.source-" + d.key)
        .classed("source", false)
        .each(highlightAll("target", false));

    svg.selectAll("path.link.target-" + d.key)
        .classed("target", false)
        .each(highlightAll("source", false));

    svg.selectAll("text.target-" + d.key)
        .classed("target", false)
        .each(highlightAll("source", false));

    svg.selectAll("text.source-" + d.key)
        .classed("source", false)
        .each(highlightAll("target", false));

}

/*
 * Highlight All
 *
 */
function highlightAll(name, value) {
    return function (d) {
        svg.select("#node-" + d.target.key).classed(name, value);
        svg.select("#arc-" + d.target.key).classed(name, value);
        svg.select("#node-" + d.source.key).classed(name, value);
        svg.select("#arc-" + d.source.key).classed(name, value);
        svg.select("text.target-" + d.target.key).classed(name, value);
        svg.select("text.source-" + d.source.key).classed(name, value);
    };
}

/*
 * Link Click
 *
 * TODO: to be implemented as separate gui element
 *
 */
function linkClick(d) {
    //var source = d.source.name;
    //var target = d.target.name;
    //window.location.href = 'http://www.ncbi.nlm.nih.gov/pubmed?term=' +
    //con_map[source, target];
}

/*
 * Node Click - for selection
 *
 */
function nodeClick(d) {
    d3.event.preventDefault();
    if (selected_source !== undefined && selected_target !== undefined) {
        clearSelection();
    }
    if (d3.event.shiftKey === true) {
        if (selected_target !== undefined) {
            svg.select("#arc-" + selected_target.key).classed("selected-target", false);
        }
        selected_target = d;
        svg.select("#arc-" + d.key).classed("selected-target", true);
    } else {
        if (selected_source !== undefined) {
            svg.select("#arc-" + selected_source.key).classed("selected-source", false);
        }
        selected_source = d;
        svg.select("#arc-" + d.key).classed("selected-source", true);
    }
}

/*
 * Search Button
 *
 *
 */
function searchButtonClick() {
    if (selected_source !== undefined && selected_target !== undefined) {
        computeLinksForSelection(max_hop, selected_source,
                            selected_target, [], selected_links);
        selected_links.forEach(function (d) {
            d.forEach(function (i) {
                svg.select("path.link.source-" + i.source.key +
                    ".target-" + i.target.key)
                    .classed("selected", true);
                svg.select("#arc-" + i.source.key).classed("selected", true);
                svg.select("#arc-" + i.target.key).classed("selected", true);
            });
        });
    }
}

/*
 * Clear Button
 *
 *
 */
function clearButtonClick() {
    clearSelection();
    if (selected_source !== undefined) {
        svg.select("#arc-" + selected_source.key).classed("selected-source", false);
    }
    if (selected_target !== undefined) {
        svg.select("#arc-" + selected_target.key).classed("selected-target", false);
    }
}

/*
 * Search Input
 *
 *
 */
function searchInput() {
    selected_nodes.forEach(function (d) {
        svg.select("#arc-" + d.key).classed("selected-source", false);
    });
    selected_nodes = [];
    var inputRegion = this.value.toLowerCase();
    display_node_map.forEach(function (d) {
        if (d.name == inputRegion) {
            selected_nodes.push(d.node);
            svg.select("#arc-" + d.node.key).classed("selected-source", true);
        }
    });
}

/*
 * Set Max Hop
 *
 *
 */
function setMaxHop() {
    max_hop = this.value;
    document.getElementById("maxHopValue").innerHTML = max_hop;
    clearSelection();
}

/*
 * Set Max Depth
 *
 *
 */
function setMaxDepth() {
    max_depth = this.value;
    document.getElementById("maxDepthValue").innerHTML = max_depth;
    nodes.forEach(function (d) {
        if (d.depth > parseInt(max_depth, 10) + 1) {
            svg.select("#arc-" + d.key).classed("hidden", true);
            svg.selectAll("path.link.source-" + d.key)
                .classed("hidden", true);
            svg.selectAll("path.link.target-" + d.key)
                .classed("hidden", true);
        } else {
            svg.select("#arc-" + d.key).classed("hidden", false);
            svg.selectAll("path.link.source-" + d.key)
                .classed("hidden", false);
            svg.selectAll("path.link.target-" + d.key)
                .classed("hidden", false);
        }
    });
}


/*
 * Clear Selection
 *
 * Clears selected_links
 * Reverts selected arc and paths
 */
function clearSelection() {
    selected_links.forEach(function (d) {
        d.forEach(function (i) {
            svg.select("path.link.source-" + i.source.key +
                ".target-" + i.target.key)
                .classed("selected", false);
            svg.select("#arc-" + i.target.key).classed("selected", false);
            svg.select("#arc-" + i.source.key).classed("selected", false);
        });
    });
    selected_links = [];
}


////////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////////


function computeLinksForSelection(hop, source, target, currLink, selected_links) {
    var augmentedLinks = [],
        augmentedTargets = [],
        descendants = [];

    source.links.forEach(function (d) {
        augmentedLinks.push({source: source, target: name_node_map[d.name]});
    });

    getDecendants(source, descendants);

    descendants.forEach(function (d) {
        d.links.forEach(function (i) {
            augmentedLinks.push({source: d, target: name_node_map[i.name]});
        });
    });
    augmentedTargets.push(target);
    getDecendants(target, augmentedTargets);
    augmentedLinks.forEach(function (d) {
        var newLink = currLink.slice();
        newLink.push({source: d.source, target: d.target});
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

function filterRoot(element, index, array) {
    if (element.depth > 1) {
        return element;
    }
}

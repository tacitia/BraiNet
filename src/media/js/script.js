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

//bundle graph
var nodes,
    path,
    splines,
    con_map,
    display_node_map,
    name_node_map;

var tooltips;
//ui
var max_hop = 1,
    max_depth = 8,
    selected_source,
    selected_target,
    selected_links = [],
    selected_nodes = [];

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

var svg = d3.select("#canvas")
    .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "0 0 " + w + " " + h)
    .append('g')
      .attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")")
      .call(d3.behavior.zoom().on("zoom", redraw))
    .append('g');

//background for zoom
svg.append('rect')
    .attr('width', w)
    .attr('height', h)
    .attr('fill', 'white')
    .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");


// let's not mix the graph with other elements
// this should be in the html - not necessary for it to be in svg

//legend
svg.append('rect')
    .attr('x', -600)
    .attr('y', -300)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', '#2ca02c');

svg.append('text')
    .attr('x', -560)
    .attr('y', -290)
    .text("source");

svg.append('rect')
    .attr('x', -600)
    .attr('y', -260)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', '#d62728');

svg.append('text')
    .attr('x', -560)
    .attr('y', -250)
    .text("target");

//link details
var detail = [];

    detail[0] = svg.append('text')
        .attr("x", -600)
       .attr("y", 100)
       .text("Strength: ");
    detail[1] = svg.append('text')
       .attr("x", -600)
       .attr("y", 120)
       .text("Technique: ");
    detail[2] = svg.append('text')
       .attr("x", -600)
       .attr("y", 140)
       .text("Reference: ");
    detail[3] = svg.append('text')
       .attr("x", -600)
       .attr("y", 160)
       .text("BAMS link: ");    
    detail[4] = svg.append('text')
       .attr("x", -600)
       .attr("y", 180)
       .text("Pubmed link: ");
    detail[5] = svg.append('text')
       .attr("x", -540)
       .attr("y", 160)
       .text("");  
    detail[6] = svg.append('text')
       .attr("x", -530)
       .attr("y", 180)
       .text("");  

function redraw() {
    svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    if (d3.event.sourceEvent.type !== "mousemove") {
        tooltips.selectAll(".text").style("font-size", (10 / d3.event.scale));
        tooltips.selectAll(".tooltip").attr("d", function (d) {
            var text = svg.select("#text-" + d.key)[0][0],
            w = text.scrollWidth,
            h = text.scrollHeight;
            return tooltip(w, h);
        });
    }
}

var tooltip = function (w, h) {
    return "M 0 0 L 10 -5 L 20 " + -h + " L " + (w + 55) + " " + -h + " L " + (w + 55) + " " + h + " L 20 " + h + " L 10 5 Z";
};

var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

/**
 * Appends options to selection ui
 *
 */
d3.json("../media/data/options.json", function(data) {
    data.forEach(function(d) {
        $('#regionSelect').append(new Option(d.name, d.name, false, false));
    });
});


////////////////////////////////////////////////////////////////////////////////
// Draw Bundle
////////////////////////////////////////////////////////////////////////////////


d3.json("../media/data/bamsBrainData.json", function (data) {

    var nodes_for_link,
        links_visible,
        links,
//        splines,
//        path,
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

//    con_map = brainMap.evidence(nodes);
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
            return "link source-" + d.source.key + " target-" + d.target.key;
        })
        .attr("d", function (d, i) { return line(splines[i]); })
        .on("mouseover", linkMouseOver)
        .on("mouseout", linkMouseOut)
        .on("click", linkClick);

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
            .on("mouseover", mouseOver)
            .on("mouseout", mouseOut)
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

d3.select("#tension")
    .on("change", setTension);

//TODO: convert to D3 selector if possible
$('.chzn-select').change(searchInput);

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
function mouseOver(d) {

    //svg.select("#node-" + d.key).append("svg:path")
        //.attr("d", tooltip())
        //.attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; });

    //svg.selectAll("path.link").classed("non-selected", true);

    svg.select("#text-" + d.key).classed("target", true);

    svg.select("#tooltip-" + d.key).classed("hidden", false);

    svg.selectAll("path.link.target-" + d.key)
        .classed("target", true)
        .classed("hidden", false)
        .classed("non-selected", false)
        .each(highlightAll("source", true));

    svg.selectAll("path.link.source-" + d.key)
        .classed("source", true)
        .classed("hidden", false)
        .classed("non-selected", false)
        .each(highlightAll("target", true));

}


/*
 * Mouse Out
 *
 */
function mouseOut(d) {

    //svg.selectAll("path.link").classed("non-selected", false);

    svg.select("#text-" + d.key).classed("target", false);

    svg.select("#tooltip-" + d.key).classed("hidden", true);

    svg.selectAll("path.link.source-" + d.key)
        .classed("source", false)
        .each(highlightAll("target", false));

    svg.selectAll("path.link.target-" + d.key)
        .classed("target", false)
        .each(highlightAll("source", false));
}


/*
 * Mouse over for link
 */
function linkMouseOver(d) {
    svg.select("path.link.source-" + d.source.key + ".target-" + d.target.key)
       .classed("selected", true);
    svg.select("#arc-" + d.target.key).classed("target", true);
    svg.select("#arc-" + d.source.key).classed("source", true);
    svg.select("#text-" + d.target.key).classed("target", true);
    svg.select("#text-" + d.source.key).classed("target", true);
    svg.select("#tooltip-" + d.target.key).classed("hidden", false);
    svg.select("#tooltip-" + d.source.key).classed("hidden", false);
}


/*
 * Mouse out for link
 *
 *
 *
 */
function linkMouseOut(d) {
    svg.select("path.link.source-" + d.source.key + ".target-" + d.target.key)
       .classed("selected", false);
    svg.select("#arc-" + d.target.key).classed("target", false);
    svg.select("#arc-" + d.source.key).classed("source", false);
    svg.select("#text-" + d.target.key).classed("target", false);
    svg.select("#text-" + d.source.key).classed("target", false);
    svg.select("#tooltip-" + d.target.key).classed("hidden", true);
    svg.select("#tooltip-" + d.source.key).classed("hidden", true);
}

/*
 * Highlight All
 *
 */
function highlightAll(name, value) {
    return function (d) {
        //svg.select("#node-" + d.target.key).classed(name, value);
        //svg.select("#node-" + d.source.key).classed(name, value);
        svg.select("#arc-" + d.target.key).classed(name, value);
        svg.select("#arc-" + d.source.key).classed(name, value);
        svg.select("#text-" + d.target.key).classed(name, value);
        svg.select("#text-" + d.source.key).classed(name, value);
        svg.select("#tooltip-" + d.target.key).classed("hidden", !value);
        svg.select("#tooltip-" + d.source.key).classed("hidden", !value);
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
    console.log(d.detail);
    detail[0].text("Strength: " + d.detail.strength);
    detail[1].text("Technique: " + d.detail.technique);
    detail[2].text("Reference: " + d.detail.ref);
    detail[5].text(d.detail.bams_link)
    detail[6].text(d.detail.pubmed_link);
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
            piwikTracker.trackPageView('SelectTarget');
            svg.select("#arc-" + selected_target.key).classed("selected-target", false);
            svg.select("#text-" + selected_target.key).classed("selected-target", false);
        }
        selected_target = d;
        svg.select("#arc-" + d.key).classed("selected-target", true);
        svg.select("#text-" + d.key).classed("selected-target", true);
    } else {
        if (selected_source !== undefined) {
            piwikTracker.trackPageView('SelectSource');
            svg.select("#arc-" + selected_source.key).classed("selected-source", false);
            svg.select("#text-" + selected_source.key).classed("selected-source", false);
        }
        selected_source = d;
        svg.select("#arc-" + d.key).classed("selected-source", true);
        svg.select("#text-" + d.key).classed("selected-source", true);
    }
}

/*
 * Search Button
 *
 *
 */
function searchButtonClick() {
    piwikTracker.trackPageView('SearchConnection');
    console.log("custom variable logged");
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
    selected_nodes.forEach(function (d) {
        svg.select("#arc-" + d.key).classed("selected-source", false);
        svg.select("#text-" + d.key).classed("source", false);
    });
    if (selected_source !== undefined) {
        svg.select("#arc-" + selected_source.key).classed("selected-source", false);
        svg.select("#text-" + selected_source.key).classed("selected-source", false);
    }
    if (selected_target !== undefined) {
        svg.select("#arc-" + selected_target.key).classed("selected-target", false);
        svg.select("#text-" + selected_target.key).classed("selected-target", false);
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
        svg.select("#text-" + d.key).classed("source", false);
        svg.select("#tooltip-" + d.key).classed("hidden", true);
    });
    selected_nodes = [];
    var inputRegion = this.value.toLowerCase();
    display_node_map.forEach(function (d) {
        if (d.name == inputRegion) {
            selected_nodes.push(d.node);
            svg.select("#arc-" + d.node.key).classed("selected-source", true);
            svg.select("#text-" + d.node.key).classed("source", true);
            svg.select("#tooltip-" + d.node.key).classed("hidden", false);
        }
    });
}

/*
 * Set Max Hop
 *
 *
 */
function setMaxHop() {
    piwikTracker.trackPageView('SetMaxHop');
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
    piwikTracker.trackPageView('SetMaxDepth');
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
    line.tension(this.value/100);
    path.attr("d", function(d,i) {return line(splines[i]);});
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

function filterRoot(element) {
    if (element.depth > 1) {
        return element;
    }
}

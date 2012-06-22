/**
 * script.js
 *
 * Brain Circus
 * Heirararchical Edge Bundles
 *
 * Authors: Hua & Arthur
 *
 */

//display
var w = 1440,
    h = 900,
    rotate = 0,
    radius = Math.min(w, h) / 2;

//bundle graph
var nodes,
    conMap,
    displayNameNodeMap,
    nameNodeMap;

//ui
var maxHop = 1,
    maxDepth = 1,
    selectedSource,
    selectedTarget,
    selectedLinks = [],
    selectedNodes = [];

var cluster = d3.layout.cluster()
    .size([360, h/2.5 ])
    .sort(null)
    .value(function(d) { return d.size; });

var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return 1; });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(0.85)
    .radius(function(d) { return d.y; })
    .angle(function(d) {
        return (d.x) * (Math.PI / 180);
    });

var svg = d3.select("body")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h + 100)
    .append("svg:g")
    .attr("transform", "translate(" + ((w/2) - 150) + "," + ((h/2) + 50) + ")");


////////////////////////////////////////////////////////////////////////////////
// Draw Bundle
////////////////////////////////////////////////////////////////////////////////


d3.json("../media/data/brainData.json", function(data) {

    nodes = cluster.nodes(brainMap.root(data));

    var nodesInver = [];
    for (var i = 0; i < nodes.length; i++){
        nodesInver[i] = Object.create(nodes[i]); //nodesInver inherits from nodes
        nodesInver[i].y = 25 * (20 - nodesInver[i].depth); //overrides y value
        nodes[i].y -= 30;
    };

    var links = brainMap.connections(nodes);
    var linksInver = brainMap.connections(nodesInver);
    var splines = bundle(links, linksInver);

    //conMap = brainMap.evidence(nodes);
    nameNodeMap = brainMap.nameNodeMap(nodes);
    displayNameNodeMap = brainMap.displayNameNodeMap(nodes);

    //
    // Connections
    //
    var path = svg.selectAll("path.link")
        .data(links)
        .enter().append("svg:path")
        .attr("class", function(d) {
            return "link source-" + d.source.key + " target-" + d.target.key})
        .attr("d", function(d, i) { return line(splines[i]); })
        .on("click", linkClick);

    var node = svg.selectAll("g.node")
        .data(nodesInver.filter(filterRoot))
        .enter()
        .append("svg:g")
        .attr("id", function(d) {return "node-" + d.key;})
        .attr("class", "node"); //target and source are added by the css
        //.attr("transform", function(d) {
            //return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

    //
    // ARCS
    //
    var arc = d3.svg.arc()
        .innerRadius(function(d) {
                return Math.sqrt(d.y + 150000 - d.dy * (d.depth - 2) * 2);
        })
        .outerRadius(function(d) {
                return Math.sqrt(d.y + 150000 - d.dy * (d.depth - 2) * 2 + d.dy);

        })
        .startAngle(function(d) {
                return d.x;

        })
        .endAngle(function(d) {
                return d.x + d.dx;
        });

    //node.append("circle")
        //.data(nodesInver)
        //.attr("r", function(d) {return 2})
        //.attr("transform", function(d) {
            //return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
        //.on("mouseover", mouseover)
        //.on("mouseout", mouseout)
        //.on("click", nodeClick)

    //WARNING - partition will destroy both nodesInver and nodes
    partition.nodes(nodes[0]);

    node.append("path")
        .data(nodes.filter(filterRoot))
        .attr("d", arc)
        .attr("fill", "white")
        .attr("stroke", "white")
        .attr("id", function(d) {return "arc-" + d.key;})
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
    return function(d) {
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
    //conMap[source, target];
}

/*
 * Node Click - for selection
 *
 */
function nodeClick(d) {
    d3.event.preventDefault();
    if (selectedSource != undefined && selectedTarget != undefined) {
        clearSelection();
    }
    if (d3.event.shiftKey == true) {
        if (selectedTarget != undefined) {
            svg.select("#arc-" + selectedTarget.key).classed("selected-target", false);
        }
        selectedTarget = d;
        svg.select("#arc-" + d.key).classed("selected-target", true);
    }
    else {
        if (selectedSource != undefined) {
            svg.select("#arc-" + selectedSource.key).classed("selected-source", false);
        }
        selectedSource = d;
        svg.select("#arc-" + d.key).classed("selected-source", true);
    }
}

/*
 * Search Button
 *
 *
 */
function searchButtonClick() {
    if (selectedSource != undefined && selectedTarget != undefined) {
        computeLinksForSelection(maxHop, selectedSource,
                            selectedTarget, [], selectedLinks);
        selectedLinks.forEach(function(d) {
            d.forEach(function(i) {
                svg.select("path.link.source-" + i.source.key
                    + ".target-" + i.target.key)
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
    if (selectedSource != undefined) {
        svg.select("#arc-" + selectedSource.key).classed("selected-source", false);
    }
    if (selectedTarget != undefined) {
        svg.select("#arc-" + selectedTarget.key).classed("selected-target", false);
    }
}

/*
 * Search Input
 *
 *
 */
function searchInput() {
    selectedNodes.forEach(function(d) {
        svg.select("#arc-" + d.key).classed("selected-source", false);
    });
    selectedNodes = [];
    var inputRegion = this.value.toLowerCase();
    maxKey = brainMap.maxKey(nodes);
    displayNameNodeMap.forEach(function(d) {
        if (d.name == inputRegion) {
            selectedNodes.push(d.node);
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
    maxHop = this.value;
    document.getElementById("maxHopValue").innerHTML=maxHop;
    clearSelection();
}

/*
 * Set Max Depth
 *
 *
 */
function setMaxDepth() {
    maxDepth = this.value;
    document.getElementById("maxDepthValue").innerHTML=maxDepth;
    nodes.forEach(function(d) {
        if (d.depth > parseInt(maxDepth) + 1) {
            svg.select("#arc-" + d.key).classed("hidden", true);
            svg.selectAll("path.link.source-" + d.key)
                .classed("hidden", true);
            svg.selectAll("path.link.target-" + d.key)
                .classed("hidden", true);             }
        else {
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
 * Clears selectedLinks
 * Reverts selected arc and paths
 */
function clearSelection() {
    selectedLinks.forEach(function(d) {
        d.forEach(function(i) {
            svg.select("path.link.source-" + i.source.key
                + ".target-" + i.target.key)
            .classed("selected", false);
            svg.select("#arc-" + i.target.key).classed("selected", false);
            svg.select("#arc-" + i.source.key).classed("selected", false);
        });
    });
    selectedLinks = [];
}


////////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////////


function computeLinksForSelection(hop, source, target, currLink, selectedLinks) {
    var augmentedLinks = [];
    var augmentedTargets = [];
    source.links.forEach(function(d) {augmentedLinks.push({source: source, target: nameNodeMap[d.name]})});
    var decendants = [];
    getDecendants(source, decendants);
    decendants.forEach(function(d) {
        d.links.forEach(function(i) {augmentedLinks.push({source: d, target: nameNodeMap[i.name]})});
    });
    augmentedTargets.push(target);
    getDecendants(target, augmentedTargets);
    augmentedLinks.forEach(function(d) {
        var newLink = currLink.slice();
        newLink.push({source: d.source, target: d.target});
        augmentedTargets.forEach(function(i) {
            if (d.target == i) {
                selectedLinks.push(newLink);
            }
        });
        if (hop > 1) {
            computeLinksForSelection(hop-1, d.target, target, newLink, selectedLinks);
        }
    });
}

function getDecendants(node, decendants) {
    node.children.forEach(function(d) {
        decendants.push(d);
        getDecendants(d, decendants);
    });
}

function filterRoot(element, index, array) {
    if(element.depth > 1) {
        return element;
    }
}

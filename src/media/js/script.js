/**
 * script.js
 *
 * Creates d3 svg circular layout.
 *
 * We should plan how we are going to organize the js.
 *
 * Authors: Hua & Arthur
 *
 */

var w = 1440,
    h = 900,
    m0,
    rotate = 0;
    radius = Math.min(w, h) / 2,
    color = d3.scale.category20c();
    maxHop = 1;

var selectedSource;
var selectedTarget;
var nameNodeMap;
var linkRepo = [];

var splines = [];

var cluster = d3.layout.cluster()
    .size([360, h/2.5 ])
    .sort(null)
    .value(function(d) { return d.size; });

//var partition = d3.layout.partition()
    //.sort(null)
    //.size([2 * Math.PI, radius * radius])
    //.value(function(d) { return 1; });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(0.9)
    .radius(function(d) { return d.y; })
    .angle(function(d) {
        return (d.x) * (Math.PI / 180);
    });

//create svg canvas
var svg = d3.select("body")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .append("svg:g")
    .attr("transform", "translate(" + w/2 + "," + h/2 + ")");

d3.select("#search")
    .on("click", searchButtonClick);

d3.select("#clear")
    .on("click", clearButtonClick);

d3.select("#maxHop")
    .on("change", setMaxHop);

d3.json("../media/data/brainData.json", function(data) {
    nodes = cluster.nodes(brainMap.root(data));
    nodesCopy = cluster.nodes(brainMap.root(data));

    nodes.forEach(function(d) {
        if (d.depth < 11) {
           d.y = 24 * (20 - d.depth);
        }
    });

    //console.log(data);
    //console.log(links[1])
    //console.log(linksCopy[1])

    links = brainMap.connections(nodes);
    linksCopy = brainMap.connections(nodesCopy);
    splines = bundle(links, linksCopy);

    conMap = brainMap.evidence(nodes);
    nameNodeMap = brainMap.nameNodeMap(nodes);

    var path = svg.selectAll("path.link")
        .data(links)
        .enter().append("svg:path")
        .attr("class", function(d) {
            return "link source-" + d.source.key + " target-" + d.target.key})
        .attr("d", function(d, i) { return line(splines[i]); })
        .on("click", linkClick);

    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter()
        .append("svg:g")
        .attr("id", function(d) {return "node-" + d.key;})
        .attr("class", "node") //target and source are added by the css
        .attr("transform", function(d) {
            return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

        //circle is part node
        node.append("circle")
            .attr("r", function(d) {return 2})
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("click", nodeClick);

        //text is part of node
        node.append("svg:text")
            //set margin space
            .attr("dx", function(d) { return d.x < 180 ? 15 : -15; })
            .attr("dy", ".31em")
            .attr("class", function(d) {
                return "text source-" + d.key + " target-" + d.key})
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
            .text(function(d) { return d.displayName; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("click", nodeClick);
});


function mouse(e) {
    return [e.pageX - rx, e.pageY - ry];
}

function mouseover(d) {
    svg.selectAll("path.link.target-" + d.key)
    .classed("target", true)
    .each(updateNodes("source", true));

    svg.selectAll("path.link.source-" + d.key)
    .classed("source", true)
    .each(updateNodes("target", true));

    svg.selectAll("text.target-" + d.key)
    .classed("target", true)
    .each(updateNodes("source", true));

    svg.selectAll("text.source-" + d.key)
    .classed("source", true)
    .each(updateNodes("target", true));
}


function mouseout(d) {
    svg.selectAll("path.link.source-" + d.key)
    .classed("source", false)
    .each(updateNodes("target", false));

    svg.selectAll("path.link.target-" + d.key)
    .classed("target", false)
    .each(updateNodes("source", false));

    svg.selectAll("text.target-" + d.key)
    .classed("target", false)
    .each(updateNodes("source", false));

    svg.selectAll("text.source-" + d.key)
    .classed("source", false)
    .each(updateNodes("target", false));
}


//mouseover and mouseout helper
function updateNodes(name, value) {
    return function(d) {
        if (d.target != undefined) {
            svg.select("#node-" + d.target.key).classed(name, value);
            svg.select("text.target-" + d.target.key).classed(name, value);
        }
        if (d.source != undefined) {
            svg.select("#node-" + d.source.key).classed(name, value);
            svg.select("text.source-" + d.source.key).classed(name, value);
        }
    };
}

function linkClick(d) {
    var source = d.source.name;
    var target = d.target.name;
    window.location.href = 'http://www.ncbi.nlm.nih.gov/pubmed?term=' + conMap[source, target];
}

function nodeClick(d) {
    d3.event.preventDefault();
    if (selectedSource != undefined && selectedTarget != undefined) {
        clearSelection();
    }
    if (d3.event.shiftKey == true) {
        selectedTarget = d;
    }
    else {
        selectedSource = d;
    }

}

function searchButtonClick() {
    if (selectedSource != undefined && selectedTarget != undefined) {
        computeLinksForSelection(maxHop, selectedSource,
                            selectedTarget, [], linkRepo);
        linkRepo.forEach(function(d) {
            d.forEach(function(i) {
                svg.selectAll("path.link.source-" + i.source.key
                    + ".target-" + i.target.key)
                .classed("selected", true);
            });
        });
    }
}

function clearButtonClick() {
    clearSelection();
}

function setMaxHop() {
    maxHop = this.value;
    document.getElementById("maxHopValue").innerHTML=maxHop;
    clearSelection();
}

/*
    Clear the link repo as well as the highlights
*/
function clearSelection() {
    linkRepo.forEach(function(d) {
        d.forEach(function(i) {
            svg.selectAll("path.link.source-" + i.source.key
                + ".target-" + i.target.key)
            .classed("selected", false);
        });
    });
    linkRepo = [];
}

function computeLinksForSelection(hop, source, target, currLink, linkRepo) {
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
                linkRepo.push(newLink);
            }
        });
        if (hop > 1) {
            computeLinksForSelection(hop-1, d.target, target, newLink, linkRepo);
        }
    });
}

function getDecendants(node, decendants) {
    node.children.forEach(function(d) {
        decendants.push(d);
        getDecendants(d, decendants);
    });
}

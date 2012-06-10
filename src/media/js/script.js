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

var selectedSource;
var selectedTarget;

var splines = [];

var cluster = d3.layout.cluster()
    .size([360, 960 / 2 - 120])
    .sort(null)
    .value(function(d) { return d.size; });

var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return 1; });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.85)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

var svg = d3.select("body")
    .append("svg:svg")
    .attr("width", 1440)
    .attr("height", 900)
    .append("svg:g")
    .attr("transform", "translate(600,480)");

d3.select("#search")
    .on("click", searchButtonClick);
    
d3.select("#clear")
    .on("click", clearButtonClick);

d3.json("../media/data/brainData.json", function(data) {

    var nodes = cluster.nodes(brainMap.root(data));
    links = brainMap.connections(nodes);
    splines = bundle(links);
    conMap = brainMap.evidence(nodes);

    var path = svg.selectAll("path.link")
    .data(links)
    .enter().append("svg:path")
    .attr("class", function(d) {return "link source-" + d.source.key + " target-" + d.target.key})
    .attr("d", function(d, i) { return line(splines[i]); })
    .on("click", linkClick);

    var node = svg.selectAll("g.node")
    //      .data(nodes.filter(function(n) { return !n.children; }))
    .data(nodes)
    .enter()
    .append("svg:g")
    .attr("class", "node")
    .attr("id", function(d) {return "node-" + d.key;})
    .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

    node.append("svg:text")
    .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
    .attr("dy", ".31em")
    .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
    .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
    .text(function(d) { return d.displayName; })
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
    .on("click", nodeClick);

    node.append("circle")
    .attr("r", function(d) {return 1});
});

d3.select(self.frameElement).style("height", "960px");


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
}

function mouseout(d) {
    svg.selectAll("path.link.source-" + d.key)
    .classed("source", false)
    .each(updateNodes("target", false));

    svg.selectAll("path.link.target-" + d.key)
    .classed("target", false)
    .each(updateNodes("source", false));
}

function updateNodes(name, value) {
    return function(d) {
        //if (value) this.data.parentNode.appendChild(this);
        svg.select("#node-" + d.target.key).classed(name, value);
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
        svg.selectAll("path.link.source-" + selectedSource.key
            + ".target-" + selectedTarget.key)
           .classed("selected", false);
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
        svg.selectAll("path.link.source-" + selectedSource.key
            + ".target-" + selectedTarget.key)
           .classed("selected", true);
    }
}

function clearButtonClick() {
    if (selectedSource != undefined && selectedTarget != undefined) {
        svg.selectAll("path.link.source-" + selectedSource.key
            + ".target-" + selectedTarget.key)
           .classed("selected", false);
    }
}


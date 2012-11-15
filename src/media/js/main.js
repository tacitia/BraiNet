/*
    Brain Circuits Viz
    Authors: Hua and Arthur
    Script 1: main routine
*/

/*******
    Data loading section
*******/

// Read in the nodes data and build the node map
d3.json("media/data/test_node.json", function (data) {
    node_map = {};
    node_in_neighbor_map = {};
    node_out_neighbor_map = {};
    var num_nodes = data.length;
    for (var i = 0; i < num_nodes; ++i) {
        var node = data[i];
        node.circ = {};
        node_map[node.key] = node;
        node_in_neighbor_map[node.key] = [];
        node_out_neighbor_map[node.key] = [];
    }
    // !! Change Java code later so that parent field is assigned in json file
    /*
    for (var key in node_map) {
        var node = node_map[key];
        for (var i = 0; i < node.children.length; ++i) {
            var child_key = node.children[i];
            var child = node_map[child_key];
            if (child !== undefined) {
                child.parent = key;
                child.group = key;
            }
        }
    }
    */
    mutex -= 1;
});

/*
d3.json("media/data/test_paper.json", function(data) {
    paper_map = {};
    var num_paper = data.length;
    for (var i = 0; i < num_paper; ++i) {
        var paper = data[i];
        paper_map[paper.key] = paper;
    }
    mutex -= 1;
});
*/

d3.json("media/data/test_link.json", function (data) {
    link_map = {};
    node_link_map = {};
    var num_links = data.length;
    for (var i = 0; i < num_links; ++i) {
        var raw_link = data[i];
        var link = {key: raw_link.key, source: node_map[raw_link.sourceKey],
                    target: node_map[raw_link.targetKey]};
        link_map[link.key] = link;
        var key_pair = link.source.key + "-" + link.target.key;
        node_link_map[key_pair] = link;
        node_in_neighbor_map[raw_link.targetKey].push(raw_link.sourceKey);
        node_out_neighbor_map[raw_link.sourceKey].push(raw_link.targetKey);
    }
    mutex -= 1;
});

waitForDataLoading();

/*******
    End of data loading section
*******/


/*******
    UI elements action binding section
*******/
d3.select("#bt-search").on("click", searchButtonClick);
d3.select("#bt-clear").on("click", clearButtonClick);
$('#sourceSelect').change(sourceSearchInput);
$('#targetSelect').change(targetSearchInput);
/*******
    End of UI elements action binding section
*******/

/*
node_neighbor_map = {};
node_neighbor_map[2] = [{node: node_map[3]}, {node: node_map[6]}, {node: node_map[7]}];
node_neighbor_map[3] = [{node: node_map[2]}, {node: node_map[4]}, {node: node_map[5]}];
node_neighbor_map[4] = [{node: node_map[6]}, {node: node_map[3]}];
node_neighbor_map[5] = [{node: node_map[7]}, {node: node_map[3]}];
node_neighbor_map[6] = [{node: node_map[4]}, {node: node_map[2]}];
node_neighbor_map[7] = [{node: node_map[5]}, {node: node_map[2]}];

paper_map = {};
paper_map[1] = {key: 1, title: "paper 1", url: "http://pubmed"};
paper_map[2] = {key: 2, title: "paper 2", url: "http://pubmed"};

bams_map = {};
bams_map[1] = {key: 1, url: ""};
*/

function renderCanvas() {
    // Assign colors to
    assignColors();
    // Initialize the active nodes to be the highest level ones
    initActiveNodes();
    computeCircularNodesParameters(active_data_nodes);
    // Initialize the active links according to the active nodes
    initActiveLinks();

    // Setup the arc function object
    arcs = d3.svg.arc()
             .innerRadius(inner_radius)
             .outerRadius(outer_radius)
             .startAngle(function(d) {return d.circ.startAngle;})
             .endAngle(function(d) {return d.circ.endAngle;});

    curves = d3.svg.line()
               .x(function(d) {return d.x;})
               .y(function(d) {return d.y;})
               .interpolate("basis");


    //this should be incorporated in the node data
    var num_groups = 0,
        group_count = {};
    active_data_nodes_force.forEach(function(d) {
        if (!group_count[d.group]) {
            ++num_groups;
            group_count[d.group] = [num_groups, 1];
        } else {
            //increase group size
            group_count[d.group][1] += 1;
        }
    });

    force = d3.layout.force()
              .nodes(active_data_nodes_force)
              .links(active_data_links_force)
              //.links([])
              .size([vis_width, vis_height])
              //still needs work - link distance determined by group size and if
              //connection are internal
              .linkDistance(function(l) {
                  var s = group_count[l.source.group], t = group_count[l.target.group];
                  return 30 * Math.max(l.source.group != l.target.group ? s[1] : 2/s[1],
                                       l.source.group != l.target.group ? t[1] : 2/t[1]) + 20;
              })
              .linkStrength(1)
              //.gravity(0.01)
              .charge(-600)
              .friction(0.5)
              .start();

    // Initialize the background svg canvas
    svg_circular = d3.select("#canvas-circular")
            .append("svg")
            .attr("width", vis_width)
            .attr("height", vis_height)
            .append('g')
            .attr("transform", "translate(" + (vis_width / 2) + "," + (vis_height / 2) + ")")
            .append('g');

    svg_force = d3.select("#canvas-force")
            .append("svg")
            .attr("width", vis_width)
            .attr("height", vis_height)
            .append('g');

    // Render the arcs
    enterCircularNodes(svg_circular);
    // Render the links
    enterCircularLinks(svg_circular);

    var link = svg_force.selectAll("nodelink.links")
       .data(active_data_links_force)
       .enter().append("svg:line")
       .attr("class", "links")
       .style("stroke-width", 3);

    var node = svg_force.selectAll("nodelink.nodes")
       .data(active_data_nodes_force)
       .enter().append("svg:circle")
       .attr("class", "node")
       .attr("cx", function(d) { return d.x; })
       .attr("cy", function(d) { return d.y; })
       .attr("r", 5)
       .style("fill", function(d) {return d.color;})
       .call(force.drag);

    /*
    svg_force.selectAll("text")
       .data(active_data_nodes, function(d) {return d.key;})
       .enter().append("text")
       .attr('x', function(d) {return d.circ.x;})
       .attr('y', function(d) {return d.circ.y;})
       .attr('class', 'text visible')
       .text(function(d) {return d.name});
   */

  force.on("tick", function(e) {
      // To bundle nodes without links (useful)
      /*
      var k = 8 * e.alpha;

      active_data_nodes_force.forEach(function(o) {
          o.x += group_count[o.group][0] * k;
          o.y += group_count[o.group][0] * -k;
      });
      */

     link.attr("x1", function(d) { return d.source.x; })
         .attr("y1", function(d) { return d.source.y; })
         .attr("x2", function(d) { return d.target.x; })
         .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
  })

}

function setupUIElements() {
    appendNodesAsOptions(node_map);
    $('.chzn-select').chosen({allow_single_deselect: true});
}

function waitForDataLoading() {
    if (mutex > 0) {
        setTimeout(function() {waitForDataLoading();}, 1000);
    }
    else {
        renderCanvas();
        setupUIElements();
    }
}

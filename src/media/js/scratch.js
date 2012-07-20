//.append("svg")
//.attr("width", w)
//.attr("height", h)
//.attr("width", "100%")
//.attr("height", "100%")
//.attr("viewBox", "0 0 " + w + " " + h)
//.append("g")
//.call(d3.behavior.zoom().on("zoom", redraw));

//DEBUGGING - show nodesCopy nodes
//var node = svg.selectAll("g.node")
    //.data(nodesCopy)
    //.enter()
    //.append("svg:g")
    //.attr("id", function(d) {return "nodeCopy-" + d.key;})
    //.attr("class", "nodeCopy") //target and source are added by the css
    //.attr("transform", function(d) {
        //return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

    ////circle is part node
    //node.append("circle")
        //.attr("r", function(d) {return 3})
        //.on("mouseover", mouseover)
        //.on("mouseout", mouseout)
        //.on("click", nodeClick);
//END DEBUGGING

//node = svg.selectAll("g.node")
    //.data(nodes_flip.filter(filterRoot))
    //.enter()
    //.append("svg:g")
    //.attr("id", function (d) { return "node-" + d.key; })
    //.attr("class", "node"); target and source are added by the css
    //.attr("transform", function(d) {
        //return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

//nodes_flip = [];
//for (var i = 0; i < nodes.length; i += 1) {
    //nodes_flip[i] = Object.create(nodes[i]); nodes_flip inherits from nodes
    //nodes_flip[i].y = 25 * (20 - nodes_flip[i].depth); overrides y value
    //nodes[i].y -= 30;
//}
//

//function () {
    //selected_nodes.forEach(function (d) {
        //svg.select("#arc-" + d.key).classed("selected-source", false);
        //svg.select("#text-" + d.key).classed("source", false);
    //});
    //selected_nodes = [];
    //var inputRegion = this.value.toLowerCase();
    //console.log(inputRegion);
    //display_node_map.forEach(function (d) {
        //if (d.name === inputRegion) {
            //selected_nodes.push(d.node);
            //svg.select("#arc-" + d.node.key).classed("selected-source", true);
            //svg.select("#text-" + d.node.key).classed("source", true);
            //svg.select("#tooltip-" + d.node.key).classed("hidden", false);
        //}
    //});
//}

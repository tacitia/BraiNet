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

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


/*
 * Search Input
 * Deprecated
 *
function regionSearchInput() {
    selected_nodes.forEach(function (d) {
        highlightNode(d.node, "selected-source", false, true);
    });
    selected_nodes = [];
    var inputRegion = this.value.toLowerCase();
    display_node_map.forEach(function (d) {
        if (d.name == inputRegion) {
            selected_nodes.push(d.node);
            highlightNode(d.node, "selected-source", true, true);
        }
    });
}
*/

/*
function highlightNode(node, className, value, fixed) {
    svg.select("#arc-" + node.key).classed(className, value);

    if (node.depth > 2) {
        svg.select("#text-" + node.key).classed(className, value);
        if (fixed) {
            svg.select("#tooltip-" + node.key).classed("hidden", false);
            svg.select("#tooltip-" + node.key).classed("selected-hidden", !value);
        }
        else {
            if (!isSelected(node)) {
                svg.select("#tooltip-" + node.key).classed("hidden", !value);
            }
        }
    }
}

function focusOnNode(node, value, fixed) {
    svg.selectAll("path.link.target-" + node.key)
        .classed("target", value)
        .classed("dimmed", fixed ? value : false)
        .classed("fixed", fixed ? value : false)
        .each(function(d) {highlightNode(d.source, "source", value, fixed)});

    svg.selectAll("path.link.source-" + node.key)
        .classed("source", value)
        .classed("dimmed", fixed ? value : false)
        .classed("fixed", fixed ? value : false)
        .each(function(d) {highlightNode(d.target, "target", value, fixed)});

    svg.selectAll("path.link.bi-" + node.key)
        .classed("bi", value)
        .classed("dimmed", fixed ? value : false)
        .classed("fixed", fixed ? value : false)
        .each(function(d) {highlightNode(d.source, "bi", value, fixed);
                            highlightNode(d.target, "bi", value, fixed);});

    highlightNode(node, "selected", value, fixed);
}
*/



// Old code for appending textual display for links
/*
        for (var i = 0; i < grouped_selected_links.length; ++i) {
            if (i != (max_hop-1)) continue;
            connectionPanel.append('<h4 style="position:absolute; left:20px; top:30px">Level of indirection: ' + i + '</h4></br>');
            var currPanel = $('<div id=conn-hop' + (i+1) + '" class="conn-level1' + '></div>').appendTo(connectionPanel);
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
                    button.on("click", function() {
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
        }
*/
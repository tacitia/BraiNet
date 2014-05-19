// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.force = (function($, undefined) {

	var doms = {
		canvas: '#force-pane .canvas',
		regionName: '#force-pane .svg-controller #region-name',
        upButton: '#force-pane .svg-controller #upButton',
        downButton: '#force-pane .svg-controller #downButton',
        removeButton: '#force-pane .svg-controller #removeButton',
        anatomyButton: '#force-pane .svg-controller #anatomyButton'
	};
	
	var settings = {};
	settings.vis = {
		width: 550,
		height: 550
	};
	// TODO: The settings below should be exposed to the users later
	settings.hideIsolated = true;
	settings.regionSelectLinkedOnly = true; // Only display nodes that are connected to the node being searched for
	settings.showAllRegionAtInit = false;
	
	var state = {
		mode: 'exploration', //Three possible values for mode: exploration, search, and fixation
		selectedNode: null,
		ignoredNodes: [],
		datasetId: null,
        source: null,
        target: null,
        paths: null
	};
	
	var data = {
		nodes: null,
		links: null,
		activeNodes: null,
		activeLinks: null
	};
	
	var svgGens = {
		palette: null
	};
	
	var svgObjs = {
		canvas: null,
		links: null,
		force: null,
		noSearchMsg: null
	};

	var init = function() {
		svgGens.palette = d3.scale.category20b();

		svgObjs.canvas = d3.select(doms.canvas)
				.attr('width', settings.vis.width)
				.attr('height', settings.vis.height)
				.append('g');

        $(doms.upButton).click(upButtonClick);
        $(doms.downButton).click(downButtonClick);
        $(doms.removeButton).click(removeButtonClick);
        $(doms.anatomyButton).click(anatomyButtonClick);

        $(doms.upButton).qtip({
            content: 'Up one level in the anatomical hierarchy (or press ALT while clicking)'
        });
        $(doms.downButton).qtip({
            content: 'Down one level in the anatomical hierarchy (or press META/Command Key/Windows Key while clicking)'
        });
        $(doms.removeButton).qtip({
            content: 'Remove a brain region from display (or press SHIFT while clicking)'
        });
        $(doms.anatomyButton).qtip({
            content: 'Highlight the selected brain region in the anatomical view'
        });

        console.log('Force view initialized.');
	};
	
	var render = function(d, datasetId) {
		data.nodes = d.nodes;
		data.links = d.links;
		state.datasetId = datasetId;
		// Initialize data.activeNodes to contain the top level nodes
		if (settings.showAllRegionAtInit) {
			initActiveElements();
			updateLayout();
		}
		else {
			displayNoSearchMessage();
		}
		console.log("Force view rendered.");
		amplify.publish('renderComplete');
	};

	var clearCanvas = function() {
		svgObjs.canvas.selectAll('.node').remove();
		svgObjs.canvas.selectAll('.link').remove();
	};
	
	/* SVG Objects Interaction */
	
	var nodeClick = function(d) {
		// Fix on the clicked node
		if (state.mode === 'exploration') {
			state.selectedNode = d;
			state.mode = 'fixation';
            highlightPath(d);
			svg.circular.showRegion(d.pk);
			svg.circular.selectRegion(d);
			util.action.add('select region in force view', {region: d.fields.name});
		}
		else if (state.mode === 'fixation') {
			state.selectedNode = null;
			state.mode = 'exploration';
            clearAllHighlight();
			svg.circular.deselectRegion(d);
		}
/*		else if (state.mode === 'search') {
			state.selectedNode === null ? state.selectedNode = d : state.selectedNode = null;		
		} */
	};
	
	// When mousing over, highlight itself and the neighbors
	var nodeMouseOver = function(node) {
		console.log(node);
		$(doms.regionName).text(node.fields.name);
		if (state.mode === 'fixation' && state.selectedNode !== null) { return; }
//		if (state.mode === 'search' && state.selectedNode !== null) { return; }
  		highlightNode(node, false);
	};

	var nodeMouseOut = function(node) {
		$(doms.regionName).text('');
		if (state.mode === 'fixation' && state.selectedNode !== null) { return; }
//		if (state.mode === 'search' && state.selectedNode !== null) { return; }
		highlightNode(node, true);
	};

	var linkClick = function(link) {
		svg.linkAttr.render(link);
		ui.linkInfo.displayLinkInfo(link);	
	};

	var linkMouseOver = function(link) {

		if (state.mode === 'fixation') { return; }
		svgObjs.canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				return d.pk !== link.derived.source.pk && d.pk !== link.derived.target.pk;
			});
		svgObjs.canvas.selectAll('.link')
			.classed('hidden', function(d) {
				return d.pk !== link.pk;
			});
	};
	
	var linkMouseOut = function(link) {
		if (state.mode === 'fixation') { return; }
//		if (state.mode === 'search') { return; }
		svgObjs.canvas.selectAll('.node').classed('nofocus', false);
		svgObjs.canvas.selectAll('.link').classed('hidden', false);
	};

    var upButtonClick = function(e) {
        e.preventDefault();
        var n = state.selectedNode;
        if (n === null) { return; }
        var parent = n.derived.parent;
        if ($.inArray(parent, svg.model.searchNodes()) < 0) { return; } // Ignore top level nodes
        var nodesToRemove = [];
        for (var i in data.activeNodes) {
            var sub = data.activeNodes[i];
            if (sub.derived.parent.pk === parent.pk) {
                nodesToRemove.push(sub);
            }
        }
        clearAllHighlight();
        combineRegions(parent, nodesToRemove);
        state.mode = 'exploration';
        util.action.add('go up in the hierarchy in force view', {region: n.fields.name});
    };

    var downButtonClick = function(e) {
        e.preventDefault();
        var n = state.selectedNode;
        if (n === null) { return; }
        var searchNodes = svg.model.searchNodes();
        var children = [];
        for (var i in searchNodes) {
            var sn = searchNodes[i];
            if (sn.fields.parent_id === n.pk) {
                children.push(sn);
            }
        }
        clearAllHighlight();
        expandRegion(n, children);
        state.mode = 'exploration';
        util.action.add('go down in the hierarchy in force view', {region: state.selectedNode.fields.name});
    };

	var removeButtonClick = function() {
		var n = state.selectedNode;
		if (n === null) { return; }
		// remove the selected node and associated links from svgData.circularNodes/circLinks
		var nodes = data.activeNodes;
		var links = data.activeLinks;
		nodes.splice($.inArray(n, nodes), 1);
		var linkLength = links.length;
		while (linkLength--) {
			var l = links[linkLength];
			if (l.derived.source === n || l.derived.target === n) {
				links.splice(linkLength, 1);
			}
		}
		var newNum = nodes.length;
		clearAllHighlight();
		updateLayout(newNum, 2 * Math.PI / newNum);
		// add the selected node to black list
		state.ignoredNodes.push(n);
		n.circular.isIgnored = true;
		state.mode = 'exploration';	
		// Todo: have a list that displays the removed nodes, so that the user can 
		// add them back when needed
	};

    var anatomyButtonClick = function() {
        svg.anatomy.selectStructure(state.selectedNode.fields.name, false);
        util.action.add('update anatomical slice from the force view', {region: state.selectedNode.fields.name})
    };
	
	 /* End of SVG Objects Interaction */
	
	/* Canvas Update */

    var updateForceElements = function() {

        var forceNodes = svgObjs.force.nodes();
        var forceLinks = svgObjs.force.links();
        // Copy source and target into top level of the links
        console.log('check active link format');
        for (var i in forceLinks) {
            var l = forceLinks[i];
            l.source = $.inArray(l.derived.source, forceNodes);
            l.target = $.inArray(l.derived.target, forceNodes);
        }

        var link = svgObjs.canvas.selectAll(".force.link")
            .data(forceLinks, function(d) { return d.pk; });

        var node = svgObjs.canvas.selectAll(".force.node")
            .data(forceNodes, function(d) { return d.pk; });

        link.enter().append("svg:line")
            .attr("class", "force link")
            .style("stroke-width", 1)
            .attr('stroke', '#ccc')
            .attr('stroke-width', function(d) {
                return Math.min(10, 1 + Math.ceil(d.derived.leaves.length / 50)) + 'px';
            })
            .on('click', linkClick)
            .on('mouseover', linkMouseOver)
            .on('mouseout', linkMouseOut);

        node.enter().append("svg:circle")
            .attr("class", "force node")
            .attr('id', function(d) { return 'force-node-' + d.pk; })
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", function(d) { return (d === state.source || d === state.target) ? 20 : 10; })
            .style("fill", function(d) {return d.derived.color;})
            .on('click', nodeClick)
            .on('mouseover', nodeMouseOver)
            .on('mouseout', nodeMouseOut)
            .call(svgObjs.force.drag);


        node.exit().remove();
        link.exit().remove();


        svgObjs.force.on("tick", function() {

            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

        });

        svgObjs.force.start();
    };

	var updateLayout = function(source, target) {
		//this should be incorporated in the node data
		var numGroup = 0;
		var groupCount = {};

		// Set the selected source and selected target to have fixed positions, and 
		// set their locations
		data.activeNodes.forEach(function(d) {
			if (!groupCount[d.derived.group]) {
				++numGroup;
				groupCount[d.derived.group] = [numGroup, 1];
			} else {
				//increase group size
				groupCount[d.derived.group][1] += 1;
			}
			if (source !== undefined && d.pk === source.pk) {
				d.fixed = true;
				d.x = 100;
				d.y = 280;
			}
			else if (target !== undefined && d.pk === target.pk) {
				d.fixed = true;
				d.x = 500;
				d.y = 280;
			}
			else {
				d.fixed = false;
			}
		});

		
		// Copy source and target into top level of the links
		console.log('check active link format');
		for (var i in data.activeLinks) {
			var l = data.activeLinks[i];
			l.source = $.inArray(l.derived.source, data.activeNodes);
			l.target = $.inArray(l.derived.target, data.activeNodes);
		}
		
		var gravity = 1;
		var charge = -12000;
		var showAll = true;
		
		if (source !== undefined && target !== undefined) {
			gravity = 0.5;
			charge = -6000;
			showAll = false;
		}


		svgObjs.force = d3.layout.force()
				  .nodes(data.activeNodes)
				  .links(data.activeLinks)
				  .size([settings.vis.width, settings.vis.height])
				  //still needs work - link distance determined by group size and if
				  //connection are internal
				  .linkDistance(function(l) {
					  var s = groupCount[l.source.derived.group];
					  var t = groupCount[l.target.derived.group];
					  return showAll 
					  ? 10 
					  : 10 * Math.max(l.source.derived.group != l.target.derived.group ? s[1] : 2/s[1],
										l.source.derived.group != l.target.derived.group ? t[1] : 2/t[1]) + 20;
				  })
				  .linkStrength(0.3)
	              .gravity(gravity)
				  .charge(charge)
				  .friction(0.5);

		// Clear up visual elements from previous search
		svgObjs.canvas.selectAll('.link').remove();
		svgObjs.canvas.selectAll(".node").remove();
	
		var link = svgObjs.canvas.selectAll(".force.link")    
			   .data(data.activeLinks, function(d) { return d.pk; })
		   .enter().append("svg:line")
		   .attr("class", "force link")
		   .style("stroke-width", 1)
		   .attr('stroke', '#ccc')
		   .attr('stroke-width', function(d) { 
				return Math.min(10, 1 + Math.ceil(d.derived.leaves.length / 50)) + 'px'; 
		   })
		   .on('click', linkClick)
		   .on('mouseover', linkMouseOver)
		   .on('mouseout', linkMouseOut);


		var node = svgObjs.canvas.selectAll(".force.node")
		   .data(data.activeNodes, function(d) { return d.pk; })
		   .enter().append("svg:circle")
		   .attr("class", "force node")
		   .attr('id', function(d) { return 'force-node-' + d.pk; })
		   .attr("cx", function(d) { return d.x; })
		   .attr("cy", function(d) { return d.y; })
		   .attr("r", function(d) { return (d === source || d === target) ? 20 : 10; })
		   .style("fill", function(d) {return d.derived.color;})
		   .on('click', nodeClick)
		   .on('mouseover', nodeMouseOver)
		   .on('mouseout', nodeMouseOut);
		   
		node.call(svgObjs.force.drag);

/*		node.call(svgObjs.force.drag().origin(function() {
        			var t = d3.transform(d3.select(this).attr("transform")).translate;
        			return {x: t[0], y: t[1]};
    			}).on("drag.force", function() {
        			svgObjs.force.stop();
        			d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
    			})); */

		svgObjs.force.on("tick", function() {
			  // To bundle nodes without links (useful)
			  /*
			  var k = 8 * e.alpha;

			  active_data_nodes_force.forEach(function(o) {
				  o.x += groupCount[o.group][0] * k;
				  o.y += groupCount[o.group][0] * -k;
			  });
			  */

			 link.attr("x1", function(d) { return d.source.x; })
				 .attr("y1", function(d) { return d.source.y; })
				 .attr("x2", function(d) { return d.target.x; })
				 .attr("y2", function(d) { return d.target.y; });

			 node.attr("cx", function(d) { return d.x; })
				 .attr("cy", function(d) { return d.y; }); 

		});
		
		svgObjs.force.start();
		
		if (showAll) {
			for (var i = 0; i < 500; ++i) {
				svgObjs.force.tick();
			}
			svgObjs.force.stop();
		}

//		createNodeTooltips(); 
	};

    var highlightPath = function(d) {
        console.log('inside highlightPath');
        console.log(state.paths);
        clearAllHighlight();
        // 1. Find out all the paths involving d
        var nodePks = [state.source.pk, state.target.pk];
        var linkPks = [];
        var maps = svg.model.maps();
        for (var i in state.paths) {
            var p = state.paths[i];
            if ($.inArray(d.pk, p) >= 0) {
                for (var j in p) {
                    j = parseInt(j);
                    var nKey = p[j];
                    if ($.inArray(nKey, nodePks) < 0) { nodePks.push(nKey); }
                    // Special treatments for the first and last node in the path
                    if (j === 0) {
                        var linkKey = state.source.pk + '_' + nKey;
                        var l = maps.nodeToLink[linkKey];
                        if ($.inArray(l.pk, linkPks) < 0) { linkPks.push(l.pk); }
                    }
                    var nNextKey = null;
                    if (j === p.length-1) {
                        nNextKey = state.target.pk;
                    }
                    else {
                        nNextKey = p[j+1];
                    }
                    var linkKey = nKey + '_' + nNextKey;
                    var l = maps.nodeToLink[linkKey];
                    if ($.inArray(l.pk, linkPks) < 0) { linkPks.push(l.pk); }
                }
            }
        }
        // 2. Highlight all the nodes and links on those paths
        var canvas = svgObjs.canvas;
        canvas.selectAll('.link')
            .classed('biLink', function(d) {
                var reversedLink = maps.nodeToLink[d.fields.target_id + '_' + d.fields.source_id];
                return $.inArray(d.pk, linkPks) >= 0 && (reversedLink === undefined || $.inArray(reversedLink.pk, linkPks) >= 0);
            });
        canvas.selectAll('.link')
            .classed('outLink', function(d) {
                var reversedLink = maps.nodeToLink[d.fields.target_id + '_' + d.fields.source_id];
                return $.inArray(d.pk, linkPks) >= 0 && (reversedLink === undefined || $.inArray(reversedLink.pk, linkPks) < 0);
            });
        canvas.selectAll('.link')
            .classed('hidden', function(d) {
                return $.inArray(d.pk, linkPks) < 0;
            });
        canvas.selectAll('node')
            .classed('nofocus', function(d){
                return $.inArray(d.pk, nodePks) < 0;
            });
        canvas.selectAll('node')
            .classed('highlight', function(d) {
                return $.inArray(d.pk, nodePks) >= 0;
            });
    };

	var highlightNode = function(node, isCancel) {
		var canvas = svgObjs.canvas;
		var maps = svg.model.maps();
	
		if (isCancel) {
			clearAllHighlight();
			return;
		}
		canvas.selectAll('.link')
			.classed('hidden', function(d) {
				return d.derived.source.pk !== node.pk && d.derived.target.pk !== node.pk; 
			});
		canvas.selectAll('.link')
			.classed('outLink', function(d) {
				var revertedLink = maps.nodeToLink[d.derived.target.pk + '_' + d.derived.source.pk];
				return d.derived.source.pk === node.pk && revertedLink === undefined;
			});
		canvas.selectAll('.link')
			.classed('inLink', function(d) {
				var revertedLink = maps.nodeToLink[d.derived.target.pk + '_' + d.derived.source.pk];
				return d.derived.target.pk === node.pk && revertedLink === undefined;
			});
		canvas.selectAll('.link')
			.classed('biLink', function(d) {
				var revertedLink = maps.nodeToLink[d.derived.target.pk + '_' + d.derived.source.pk];
				return revertedLink !== undefined;
			});
		canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				var dKey = d.pk;
				var nodeKey = node.pk;
				var inNeighbors = maps.keyToInNeighbors[nodeKey];
				var outNeighbors = maps.keyToOutNeighbors[nodeKey];
				return dKey !== nodeKey && ($.inArray(dKey, inNeighbors) < 0) &&
					($.inArray(dKey, outNeighbors) < 0);
			});   	
		canvas.selectAll('.node')
			.classed('highlight', function(d) {
				return d.pk === node.pk;
			});  
	};

	var highlightInput = function(id, node, isCancel) {
		svgObjs.canvas.select('#force-node-' + node.pk)
			.classed('selected-' + id, !isCancel);
	};
	
	// Display a node and set it as in focus
	var showRegion = function(regionPk) {	
		var maps = svg.model.maps();
		svgObjs.canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				return d.pk !== regionPk;
			});
		svgObjs.canvas.selectAll('.node')
			.classed('highlight', function(d) {
				return d.pk === regionPk;
			});
		svgObjs.canvas.selectAll('.link').classed('hidden', true);
	};
	
	var showRegionMulti = function(regionPks) {
		var maps = svg.model.maps();
		svgObjs.canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				return $.inArray(d.pk, regionPks) < 0;
			});
		svgObjs.canvas.selectAll('.node')
			.classed('highlight', function(d) {
				return $.inArray(d.pk, regionPks) >= 0;
			});
		svgObjs.canvas.selectAll('.link').classed('hidden', true);
	};
	
	var resetRegion = function(regionPk) {
		var maps = svg.model.maps();
		var region = maps.keyToNode[regionPk];
		region.circular.fixed = false;
		svgObjs.canvas.selectAll('.node').classed('nofocus', false);
		svgObjs.canvas.selectAll('.link').classed('hidden', false);
		$('#circ-node-' + region.pk).qtip('hide');	
	};
	
	var clearAllHighlight = function() {
		svgObjs.canvas.selectAll('.node').classed('nofocus', false);
		svgObjs.canvas.selectAll('.node').classed('highlight', false);
		svgObjs.canvas.selectAll('.link').classed('hidden', false);
		svgObjs.canvas.selectAll('.link').classed('inLink', false);
		svgObjs.canvas.selectAll('.link').classed('outLink', false);
		svgObjs.canvas.selectAll('.link').classed('biLink', false);
		$('.node').qtip('hide');
	};
	
	var displaySearchResult = function(source, target, paths) {
        state.mode = 'exploration';
//		state.mode = 'search';
		state.selectedNode = null;
        state.source = source;
        state.target = target;
        state.paths = paths;
		removeNoSearchMessage();
		populateActiveElements();
		updateLayout(source, target);		
	};

	var clearSearchResult = function() {
		reset();
	};
	
	var displayNoSearchMessage = function() {
		svgObjs.noSearchMsg = d3.select(doms.canvas)
								.append('g')
								.attr('transform', 'translate(180,300)')
								.append('svg:text')
								.text('No active search')
								.attr('font-size', 30)
								.attr('fill', 'lightgray')
								.attr('id', 'noSearchMsg');
	};
	
	var removeNoSearchMessage = function() {
		d3.select('#noSearchMsg').remove();
	};
	
	var reset = function() {
		console.log('Reset force');
		state.mode = 'exploration';
		clearCanvas();
        state.selectedNode = null;
        state.source = null;
        state.target = null;
		if (settings.showAllRegionAtInit) {
			initActiveElements();
			updateLayout();
		}
		else {
			displayNoSearchMessage();
		}
		amplify.publish('resetComplete');
	};
	
	var selectRegion = function(node) {
		state.mode = 'fixation';
		state.selectedNode = node;
		clearAllHighlight();
		highlightNode(node, false);
	};
	
	var deselectRegion = function(node) {
		state.mode = 'exploration';
		state.selectedNode = null;
		clearAllHighlight();
	};
	
	/* End of Canvas Update*/
	
	/* SVG Data Update */
	
	var initActiveElements = function() {
		data.activeNodes = [];
		data.activeLinks = [];
		if (!settings.showAllRegionAtInit) { return; }
		var minDepth = window.settings.dataset[state.datasetId].minDepth;
		for (var i in data.nodes) {
			var n = data.nodes[i];
			if (n.fields.depth >= minDepth && (!settings.hideIsolated || !n.derived.isIsolated)) {
				data.activeNodes.push(n);
			}
		}
		for (var i in data.links) {
			var l = data.links[i];
			if (!l.derived.isDerived && l.derived.source.fields.depth >= minDepth && l.derived.target.fields.depth >= minDepth) {
				data.activeLinks.push(l);
			}
		}
	};

	var populateActiveElements = function() {
		data.activeNodes = [];
		data.activeLinks = [];
		var searchNodes = svg.model.searchNodes();
		var searchLinks = svg.model.searchLinks();
		for (var i in searchNodes) {
			var n = searchNodes[i];
			data.activeNodes.push(n);
			n.force.isActive = true;
		}
		for (var i in searchLinks) {
			var l = searchLinks[i];
			data.activeLinks.push(l);
			l.force.isActive = true;
		}
	};
	
	var assignColor = function() {
		var pks = [];
		for (var i = 0; i < data.activeNodes.length; ++i) {
			pks.push(data.activeNodes[i].pk);
		}
		svgGens.palette.domain(pks);
	};

	var combineRegions = function(newNode, nodesToRemove) {
        var forceNodes = svgObjs.force.nodes();
        var forceLinks = svgObjs.force.links();
		// 1. add new node to and remove old nodes from active nodes
        var nodeLength = forceNodes.length;
        while (nodeLength--) {
            var n = forceNodes[nodeLength];
            n.fixed = true;
            if ($.inArray(n, nodesToRemove) > -1) {
                n.force.isActive = false;
                forceNodes.splice(nodeLength, 1);
            }
        }
        forceNodes.push(newNode);
        newNode.force.isActive = true;
        newNode.fixed = false;
        // 2. remove old links
        var linkLength = forceLinks.length;
        while (linkLength--) {
            var l = forceLinks[linkLength];
            if ($.inArray(l.derived.source, nodesToRemove) > -1 || $.inArray(l.derived.target, nodesToRemove) > -1) {
                l.force.isActive = false;
                forceLinks.splice(linkLength, 1);
            }
        }
        // 3. add new links
        var searchLinks = svg.model.searchLinks();
        for (var i in searchLinks) {
            var l = searchLinks[i];
            if (l.derived.source.pk === newNode.pk && $.inArray(l.derived.target, forceNodes) > -1 ||
                l.derived.target.pk === newNode.pk && $.inArray(l.derived.source, forceNodes) > -1) {
                l.force.isActive = true;
                forceLinks.push(l);
            }
        }
		// Update the layout
        updateForceElements();
	};

	var expandRegion = function(d, sub) {
        // 0. compute new links added due to the expansion
        var forceNodes = svgObjs.force.nodes();
        var forceLinks = svgObjs.force.links();
        var searchLinks = svg.model.searchLinks();
        var newLinks = [];
        for (var i in searchLinks) {
            var l = searchLinks[i];
            if (($.inArray(l.derived.source, sub) >= 0 && $.inArray(l.derived.target, forceNodes) >= 0) ||
                ($.inArray(l.derived.target, sub) >= 0 && $.inArray(l.derived.source, forceNodes) >= 0)) {
                l.force.isActive = true;
                newLinks.push(l);
            }
        }
        if (newLinks.length === 0) {
            return;
            // TODO: notify the user that there is no more sub-connections and the region will therefore not be expanded
        }
        // 1. remove the original node from active nodes and add the new ones into it
        var index = $.inArray(d, forceNodes);
        forceNodes[index].force.isActive = false;
        forceNodes.splice(index, 1);
        for (var i in forceNodes) {
            var en = forceNodes[i];
//            en.fixed = true;
        }
        for (var i in sub) {
            var subn = sub[i];
            subn.force.isActive = true;
//            subn.fixed = false;
            subn.x = d.x;
            subn.y = d.y;
            subn.px = d.px;
            subn.py = d.py;
            forceNodes.push(subn);
        }
        // 2. remove links associated with the original node
        var linkLength = forceLinks.length;
        while (linkLength--) {
            var l = forceLinks[linkLength];
            if (l.fields.source_id === d.pk || l.fields.target_id === d.pk) {
                forceLinks[linkLength].force.isActive = false;
                forceLinks.splice(linkLength, 1);
            }
        }
        // 3. add links associated with the new nodes
        for (var i in newLinks) {
            forceLinks.push(newLinks[i]);
        }
        // 4. cache new links
        svg.model.cacheSubConnections(newLinks);
        updateForceElements();
	};

	var displayNode = function(node) {
		console.log('displaying');
		console.log(node);
		var maps = svg.model.maps();
		if (!node.circular.isActive) {
			var parent = findActiveParent(node);
			// In this case, the input is on a level higher than the visible nodes
			if (parent === undefined) {
				var activeDescs = findActiveDescends(node);
				combineRegions(node, activeDescs);
			}
			else {
				var siblings = findDescAtDepth(parent, node.fields.depth);
				if (settings.regionSelectLinkedOnly) {
					var inNeighbors = maps.keyToInNeighbors[node.pk];
					var outNeighbors = maps.keyToOutNeighbors[node.pk];
					var length = siblings.length;
					while (length--) {
						var n = siblings[length];
						if (n !== node && $.inArray(n, inNeighbors) < 0 && $.inArray(n, outNeighbors) < 0) {
							siblings.splice(length, 1);	
						}
					}
				}
				expandRegion(parent, siblings);
			}
		}
	};
	
	var removeDisconnectedNode = function(node) {
		var maps = svg.model.maps();
		var inNeighbors = maps.keyToInNeighbors[node.pk];
		var outNeighbors = maps.keyToOutNeighbors[node.pk];
		var length = data.activeNodes.length;
		while (length--) {
			var n = data.activeNodes[length];
			console.log(n);
			if (n !== node && $.inArray(n.pk, inNeighbors) < 0 && $.inArray(n.pk, outNeighbors) < 0) {
				data.activeNodes.splice(length, 1);
			}
		}
		var length = data.activeLinks.length;
		while (length--) {
			var l = data.activeLinks[length];
			if (l.derived.source !== node && l.derived.target !== node) {
				data.activeLinks.splice(length, 1);
			}
		}
		console.log(data.activeNodes);
		var newNum = data.activeNodes.length;
		var newDelta = 2 * Math.PI / newNum;
		updateLayout(newNum, newDelta);
	};

	var removeDisconnectedNodeMulti = function(nodes) {
		var maps = svg.model.maps();
		var neighbors = [];
		for (i in node) {
			neighbors = $.merge(neighbor, maps.keyToInNeighbors[nodes[i].pk]);
			neighbors= $.merge(neighbors, maps.keyToOutNeighbors[nodes[i].pk]);
		}
		var length = data.activeNodes.length;
		while (length--) {
			var n = data.activeNodes[length];
			console.log(n);
			if (n !== node && $.inArray(n.pk, neighbors) < 0) {
				data.activeNodes.splice(length, 1);
			}
		}
		var length = data.activeLinks.length;
		var toRemove = true;
		while (length--) {
			var l = data.activeLinks[length];
			for (i in nodes) {
				if (l.derived.source === node[i] || l.derived.target === node[i]) {
					toRemove = false;
				}
			}
			if (toRemove) {
				data.activeLinks.splice(length, 1);
			}
		}
		console.log(data.activeNodes);
		var newNum = data.activeNodes.length;
		var newDelta = 2 * Math.PI / newNum;
		updateLayout(newNum, newDelta);
	};


	/* End of SVG Data Update */
	
	/* Computation */

	var findActiveParent = function(node) {
		var maps = svg.model.maps();
		var result = node;
		while (result !== undefined && result !== null) {
			if (result.circular.isActive) {
				return result;
			}
			result = result.derived.parent;
		}
		return result;
	};

	var findActiveDescends = function(node) {
		var numActiveNodes = data.activeNodes.length;
		var nodeMap = svg.model.maps().keyToNode;
		var results = [];
		for (var i = 0; i < numActiveNodes; ++i) {
			var n = data.activeNodes[i];
			var parent = n.derived.parent;
			if (parent === undefined) { continue; }
			// Check if the input node is a parent of the current active node
			while (parent !== undefined && parent !== null) {
				if (parent === node) {
					results.push(n);
					break;
				}
				parent = parent.derived.parent;
			}
		}
		return results;
	};

	var findDescAtDepth = function(node, depth) {
		var maps = svg.model.maps();
		var result = [node];
		while (result.length > 0 && result[0].fields.depth < depth) {
			var n = result[0];
			var children = n.derived.children;
			var childNum = children.length;
			for (var i = 0; i < childNum; ++i) {
				result.push(maps.keyToNode[children[i]]);
			}
			result.splice(0, 1);
		}
		return result;
	};
	
	var findAllDesc = function(node) {
		var result = [];
		var maps = svg.model.maps();
		var children = $.merge([], node.derived.children);
		var nodeMap = maps.keyToNode;
		while (children.length > 0) {
			var childNum = children.length;
			for (var i = 0; i < childNum; ++i) {
				var child = nodeMap[children[i]];
				result.push(child);
				$.merge(children, child.derived.children);
			}
			children.splice(0, child_num);
		}
		return result;
	}
	
	var setMode = function(m) {
		state.mode = m;
	};
	
	var isActiveForceNode = function(n) {
		return $.inArray(n, data.activeNodes) < 0;
	};
	var isActiveForceLink = function(l) {
		return $.inArray(l, data.activeLinks) < 0;
	};

	/* End of Computation */

	return {
		init: init,
		render: render,
		showRegion: showRegion,
		setMode: setMode,
		highightNode: highlightNode,
		highlightInput: highlightInput,
		findAllDesc: findAllDesc,
		populateActiveElements: populateActiveElements,
		isActiveForceNode: isActiveForceNode,
		isActiveForceLink: isActiveForceLink,
		updateLayout: updateLayout,
		reset: reset,
		clearAllHighlight: clearAllHighlight,
		selectRegion: selectRegion,
		deselectRegion: deselectRegion,
		displaySearchResult: displaySearchResult,
		clearSearchResult: clearSearchResult
	};

}(jQuery));

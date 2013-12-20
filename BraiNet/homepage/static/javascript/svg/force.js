// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.force = (function($, undefined) {

	var doms = {
		canvas: '#force-pane .canvas',
		controller: '#circular-pane .svg-controller',
		regionName: '#force-pane .svg-controller #region-name'
	};
	
	var settings = {};
	settings.vis = {
		width: 600,
		height: 600
	};
	// TODO: The settings below should be exposed to the users later
	settings.hideIsolated = true;
	settings.regionSelectLinkedOnly = true; // Only display nodes that are connected to the node being searched for
	
	var state = {
		mode: 'exploration', //Three possible values for mode: exploration, search, and fixation
		selectedNode: null,
		ignoredNodes: [],
		datasetId: null
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
		force: null
	};

	var init = function() {
		svgGens.palette = d3.scale.category20b();

		svgObjs.canvas = d3.select(doms.canvas)
				.attr('width', settings.vis.width)
				.attr('height', settings.vis.height)
				.append('g');

		console.log('Force view initialized.');
	};
	
	var render = function(d, datasetId) {
		data.nodes = d.nodes;
		data.links = d.links;
		state.datasetId = datasetId;
		// Initialize data.activeNodes to contain the top level nodes
		initActiveElements();
		updateLayout();
		console.log("Force view rendered.");
		amplify.publish('renderComplete');
	};

	var clearCanvas = function() {
		svgObjs.canvas.selectAll('.node').remove();
		svgObjs.canvas.selectAll('.link').remove();
	}
	
	/* SVG Objects Interaction */
	
	var nodeClick = function(d) {
		// Fix on the clicked node
		if (state.mode === 'exploration') {
			state.selectedNode = d;
			state.mode = 'fixation';
			svg.circular.showRegion(d.pk);
			svg.circular.selectRegion(d);
		}
		else if (state.mode === 'fixation') {
			state.selectedNode = null;
			state.mode = 'exploration';
			svg.circular.deselectRegion(d);
		}
		else if (state.mode === 'search') {
			state.selectedNode === null ? state.selectedNode = d : state.selectedNode = null;		
		}
		if (window.event.shiftKey === true) {
			removeButtonClick();
		}
		if (window.event.metaKey === true) {
			downButtonClick();
		}
		if (window.event.altKey === true) {
			upButtonClick();
		}
	};
	
	// When mousing over, highlight itself and the neighbors
	var nodeMouseOver = function(node) {
		console.log(node);
		$(doms.regionName).text(node.fields.name);
		if (state.mode === 'fixation') { return; }
		if (state.mode === 'search' && state.selectedNode !== null) { return; }
  		highlightNode(node, false);
	};

	var nodeMouseOut = function(node) {
		$(doms.regionName).text('');
		if (state.mode === 'fixation') { return; }
		if (state.mode === 'search' && state.selectedNode !== null) { return; }
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
		if (state.mode === 'search') { 
			return; 
		}
		svgObjs.canvas.selectAll('.node').classed('nofocus', false);
		svgObjs.canvas.selectAll('.link').classed('hidden', false);
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
	
	 /* End of SVG Objects Interaction */
	
	/* Canvas Update */
	
	var updateNodes = function() {
		svgObjs.canvas.selectAll(".node")
			.data(data.activeNodes, function(d) {return d.pk;})
			.transition()
			.duration(1000)
			.attr("d", svgGens.arcs);

		svgObjs.canvas.selectAll('.mark')
			.data(data.activeNodes, function(d) {return d.pk;})
			.transition()
			.duration(1000)
			.attr('cx', function(d) { return d.circular.x; })
			.attr('cy', function(d) { return d.circular.y; });
	};

	var updateLinks = function() {
		var links = svgObjs.canvas.selectAll(".link")
			.data(data.activeLinks, function(d) {return d.pk;});
		
		links.transition()
			.duration(1000)
			.attr("d", function(d) {
					var coors = [{x: d.derived.source.circular.x, y:d.derived.source.circular.y}, 
								 {x: 0, y: 0},
								 {x: d.derived.target.circular.x, y:d.derived.target.circular.y}];
					return svgGens.curves(coors);
		});
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
				d.x = 150;
				d.y = 350;
			}
			else if (target !== undefined && d.pk === target.pk) {
				d.fixed = true;
				d.x = 650;
				d.y = 350;
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
			gravity = 0;
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
				  .linkStrength(1)
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
		   .style("stroke-width", 3)
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

		node.call(svgObjs.force.drag().origin(function() {
        			var t = d3.transform(d3.select(this).attr("transform")).translate;
        			return {x: t[0], y: t[1]};
    			}).on("drag.force", function() {
        			svgObjs.force.stop();
        			d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
    			}));

		svgObjs.force.on("tick", function(e) {
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

	var enterNodes = function() {
		svgObjs.canvas.selectAll('.node')
			.data(data.activeNodes, function(d) {return d.pk;})
			.enter().append('svg:path')
			.style('fill', function(d) { return svgGens.palette(d.pk);} )
			.attr('d', svgGens.arcs)
			.attr('class', 'node')
			.attr('id', function(d) { return 'circ-node-' + d.pk; })
			.attr('title', function(d) { return d.fields.name; })
			.on('click', nodeClick)
			.on('mouseover', function(d) { nodeMouseOver(d); })
			.on('mouseout', function(d) { nodeMouseOut(d); });


		svgObjs.canvas.selectAll('.mark')
			.data(data.activeNodes, function(d) {return d.pk;})
			.enter().append('circle')
			.attr('id', function(d) { return 'circ-mark-' + d.pk; })
			.attr('class', 'mark')
			.attr('cx', function(d) { return d.circular.x; })
			.attr('cy', function(d) { return d.circular.y; })
			.attr('r', 1)
			.attr('fill', 'none')
			.attr('stroke', 'none');

	};

	var exitNodes = function() {
		svgObjs.canvas.selectAll('.node')
		   .data(data.activeNodes, function(d) {return d.pk;})
		   .exit().remove();
	}

	var exitLinks = function() {
		svgObjs.canvas.selectAll('.link')
		   .data(data.activeLinks, function(d) {return d.pk;})
		   .exit().remove();
	}
	
	var createNodeTooltips = function() {
		for (var i = 0; i < data.activeNodes.length; ++i) {
			var node = data.activeNodes[i];
			console.log('creating tooltips');
			$('#force-node-' + node.pk).qtip({
				style: {
					classes: 'qtip-bootstrap'
				},
				position: {
					my: 'bottom right',
					at: 'top left',
					target: $('#circ-node-' + node.pk),
				},
			});
		}
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
	
	var displaySearchResult = function(source, target) {
		state.mode = 'search';
		state.selectedNode = null;
		populateActiveElements();
		updateLayout(source, target);		
	};

	var clearSearchResult = function() {
		reset();
	};
	
	var reset = function() {
		console.log('Reset force');
		state.mode = 'exploration';
		clearCanvas();
		initActiveElements();
		updateLayout();
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

	var initActiveNodes = function() {
		var maps = svg.model.maps();
		// TODO: change the name of the "settings" variables so there is no conflict between the global one and 
		// the local ones
		var minDepth = window.settings.dataset[state.datasetId].minDepth;
		for (var key in maps.keyToNode) {
			var n = maps.keyToNode[key];
			if (n.fields.depth === minDepth && (!settings.hideIsolated || !n.derived.isIsolated)) {
				n.circular.isActive = true;
				data.activeNodes.push(n);
			}
		}
	};
	
	var initActiveLinks = function() {
		var maps = svg.model.maps();
		var minDepth = window.settings.dataset[state.datasetId].minDepth;
		for (var key in maps.keyToLink) {
			var l = maps.keyToLink[key];
			if (l.derived.source.fields.depth === minDepth && l.derived.target.fields.depth === minDepth) {
				data.activeLinks.push(l);
			}
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
		var maps = svg.model.maps();
		// Iterate through all the active nodes and remove the links associated 
		// with the nodes to be removed
		var nodes = data.activeNodes;
		var links = data.activeLinks;
		var numToRemove = nodesToRemove.length;
		var linkLength = links.length;
		while (linkLength--) {
			var l = links[linkLength];
			// Iterate through all the siblings and remove associated links
			for (var i = 0; i < numToRemove; ++i) {
				var d = nodesToRemove[i];
				if (l.derived.source === d || l.derived.target === d) {
					links.splice(linkLength, 1);
				}
			}
		}
		// Remove the nodes and add the parent node
		var firstPos = $.inArray(nodesToRemove[0], nodes);
		var removeFirst = nodes[firstPos];
		removeFirst.circular.isActive = false;
		newNode.circular = removeFirst.circular;
		newNode.circular.isActive = true;
		nodes[firstPos] = newNode;
		for (var i = 1; i < numToRemove; ++i) {
			var n = nodesToRemove[i];
			n.circular.isActive = false;
			var pos = $.inArray(n, nodes);
			nodes.splice(pos, 1);
		}
		// Update the positions of the nodes
		var newNum = nodes.length;
		var newDelta = 2 * Math.PI / newNum;
		// Add in links for the parent
		var newKey = newNode.pk;
		for (var i = 0; i < newNum; ++i) {
			var k = nodes[i].pk;
			var keyPair = newKey + '_' + k;
			var link = maps.nodeToLink[keyPair];
			if (link !== undefined) {
				links.push(link);
			}
			keyPair = k + '_' + newKey;
			link = maps.nodeToLink[keyPair];
			if (link !== undefined) {
				links.push(link);
			}
		}
		// Update the layout
		updateLayout(newNum, newDelta);
	};

	var expandRegion = function(d, sub) {
		var maps = svg.model.maps();
		var ans = data.activeNodes;
		var als = data.activeLinks;
		// First check the children. If no children, do nothing and return.
		var subNum = sub.length;
		if (subNum < 1) {return;}

		// Add the sub-regions of the original region that has been chosen to be expanded
		var startAngle = d.circular.startAngle;
		var endAngle = d.circular.endAngle;
		var delta = (endAngle - startAngle) / subNum;

		// Record neighbors of the node being removed
		var inNeighbors = [];
		var outNeighbors = [];
		var linkLength = als.length;
	
		// Iterate through all the active links and locate those associated with d
		// Remove the expanded node from the data nodes and the corresponding 
		// links from the data links
		while (linkLength--) {
			var l = als[linkLength];
			if (l.derived.source === d) {
				outNeighbors.push(l.derived.target);
				als.splice(linkLength, 1);
			}
			else if (l.derived.target === d) {
				inNeighbors.push(l.derived.source);
				als.splice(linkLength, 1);
			}
		}

		var pos = $.inArray(d, ans);
		ans[pos].circular.isActive = false;
	
		var inNeighborNum = inNeighbors.length;
		var outNeighborNum = outNeighbors.length;
		var oldNum = ans.length;
		var newNum = oldNum + subNum - 1;
		var newDelta = 2 * Math.PI / newNum;

		for (var i = newNum-1; i > pos; --i) {
			ans[i] = ans[i-subNum+1];
		}

		for (var i = pos; i < pos + subNum; ++i) {
			var datum = sub[i-pos];
			calculateArcPositions(datum, startAngle, delta, i-pos);
			datum.color = d.color;
			datum.circular.isActive = true;
			ans[i] = datum;
			for (var j = 0; j < inNeighborNum; ++j) {
				var neighbor = inNeighbors[j];
				var keyPair = neighbor.pk + "_" + datum.pk;
				var link = maps.nodeToLink[keyPair];
				if (link !== undefined) {
					als.push(link);
				}
			}
			for (var j = 0; j < outNeighborNum; ++j) {
				var neighbor = outNeighbors[j];
				var keyPair = datum.pk + "_" + neighbor.pk;
				var link = maps.nodeToLink[keyPair];
				if (link !== undefined) {
					als.push(link);
				}
			}
		}
		// Add new links between new nodes
		for (var i = 0; i < subNum; ++i) {
			for (var j = i + 1; j < subNum; ++j) {
				var keyPair = sub[i].pk + '_' + sub[j].pk;
				var link = maps.nodeToLink[keyPair];
				if (link !== undefined) {
					als.push(link);
				}
				keyPair = sub[j].pk + '_' + sub[i].pk;
				link = maps.nodeToLink[keyPair];
				if (link !== undefined) {
					als.push(link);
				}

			}
		}

		updateLayout(newNum, newDelta);
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

	var computeNodesParameters = function() {
		var total = data.activeNodes.length;
		var delta = 2 * Math.PI  / total;
		for (var i = 0; i < total; ++i) {
			var datum = data.activeNodes[i];
			calculateArcPositions(datum, 0, delta, i);
		}
	};

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

// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.circular = (function($, undefined) {

	var doms = {
		canvas: '#circular-pane .canvas',
		controller: '#circular-pane .svg-controller',
		upButton: '#circular-pane .svg-controller #upButton',
		downButton: '#circular-pane .svg-controller #downButton',
		removeButton: '#circular-pane .svg-controller #removeButton',
		anatomyButton: '#circular-pane .svg-controller #anatomyButton',
	};
	
	var settings = {};
	settings.vis = {
		width: 600,
		height: 600
	};
	settings.arc = {};
	settings.arc.innerRadius = Math.min(settings.vis.width, settings.vis.height) * 0.35,
	settings.arc.outerRadius = settings.arc.innerRadius * 1.2;
	// TODO: The settings below should be exposed to the users later
	settings.hideIsolated = true;
	settings.regionSelectLinkedOnly = true; // Only display nodes that are connected to the node being searched for
	
	var state = {
		mode: 'exploration', //Three possible values for mode: exploration, search, and fixation
		selectedNode: null,
		ignoredNodes: [],
		datasetId: null,
		searchSource: null,
		searchTarget: null,
		selectedAttr: null,
		attrColorMap: null
	};
	
	var data = {
		nodes: null,
		links: null,
		activeNodes: null,
		activeLinks: null
	};
	
	var svgGens = {
		arcs: null,
		curves: null,
		palette: null
	};
	
	var svgObjs = {
		canvas: null,
		links: null,
		force: null
	};

	var init = function() {
		svgGens.arcs = d3.svg.arc()
				 .innerRadius(settings.arc.innerRadius)
				 .outerRadius(settings.arc.outerRadius)
				 .startAngle(function(d) {return d.circular.startAngle;})
				 .endAngle(function(d) {return d.circular.endAngle;});

		svgGens.curves = d3.svg.line()
				   .x(function(d) {return d.x;})
				   .y(function(d) {return d.y;})
				   .interpolate('basis');

		svgGens.palette = d3.scale.category20b();

		svgObjs.canvas = d3.select(doms.canvas)
				.attr('width', settings.vis.width)
				.attr('height', settings.vis.height)
				.append('g')
				.attr('transform', 'translate(' + (settings.vis.width / 2) + ',' + (settings.vis.height / 2) + ')')
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
	};
	
	var render = function(d, datasetId) {
		data.nodes = d.nodes;
		data.links = d.links;
		state.datasetId = datasetId;
		// Initialize data.activeNodes to contain the top level nodes
		initActiveNodes();
		initActiveLinks();
		computeNodesParameters();
		clearCanvas();
		enterLinks();
		enterNodes();
		createNodeTooltips();
		console.log("Circular view rendered.");
		amplify.publish('renderComplete');		
	};

	var clearCanvas = function() {
		svgObjs.canvas.selectAll('.node').remove();
		svgObjs.canvas.selectAll('.link').remove();
		$('.node').qtip('hide');
	}
	
	/* SVG Objects Interaction */
	
	var nodeClick = function(d) {
		// Fix on the clicked node
		if (state.mode === 'exploration') {
			state.selectedNode = d;
			state.mode = 'fixation';
			svg.force.selectRegion(d);
		}
		else if (state.mode === 'fixation') {
			state.selectedNode = null;
			state.mode = 'exploration';
			svg.anatomy.selectStructure(d.fields.name, true);
			svg.force.deselectRegion(d);
		}
		else if (state.mode === 'search') {
			if (state.selectedNode === null) {
				state.selectedNode = d;
				svg.force.selectRegion(d);
			}
			else {
				svg.force.deselectRegion(state.selectedNode);
				state.selectedNode = null;
			}
		}
		if (window.event.shiftKey === true) {
			removeButtonClick();
		}
		else if (window.event.metaKey === true) {
			downButtonClick();
		}
		else if (window.event.altKey === true) {
			upButtonClick();
		}
	};
	
	// When mousing over, highlight itself and the neighbors
	var nodeMouseOver = function(node) {
		if (state.mode === 'fixation') { return; }
		if (state.mode === 'search' && state.selectedNode !== null && state.selectedNode !== node) { return; }
  		highlightNode(node, false);
	};

	var nodeMouseOut = function(node) {
		if (state.mode === 'fixation') { return; }
		if (state.mode === 'search' && state.selectedNode !== null) { return; }
		highlightNode(node, true);
		if (state.mode === 'search') { 
			dimNonSearchResults();
		}
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
		$('#circ-node-' + link.derived.source.pk).qtip('show');
		$('#circ-node-' + link.derived.target.pk).qtip('show');
	};
	
	var linkMouseOut = function(link) {
		if (state.mode === 'fixation') { return; }
		if (state.mode === 'search') { 
			dimNonSearchResults();		
			return; 
		}
		svgObjs.canvas.selectAll('.node').classed('nofocus', false);
		svgObjs.canvas.selectAll('.link').classed('hidden', false);
		$('#circ-node-' + link.derived.source.pk).qtip('hide');
		$('#circ-node-' + link.derived.target.pk).qtip('hide');
	};

	function linkClick(link) {
		svg.linkAttr.render(link);
		ui.linkInfo.displayLinkInfo(link);	
	}

	
	var anatomyButtonClick = function() {
		svg.anatomy.selectStructure(state.selectedNode.fields.name, false);		
	};
	
	var upButtonClick = function(e) {
		e.preventDefault();
		var n = state.selectedNode;
		if (n === null) { return; }
		var minDepth = window.settings.dataset[state.datasetId].minDepth;
		if (n.fields.depth === minDepth) { return; } // Ignore top level nodes
		var parent = n.derived.parent; 
		var nodesToRemove = findActiveDescends(parent);
		clearAllHighlight();
		combineRegions(parent, nodesToRemove);	
		state.mode = 'exploration';
	};
	
	var removeButtonClick = function(e) {
		e.preventDefault();
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
	
	var downButtonClick = function(e) {
		e.preventDefault();
		var n = state.selectedNode;
		if (n === null) { return; }
		var maps = svg.model.maps();
		var children = [];
		var ids = n.derived.children;
		var length = ids.length;
		for (var i = 0; i < length; ++i) {
			var c = maps.keyToNode[ids[i]];
			if (!settings.hideIsolated || !c.derived.isIsolated) {
				children.push(c);
			}
		}
		clearAllHighlight();
		expandRegion(n, children);	
		state.mode = 'exploration';			
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
			.attr('stroke', function(d) { 
				if (state.selectedAttr === null) { return '#ccc'; } 
				var attrValue = 0;
				if (d.derived.isDerived) {
					var maps = svg.model.maps();
					var leaves = d.derived.leaves;
					var numLeaves = leaves.length;
					for (var i in leaves) {
						var l = maps.keyToLink[leaves[i]];
						attrValue += l.fields.attributes[state.selectedAttr];
					}
					attrValue /= numLeaves;
				}
				else {
					attrValue = d.fields.attributes[state.selectedAttr];
				}
				return state.attrColorMap(attrValue); 
			})
			.attr("d", function(d) {
					var coors = [{x: d.derived.source.circular.linkX, y:d.derived.source.circular.linkY}, 
								 {x: 0, y: 0},
								 {x: d.derived.target.circular.linkX, y:d.derived.target.circular.linkY}];
					return svgGens.curves(coors);
		});
	};

	var updateLayout = function(newNum, newDelta) {
		// Remove the nodes and links from canvas
		exitNodes();
		exitLinks();

		// Add the new links and new nodes resulted from the split
		enterLinks();    
		enterNodes();

		for (var i = 0; i < newNum; ++i) {
			var datum = data.activeNodes[i];
			calculateArcPositions(datum, 0, newDelta, i);
		}

		updateLinks();
		updateNodes();

		createNodeTooltips();

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
		for (var i = 0; i < data.activeNodes.length; ++i) {
			var n = data.activeNodes[i];
			var nodeKey = node.pk;
			var inNeighbors = maps.keyToInNeighbors[nodeKey];
			var outNeighbors = maps.keyToOutNeighbors[nodeKey];
			if (n.pk === nodeKey || ($.inArray(n.pk, inNeighbors) >= 0) ||
					($.inArray(n.pk, outNeighbors) >= 0)) {
				isCancel ? $('#circ-node-' + n.pk).qtip('hide') : $('#circ-node-' + n.pk).qtip('show');
			}
		}
	};
	
	var highlightInput = function(id, node, isCancel) {
		svgObjs.canvas.select('#circ-node-' + node.pk)
			.classed('selected-' + id, !isCancel);
	};

	var enterNodes = function() {
		svgObjs.canvas.selectAll('.node')
			.data(data.activeNodes, function(d) {return d.pk;})
			.enter().append('svg:path')
			.style('fill', function(d) { return d.derived.color;} )
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
	
	var enterLinks = function() {
		console.log(data.activeLinks);
		svgObjs.canvas.selectAll(".link")
			.data(data.activeLinks, function(d) {return d.pk;})
			.enter().append("svg:path")
			.attr("d", function(d) {
					var coors = [{x: d.derived.source.circular.linkX, y:d.derived.source.circular.linkY}, 
								 {x: 0, y: 0},
								 {x: d.derived.target.circular.linkX, y:d.derived.target.circular.linkY}];
					return svgGens.curves(coors);
				})
			.attr("class", "link")
			.attr('stroke', '#ccc')
			.attr('stroke-width', function(d) { 
				return Math.min(10, 1 + Math.ceil(d.derived.leaves.length / 50)) + 'px'; 
			})
			.attr("id", function(d) { return "circ-link-" + d.pk; })
			.on("mouseover", linkMouseOver)
			.on("mouseout", linkMouseOut)
			.on("click", linkClick);
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
	
	var updateLinkColor = function(attr, colorMap) {
	
		state.selectedAttr = attr;
		state.attrColorMap = colorMap;
	
		var links = svgObjs.canvas.selectAll(".link")
			.data(data.activeLinks, function(d) {return d.pk;});
		
		links.transition()
			.duration(1000)
			.attr('stroke', function(d) { 
				if (state.selectedAttr === null) { return '#ccc'; } 
				var attrValue = 0;
				if (d.derived.isDerived) {
					var maps = svg.model.maps();
					var leaves = d.derived.leaves;
					var numLeaves = leaves.length;
					for (var i in leaves) {
						var l = maps.keyToLink[leaves[i]];
						attrValue += l.fields.attributes[attr];
					}
					attrValue /= numLeaves;
				}
				else {
					attrValue = d.fields.attributes[attr];
				}
				return colorMap(attrValue); 
			});
	};
	
	var createNodeTooltips = function() {
		for (var i = 0; i < data.activeNodes.length; ++i) {
			var node = data.activeNodes[i];
			$('#circ-node-' + node.pk).qtip({
				style: {
					classes: 'qtip-bootstrap'
				},
				position: {
					my: 'bottom right',
					at: 'top left',
					target: $('#circ-mark-' + node.pk),
				},
			});
		}
	};
	
	// Display a node and set it as in focus
	var showRegion = function(regionPk) {
		var maps = svg.model.maps();
		var region = maps.keyToNode[regionPk];
		var inNeighbors = maps.keyToInNeighbors[regionPk];
		var outNeighbors = maps.keyToOutNeighbors[regionPk];
		if (inNeighbors.length === 0 && outNeighbors.length === 0) {
			// TODO: show dialog whether users still want to see a region with no connections
		}
		clearAllHighlight();
		displayNode(region);
		svgObjs.canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				return d !== region;
			});
		
		$('#circ-node-' + region.pk).qtip('show');
	};
	
	var showRegionMulti = function(regionPks) {
		clearAllHighlight();
		var maps = svg.model.maps();
		var regions = [];
		for (i in regionPks) {
			region = maps.keyToNode[regionPks[i]];
			regions.push(region);
			displayNode(region);
		}
		svgObjs.canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				return $.inArray(d, regions) < 0;
			});
		for (i in regionPks) {
			$('#circ-node-' + regionPks[i]).qtip('show');
		}
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
		state.selectedSource = source;
		state.selectedTarget = target;
		state.selectedNode = null;
		var searchNodes = svg.model.searchNodes();
		var nodeIds = [];
		for (var i in searchNodes) {
			nodeIds.push(searchNodes[i].pk);
		}
		showRegionMulti(nodeIds);
		dimNonSearchResults();
	};
	
	var clearSearchResult = function() {
		clearAllHighlight();
		state.mode = 'exploration';
		svgObjs.canvas.selectAll('.node')
			.classed('selected-source', false);
		svgObjs.canvas.selectAll('.node')
			.classed('selected-target', false);
	};

	var dimNonSearchResults = function(source, target) {
		var searchNodes = svg.model.searchNodes();
		var searchLinks = svg.model.searchLinks();
		svgObjs.canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				return $.inArray(d, searchNodes) < 0;
			});
		svgObjs.canvas.selectAll('.link')
			.classed('hidden', function(d) {
				return $.inArray(d, searchLinks) < 0;
			});
		svgObjs.canvas.selectAll('.node')
			.classed('selected-source', function(d) {
				return d.pk === state.selectedSource.pk;
			});
		svgObjs.canvas.selectAll('.node')
			.classed('selected-target', function(d) {
				return d.pk === state.selectedTarget.pk;
			});
		for (var i = 0; i < searchNodes.length; ++i) {
			$('#circ-node-' + searchNodes[i].pk).qtip('show');
		} 
		
	};
	
	
	var reset = function() {
		console.log('Reset circular');
		initActiveNodes();
		initActiveLinks();
		computeNodesParameters();
//		assignColor();
		clearCanvas();
		enterLinks();
		enterNodes();
		createNodeTooltips();
		state.mode = 'exploration';
		amplify.publish('resetComplete');
	};

	var selectRegion = function(node) {
		state.mode = 'fixation';
		state.selectedNode = node;
		clearAllHighlight();
		highlightNode(node, false);
	};
	
	var deselectRegion = function(region) {
		state.mode = 'exploration';
		state.selectedNode = null;
		clearAllHighlight();
	};
	
	/* End of Canvas Update*/
	
	/* SVG Data Update */

	var initActiveNodes = function() {
		data.activeNodes = [];
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
		data.activeLinks = [];
		var maps = svg.model.maps();
		var minDepth = window.settings.dataset[state.datasetId].minDepth;
		for (var key in maps.keyToLink) {
			var l = maps.keyToLink[key];
			if (l.derived.source.fields.depth === minDepth && l.derived.target.fields.depth === minDepth) {
				data.activeLinks.push(l);
			}
		}
	};
	
/*	var assignColor = function() {
		var pks = [];
		for (var i = 0; i < data.activeNodes.length; ++i) {
			pks.push(data.activeNodes[i].pk);
		}
		svgGens.palette.domain(pks);
		for (i in data.activeNodes) {
			var n = data.activeNodes[i];
			n.derived.color = svgGens.palette(n.pk);
		}
	}; */

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
//			datum.derived.color = d.derived.color;
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
		console.log(node.fields.name);
		var maps = svg.model.maps();
		if (!node.circular.isActive) {
			var parent = findActiveParent(node);
			// In this case the input is either on a level higher than the visibile nodes or its parent not present because of no connection
			if (parent === undefined) {
				var activeDescs = findActiveDescends(node);
				if (activeDescs.length > 0) {
					if (state.mode === 'search' && ($.inArray(state.selectedSource, activeDescs) > -1 || $.inArray(state.selectedTarget, activeDescs) > -1)) {
						return;
					}
					combineRegions(node, activeDescs);
				}
				else {
					var sib = null;
					for (var i in data.activeNodes) {
						var n = data.activeNodes[i];
						if (n.derived.group === node.derived.group) {
							sib = n;
							break;
						}
					}
					expandRegion(sib, [sib, node]);
				}
			}
			// In this case, the input is on a level lower than the visible nodes
			else {
				var siblings = findDescAtDepth(parent, node.fields.depth);
				if (state.mode === 'search' && (parent.pk === state.selectedSource.pk || parent.pk === state.selectedTarget.pk)) {
					return;
				}
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

	var calculateArcPositions = function(datum, startAngle, delta, i) {
		datum.circular.startAngle = startAngle + delta * i;
		datum.circular.endAngle = startAngle + delta * (i+1);
		var angle = delta * (i + 0.5) + startAngle;
		var radius = settings.arc.innerRadius + (settings.arc.outerRadius - settings.arc.innerRadius) / 2;
		datum.circular.x = radius * Math.cos(Math.PI / 2 - angle);
		datum.circular.linkX = settings.arc.innerRadius * Math.cos(Math.PI / 2 - angle);
		datum.circular.y = -radius * Math.sin(Math.PI / 2 - angle);
		datum.circular.linkY = -settings.arc.innerRadius * Math.sin(Math.PI / 2 - angle);
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
			children.splice(0, childNum);
		}
		return result;
	}
	
	var setMode = function(m) {
		state.mode = m;
	};

	/* End of Computation */

	return {
		init: init,
		render: render,
		showRegion: showRegion,
		showRegionMulti: showRegionMulti,
		setMode: setMode,
		highlightNode: highlightNode,
		highlightInput: highlightInput,
		findAllDesc: findAllDesc,
		displaySearchResult: displaySearchResult,
		clearSearchResult: clearSearchResult,
		reset: reset,
		clearAllHighlight: clearAllHighlight,
		selectRegion: selectRegion,
		deselectRegion: deselectRegion,
		updateLinkColor: updateLinkColor
	};

}(jQuery));

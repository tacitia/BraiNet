// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.circular = (function($, undefined) {

	var doms = {
		canvas: '#circular-pane .canvas',
		controller: '#circular-pane .svg-controller',
		configButton: '#circular-pane .svg-controller #configButton',
		upButton: '#circular-pane .svg-controller #upButton',
		downButton: '#circular-pane .svg-controller #downButton',
		removeButton: '#circular-pane .svg-controller #removeButton',
		anatomyButton: '#circular-pane .svg-controller #anatomyButton'
	};
	
	var settings = {};
	settings.vis = {
		width: 550,
		height: 550
	};
	settings.arc = {};
	settings.arc.innerRadius = Math.min(settings.vis.width, settings.vis.height) * 0.35,
	settings.arc.outerRadius = settings.arc.innerRadius * 1.2;
	// TODO: The settings below should be exposed to the users later
	settings.hideIsolated = true;
	settings.regionSelectLinkedOnly = true; // Only display nodes that are connected to the node being searched for
	settings.weightArcAreaByNumSubRegions = false;
	
	var state = {
		mode: 'exploration', //Three possible values for mode: exploration, search, and fixation
		selectedNode: null,
		ignoredNodes: [],
		datasetId: null,
		searchSource: null,
		searchTarget: null,
		selectedAttr: null,
		attrColorMap: null,
        localConnRetrievalCounter: 0,
        localConnCache: []
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
	
		$(doms.configButton).click(configButtonClick);
		$(doms.upButton).click(upButtonClick);	
		$(doms.downButton).click(downButtonClick);	
		$(doms.removeButton).click(removeButtonClick);
		$(doms.anatomyButton).click(anatomyButtonClick);
		
		
		$(doms.configButton).qtip({
			content: 'Settings'
		});
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
           console.log(d);
           console.log(svg.model.maps().keyToOutNeighbors[d.pk]);
		// Fix on the clicked node
		if (state.mode === 'exploration') {
			state.selectedNode = d;
			state.mode = 'fixation';
			svg.force.selectRegion(d);
			util.action.add('select region in circular view', {region: d.fields.name});
		}
		else if (state.mode === 'fixation') {
			state.selectedNode = null;
			state.mode = 'exploration';
			svg.anatomy.selectStructure(d.fields.name, true);
			svg.force.deselectRegion(d);
			util.action.add('deselect region in circular view', {region: d.fields.name});		
		}
		else if (state.mode === 'search') {
			if (state.selectedNode === null) {
				state.selectedNode = d;
				svg.force.selectRegion(d);
				util.action.add('select region in circular view', {region: d.fields.name});
			}
			else {
				svg.force.deselectRegion(state.selectedNode);
				state.selectedNode = null;
				util.action.add('deselect region in circular view', {region: d.fields.name});	
			}
		}
		if (window.event.shiftKey === true) { removeButtonClick(); }
		else if (window.event.metaKey === true) { downButtonClick(); }
		else if (window.event.altKey === true) { upButtonClick(); }
	};
	
	// When mousing over, highlight itself and the neighbors
	var nodeMouseOver = function(node) {
        console.log(node.fields.depth);
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
		amplify.request('getLeaves',
			{
				connId: link.pk
			},
			function(leaves) {
                svg.model.addLinks(leaves, 3);
				ui.linkInfo.displayLinkInfo(link, leaves);
			}
		);
		svg.linkAttr.render(link);
		util.action.add('click link in circular view', {source: link.derived.source.fields.name, target: link.derived.target.fields.name});
	}

	
	var anatomyButtonClick = function() {
		svg.anatomy.selectStructure(state.selectedNode.fields.name, false);	
		util.action.add('update anatomical slice from the circular view', {region: state.selectedNode.fields.name})	
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
		util.action.add('go up in the hierarchy in circular view', {region: n.fields.name});
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
		util.action.add('remove a region in circular view', {region: d.fields.name});
	};

    /*
     * This function:
     * 1. calls expandRegion to expand the selected region into its children regions and expand associated links
     * into children links
     */
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
		util.action.add('go down in the hierarchy in circular view', {region: state.selectedNode.fields.name});
	};
	
	var configButtonClick = function(e) {
		e.preventDefault();
		ui.configModal.clear();
		ui.configModal.addOption('arcArea', 'Region area proportional to region complexity', 'check', arcPropOptionUpdate, settings.weightArcAreaByNumSubRegions);
		ui.configModal.show();
		util.action.add('open config window in circular view', {});
	};
	
	var arcPropOptionUpdate = function(value) {
		settings.weightArcAreaByNumSubRegions = value;
		console.log(value);
		var newNum = data.activeNodes.length;
		var newDelta = 2 * Math.PI / newNum;
		updateLayout(newNum, newDelta);
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

		if (settings.weightArcAreaByNumSubRegions) {
			computeNodesParametersWeighted();
		}
		else {
			for (var i = 0; i < newNum; ++i) {
				var datum = data.activeNodes[i];
				calculateArcPositions(datum, 0, newDelta, i, 1);
			}		
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
                var width = d.derived.isDerived
                        ? Math.min(10, 1 + Math.ceil(d.derived.leaves.length / 50)) + 'px'
                        : 1 + 'px';
                return width;
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
					classes: 'qtip-light'
				},
				position: {
					my: 'bottom right',
					at: 'top left',
					target: $('#circ-mark-' + node.pk)
				}
			});
		}
	};
	
	// Display a node and set it as in focus
	var showRegion = function(regionPk, callback1) {
		var maps = svg.model.maps();
		var region = maps.keyToNode[regionPk];
		var inNeighbors = maps.keyToInNeighbors[regionPk];
		var outNeighbors = maps.keyToOutNeighbors[regionPk];
		if (inNeighbors.length === 0 && outNeighbors.length === 0) {
			console.log('call getLocalConnections');
			amplify.request('getLocalConnections',
				{
					structId: regionPk,
                    depth: Math.min(region.fields.depth, 3)
				},
				function(data) { 
					console.log(data);
					svg.model.addLinks(data);
                    svg.model.cacheSubConnections(data);
					showRegionCallBack(region);
                    callback1();
				}
			);
		}
		else {
			showRegionCallBack(region);
            callback1();
		}
	};
	
	var showRegionCallBack = function(region) {
		clearAllHighlight();
		displayNodes([region]);
		svgObjs.canvas.selectAll('.node')
			.classed('nofocus', function(d) {
				return d !== region;
			});
		
		$('#circ-node-' + region.pk).qtip('show');

	};
		
	var showRegionMulti = function(regionPks, callback1) {
		var maps = svg.model.maps();
		var regions = [];
        var regionWoLocalConns = [];
		for (i in regionPks) {
			region = maps.keyToNode[regionPks[i]];
			regions.push(region);
            var inNeighbors = maps.keyToInNeighbors[regionPks[i]];
            var outNeighbors = maps.keyToOutNeighbors[regionPks[i]];
            if (inNeighbors.length === 0 && outNeighbors.length === 0) {
                regionWoLocalConns.push(regionPks[i]);
            }
		}
        if (regionWoLocalConns.length > 0) {
            state.localConnRetrievalCounter = regionWoLocalConns.length;
            for (var i=0; i < regionWoLocalConns.length; ++i) {
                var regionPk = regionWoLocalConns[i];
                amplify.request('getLocalConnections',
                    {
                        structIds:regionPk,
                        depth: Math.min(region.fields.depth, 3)
                    },
                    function(data) {
                        state.localConnCache = state.localConnCache.concat(data);
                        state.localConnRetrievalCounter -= 1;
                        if (state.localConnRetrievalCounter === 0) {
                            svg.model.addLinks(state.localConnCache);
                            svg.model.cacheSubConnections(state.localConnCache);
                            showRegionMultiCallBack(regions);
                            callback1();
                        }
                    }
                )
            }

        }
        else {
            showRegionMultiCallback(regions);
            callback1();
        }

	};

    var showRegionMultiCallBack = function(regions) {
        clearAllHighlight();
        displayNodes(regions);
        svgObjs.canvas.selectAll('.node')
            .classed('nofocus', function(d) {
                return $.inArray(d, regions) < 0;
            });
        for (i in regions) {
            $('#circ-node-' + regions[i].pk).qtip('show');
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
		console.log(data.activeLinks);
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

    /*
     * This function:
     * 1. expands the node d into sub as well as adjust the links accordingly
     * 2. calls the function to cache links for the new active links
     */
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
		var leafLength = 1;
		var unit = (endAngle - startAngle) / Math.max(d.derived.leaves.length, 1);

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

		var pastLeaves = 0;
        var newLinks = [];
		for (var i = pos; i < pos + subNum; ++i) {
			var datum = sub[i-pos];
			if (settings.weightArcAreaByNumSubRegions) {
				calculateArcPositions(datum, startAngle, unit, pastLeaves, Math.max(datum.derived.leaves.length, 1));
				pastLeaves += Math.max(datum.derived.leaves.length, 1);
			}
			else {
				calculateArcPositions(datum, startAngle, delta, i-pos, 1);
			}
//			datum.derived.color = d.derived.color;
			datum.circular.isActive = true;
			ans[i] = datum;
			for (var j = 0; j < inNeighborNum; ++j) {
				var neighbor = inNeighbors[j];
				var keyPair = neighbor.pk + "_" + datum.pk;
				var link = maps.nodeToLink[keyPair];
				if (link !== undefined) {
                    als.push(link);
					newLinks.push(link);
				}
			}
			for (var j = 0; j < outNeighborNum; ++j) {
				var neighbor = outNeighbors[j];
				var keyPair = datum.pk + "_" + neighbor.pk;
				var link = maps.nodeToLink[keyPair];
				if (link !== undefined) {
                    als.push(link);
					newLinks.push(link);
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
					newLinks.push(link);
				}
				keyPair = sub[j].pk + '_' + sub[i].pk;
				link = maps.nodeToLink[keyPair];
				if (link !== undefined) {
                    als.push(link);
					newLinks.push(link);
				}

			}
		}
//        als = als.concat(newLinks);
        svg.model.cacheSubConnections(newLinks);

		updateLayout(newNum, newDelta);
	};



	/* 
	 * Display a node so that the visualization only shows the given node and nodes that are 
	 * linked to it
	 * NOTE: this assumes that it is fine that we only display neighbors of the chosen node
	 */
	var displayNodes = function(nodes) {
		var maps = svg.model.maps();
		// 1. Put the incoming nodes and their neighbors into an array, which will be the new 
		// data.activeNodes
		// 2. Put the links associated with the incoming nodes into an array, which will be the
		// new data.activeLinks.
		var newActiveNodes = [];
		var newActiveLinks = [];
		for (var i in nodes) {
			var n = nodes[i];
			newActiveNodes.push(n);
			var inNeighborIds = maps.keyToInNeighbors[n.pk];
			var outNeighborIds = maps.keyToOutNeighbors[n.pk];
			for (var j in inNeighborIds) {
				var id = inNeighborIds[j];
                var neighbor = maps.keyToNode[id];
                if (neighbor.fields.depth <= window.settings.defaultDisplayDepth) {
                    newActiveNodes.push(neighbor);
                }
			}
			for (var j in outNeighborIds) {
				var id = outNeighborIds[j];
                var neighbor = maps.keyToNode[id];
                if (neighbor.fields.depth <= window.settings.defaultDisplayDepth) {
                    newActiveNodes.push(neighbor);
                }
            }
		}
		// 3. Clean up the new active nodes array
		var sortByName = function(a, b) {
			var an = a.fields.name.toLowerCase();
			var bn = b.fields.name.toLowerCase();
			if (an > bn) { return 1; }
			if (an < bn) { return -1; }
			return 0;
		}
		newActiveNodes = util.generic.createSortedUniqueArray(newActiveNodes, sortByName);
		// 4. Cluster new active nodes by group	
		var groups = {};
		for (var i in newActiveNodes) {
			var g = newActiveNodes[i].derived.group;
			if (groups[g] === undefined) {
				groups[g] = [];
			}
			groups[g].push(newActiveNodes[i]);
		}
		// 5. Get the ordering of groups in the current active nodes
		var groupIndex = [];
		var an = data.activeNodes;
		var currentGroups = {}; // Store a mapping from group ID to nodes in the current active nodes
		groupIndex.push(an[0].derived.group);
		currentGroups[an[0].derived.group] = [];	
		for (var i in an) {
			i = parseInt(i);
			// If the next element in the active nodes has a ground id that differs from the current element
			if (an[i+1] && an[i+1].derived.group !== an[i].derived.group) {
				groupIndex.push(an[i+1].derived.group);
				currentGroups[an[i+1].derived.group] = [];
			}
			currentGroups[an[i].derived.group].push(an[i]);
		}
		// 6. Substitute current active nodes with the new ones
		newActiveNodes.length = 0;
		for (var i in groupIndex) {
			var g = groupIndex[i];
			newActiveNodes = groups[g] ? 
				newActiveNodes.concat(groups[g]) :
				newActiveNodes.concat(currentGroups[g]);
		}
		// 7. Add in links for active nodes that haven't been covered
		for (var i in newActiveNodes) {
			for (var j in newActiveNodes) {
				var n1Id = newActiveNodes[i].pk;
				var n2Id = newActiveNodes[j].pk;
				var forward = maps.nodeToLink[n1Id + '_' + n2Id];
				var backward = maps.nodeToLink[n2Id + '_' + n1Id];
				if (forward) { newActiveLinks = newActiveLinks.concat(forward); }
				if (backward) { newActiveLinks = newActiveLinks.concat(backward); }
			}
		}
		// 8. Finalize
		data.activeNodes = newActiveNodes;
		data.activeLinks = newActiveLinks;
		computeNodesParameters();	
		updateLayout(data.activeNodes.length, 2 * Math.PI / data.activeNodes.length);
	};
	
/*
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
*/
	
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
	
	var computeNodesParametersWeighted = function() {
		var totalLeaves = 0;
		for (var i in data.activeNodes) {
			var datum = data.activeNodes[i];
			totalLeaves += Math.max(datum.derived.leaves.length, 1);
		}
		var pastLeaves = 0;
		var unit = 2 * Math.PI / totalLeaves;
		for (var i in data.activeNodes) {
			var datum = data.activeNodes[i];
			calculateArcPositions(datum, 0, unit, pastLeaves, Math.max(datum.derived.leaves.length, 1));
			pastLeaves += Math.max(datum.derived.leaves.length, 1);
		}
	};

	var computeNodesParameters = function() {
		console.log('arc area option');
		console.log(settings.weightArcAreaByNumSubRegions);
		if (settings.weightArcAreaByNumSubRegions) {
			computeNodesParametersWeighted();
		}
		else {
			var total = data.activeNodes.length;
			var delta = 2 * Math.PI  / total;
			for (var i = 0; i < total; ++i) {
				var datum = data.activeNodes[i];
				calculateArcPositions(datum, 0, delta, i, 1);
			}			
		}
	};

	var calculateArcPositions = function(datum, startAngle, unit, past, present) {
		datum.circular.startAngle = startAngle + unit * past;
		datum.circular.endAngle = startAngle + unit * (past + present);
		var angle = unit * (past + present / 2) + startAngle;
		var radius = settings.arc.innerRadius + (settings.arc.outerRadius - settings.arc.innerRadius) / 2;
		datum.circular.x = radius * Math.cos(Math.PI / 2 - angle);
		datum.circular.linkX = settings.arc.innerRadius * Math.cos(Math.PI / 2 - angle);
		datum.circular.y = -radius * Math.sin(Math.PI / 2 - angle);
		datum.circular.linkY = -settings.arc.innerRadius * Math.sin(Math.PI / 2 - angle);
	};
	
/*	var calculateArcPositionsProp = function(datum, startAngle, unit, pastLeaves) {
		datum.circular.startAngle = startAngle + unit * pastLeaves;
		datum.circular.endAngle = startAngle + unit * (pastLeaves + datum.derived.leaves.length);
		var angle = startAngle + unit * (pastLeaves + datum.derived.leaves.length / 2);
		var radius = settings.arc.innerRadius + (settings.arc.outerRadius - settings.arc.innerRadius) / 2;
		datum.circular.x = radius * Math.cos(Math.PI / 2 - angle);
		datum.circular.linkX = settings.arc.innerRadius * Math.cos(Math.PI / 2 - angle);
		datum.circular.y = -radius * Math.sin(Math.PI / 2 - angle);
		datum.circular.linkY = -settings.arc.innerRadius * Math.sin(Math.PI / 2 - angle);
	}; */

	var findActiveParent = function(node) {
		var maps = svg.model.maps();
		var result = node;
		while (result !== undefined && result !== null) {
//			if (result.circular.isActive) {
			if ($.inArray(result, data.activeNodes) > -1) {
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

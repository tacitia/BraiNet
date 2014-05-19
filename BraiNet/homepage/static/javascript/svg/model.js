// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.model = (function($, undefined) {

	var states = {
		activeDatasetId: null
	};

	var data = {
		nodes: null,
		links: null,
		searchNodes: null,
		searchLinks: null,
        searchPaths: null
	};

	var maps = {
		keyToNode: null,
		nameToNode: null,
		keyToInNeighbors: null,
		keyToOutNeighbors: null,
		keyToLink: null,
		nodeToLink: null,
		LinkToPaper: null
	};

	var getDataset = function(datasetId, maxDepth) {
		console.log("Requesting dataset " + datasetId + " with max depth " + maxDepth + '...');
		if (datasetId == states.activeDatasetId) {
			amplify.publish('datasetReady', data);
		}
		else {
			states.activeDatasetId = datasetId;
			amplify.request('getDataset',
				{
					userId: user.id(),
					datasetId: datasetId,
					maxDepth: maxDepth
				},
				datasetReceived
			);
		}
	};

	var addConnNote = function(linkId, notes) {
		console.log('Adding conn note into database...');
		amplify.request('addConnectionNote',
			{
				userId: user.id(),
				datasetId: states.activeDatasetId,
				linkId: linkId,
				content: notes,
				csrfmiddlewaretoken: '{{ csrf_token }}'
			});
	};

	var datasetReceived = function(d) {
		console.log('dataset received');
		d.conns = $.parseJSON(d.conns);
		d.structs = $.parseJSON(d.structs);
		d.connNotes = $.parseJSON(d.connNotes);
		for (var i = 0; i < d.conns.length; ++i) {
			delete d.conns[i].model;
			d.conns[i].fields.attributes = $.parseJSON(d.conns[i].fields.attributes);
		}
		for (var i = 0; i < d.structs.length; ++i) {
			delete d.structs[i].model;
			d.structs[i].fields.attributes = $.parseJSON(d.structs[i].fields.attributes);
		}
		data.nodes = d.structs;
		data.links = d.conns;
		buildNodesMaps();
		buildNodeHierarchy();
		assignGroups();
		buildLinksMaps();
		addNotes(d.connNotes);
		console.log('# of links before creating derived links: ' + data.links.length);
//		buildLinkHierarchy();
		console.log('# of links after creating derived links: ' + data.links.length);
		amplify.publish('datasetReady', data, states.activeDatasetId);
		console.log(maps);
	};


	// Add the node to maps
	var registerNode = function(node) {
		node.circular = {};
		node.force = {};
		node.derived = {};
		node.derived.children = [];

		node.derived.isIsolated = true; // Initialization; node with connection will be marked as false in registerLink

		node.derived.ancestors = $.parseJSON(node.fields.struct_id_path);
		for (var i in node.derived.ancestors) {
			node.derived.ancestors[i] = states.activeDatasetId + '-' + node.derived.ancestors[i];
		}

		maps.keyToNode[node.pk] = node;
		maps.nameToNode[node.fields.name] = node;
		maps.keyToInNeighbors[node.pk] = [];
		maps.keyToOutNeighbors[node.pk] = [];
	};

	var registerLink = function(link, isDerived, priority) {
		var targetKey = link.fields.target_id;
		var sourceKey = link.fields.source_id;
		var keyPair = sourceKey + "_" + targetKey;

		link.derived = {};
		var source = link.derived.source = maps.keyToNode[sourceKey];
		var target = link.derived.target = maps.keyToNode[targetKey];

        // Don't register the link if it connects a node with its descendant
        // TODO: test and remove this when proper server side validation is implemented
        if ($.inArray(target.pk, source.derived.ancestors) > 0 || $.inArray(source.pk, target.derived.ancestors) > 0) {
            return;
        }

		link.derived.children = [];
		link.derived.leaves = $.parseJSON(link.fields.leaves); // This is just to remain consistency with code from previous version (before computation is offloaded onto the server)
		link.derived.isDerived = isDerived;
        link.derived.priority = priority;

		link.derived.source.derived.isIsolated = false;
		link.derived.target.derived.isIsolated = false;

        link.circular = {};
        link.force = {};

        (typeof link.fields.attributes == 'string') && (link.fields.attributes = $.parseJSON(link.fields.attributes));

		maps.keyToLink[link.pk] = link;
		maps.nodeToLink[keyPair] = link;
		maps.keyToInNeighbors[targetKey].push(sourceKey);
		maps.keyToOutNeighbors[sourceKey].push(targetKey);
	}

	var buildNodesMaps = function() {
		maps.keyToNode = {};
		maps.nameToNode = {};
		maps.keyToInNeighbors = {};
		maps.keyToOutNeighbors = {};

		for (var i = 0; i < data.nodes.length; ++i) {
			var node = data.nodes[i];
			registerNode(node);
		}
	};

	var assignGroups = function() {
		var palette = d3.scale.category20b();
		var queue = [];
		var pks = [];
		for (var key in maps.keyToNode) {
			var node = maps.keyToNode[key];
			if (node.fields.depth === window.settings.dataset[states.activeDatasetId].minDepth) {
				node.derived.group = node.pk;
				queue.push(node);
				pks.push(node.pk);
			}
		}
		palette.domain(pks);
		while (queue.length > 0) {
			var n = queue[0];
			n.derived.color = palette(n.derived.group);
			var children = n.derived.children;
			var childNum = children.length;
			for (var i = 0; i < childNum; ++i) {
				var child = maps.keyToNode[children[i]];
				child.derived.group = n.derived.group;
				queue.push(child);
			}
			queue.splice(0, 1);
		}
	};


	var buildLinksMaps = function() {
		maps.keyToLink = {};
		maps.nodeToLink = {};
		maps.LinkToPaper = {};

		var inNeighborMap = maps.keyToInNeighbors;
		var outNeighborMap = maps.keyToOutNeighbors;

		// Further process links
		var numLinks = data.links.length;
		for (var i = 0; i < numLinks; ++i) {
			var link = data.links[i];
			var isDerived = link.fields.is_derived == 0 ? false : true;
			registerLink(link, isDerived);
		}
	};

	var addLinks = function(links, priority) {
		for (var i in links) {
			var l = links[i];
            if ($.inArray(l, data.links) < 0) {
                data.links.push(l);
                var isDerived = l.fields.is_derived == 0 ? false : true;
                registerLink(l, isDerived, priority);
            }
		}
	};


	var addNotes = function(notes) {
		for (var i in notes) {
			var n = notes[i];
			var l = maps.keyToLink[n.fields.link];
			// This will happen if the max depth allowed differs between the session in which the note was added and the current session
			if (l === undefined) { continue; }
			l.derived.note = n.fields.content;
		}
	};

	var buildNodeHierarchy = function() {
		for (var key in maps.keyToNode) {
			var node = maps.keyToNode[key];
			if (node.fields.parent_id !== null) {
				var parentNode = maps.keyToNode[node.fields.parent_id];
				parentNode.derived.children.push(node.pk);
				node.derived.parent = parentNode;
			}
			node.derived.leaves = [];
		}
		populateLeaves();
	};

	var populateLeaves = function() {
		var leaves = [];
		for (var key in maps.keyToNode) {
			var node = maps.keyToNode[key];
			if (node.derived.children.length === 0) {
				leaves.push(node);
			}
		}
		for (var i in leaves) {
			var p = leaves[i].derived.parent;
			while (p !== undefined && p !== null) {
				p.derived.leaves.push(leaves[i]);
				p = p.derived.parent;
			}
		}
	};

	/*
	 * Deprecated: computation offloaded to the server
	 */
/*
	var buildLinkHierarchy = function() {
		var numLink = data.links.length;
		var maxLinkKey = 0;
		for (var i = 0; i < numLink; ++i) {
			var link = data.links[i];
			if (link.pk > maxLinkKey) {
				maxLinkKey = link.pk;
			}
		}
		// 1. initiate children
		// 2. check parent existence
		// 3. optionally create parent and add a child
		for (var i = 0; i < numLink; ++i) {
			var link = data.links[i];
			var source = link.derived.source;
			var target = link.derived.target;
			var srcParentId = source.fields.parent_id;
			var tgtParentId = target.fields.parent_id;
			var srcParentNode = maps.keyToNode[srcParentId];
			var tgtParentNode = maps.keyToNode[tgtParentId];
			var leaves = [];
			var numLeaves = link.derived.leaves.length;
			util.generic.copySimpleArray(link.derived.leaves, leaves);
			if (!link.derived.isDerived) {
				leaves.push(link.pk);
				numLeaves += 1;
			}
			if (srcParentId !== null && srcParentId !== target.pk &&
					$.inArray(target.pk, srcParentNode.derived.children) < 0) {
				var keyPair = srcParentId + "_" + target.pk;
				var srcParentLink = maps.nodeToLink[keyPair];
				var addedNewLink = createParentLink(maxLinkKey, link, srcParentLink, srcParentId, target.pk, leaves);
				if (addedNewLink) {
					maxLinkKey += 1;
					numLink += 1;
				}
			}
			if (tgtParentId !== null && tgtParentId !== source.pk &&
					$.inArray(source.pk, tgtParentNode.derived.children) < 0) {
				var keyPair = source.pk + "_" + tgtParentId;
				var tgtParentLink = maps.nodeToLink[keyPair];
				var addedNewLink = createParentLink(maxLinkKey, link, tgtParentLink, source.pk, tgtParentId, leaves);
				if (addedNewLink) {
					maxLinkKey += 1;
					numLink += 1;
				}
			}
			if (srcParentId !== null && tgtParentId !== null && srcParentId !== tgtParentId &&
					$.inArray(target.pk, srcParentNode.derived.children) < 0 &&
					$.inArray(source.pk, tgtParentNode.derived.children) < 0) {
				var keyPair = srcParentId + "_" + tgtParentId;
				var parentLink = maps.nodeToLink[keyPair];
				var addedNewLink = createParentLink(maxLinkKey, link, parentLink, srcParentId, tgtParentId, leaves);
				if (addedNewLink) {
					maxLinkKey += 1;
					numLink += 1;
				}
			}
		}
	};
*/

	var createParentLink = function(maxLinkKey, link, parentLink, srcId, tgtId, leaves) {
		var result = false;
		if (parentLink === undefined) {
			result = true;
			var parentLink = {
				pk: maxLinkKey + 1,
				fields: {}
			};
			parentLink.fields.source_id = srcId;
			parentLink.fields.target_id = tgtId;
//			processMetaLink(srcParentLink, dataset.link_map, dataset.attr_map);
			data.links.push(parentLink);
			registerLink(parentLink, true);
		}
		if ($.inArray(link.pk, parentLink.derived.children) < 0) {
			parentLink.derived.children.push(link.pk);
		}
		util.generic.copySimpleArray(leaves, parentLink.derived.leaves);
		return result;
	};

	var calculatePathsRemote = function() {
		amplify.request(''

		);
	};

	var calculatePaths = function(source, target, numHop) {
		var counter = 0;
		var paths = [];
		var results = [];
		paths[0] = [source];
		// Set the min / max depth
		var depth1 = source.fields.depth;
		var depth2 = target.fields.depth;
		var minDepth = Math.min(depth1, depth2);
		var maxDepth = Math.max(depth1, depth2);

		while (paths.length > 0 && paths[0].length <= numHop + 1) {
			var currPath = paths[0];
			paths.splice(0, 1);
			var anchorNode = currPath[currPath.length - 1];
/*			if (anchorNode.pk === target.pk) {
				results.push(currPath);
				continue;
			} */
			// If already reaches the maximum length, don't continue counting neighbors
//			if (currPath.length >= numHop + 2) { continue; }
			var neighbors = maps.keyToOutNeighbors[anchorNode.pk];
			var neighborNum = neighbors.length;
			for (var i = 0; i < neighborNum; ++i) {
				var neighborId = neighbors[i];
				var neighborNode = maps.keyToNode[neighborId];
/*				if ($.inArray(source.pk, neighborNode.derived.ancestors) > -1 || $.inArray(target.pk, neighborNode.derived.ancestors) > -1) {
					continue;
				}
				if ($.inArray(neighborNode.pk, source.derived.ancestors) > -1 || $.inArray(neighborNode.pk, target.derived.ancestors) > -1) {
					continue;
				} */
/*				if (neighborNode.fields.name === 'Ventral tegmental area') {
					console.log('found');
					console.log(neighborNode);
					break;
				} */
				if (neighborNode.fields.depth >= minDepth && neighborNode.fields.depth <= maxDepth) {
					var newPath = currPath.concat(neighborNode);
					if (neighborNode.pk === target.pk) {
						results.push(newPath);
						continue;
					}
					if (currPath.length === numHop + 1) {
						continue;
					}
					paths.push(newPath);
				}
			}
			counter++;
			if (counter > 5000) {
//				userAction.trackAction(null, 'Warning', 'Path size limit reached', selected_source.name + '-' + selected_target + '-' + max_hop);
				console.log("Reached path limit."); break;
			}
		}
		saveSearchElements(results);
		return results;
	};

    var saveSearchElements = function(serverData, source, target) {
        data.searchNodes = [];
        data.searchLinks = [];
        for (var i in serverData.stops) {
            var nodeId = serverData.stops[i];
            var node = maps.keyToNode[nodeId];
            data.searchNodes.push(node);
        }
        data.searchLinks = serverData.links;
        data.searchPaths = serverData.paths;
        data.searchNodes.push(source);
        data.searchNodes.push(target);
        console.log(data.searchNodes);
        console.log(data.searchLinks);
        addLinks(serverData.links, 3);
    };


    /* Deprecated */
/*
	var saveSearchElements = function(paths) {
		data.searchNodes = [];
		data.searchLinks = [];
		var numPath = paths.length;
		for (var i = 0; i < numPath; ++i) {
			var path = paths[i];
			var numLink = path.length - 1;
			for (var j = 0; j < numLink; ++j) {
				var currSrc = path[j];
				var currTgt = path[j+1];
				var keyPair = currSrc.pk + "_" + currTgt.pk;
				var link = maps.nodeToLink[keyPair];
				if ($.inArray(link, data.searchLinks) < 0) {
					data.searchLinks.push(link);
				}
				if ($.inArray(currSrc, data.searchNodes) < 0) {
					data.searchNodes.push(currSrc);
				}
				if ($.inArray(currTgt, data.searchNodes) < 0) {
					data.searchNodes.push(currTgt);
				}
			}
		}
		console.log(data.searchNodes.length);
	};
	*/

    var cacheSubConnections = function(links, callback) {
        for (var i in links) {
            var l = links[i];
            amplify.request('getSubConnections',
                {
                    connId: l.pk
                },
                function(subConns) {
                    subConns = $.parseJSON(subConns);
                    addLinks(subConns, 4);
                    if (callback !== undefined) {
                        callback(subConns);
                    }
                }
            );
        }
    };

    var addSearchLinks = function(links) {
        data.searchLinks = data.searchLinks.concat(links);
        for (var i in links) {
            var l = links[i];
            var source = l.derived.source;
            var target = l.derived.target;
            if ($.inArray(source, data.searchNodes) < 0) {
                data.searchNodes.push(source);
            }
            if ($.inArray(target, data.searchNodes) < 0) {
                data.searchNodes.push(target);
            }
        }
    };

	return {
		getDataset: getDataset,
		maps: function() { return maps; },
		calculatePaths: calculatePaths,
		searchNodes: function() { return data.searchNodes; },
		searchLinks: function() { return data.searchLinks; },
		addConnNote: addConnNote,
		addLinks: addLinks,
        cacheSubConnections: cacheSubConnections,
        saveSearchElements: saveSearchElements,
        addSearchLinks: addSearchLinks
	};

}(jQuery));

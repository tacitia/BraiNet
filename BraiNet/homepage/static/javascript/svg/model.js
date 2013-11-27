// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

svg.model = (function($, undefined) {

	var states = {
		activeDatasetId: null
	};
	
	var data = {
		nodes: null,
		links: null
	};
	
	var maps = {
		keyToNode: null,
		nameToNode: null,
		keyToInNeighbors: null,
		keyToOutNeighbors: null	
	};
	
	var getDataset = function(userId, datasetId) {
		if (datasetId == states.activeDatasetId) { 
			amplify.publish('datasetReady', data);
		}
		else {
			amplify.request('getDataset',
				{
					userId: userId,
					datasetId: datasetId
				},
				datasetReceived
			);
		}
	};
	
	var datasetReceived = function(d) {
		d.conns = $.parseJSON(d.conns);
		d.structs = $.parseJSON(d.structs);
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
		console.log(maps);
//		buildLinksMaps();
//		buildLinkHierarchy();
		amplify.publish('datasetReady', d);
	};


	// Add the node to maps
	var registerNode = function(node) {
		node.circular = {};
		node.derived = {};
		node.derived.children = [];
		
		maps.keyToNode[node.pk] = node;
		maps.nameToNode[node.fields.name] = node;
		maps.keyToInNeighbors[node.pk] = [];
		maps.keyToOutNeighbors[node.pk] = [];
	};

	var registerLink = function(link) {
		var targetKey = link.target_id;
		var sourceKey = link.source_id;
		var keyPair = source_key + "_" + target_key;
		
		maps.keyToLink[link.pk] = link;
		maps.srcTgtKeysToLink[keyPair] = link;
		maps.keyToInNeighbors[target_key].push(source_key);
		maps.keyToOutNeighbors[source_key].push(target_key);
//		link_paper_map[link.key] = [];		
	}

	var processRawLink = function(rawLink, attrs, attrCats, node_map) {
		var source_key = parseInt(rawLink.sourceKey);
		var target_key = parseInt(rawLink.targetKey);
		var linkKey = parseInt(rawLink.key);
		var numPub = parseInt(rawLink.numPub);
		var link = {
			key: linkKey, 
			source: node_map[source_key], 
			target: node_map[target_key], 
			numPub: numPub,
			notes: rawLink.notes, 
			paper: rawLink.paper,
			attrs: {},
			children: [], 
			isDerived: false, 
			base_children: []
		};
		for (var i = 0; i < attrs.length; ++i) {
			var attr = attrs[i];
			if (attr.linkKey === rawLink.key) {
				link.attrs[attr.attrKey] = attr.attrValue;
			}
		}
		return link;
	};	

	var buildNodesMaps = function() {
		maps.keyToNode = {};
		maps.nameToNode = {};
		maps.keyToInNeighbors = {};
		maps.keyToOutNeighbors = {};

		for (var i = 0; i < data.nodes.length; ++i) {
			var node = data.nodes[i];
			registerNode(node);
		}
	
		for (var key in maps.keyToNode) {
			var node = maps.keyToNode[key];
			if (node.fields.parent_id !== null) { 
				var parent_node = maps.keyToNode[node.fields.parent_id];
				parent_node.derived.children.push(node.pk);
			}
		}
	};


	var buildLinksMaps = function() {    
		var link_map = {};
		var node_link_map = {};
		var link_paper_map = {};
		var dataset = user.datasets[datasetKey];
		var in_neighbor_map = dataset.node_in_neighbor_map;
		var out_neighbor_map = dataset.node_out_neighbor_map;
		var processedLinks = [];

		// Further process links
		var num_links = links.length;
		for (var i = 0; i < num_links; ++i) {
			var rawLink = links[i];
			var link = processRawLink(rawLink, attrs, attrCats, dataset.node_map);
			processedLinks.push(link);
		}
		
		for (var i = 0; i < num_links; ++i) {
			var link = processedLinks[i];
			dm.addLink(link, link_map, node_link_map, in_neighbor_map, out_neighbor_map, link_paper_map);
		}
	
		dataset.link_map = link_map;
		dataset.node_link_map = node_link_map;
		dataset.link_paper_map = link_paper_map;

	};

	/*
	 * TODO: could use some performance improvement
	 */
	var buildLinkHierarchy = function(datasetKey, links) {
		var num_link = links.length;
		var max_link_key = 0;
		for (var i = 0; i < num_link; ++i) {
			var link_key = parseInt(links[i].key);
			if (link_key > max_link_key) {
				max_link_key = link_key;
			}
		}
		var dataset = user.datasets[datasetKey];
		// 1. initiate children
		// 2. check parent existence
		// 3. optionally create parent and add a child
		for (var i = 0; i < num_link; ++i) {
			var link_key = parseInt(links[i].key);
			var link = dataset.link_map[link_key];
			var source = link.source;
			var target = link.target;
			var source_parent_node = dataset.node_map[source.parent];
			var target_parent_node = dataset.node_map[target.parent];
			var base_children = [];
			var num_base_child = link.base_children.length;        
			for (var j = 0; j < num_base_child; ++j) {
				base_children.push(link.base_children[j]);
			}
			if (!link.isDerived) {
				base_children.push(link.key);
				num_base_child += 1;
			}
		
			if (source.parent !== null && source.parent !== target.key && 
					$.inArray(target.key, source_parent_node.children) < 0) {
				var key_pair = source.parent + "-" + target.key;
				var srcParentLink = dataset.node_link_map[key_pair];
				if (srcParentLink === undefined) {
					max_link_key += 1;
					var srcParentLink = {
						key: max_link_key, 
						source: dataset.node_map[parseInt(source.parent)],
						target: target, 
						children: [link_key], 
						base_children: base_children, 
					};
					processMetaLink(srcParentLink, dataset.link_map, dataset.attr_map);
					dataset.link_map[max_link_key] = srcParentLink;
					dataset.node_link_map[key_pair] = srcParentLink;
					dataset.node_in_neighbor_map[target.key].push(source.parent);
					dataset.node_out_neighbor_map[source.parent].push(target.key);
					links.push(srcParentLink);
					num_link += 1;
				}
				else {
					if ($.inArray(link_key, srcParentLink.children) < 0) {
						srcParentLink.children.push(link_key);
					}
					for (var j = 0; j < num_base_child; ++j) {
						var base_child = base_children[j];
						if ($.inArray(base_child, srcParentLink.base_children) < 0) {
							srcParentLink.base_children.push(base_child);
						}
					}
				}
			}
			if (target.parent !== null && target.parent !== source.key &&
					$.inArray(source.key, target_parent_node.children) < 0) {
				var key_pair = source.key + "-" + target.parent;
				var tgtParentLink = dataset.node_link_map[key_pair];
				if (tgtParentLink === undefined) {
					max_link_key += 1;
					var tgtParentLink = {
						key: max_link_key, 
						source: source,
						target: dataset.node_map[parseInt(target.parent)], 
						children: [link_key], 
						base_children: base_children, 
					};
					processMetaLink(tgtParentLink, dataset.link_map, dataset.attr_map);
					dataset.link_map[max_link_key] = tgtParentLink;
					dataset.node_link_map[key_pair] = tgtParentLink;
					dataset.node_in_neighbor_map[target.parent].push(source.key);
					dataset.node_out_neighbor_map[source.key].push(target.parent);
					links.push(tgtParentLink);
					num_link += 1;
				}
				else {
					if ($.inArray(link_key, tgtParentLink.children) < 0) {
						tgtParentLink.children.push(link_key);
					}
					for (var j = 0; j < num_base_child; ++j) {
						var base_child = base_children[j];
						if ($.inArray(base_child, tgtParentLink.base_children) < 0) {
							tgtParentLink.base_children.push(base_child);
						}
					}          
				}
			} 
			if (source.parent !== null && target.parent !== null && source.parent !== target.parent &&
					$.inArray(target.key, source_parent_node.children) < 0 &&
					$.inArray(source.key, target_parent_node.children) < 0) {
				var key_pair = source.parent + "-" + target.parent;
				var parentLink = dataset.node_link_map[key_pair];
				if (parentLink === undefined) {
					max_link_key += 1;
					var parentLink = {
						key: max_link_key, 
						source: dataset.node_map[parseInt(source.parent)],
						target: dataset.node_map[parseInt(target.parent)], 
						children: [link_key], 
						base_children: base_children,
					};
					processMetaLink(parentLink, dataset.link_map, dataset.attr_map);
					dataset.link_map[max_link_key] = parentLink;
					dataset.node_link_map[key_pair] = parentLink;
					dataset.node_in_neighbor_map[target.parent].push(source.parent);
					dataset.node_out_neighbor_map[source.parent].push(target.parent);
					links.push(parentLink);
					num_link += 1;
				}
				else {
					if ($.inArray(link_key, parentLink.children) < 0) {            
						parentLink.children.push(link_key);
					}
					for (var j = 0; j < num_base_child; ++j) {
						var base_child = base_children[j];
						if ($.inArray(base_child, parentLink.base_children) < 0) {
							parentLink.base_children.push(base_child);
						}
					}
				}
			} 
		}
	};

	return {
		getDataset: getDataset,
		maps: function() { return maps; }
	};

}(jQuery));

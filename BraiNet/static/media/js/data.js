
(function(dm, $, undefined) {

	function mergeDiffs(datasetKey, nodes, links, diff_nodes, diff_links) {
		var node_map = user.datasets[datasetKey].node_map;
		var link_map = user.datasets[datasetKey].link_map;
		for (var i = 0; i < diff_nodes.length; ++i) {
			diff_entry = diff_nodes[i];
			switch (diff_entry.diff) {
				case 'Rename':
					node_map[diff_entry.nodeKey].name = diff_entry.content;
					break;
				case 'AddNote':
					node_map[diff_entry.nodeKey].notes = diff_entry.content;
					break;
			}
		}
		console.log(link_map);
		for (var i = 0; i < diff_links.length; ++i) {
			diff_entry = diff_links[i];
			switch (diff_entry.diff) {
				case 'AddLink':
					break;
				case 'AddNote':
					link_map[diff_entry.linkKey].notes = diff_entry.content;
					break;
			}
		}
	};
	
	
	dm.addNode = function(node, node_map, name_node_map, in_neighbor_map, out_neighbor_map) {
		node.key = parseInt(node.key);
		node.depth = parseInt(node.depth);
		node.parent = (node.parentKey === null) ? null : parseInt(node.parentKey);
		node.circ = {};
		node.children = [];
		node_map[node.key] = node;
		name_node_map[node.name] = node;
		in_neighbor_map[node.key] = [];
		out_neighbor_map[node.key] = [];
	};

	dm.addLink = function(link, link_map, node_link_map, in_neighbor_map, out_neighbor_map, link_paper_map) {
		link_map[link.key] = link;
		var target_key = link.target.key;
		var source_key = link.source.key
		var key_pair = source_key + "-" + target_key;
		node_link_map[key_pair] = link;
		in_neighbor_map[target_key].push(source_key);
		out_neighbor_map[source_key].push(target_key);
		link_paper_map[link.key] = [];		
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
	
	
	var processMetaLink = function(link, link_map, attr_map) {
		var numPub = 0;
		var attrs = {}
		
		for (var key in attr_map) {
			var attrCat = attr_map[key];
			valueCounts = {};
			var attrValues = attrCat.values;
			for (var i = 0; i < attrValues.length; ++i) {
				var attrValue = attrValues[i];
				valueCounts[attrValue] = 0;
			}
			attrs[key] = valueCounts;
		}
				
		var base_children = link.base_children;
		for (var j = 0; j < base_children.length; ++j) {
			var baseChild = link_map[base_children[j]];
			numPub += baseChild.numPub;
			var baseAttrs = baseChild.attrs;
			for (var key in baseAttrs) {
				var attrValue = baseAttrs[key];
				attrs[key][attrValue] += 1;	
			}
		}
		
		link.notes = 'Meta link';
		link.numPub = numPub;
		link.attrs = attrs;
		link.isDerived = true;
	};


	dm.constructDataModel = function(datasetKey, data) {
		user.datasets[datasetKey] = {};
		storeDatasetAttrs(datasetKey, data.attrCats, data.attrs);
		constructNodesMaps(datasetKey, data.nodes);
		constructLinksMaps(datasetKey, data.links, data.attrs, data.attrCats);
		constructLinkHierarchy(datasetKey, data.links);
		constructPaperMap(datasetKey, data.papers);
		constructLinkPaperMap(datasetKey, data.link_paper_map)
		if (data.diff_nodes.length > 0 || data.diff_links.length > 0) {
			mergeDiffs(datasetKey, data.nodes, data.links, data.diff_nodes, data.diff_links);				
		}
		svgData.assignColors(user.datasets[datasetKey].node_map);
	};
	
	var storeDatasetAttrs = function(datasetKey, attrCats, attrs) {
		var attr_map = {};
		for (var i = 0; i < attrCats.length; ++i) {
			var attrCat = attrCats[i];
			if (attrCat.type === 'ordinal' || attrCat.type === 'nominal') {
				extractAttrValues(attrCat, attrs);
			}
			attrCat.key = parseInt(attrCat.key);
			attr_map[attrCat.key] = attrCat;
		}
		user.datasets[datasetKey].attr_map = attr_map;
	}; 
		
		
	var extractAttrValues = function(attrCat, attrs) {
		var values = [];
		for (var i = 0; i < attrs.length; ++i) {
			var attr = attrs[i];
			if (attr.attrKey == attrCat.key) {// use == here in case one of the key is already parsed into int
				var value = attr.attrValue;
				if ($.inArray(value, values) < 0) {
					values.push(value);
				}
			}
		}
		attrCat.values = values;
	};		
		
	var constructNodesMaps = function(datasetKey, nodes) {
		var node_map = {};
		var in_neighbor_map = {};
		var out_neighbor_map = {};
		var name_node_map = {};

		var num_nodes = nodes.length;
		for (var i = 0; i < num_nodes; ++i) {
			var node = nodes[i];
			dm.addNode(node, node_map, name_node_map, in_neighbor_map, out_neighbor_map);
		}
	
		for (var key in node_map) {
			var node = node_map[key];
			if (node.parent !== null) { 
				var parent_node = node_map[node.parent];
				// TODO fix this in the test_node
				if (parent_node !== undefined) { parent_node.children.push(node.key); }
				else { node.parent = null; }
			}
		}

		user.datasets[datasetKey].node_map = node_map;
		user.datasets[datasetKey].name_node_map = name_node_map;
		user.datasets[datasetKey].node_in_neighbor_map = in_neighbor_map;
		user.datasets[datasetKey].node_out_neighbor_map = out_neighbor_map;
	};


	var constructLinksMaps = function(datasetKey, links, attrs, attrCats) {    
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
	var constructLinkHierarchy = function(datasetKey, links) {
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
	
	var constructPaperMap = function(datasetKey, papers) {
		var paper_map = {};
		var num_paper = papers.length;
		for (var i = 0; i < num_paper; ++i) {
			var paper = papers[i];
			paper_map[paper.pmid] = paper;
		} 
		user.datasets[datasetKey].paper_map = paper_map;
	};
	
	var constructLinkPaperMap = function(datasetKey, records) {
		var link_paper_map = user.datasets[datasetKey].link_paper_map;
		var num_record = records.length;
		for (var i = 0; i < num_record; ++i) {
			var record = records[i];
			var linkKey = parseInt(record.linkKey);
			link_paper_map[linkKey].push(record.pmid);
		}
	};
	
	function constructBrodmannMap(data) {
		brodmann_map = {};
		var num_area = data.length;
		for (var i = 0; i < num_area; ++i) {
			var area = data[i];
			brodmann_map[area.id] = area.name;
		}
	}
	
}(window.dataModel = window.dataModel || {}, jQuery));
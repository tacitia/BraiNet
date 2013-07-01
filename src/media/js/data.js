
(function(dm, $, undefined) {

	function mergeDiffs(datasetKey, nodes, links, diff_nodes, diff_links) {
		console.log(diff_nodes);
		console.log(diff_links);
		var node_map = user_datasets[datasetKey].node_map;
		var link_map = user_datasets[datasetKey].link_map;
		for (var i = 0; i < diff_nodes.length; ++i) {
			diff_entry = diff_nodes[i];
			switch (diff_entry.diff) {
				case 'AddNode':
					var newNode = {key: diff_entry.nodeKey, name: null, depth: 0, parent: null, notes: null};
					nodes.push(newNode);
					node_map[newNode.key] = newNode;
					break;
				case 'Rename':
					node_map[diff_entry.nodeKey].name = diff_entry.content;
					break;
				case 'ChangeNote':
					node_map[diff_entry.nodeKey].notes = diff_entry.content;
					break;
			}
		}
		for (var i = 0; i < diff_links.length; ++i) {
			diff_entry = diff_links[i];
			switch (diff_entry.diff) {
				case 'AddLink':
					break;
				case 'ChangeNode':
					link_map[diff_entry.linkKey].notes = diff_entry.content;
					break;
			}
		}
	};

	
	dm.constructDataModel = function(datasetKey, data) {
		user.datasets[datasetKey] = {};
		constructNodesMaps(datasetKey, data.nodes);
		constructLinksMaps(datasetKey, data.links);
		constructLinkHierarchy(datasetKey, data.links);
		constructPaperMap(datasetKey, data.papers);
		constructLinkPaperMap(datasetKey, data.link_paper_map)
		if (data.diff_nodes.length > 0 || data.diff_links.length > 0) {
			mergeDiffs(datasetKey, data.nodes, data.links, data.diff_nodes, data.diff_links);				
		}
		svgData.assignColors(user.datasets[datasetKey].node_map);
	};
		
	var constructNodesMaps = function(datasetKey, nodes) {
		var node_map = {};
		var in_neighbor_map = {};
		var out_neighbor_map = {};
		var name_node_map = {};

		var num_nodes = nodes.length;
		for (var i = 0; i < num_nodes; ++i) {
			var node = nodes[i];
			node.key = parseInt(node.key);
			node.depth = parseInt(node.depth);
			node.parent = (node.parentKey === null) ? null : parseInt(node.parentKey);
			node.circ = {};
			node.children = [];
			node_map[node.key] = node;
			name_node_map[node.name] = node;
			in_neighbor_map[node.key] = [];
			out_neighbor_map[node.key] = [];
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


	var constructLinksMaps = function(datasetKey, links) {    
		var link_map = {};
		var node_link_map = {};
		var dataset = user.datasets[datasetKey];

		var num_links = links.length;
		for (var i = 0; i < num_links; ++i) {
			var raw_link = links[i];
			var source_key = parseInt(raw_link.sourceKey);
			var target_key = parseInt(raw_link.targetKey);
			var link = {key: parseInt(raw_link.key), source: dataset.node_map[source_key], 
				target: dataset.node_map[target_key], notes: raw_link.notes, paper: raw_link.paper,
				children: [], isDerived: false, base_children: []};
			link_map[link.key] = link;
			var key_pair = link.source.key + "-" + link.target.key;
			node_link_map[key_pair] = link;
			dataset.node_in_neighbor_map[target_key].push(source_key);
			dataset.node_out_neighbor_map[source_key].push(target_key);
		}
	
		dataset.link_map = link_map;
		dataset.node_link_map = node_link_map;
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
					var srcParentLink = {key: max_link_key, 
					source: dataset.node_map[parseInt(source.parent)],
					target: target, notes: 'Meta link', children: [link_key], isDerived: true, 
					base_children: base_children, paper: []};
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
					var tgtParentLink = {key: max_link_key, 
					source: source,
					target: dataset.node_map[parseInt(target.parent)], 
					notes: 'Meta link', children: [link_key], isDerived: true, 
					base_children: base_children, paper: []};
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
					var parentLink = {key: max_link_key, 
					source: dataset.node_map[parseInt(source.parent)],
					target: dataset.node_map[parseInt(target.parent)], 
					notes: 'Meta link', children: [link_key], isDerived: true, 
					base_children: base_children, paper: []};
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
		console.log(paper_map);
	};
	
	var constructLinkPaperMap = function(datasetKey, records) {
		var link_paper_map = {};
		var num_record = records.length;
		for (var i = 0; i < num_record; ++i) {
			var record = records[i];
			var linkKey = parseInt(record.linkKey);
			if (link_paper_map[linkKey] === undefined) link_paper_map[linkKey] = [];
			link_paper_map[linkKey].push(record.pmid);
		}
		user.datasets[datasetKey].link_paper_map = link_paper_map;
		console.log(link_paper_map);
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
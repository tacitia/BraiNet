/**
* brainMap.js
*
* Author: Hua
*
*/

(function () {
    brainMap = {
        // Lazily construct the brain hierarchy from brain region names.
        root: function (data) {
            var map = {};
            function find(name, data) {
                var node = map[name], i;
                if (!node) {
                    node = map[name] = data || {name: name, children: []};
                    if (name.length) {
                        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                        node.parent.children.push(node);
                        node.displayName = name.substring(i + 1);
                        node.children = [];
                        node.fixed = false;
                    }
                }
                return node;
            }


            data.forEach(function (d) {
                find(d.name, d);
            }
            );
            return map[""];
        },
        // Generate the mapping from [source region name, target region name] to an ID of the associated literature
        evidence: function (nodes) {
            var map = [];

            nodes.forEach(function (d) {
                if (d.links) {
                    d.links.forEach(function (i) {
                        map.push({source:d.name, target:i.name, detail:i.detail});
                    });
                }
            });

            return map;
        },
        // Return a list of connections for the given array of brain regions.
        connections: function (nodes) {
            var map = {},
            links = [];

            // Compute a map from name to node.
            nodes.forEach(function (d) {
                map[d.name] = d;
            });

            // Construct links
            nodes.forEach(function (d) {
                if (d.links) {
                    d.links.forEach(function (i) {
                        // Debug code: map[i.name] will be undefined if the connectivity data is incorrect
                        if (map[i.name] === undefined) {
                            console.log(d.name);
                            console.log(i.name);
                        }
                        else {
                            links.push({source: map[d.name], target: map[i.name], detail: i.detail, bi: i.bi});
                        }
                    });
                }
            });
            return links;
        },
        nameNodeMap: function (nodes) {
            var map = {};
            nodes.forEach(function (d) {
                map[d.name] = d;
            });
            return map;
        },
        displayNameNodeMap: function (nodes) {
            var map = [];
            nodes.forEach(function (d) {
                if (d.displayName !== undefined) {
                    map.push({name: d.displayName.toLowerCase(), node: d});
                    //map[d.displayName.toLowerCase()] = d;
                }
            });
            return map;
        },
        maxKey: function (nodes) {
            var key = 0;
            nodes.forEach(function (d) {
                if (d.key > key) {
                    key = d.key;
                }
            });
            return key;
        }
        //cloneNode: function (node) {
            //var newNode;
            //newNode.name = d.name;
            //newNode.key = d.key;
            //if (node.parent != undefined) {
                //newNode.parent = cloneNode(node.parent);
            //}
            //newNode.displayName = node.displayName;
            //newNode.links = cloneLink(node.links);
            //return newNode;
        //},
        //cloneLink: function(links) {
            //var newLinks = [];
            //return newLinks;
        //}
    };
}());

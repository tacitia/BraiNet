import json    

sourcefilename = '../source/structures.json'
sourcefile = open(sourcefilename, 'r')

structures = json.load(sourcefile)

for s in structures:
	attributes = {}
	s.pop('st_level')
	s.pop('neuro_name_structure_id_path')
	s.pop('neuro_name_structure_id')
	s.pop('graph_id')
	s.pop('weight')
	s.pop('failed')
	s.pop('ontology_id')
	attributes['atlas_id'] = s.pop('atlas_id')
	attributes['color_hex_triplet'] = s.pop('color_hex_triplet')
	attributes['graph_order'] = s.pop('graph_order')
	attributes['sphinx_id'] = s.pop('sphinx_id')
	attributes['hemisphere_id'] = s.pop('hemisphere_id')
	s['attributes'] = attributes

outputfile = '../output/structures.json'
    
file = open(outputfile,"w")
file.write(json.dumps(structures, indent=2, separators=(', ', ': ')))
file.close()
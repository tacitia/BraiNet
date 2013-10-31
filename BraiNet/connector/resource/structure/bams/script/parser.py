from bs4 import BeautifulSoup
import json

inputfilename = '../source/ontology-bams-102613.xml'
inputfile = open(inputfilename)
soup = BeautifulSoup(inputfile)

descriptions = soup.find_all('rdf:description')
structures = []
struct_hash = {}
struct_id_hash = {}
id_counter = 1


# Read brain parts and parent-child relationships
# Note: "brainPart" and "hierarchy" sections in the data doesn't match each other, so we only parse structures from the hierarchy section
for desc in descriptions:
	contents = desc.contents
	type_brain_part = '<rdf:type rdf:resource="http://brancusi1.usc.edu/RDF/brainPart"></rdf:type>'
	type_hierarchy = '<rdf:type rdf:resource="http://brancusi1.usc.edu/RDF/hierarchy"></rdf:type>'
#	if str(contents[1]) == type_brain_part:
#		structure = {}
#		attributes = {}
#		is_rat = False
#		for tag in contents:
#			tag = str(tag)
#			if (tag.startswith('<bams:abbreviation>')):
#				structure['acronym'] = tag.replace('<bams:abbreviation>', '').replace('</bams:abbreviation>', '')
#			elif (tag.startswith('<bams:name>')):
#				structure['name'] = tag.replace('<bams:name>', '').replace('</bams:name>', '')
#			elif (tag.startswith('<bams:collationdate>')):
#				attributes['collation_date'] = tag.replace('<bams:collationdate>', '').replace('</bams:collationdate>', '')
#			elif (tag.startswith('<bams:description>')):
#				attributes['description'] = tag.replace('<bams:description>', '').replace('</bams:description>', '')
#			elif (tag.startswith('<bams:grossconstituent')):
#				attributes['gross_constituent'] = tag.replace('<bams:grossconstituent rdf:resource="http://brancusi1.usc.edu/RDF/', '').replace('</bams:grossconstituent', '').replace('\">>', '')
#			elif (tag.startswith('<bams:species')):
#				rdf_species = tag.replace('<bams:species rdf:resource="http://brancusi1.usc.edu/RDF/', '').replace('"></bams:species>', '')
#				if rdf_species == 'rat':
#					is_rat = True
#		if is_rat:
#			structure['attributes'] = attributes
#			structure['id'] = str(counter)
#			structure['num_children'] = 0
#			structures.append(structure)
#			struct_hash[structure['name']] = structure
#			id_counter += 1
	if str(contents[1]) == type_hierarchy:
		relationship = contents[7]
		for tag in contents:
			tag = str(tag)
			if (tag.startswith('<bams:name>')):
				relationship = tag.replace('<bams:name>', '').replace('</bams:name>', '')
				nodes = relationship.split(' : ')
				parent = nodes[0].lower()
				child = nodes[1].lower()
				if not parent in struct_hash:
					parent_struct = {}
					parent_struct['name'] = parent
					parent_struct['id'] = id_counter
					parent_struct['num_children'] = 0
					structures.append(parent_struct)
					struct_hash[parent] = parent_struct
					struct_id_hash[id_counter] = parent_struct
					id_counter += 1
				else:
					parent_struct = struct_hash[parent]
				if not child in struct_hash:
					child_struct = {}
					child_struct['name'] = child
					child_struct['id'] = id_counter
					child_struct['num_children'] = 0
					structures.append(child_struct)
					struct_hash[child] = child_struct
					struct_id_hash[id_counter] = child_struct
					id_counter += 1
				else:
					child_struct = struct_hash[child]
									
				child_struct['parent_structure_id'] = parent_struct['id']
				parent_struct['num_children'] += 1					

# Construct structure_id_path
for id, struct in struct_id_hash.iteritems():
	struct['structure_id_path'] = [id]	
	if not 'parent_structure_id' in struct:
		struct['parent_structure_id'] = None
		struct['depth'] = 0
	else:
		parent_struct = struct_id_hash[struct['parent_structure_id']]
		depth = 0
		while parent_struct is not None:
			depth += 1
			struct['structure_id_path'].append(parent_struct['id'])
			if not 'parent_structure_id' in parent_struct or parent_struct['parent_structure_id'] == None:
				parent_struct = None
			else:
				parent_struct = struct_id_hash[parent_struct['parent_structure_id']]
		struct['depth'] = depth
		struct['structure_id_path'].reverse()	
				
outputfilename = '../output/structures.json'
outputfile = open(outputfilename, 'w')
outputfile.write(json.dumps(structures, indent=2, separators=(', ', ': ')))
outputfile.close()
import json

struct_file_name = '../../../structure/bams/output/structures.json'
struct_file = open(struct_file_name, 'r')
structures = json.load(struct_file)

struct_hash = {}
for s in structures:
	struct_hash[s['name']] = s
	
conn_file_name = '../output/connections_name.json'
conn_file = open(conn_file_name, 'r')

output_file_name = '../output/connections.json'
output_file = open(output_file_name, 'w')

connections = json.load(conn_file)

for c in connections:
	source_name = str(c['source']).lower()
	target_name = str(c['target']).lower()
	c['source'] = struct_hash[source_name]['id']
	c['target'] = struct_hash[target_name]['id']	

output_file.write(json.dumps(connections, indent=2, separators=(', ', ': ')))
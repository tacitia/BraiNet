import json
import general

struct_file_name = '../../../structure/bams/output/structures.json'
struct_file = open(struct_file_name, 'r')
structures = json.load(struct_file)

struct_hash = {}
for s in structures:
	struct_hash[s['name']] = s
	
conn_file_name = '../output/connections.json'
conn_file = open(conn_file_name, 'r')
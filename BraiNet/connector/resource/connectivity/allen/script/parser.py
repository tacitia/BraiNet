import json
import general
import os

source_dir = '../source/per_injection_connections'
conn_hash = {}

for i in range(1, 1390):
	print 'Parsing connection file #' + str(i) + '...'
	source_file_name = os.path.join(source_dir, str(i) + '.json')
	source_file = open(source_file_name, 'r')
	connections = json.load(source_file)
	for c in connections:
		src = c['source']
		tgt = c['target']
		if not conn_hash.has_key(src):
			conn_hash[src] = {}
		if not conn_hash[src].has_key(tgt):
			conn_hash[src][tgt] = {}
			for attr_name, attr_value in c['attributes'].iteritems():
				conn_hash[src][tgt][attr_name] = []
		for attr_name, attr_value in c['attributes'].iteritems():
			conn_hash[src][tgt][attr_name].append(attr_value)
	source_file.close()
		
output_file_name = '../output/connections.json'
output_file = open(output_file_name, 'w')

output_file.write('[\n')
num_src = len(conn_hash)
c1 = 0
for src, targets in conn_hash.iteritems():
	num_tgt = len(targets)
	c2 = 0
	for tgt, attributes in targets.iteritems():
		conn = {}
		conn['source'] = src
		conn['target'] = tgt
		conn['attributes'] = attributes
		output_file.write(json.dumps(conn, indent=4, separators=(', ', ': ')))
		if not (c1 == num_src - 1 and c2 == num_tgt - 1):
			output_file.write(',\n')
		c2 += 1
	c1 += 1
output_file.write(']')
				
import json
import general
import os

source_file_name = '../source/injections.json'
source_file = open(source_file_name, 'r')
injections = json.load(source_file)

output_dir = '../source/per_injection_connections'
counter = 0
start_id = 1273
for injection in injections:
	counter += 1
	if counter < start_id:
		continue
	out_file_name = os.path.join(output_dir, str(counter) + '.json')
	print 'Writing data for injection #' + str(counter) + ' into ' + out_file_name
	out_file = open(out_file_name, 'w')
	url = general.GetInjectDetailUrl(injection['section-data-set-id'])
	data = general.QueryAPI(url)
	connections = []
	for record in data:
		connection = {}
		connection['source'] = injection['primary_injection_structure_id']
		connection['target'] = record['structure_id']
		record.pop('structure_id')
		connection['attributes'] = {}
		connection['attributes']['projection_volume'] = record['projection_volume']
		connection['attributes']['normalized_projection_volume'] = record['normalized_projection_volume']
		connection['attributes']['projection_intensity'] = record['projection_intensity']
		connection['attributes']['projection_density'] = record['projection_density']	
		connections.append(connection)		
	out_file.write(json.dumps(connections, indent=2, separators=(', ', ': ')))
import json
import general

def ConstructConnectivityRecords(injections):
	connfile = '../output/connections.json'
	cfile = open(connfile, 'w')
	cfile.write('[\n')
	counter = 0
	for injection in injections:
		counter += 1
		print 'Parsing injection #' + str(counter)
		url = general.GetInjectDetailUrl(injection['section-data-set-id'])
		data = general.QueryAPI(url)
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
			cfile.write(json.dumps(connection, indent=2, separators=(', ', ': ')))
			cfile.write(',\n')

	cfile.write('\n]')
	cfile.close()

sourcefilename = '../source/injections.json'
sourcefile = open(sourcefilename, 'r')
injections = json.load(sourcefile)
ConstructConnectivityRecords(injections)

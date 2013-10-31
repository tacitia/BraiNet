import csv
import json

inputfilename = '../source/conn-nif-102613.csv'
inputfile = open(inputfilename, 'r')
reader = csv.reader(inputfile, delimiter = ',', quotechar='"')
connections = []
next(reader, None)

for row in reader:
	connection = {}
	connection['source'] = row[1]
	connection['target'] = row[2]
	attributes = {}
	attributes['bams_record'] = row[15]
	attributes['projection_strength'] = row[3]
	attributes['technique'] = row[5][12:]
	attributes['reference'] = row[14]
	attributes['pubmed_link'] = row[19]
	connection['attributes'] = attributes
	print connection
	connections.append(connection)
	
outputfilename = '../output/connections_name.json'
outfile = open(outputfilename, 'w')
outfile.write(json.dumps(connections, indent=2, separators=(', ', ': ')))
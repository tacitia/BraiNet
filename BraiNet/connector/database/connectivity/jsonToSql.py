from django.db import models
from django.db import IntegrityError
from connectivity.models import Structure, Connection, Dataset
from account.models import Account
import json
import os
from django.db.models import Q

super_user = Account.objects.get(access_code='abcdefgh')

conn_dir = 'connector/resource/connectivity'
conn_file_loc = 'output/connections.json'
index_file_name = 'connector/database/connectivity/index.json'

datasets = json.load(open(index_file_name))

for d in datasets:
	conn_file_name = os.path.join(conn_dir, d['dir'], conn_file_loc)
	print 'Converting connectivity json file: ' + conn_file_name + '...'
	conn_file = open(conn_file_name)
	connections = json.load(conn_file)
	dataset_model = Dataset.objects.get(name=d['name'])
	for c in connections:
		try:
			c_src_model = Structure.objects.get(id=str(dataset_model.id) + '-' + str(c['source']))
			c_tgt_model = Structure.objects.get(id=str(dataset_model.id) + '-' + str(c['target']))
			if (Connection.objects.filter(Q(source_id=c_src_model) & Q(target_id=c_tgt_model)).count() > 0):
				print 'Connection already exists.'
				continue
			c_model = Connection(
						source_id=c_src_model,
						target_id=c_tgt_model,
						user_id=super_user,
						dataset_id=dataset_model,
						attributes=c['attributes']
					)
			c_model.save()
		except IntegrityError:
			continue
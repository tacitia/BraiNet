from django.db import models
from django.db import IntegrityError
from connectivity.models import Structure, Dataset
from account.models import Account
import json
import os

super_user = Account.objects.get(access_code='abcdefgh')

struct_dir = 'connector/resource/structure'
struct_file_loc = 'output/structures.json'
index_file_name = 'connector/database/structure/index.json'

datasets = json.load(open(index_file_name))

for d in datasets:
	struct_file_name = os.path.join(struct_dir, d['dir'], struct_file_loc)
	print 'Converting structure json file: ' + struct_file_name + '...'
	struct_file = open(struct_file_name)
	structures = json.load(struct_file)
	dataset_model = Dataset.objects.get(name=d['name'])
	for s in structures:
		try:
			s_model = Structure(
						id=str(dataset_model.id) + '-' + str(s['id']),
						name=str(s['name']), 
						struct_id=s['id'],
						depth=s['depth'],
						num_children=s['num_children'],
						struct_id_path=s['structure_id_path'], 
						attributes={},
						user_id=super_user, 
						dataset_id=dataset_model
					)
			s_model.save()
		except IntegrityError:
			continue

	for s in structures:
		s_model = Structure.objects.get(id=str(dataset_model.id) + '-' + str(s['id']))
		s_parent_model = None
		if s['parent_structure_id'] != None:
			parent_id = str(dataset_model.id) + '-' + str(s['parent_structure_id'])
			s_parent_model = Structure.objects.get(id=parent_id)
		
		s_model.parent_id = s_parent_model
		s_model.save()
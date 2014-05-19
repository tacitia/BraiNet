from django.db import models
from django.db import IntegrityError
from connectivity.models import Structure, Connection, Dataset, Path
from account.models import Account
import json
import os
from django.db.models import Q

super_user = Account.objects.get(access_code='abcdefgh')
hop_limit = 1

for dataset in [2]:
	structures = Structure.objects.filter(dataset_id=dataset)
	connections = Connection.objects.filter(dataset_id=dataset)
	# loop through all pairs of structures that are not ancestors / descendants and compute 
	# paths
	for s1 in structures.iterator():
		for s2 in structures.iterator():
			for m in range(1,hop_limit+1):
				# skip pairs of ancestor / descendant; this also accounts for the case of 
				# a pair of identical structures
				if (s2.struct_id in s1.struct_id_path or s1.struct_id in s2.struct_id_path):
					continue
				print s1.id + ' ' + s2.id + ' ' + str(m)		
				# find all paths and store in final_paths	
				final_paths = []
				inter_nodes = []
				inter_paths = [[s1.id]]
				counter = 0
				while counter < m: #m = 0 means direct connection
					num_inter_paths = len(inter_paths)
					new_inter_paths = []
					for p in inter_paths: # loop through all the existing paths, all having length counter + 1
						endpoint = p[-1]
						branches = Connection.objects.filter(Q(source_id=endpoint)) # all possible directions from the endpoint
						print branches.count()
						for link in branches:
							if link.target_id.id.strip() == s2.id.strip():
								final_paths.append(p + [s2.id.strip()])
							else:
								new_inter_paths.append(p + [link.target_id.id.strip()])
								inter_nodes.append(link.target_id.id.strip())
					inter_paths = new_inter_paths
					counter += 1
				inter_nodes = list(set(inter_nodes))
				# form and save the path object
				path = Path(
					source_id=s1,
					sink_id=s2,
					hop=m,
					stops=inter_nodes,
					paths=final_paths
				)
				path.save()
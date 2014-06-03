from django.db import models
from django.db import IntegrityError
from connectivity.models import Structure, Connection, Dataset, Path
from account.models import Account
import json
import os
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist

super_user = Account.objects.get(access_code='abcdefgh')
hop_limit = 1

for dataset in [1]:
	structures = Structure.objects.filter(dataset_id=dataset)
	# loop through all pairs of structures that are not ancestors / descendants and compute 
	# paths
	for s1 in structures.iterator():
		for s2 in structures.iterator():
			for m in range(1,hop_limit+1):
				try:
					Path.objects.get(source_id=s1,sink_id=s2,hop=m)
				except ObjectDoesNotExist:
					# skip pairs of ancestor / descendant; this also accounts for the case of 
					# a pair of identical structures
					if (s2.struct_id in s1.struct_id_path or s1.struct_id in s2.struct_id_path):
						continue
					print s1.id + ' ' + s2.id + ' ' + str(m)
					source_neighbors = Connection.objects.filter(Q(source_id=s1) & ~Q(target_id=s1) & (Q(target_depth=s1.depth) | Q(is_derived=0))).iterator()
					target_neighbors = Connection.objects.filter(Q(target_id=s2) & ~Q(source_id=s2) & (Q(source_depth=s2.depth) | Q(is_derived=0))).iterator()
					sn_ids = [c.target_id.id for c in source_neighbors]
					tn_ids = [c.source_id.id for c in target_neighbors]
					if m == 1:
						stops = [val for val in sn_ids if val in tn_ids]
						paths = [[val] for val in stops]
					print paths
	#				if m == 2:
					# form and save the path object
					if len(stops) == 0:
						continue
					path = Path(
						source_id=s1,
						sink_id=s2,
						hop=m,
						stops=stops,
						paths=paths
					)
					path.save()
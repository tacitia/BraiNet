# Currently, a derived connection is NOT added if there is already a non-derived connection with the same source and target; should we change that? not sure yet

from django.db import models
from django.db import IntegrityError
from connectivity.models import Structure, Connection, Dataset
from account.models import Account
import json
import os
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist

# TODO: fix this so that it does not generate derived connections between ancestors and decendants
super_user = Account.objects.get(access_code='abcdefgh')

min_depth = 1
max_depth = 11
for dataset in [1]:
	dataset_instance = Dataset.objects.get(id=dataset)
	
	for m in range(min_depth, max_depth+1):
		for n in range(min_depth, max_depth+1):
			print 'm=' + str(m)
			print 'n=' + str(n)	
			connections = Connection.objects.filter(Q(dataset_id=dataset) & Q(is_derived=0) & (Q(source_depth=m) & Q(target_depth=n)))
			for c in connections.iterator():
				source_ancestors = c.source_id.parent_id.struct_id_path
				target_ancestors = c.target_id.parent_id.struct_id_path
				for sa in source_ancestors:
					for ta in target_ancestors:
						if sa == ta:
							continue
						new_sa = str(dataset) + '-' + str(sa)
						new_ta = str(dataset) + '-' + str(ta)
						try:
							derived_conn = Connection.objects.get(Q(source_id=new_sa) & Q(target_id=new_ta) & Q(is_derived=1))
							if c.id not in derived_conn.leaves:
								derived_conn.leaves.append(c.id);
						except ObjectDoesNotExist:
							source_object = Structure.objects.get(id=new_sa)
							target_object = Structure.objects.get(id=new_ta)
							derived_conn = Connection(
										source_id=source_object,
										target_id=target_object,
										user_id=super_user,
										dataset_id=dataset_instance,
										attributes={},
										is_derived=1,
										leaves = [c.id],
										source_depth=source_object.depth,
										target_depth=target_object.depth
									)
							derived_conn.save()

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
max_depth = 9
for dataset in [2]:
	dataset_instance = Dataset.objects.get(id=dataset)
	
	for m in range(min_depth, max_depth+1):
		for n in range(min_depth, max_depth+1):
			print 'm=' + str(m)
			print 'n=' + str(n)	
			connections = Connection.objects.filter(Q(dataset_id=dataset) & Q(is_derived=0) & (Q(source_depth=m) & Q(target_depth=n)))
			for c in connections.iterator():
				source_parent = c.source_id.parent_id
				while source_parent != None and source_parent.depth > 0:
					try:
						derived_conn = Connection.objects.get(Q(source_id=source_parent) & Q(target_id=c.target_id) & Q(is_derived=1))
						if c.id not in derived_conn.leaves:
							derived_conn.leaves.append(c.id);
					except ObjectDoesNotExist:
						derived_conn = Connection(
									source_id=source_parent,
									target_id=c.target_id,
									user_id=super_user,
									dataset_id=dataset_instance,
									attributes={},
									is_derived=1,
									leaves = [c.id],
									source_depth=source_parent.depth,
									target_depth=c.target_id.depth
								)
					derived_conn.save()
					source_parent = source_parent.parent_id
				target_parent = c.target_id.parent_id
				while target_parent != None and target_parent.depth > 0:
					try:
						derived_conn = Connection.objects.get(Q(source_id=c.source_id) & Q(target_id=target_parent) & Q(is_derived=1))
						if c.id not in derived_conn.leaves:
							derived_conn.leaves.append(c.id);
					except ObjectDoesNotExist:
						derived_conn = Connection(
									source_id=c.source_id,
									target_id=target_parent,
									user_id=super_user,
									dataset_id=dataset_instance,
									attributes={},
									is_derived=1,
									leaves = [c.id],
									source_depth=c.source_id.depth,
									target_depth=target_parent.depth
								)
					derived_conn.save()
					target_parent = target_parent.parent_id

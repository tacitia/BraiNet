from django.db import models
from django.db import IntegrityError
from connectivity.models import Structure, Connection, Dataset
from account.models import Account
import json
import os
from django.db.models import Q

super_user = Account.objects.get(access_code='abcdefgh')

for dataset in [1,2]:
	step = 20000
	for unit in range(0,12):
		start = step * unit
		end = step * (unit+1) - 1
		connections = Connection.objects.filter(dataset_id=dataset)[start:end]
		# Populate the source_depth and target_depth fields
		max_depth = -1
		id = 0
		for c in connections.iterator():
			c.source_depth = c.source_id.depth
			c.target_depth = c.target_id.depth
			if c.source_id.depth > max_depth:
				max_depth = c.source_id.depth
			if c.target_id.depth > max_depth:
				max_depth = c.target_id.depth
			id += 1
			c.save()
			print id
		print max_depth

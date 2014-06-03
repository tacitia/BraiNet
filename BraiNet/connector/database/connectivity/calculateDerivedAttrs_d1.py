# Currently, a derived connection is NOT added if there is already a non-derived connection with the same source and target; should we change that? not sure yet

from django.db import models
from django.db import IntegrityError
from connectivity.models import Structure, Connection, Dataset
from account.models import Account
import json
import os
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
import numpy as np

super_user = Account.objects.get(access_code='abcdefgh')

# iterate through all the derived edges, calculate an average and SD for each

derived_connections = Connection.objects.filter(Q(is_derived=1) & Q(dataset_id=1))

counter = 0
for c in derived_connections.iterator():
	leaves = c.leaves
	attributes = {'technique': [], 'projection_strength': []}
	# put attributes from all leaves into the same array
	for l in leaves:
		leaf_conn = Connection.objects.get(id=l)
		leaf_attr = leaf_conn.attributes
		for	key in leaf_attr:
			value = leaf_attr[key]
			try:
				attributes[key].append(value)
			except KeyError:
				continue
	# calculate count for discrete edge attributes
	for key in attributes:
		counts = {}
		for a in attributes[key]:
			try:
				counts[a] += 1
			except KeyError:
				counts[a] = 1
		c.attributes[key] = counts
		print counts
	
	c.save()
	counter += 1
	print counter
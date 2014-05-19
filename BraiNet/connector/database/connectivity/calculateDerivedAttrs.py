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

derived_connections = Connection.objects.filter(is_derived=1)

counter = 0
for c in derived_connections.iterator():
	leaves = c.leaves
	attributes = {}
	# put attributes from all leaves into the same array
	for l in leaves:
		leaf_conn = Connection.objects.get(id=l)
		leaf_attr = leaf_conn.attributes
		for	key in leaf_attr:
			values = leaf_attr[key]
			try:
				group_array = attributes[key]
			except KeyError:
				attributes[key] = []
			attributes[key] = attributes[key] + values
	# calculate average, SD, median
	for key in attributes:
		mean_v = np.mean(attributes[key])
		median_v = np.median(attributes[key])
		sd_v = np.std(attributes[key])
		c.attributes[key] = {'mean': mean_v, 'median': median_v, 'sd': sd_v}
	
	c.save()
	counter += 1
	print counter
from connectivity.models import *
from account.models import *
from account.models import ConnNote
import json
import numpy
from django.core import serializers
from django.db.models import Q
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.forms.models import model_to_dict

# Get and post connectivity data based on user id and dataset id

def getDatasets(request, user_id):
	try:
		user = Account.objects.get(access_code=user_id)
	except ObjectDoesNotExist:
		return HttpResponse(json.dumps('{"error": "InvalidAccessCode"}'), content_type='application/json')
	datasets = Dataset.objects.filter(Q(visibility='public') | Q(user_id=user.id))
	response_data = serializers.serialize('json', datasets)
	return HttpResponse(json.dumps(response_data), content_type='application/json')
	
def getSubConnections(request, conn_id):
	try:
		parent_conn = Connection.objects.get(id=conn_id)
		print parent_conn.source_id.id
		print parent_conn.target_id.id
	except ObjectDoesNotExist:
		print 'Invalid connection id in getSubConnections.'
		return HttpResponse(json.dumps('{"error": "InvalidConnectionId"}'), content_type='application/json')
	sub_conns = Connection.objects.filter((Q(source_id__parent_id=parent_conn.source_id) & Q(target_id__parent_id=parent_conn.target_id)) | (Q(source_id=parent_conn.source_id) & Q(target_id__parent_id=parent_conn.target_id)) | (Q(source_id__parent_id=parent_conn.source_id) & Q(target_id=parent_conn.target_id)))
	print sub_conns.count()
	sub_conns = serializers.serialize('json', sub_conns)
	return HttpResponse(json.dumps(sub_conns), content_type='application/json')

# return the set of leaves for a given connection
def getLeaves(request, conn_id):
	try:
		parent_conn = Connection.objects.get(id=conn_id)
	except ObjectDoesNotExist:
		print 'Invalid connection id in getLeaves.'		
		return HttpResponse(json.dumps('{"error": "InvalidConnectionId"}'), content_type='application/json')
	leaf_ids = parent_conn.leaves
	print parent_conn
	if leaf_ids is None:
		return HttpResponse(json.dumps('{"error": "NoLeaves"}'), content_type='application/json')		
	leaves = []
	for lid in leaf_ids:
		leaf = Connection.objects.get(id=lid)
		leaves.append(leaf)
	leaves = serializers.serialize('json', leaves)
	if parent_conn.dataset_id == 2:
		leaves = averageAttributes(leaves)
	print leaves
	return HttpResponse(json.dumps(leaves), content_type='application/json')

# return the set of connections associated with the given structure
def getLocalConnections(request, struct_id, depth):
	connections = Connection.objects.filter((Q(source_id=struct_id) & Q(target_id__depth=depth)) | (Q(target_id=struct_id) & Q(source_id__depth=depth)))
	print connections.count()
	if connections.count() == 0:
		return HttpResponse(json.dumps('{"error": "NoConnections"}'), content_type='application/json')	
	response_data = serializers.serialize('json', connections)
	if connections[0].dataset_id == 2:
		response_data = averageAttributes(response_data)
	return HttpResponse(json.dumps(response_data), content_type='application/json')	

def getPaths(request, source_id, target_id, max_hop):
	max_depth = 3
	s1 = Structure.objects.get(id=source_id)
	s2 = Structure.objects.get(id=target_id)
	source_neighbors = Connection.objects.filter(Q(source_id=s1) & ~Q(target_id=s1) & (Q(target_depth=max_depth) | (Q(target_depth__lt=max_depth) & Q(is_derived=0)))).iterator()
	target_neighbors = Connection.objects.filter(Q(target_id=s2) & ~Q(source_id=s2) & (Q(source_depth=max_depth) | (Q(source_depth__lt=max_depth) & Q(is_derived=0)))).iterator()
	sn_ids = [c.target_id.id for c in source_neighbors if c.target_id.struct_id not in s1.struct_id_path and s1.struct_id not in c.target_id.struct_id_path]
	tn_ids = [c.source_id.id for c in target_neighbors if c.source_id.struct_id not in s2.struct_id_path and s2.struct_id not in c.source_id.struct_id_path]
	stops = []
	links = []
	paths = []
	m = int(max_hop)
	print len(sn_ids)
	print len(tn_ids)
	if m >= 1:
		stops = [val for val in sn_ids if val in tn_ids]
		paths = [[val] for val in stops]
		for val in stops:
			l1 = Connection.objects.filter(Q(source_id=s1) & Q(target_id=val))
			l2 = Connection.objects.filter(Q(source_id=val) & Q(target_id=s2))
			# this is needed because there might be two connections (one derived and one native) between a pair of nodes
			for l in l1:
				addConnModelToList(l, links)
			for l in l2:
				addConnModelToList(l, links)				
	if m >= 2:
		for n1 in sn_ids:
			for n2 in tn_ids:
				if n1 == n2:
					continue
				try:
					c = Connection.objects.filter(Q(source_id=n1) & Q(target_id=n2))
					if c.count() == 0:
						continue
					for l in c:
						addConnModelToList(l, links)
					l1 = Connection.objects.filter(Q(source_id=s1) & Q(target_id=n1))
					l2 = Connection.objects.filter(Q(source_id=n2) & Q(target_id=s2))
					for l in l1:
						addConnModelToList(l, links)
					for l in l2:
						addConnModelToList(l, links)
					stops.extend([n1, n2])
					paths.append([n1, n2])
				except ObjectDoesNotExist:
					continue
	if m >= 3:
		for n1 in sn_ids:
			for n2 in tn_ids:
				print n1
				print n2
				if n1 == n2:
					continue
				n1_object = Structure.objects.get(id=n1)
				n2_object = Structure.objects.get(id=n2)
				n1_neighbors = Connection.objects.filter(Q(source_id=n1) & ~Q(target_id=n1) & (Q(target_depth=max_depth) | (Q(target_depth__lt=max_depth) & Q(is_derived=0)))).iterator()
				n2_neighbors = Connection.objects.filter(Q(target_id=n2) & ~Q(source_id=n2) & (Q(source_depth=max_depth) | (Q(source_depth__lt=max_depth) & Q(is_derived=0)))).iterator()
				n1n_ids = [c.target_id.id for c in n1_neighbors if c.target_id.struct_id not in n1_object.struct_id_path and n1_object.struct_id not in c.target_id.struct_id_path]
				n2n_ids = [c.source_id.id for c in n2_neighbors if c.source_id.struct_id not in n2_object.struct_id_path and n2_object.struct_id not in c.source_id.struct_id_path]	
				mid_stops = [val for val in n1n_ids if val in n2n_ids]
				if len(mid_stops) > 0:
					l1 = Connection.objects.filter(Q(source_id=s1) & Q(target_id=n1))
					l2 = Connection.objects.filter(Q(source_id=n2) & Q(target_id=s2))
					for l in l1:
						addConnModelToList(l, links)
					for l in l2:
						addConnModelToList(l, links)
					stops.extend([n1, n2])
				else:
					continue
				for val in mid_stops:
					l3 = Connection.objects.filter(Q(source_id=n1) & Q(target_id=val))
					l4 = Connection.objects.filter(Q(source_id=val) & Q(target_id=n2))
					for l in l3:
						addConnModelToList(l, links)
					for l in l4:
						addConnModelToList(l, links)	
					stops.append(val)
					paths.append([n1, val, n2])
								
	stops = list(set(stops))
	response_data = {}
	response_data['stops'] = stops
	response_data['links'] = links
	response_data['paths'] = paths
#	print response_data
	return HttpResponse(json.dumps(response_data), content_type='application/json')

def addConnModelToList(l, holder):
	if not l in holder:
		dict_l = model_to_dict(l)
		dict_l['attributes'] = dict_l['attributes'].replace('\n', '')
		dict_l['attributes'] = dict_l['attributes'].replace(' ', '')
		dict_l['leaves'] = dict_l['leaves'].replace('\n', '')
		dict_l['leaves'] = dict_l['leaves'].replace(' ', '')
		holder.append({'pk': l.id, 'fields': dict_l})
	

# calculate the indirect path between two structures
# only look at one level, since connections on lower levels would have been fully propagated up
#def getPaths(request, source_id, target_id, max_hop):
#	source = Structure.objects.get(source_id)
#	target = Structure.objects.get(target_id)
	# Get the neighbors of the source
#	max_hop = int(max_hop)
#	final_paths = []
#	inter_nodes = []
#	inter_paths = [[source_id]]
#	counter = 0
#	while counter < max_hop: #max_hop = 1 means direct connection
#		print 'counter'
#		print counter 
#		print 'inter paths'
#		print inter_paths
#		num_inter_paths = len(inter_paths)
#		new_inter_paths = []
#		for p in inter_paths: # loop through all the existing paths, all having length counter + 1
#			endpoint = p[-1]
#			branches = Connection.objects.filter(Q(source_id=endpoint) & Q(is_derived=1)) # all possible directions from the endpoint
#			print branches.count()
#			for link in branches:
#				if link.target_id.id.strip() == target_id:
#					final_paths.append(p + [target_id])
#				else:
#					new_inter_paths.append(p + [link.target_id.id.strip()])
#		inter_paths = new_inter_paths
#		counter += 1
 #	return HttpResponse(json.dumps(final_paths), content_type='application/json')

def averageAttributes(connections):
	results = json.loads(connections)
	for item in results:
		if item['fields']['is_derived'] is 1:
			continue
		attrs = json.loads(item['fields']['attributes'])
		for key in attrs:
			attrs[key] = numpy.mean(attrs[key])
		item['fields']['attributes'] = json.dumps(attrs)
	return results	

def getDataset(request, user_id, dataset_id, max_depth):
	# TODO: Check whether the request is legal (i.e. user id matches dataset id)
#	print Connection.objects.filter(Q(dataset_id=dataset_id) & Q(source_id__depth__lte=max_depth) & Q(target_id__depth__lte=max_depth)).count()
#	print Structure.objects.filter(Q(dataset_id=dataset_id) & Q(depth__lte=max_depth)).count()
	user = Account.objects.get(access_code=user_id)
#	connections = Connection.objects.filter(Q(dataset_id=dataset_id) & Q(is_derived=1) & Q(source_id__depth__lte=max_depth) & Q(target_id__depth__lte=max_depth))
	connections = Connection.objects.filter(Q(dataset_id=dataset_id) & Q(is_derived=1) & Q(source_id__depth__lte=max_depth) & Q(target_id__depth__lte=max_depth))
	print '# of connections'
	print connections.count()
	connections = connections[:20000]
	structures = Structure.objects.filter(Q(dataset_id=dataset_id))
	connNotes = ConnNote.objects.filter(Q(dataset_id=dataset_id) & Q(user_id=user.id))
	jsonCons = serializers.serialize('json', connections)
	realJsonCons = json.loads(jsonCons)
	print dataset_id
#	if dataset_id == '2':
#		for item in realJsonCons:
#			attrs = json.loads(item['fields']['attributes'])
#			for key in attrs:
#				attrs[key] = numpy.mean(attrs[key])
#			item['fields']['attributes'] = json.dumps(attrs)
	dataset = {}
	dataset['conns'] = json.dumps(realJsonCons)
	dataset['structs'] = serializers.serialize('json', structures)
	dataset['connNotes'] = serializers.serialize('json', connNotes)
	return HttpResponse(json.dumps(dataset), content_type='application/json')
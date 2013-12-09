from connectivity.models import *
import json
from django.core import serializers
from django.db.models import Q
from django.http import HttpResponse

# Get and post connectivity data based on user id and dataset id

def getDatasets(request, user_id):
	datasets = Dataset.objects.filter(Q(visibility='public') | Q(user_id=user_id))
	response_data = serializers.serialize('json', datasets)
	return HttpResponse(json.dumps(response_data), content_type='application/json')
	

def getDataset(request, user_id, dataset_id, max_depth):
	# TODO: Check whether the request is legal (i.e. user id matches dataset id)
#	print Connection.objects.filter(Q(dataset_id=dataset_id) & Q(source_id__depth__lte=max_depth) & Q(target_id__depth__lte=max_depth)).count()
#	print Structure.objects.filter(Q(dataset_id=dataset_id) & Q(depth__lte=max_depth)).count()
	connections = Connection.objects.filter(Q(dataset_id=dataset_id) & Q(source_id__depth__lte=max_depth) & Q(target_id__depth__lte=max_depth))[:10000]
	structures = Structure.objects.filter(Q(dataset_id=dataset_id))
	dataset = {}
	dataset['conns'] = serializers.serialize('json', connections)
	dataset['structs'] = serializers.serialize('json', structures)
	return HttpResponse(json.dumps(dataset), content_type='application/json')
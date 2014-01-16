from connectivity.models import *
from account.models import *
from account.models import ConnNote
import json
import numpy
from django.core import serializers
from django.db.models import Q
from django.http import HttpResponse

# Get and post connectivity data based on user id and dataset id

def getDatasets(request, user_id):
	user = Account.objects.get(access_code=user_id)
	datasets = Dataset.objects.filter(Q(visibility='public') | Q(user_id=user.id))
	response_data = serializers.serialize('json', datasets)
	return HttpResponse(json.dumps(response_data), content_type='application/json')
	

def getDataset(request, user_id, dataset_id, max_depth):
	# TODO: Check whether the request is legal (i.e. user id matches dataset id)
#	print Connection.objects.filter(Q(dataset_id=dataset_id) & Q(source_id__depth__lte=max_depth) & Q(target_id__depth__lte=max_depth)).count()
#	print Structure.objects.filter(Q(dataset_id=dataset_id) & Q(depth__lte=max_depth)).count()
	user = Account.objects.get(access_code=user_id)
	connections = Connection.objects.filter(Q(dataset_id=dataset_id) & Q(source_id__depth__lte=max_depth) & Q(target_id__depth__lte=max_depth))[:20000]
	structures = Structure.objects.filter(Q(dataset_id=dataset_id))
	connNotes = ConnNote.objects.filter(Q(dataset_id=dataset_id) & Q(user_id=user.id))
	jsonCons = serializers.serialize('json', connections)
	realJsonCons = json.loads(jsonCons)
	print dataset_id
	if dataset_id == '2':
		for item in realJsonCons:
			attrs = json.loads(item['fields']['attributes'])
			for key in attrs:
				attrs[key] = numpy.mean(attrs[key])
			item['fields']['attributes'] = json.dumps(attrs)
	dataset = {}
	dataset['conns'] = json.dumps(realJsonCons)
	dataset['structs'] = serializers.serialize('json', structures)
	dataset['connNotes'] = serializers.serialize('json', connNotes)
	return HttpResponse(json.dumps(dataset), content_type='application/json')
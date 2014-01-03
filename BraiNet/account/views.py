from account.models import *
from connectivity.models import Connection, Dataset
from account.models import Account, ConnNote
import json
from django.core import serializers
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt


def getConnectionNotes(request, user_id, dataset_id):
	data = ConnNote.objects.filter(Q(dataset_id=dataset_id) & Q(user_id=user_id))
	response_data = serializers.serialize('json', data)
	return HttpResponse(json.dumps(response_data), content_type='application/json')
	
@csrf_exempt
def addConnectionNote(request):
	print request.POST
	link_id = request.POST['linkId']
	user_id = request.POST['userId']
	dataset_id = request.POST['datasetId']
	content = request.POST['content']
	note = ConnNote(
		user_id=Account.objects.get(access_code=user_id),
		dataset_id=Dataset.objects.get(id=dataset_id),
		link=Connection.objects.get(id=link_id),
		content=content
	)
	note.save()
	return HttpResponse()
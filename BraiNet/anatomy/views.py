from anatomy.models import *
import json
from django.core import serializers
from django.http import HttpResponse


def getStructImgMap(request):
	data = Image.objects.all()
	response_data = serializers.serialize('json', data)
	return HttpResponse(json.dumps(response_data), content_type='application/json')
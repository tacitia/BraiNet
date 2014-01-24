from account.models import *
from connectivity.models import Connection, Dataset
from account.models import Account, ConnNote
import json
from django.core import serializers
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
import string
import random
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.core.mail import send_mail

def getConnectionNotes(request, user_id, dataset_id):
	data = ConnNote.objects.filter(Q(dataset_id=dataset_id) & Q(user_id=user_id))
	response_data = serializers.serialize('json', data)
	return HttpResponse(json.dumps(response_data), content_type='application/json')
	
@csrf_exempt
def addConnectionNote(request):
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
	
def register(request):
	return render_to_response('register.html', {}, context_instance=RequestContext(request))
	
def generateAccessCode(request):
	email = request.POST['email']
	code = ''.join(random.choice(string.ascii_lowercase) for i in range(8))
	while Account.objects.filter(access_code=code).count() > 0:
		code = ''.join(random.choice(string.ascii_lowercase) for i in range(8))
	user = Account(access_code=code, email=email)
	user.save()
	message = 'Hello,\n\nPlease find below an access link to BraiNet:\n\nhttp://brainconnect.cs.brown.edu/?accesscode='+code+'\n\nWhen you visit BraiNet using your access link, changes you make will be saved and will be available every time you visit BraiNet using the same access link.\n\nThanks for using BraiNet! If you have any question or comment, please email hua_guo@brown.edu.\n\nYours Sincerely,\nBraiNet team'
	send_mail('Access link to BraiNet', message, 'hua_guo@brown.edu', [email], fail_silently=False)

	result = Account.objects.get(access_code=code);
	return HttpResponseRedirect('/account/register/success')
	
def registerSuccess(request):
	return render_to_response('success.html')
from action.models import *
from account.models import Account
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import json


@csrf_exempt
def addAction(request):
	action_name = request.POST['name']
	action_time = request.POST['timestamp']
	action_parameters = json.dumps(request.POST['parameters'])
	action_user_id = request.POST['userId']
	action_user = Account.objects.get(access_code=action_user_id)
	
	action = Action(
		user=action_user,
		name=action_name,
		timestamp=action_time,
		parameters=action_parameters
	)
	
	action.save()
	
	return HttpResponse()
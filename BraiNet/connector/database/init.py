from django.db import models
from django.db import IntegrityError
from connectivity.models import Dataset
from account.models import Account
import os

try:
	super_user = Account(access_code='abcdefgh')
	super_user.save()
	print 'Super user created.'
	bams = Dataset(name='Brain Architecture Management System', user_id=super_user)
	bams.save()
	print 'Built-in dataset entry "Brain Architecture Management System" created.'
	allen = Dataset(name='Allen Mouse Brain Connectivity Atlas', user_id=super_user)
	allen.save()
	print 'Built-in dataset entry "Allen Mouse Brain Connectivity Atlas" created.'
except IntegrityError, e:
	print e
	if (e.msg.startswith('(1062')):
		print 'Super user already exists.'

execfile('connector/database/structure/jsonToSql.py')
execfile('connector/database/connectivity/jsonToSql.py')
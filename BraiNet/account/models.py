from django.db import models
import connectivity.models

# Use the default primary key 'id'
class Account(models.Model):	
	access_code = models.CharField(max_length=16, unique=True)
	
class ConnNote(models.Model):
	user_id = models.ForeignKey('Account')
	dataset_id = models.ForeignKey('connectivity.Dataset')
	link = models.ForeignKey('connectivity.Connection')
	content = models.TextField()
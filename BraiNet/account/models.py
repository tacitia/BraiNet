from django.db import models
import connectivity.models

# Use the default primary key 'id'
class Account(models.Model):	
	access_code = models.CharField(max_length=16, unique=True)
	
class Note(models.Model):
	user_id = models.ForeignKey('Account')
	link = models.ForeignKey('connectivity.Connection')
	content = models.TextField()
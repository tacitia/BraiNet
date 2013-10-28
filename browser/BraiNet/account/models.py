from django.db import models

# Use the default primary key 'id'
class Account:	
	access_code = model.CharField(max_length=16)
	
class Note:
	user_id = model.ForeignKey('Account')
	content = model.TextField()
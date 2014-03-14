from django.db import models
import account.models
from jsonfield import JSONField

class Action(models.Model):
	user = models.ForeignKey('account.Account')
	name = models.CharField(max_length = 64)
	timestamp = models.DateTimeField(auto_now_add=True)
	parameters = JSONField()
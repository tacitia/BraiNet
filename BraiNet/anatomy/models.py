from django.db import models

class Image(models.Model):
	struct_id = models.IntegerField()
	image_id = models.IntegerField()
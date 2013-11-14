from django.db import models
from jsonfield import JSONField
from account.models import Account

class Structure(models.Model):
	id = models.CharField(max_length=16, unique=True, primary_key=True) # The id is formed by concatenating dataset_key and struct_id
	name = models.CharField(max_length=128)
	struct_id = models.IntegerField()
	parent_id = models.ForeignKey('self', null=True)
	depth = models.IntegerField()
	num_children = models.IntegerField()
	struct_id_path = JSONField()
	attributes = JSONField()
	user_id = models.ForeignKey('account.Account')
	dataset_id = models.ForeignKey('Dataset')

# Use the default primary key 'id'
class Connection(models.Model):
	source_id = models.ForeignKey('Structure', to_field='id', related_name='conn_source')
	target_id = models.ForeignKey('Structure', to_field='id', related_name='conn_target')
	user_id = models.ForeignKey('account.Account')
	dataset_id = models.ForeignKey('Dataset')
	attributes = JSONField()

# Use the default primary key 'id'
class AttributeType(models.Model):
	NUMERIC = 'num'
	ORDINAL = 'ord'
	NOMINAL = 'nom'
	TYPE_CHOICES = (
		(NUMERIC, 'numeric'),
		(ORDINAL, 'ordinal'),
		(NOMINAL, 'nominal'),
	)
	name = models.CharField(max_length='32')
	type = models.CharField(max_length='16', choices=TYPE_CHOICES)

# Use the default primary key 'id'
class Attribute(models.Model):
	STRUCTURE = 'st'
	CONNECTION = 'co'
	OWNER_TYPE_CHOICES = (
		(STRUCTURE, 'structure'),
		(CONNECTION, 'connection'),
	)

	owner_type = models.CharField(max_length=8, choices=OWNER_TYPE_CHOICES)
	owner_id = models.IntegerField()
	name = models.CharField(max_length=32)
	value = models.CharField(max_length=32)

#TODO: add 'visibility' (public v.s. private) field
# Use the default primary key 'id'	
class Dataset(models.Model):
	PUBLIC = 'pub'
	PRIVATE = 'pri'
	SHARED = 'sha'
	VISIBILITY_TYPE_CHOICES = (
		(PUBLIC, 'public'),
		(PRIVATE, 'private'),
		(SHARED, 'shared'),
	)

	name = models.CharField(max_length=64, unique=True)
	user_id = models.ForeignKey('account.Account')
	visibility = models.CharField(max_length=8, choices=VISIBILITY_TYPE_CHOICES)
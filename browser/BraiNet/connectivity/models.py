from django.db import models

# Use the default primary key 'id'
class Structure:
	name = models.CharField(max_length=64)
	user_id = models.ForeignKey('account.Account')
	struct_id = models.IntegerField()
	dataset_key = models.ForeignKey('Dataset')

# Use the default primary key 'id'
class Connection:
	source_struct_id = models.ForeignKey('Structure', to_field='struct_id')
	target_struct_id = models.ForeignKey('Structure', to_field='struct_id')
	user_id = models.ForeignKey('account.Account')
	dataset_key = models.ForeignKey('Dataset')

# Use the default primary key 'id'
class AttributeType:
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
class Attribute:
	STRUCTURE = 'st'
	CONNECTION = 'co'
	OWNER_TYPE_CHOICES = (
		(STRUCTURE, 'structure'),
		(CONNECTION, 'connection'),
	)

	owner_type = models.CharField(max_length=16, choices=OWNER_TYPE_CHOICES)
	owner_id = models.IntegerField()
	name = models.CharField()
	value = models.CharField(max_length=32)

# Use the default primary key 'id'	
class Dataset:
	name = models.CharField(max_length=16)
	user_id = models.ForeignKey('account.Account')
from django.db import models
from django.db import IntegrityError
from anatomy.models import Image
import json
import os

map_file_name = 'connector/database/structure/structImgMap.json'

data = json.load(open(map_file_name))

for d in data:
	try:
		i_model = Image(
					struct_id = d['structKey'],
					image_id = d['imageKey']
				)
		i_model.save()
	except IntegrityError:
		continue
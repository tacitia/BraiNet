from django.conf.urls import patterns, include, url
from connectivity.views import *

#TODO: modify it so that getDatasets takes in user_id and dataset_id as parameters
urlpatterns = patterns('',
	url(r'^datasets/(?P<user_id>\d+)/$', getDatasets, name='getDatasets'),
	url(r'^dataset/(?P<user_id>\d+)/(?P<dataset_id>\d+)$', getDataset, name='getDataset'),
)

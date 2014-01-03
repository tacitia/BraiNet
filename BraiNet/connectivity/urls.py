from django.conf.urls import patterns, include, url
from connectivity.views import *

#TODO: modify it so that getDatasets takes in user_id and dataset_id as parameters
urlpatterns = patterns('',
	url(r'^datasets/(?P<user_id>[a-z]+)/$', getDatasets, name='getDatasets'),
	url(r'^datasets/(?P<user_id>[a-z]+)/connectivity/datasets/(?P<dummy_user_id>[a-z]+)/$', getDatasets, name='getDatasets'),
	url(r'^dataset/(?P<user_id>[a-z]+)/(?P<dataset_id>\d+)/(?P<max_depth>\d+)$', getDataset, name='getDataset'),
)

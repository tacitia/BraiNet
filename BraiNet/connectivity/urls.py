from django.conf.urls import patterns, include, url
from connectivity.views import *

#TODO: modify it so that getDatasets takes in user_id and dataset_id as parameters
urlpatterns = patterns('',
	url(r'^datasets/(?P<user_id>[a-z]+)/$', getDatasets, name='getDatasets'),
#	url(r'^datasets/(?P<user_id>[a-z]+)/connectivity/datasets/(?P<dummy_user_id>[a-z]+)/$', getDatasets, name='getDatasets'),
	url(r'^dataset/(?P<user_id>[a-z]+)/(?P<dataset_id>\d+)/(?P<max_depth>\d+)/$', getDataset, name='getDataset'),
	url(r'^connections/subs/(?P<conn_id>[0-9]+)/$', getSubConnections, name='getSubConnections'),
	url(r'^connections/leaves/(?P<conn_id>[0-9]+)/$', getLeaves, name='getLeaves'),
	url(r'^connections/local/(?P<struct_id>[-a-z0-9]+)/(?P<depth>[0-9]+)/$', getLocalConnections, name='getLocalConnections'),
	url(r'^connections/paths/(?P<source_id>[-a-z0-9]+)/(?P<target_id>[[-a-z0-9]+)/(?P<max_hop>[0-9]+)/$', getPaths, name='getPaths')

	#url(r'^dataset/(?P<user_id>[a-z]+)/(?P<dataset_id>\d+)/(?P<max_depth>\d+)/connectivity/dataset/(?P<dummy_user_id>[a-z]+)/(?P<dummy_dataset_id>\d+)/(?P<dummy_max_depth>\d+)/$', getDataset, name='getDataset'),
)

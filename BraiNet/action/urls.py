from django.conf.urls import patterns, include, url
from action.views import *

urlpatterns = patterns('',
	url(r'^add/$', addAction, name='addAction'),
)

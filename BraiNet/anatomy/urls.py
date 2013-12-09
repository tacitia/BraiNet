from django.conf.urls import patterns, include, url
from anatomy.views import *

urlpatterns = patterns('',
	url(r'^structImgMap/$', getStructImgMap, name='getStructImgMap'),
)

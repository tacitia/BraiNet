from django.conf.urls import patterns, include, url
from anatomy.views import *

urlpatterns = patterns('',
	url(r'^structImgMap/$', getStructImgMap, name='getStructImgMap'),
#	url(r'^structImgMap/anatomy/structImgMap/$', getStructImgMap, name='getStructImgMap'),
)

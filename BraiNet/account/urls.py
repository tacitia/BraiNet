from django.conf.urls import patterns, include, url
from account.views import *

urlpatterns = patterns('',
	url(r'^notes/connection/(?P<user_id>\d+)/(?P<dataset_id>\d+)$', getConnectionNotes, name='getConnectionNotes'),
#	url(r'^notes/connection/account/notes/connection/$', getConnectionNotes, name='getConnectionNotes'),
	url(r'^notes/connection/add/$', addConnectionNote, name='addConnectionNote'),
#	url(r'^notes/connection/add/account/notes/connection/add/$', addConnectionNote, name='addConnectionNote'),
	url(r'^accesscode/generate', generateAccessCode, name='generateAccessCode'),
	url(r'^register/success', registerSuccess, name='registerSuccess'),
	url(r'^register', register, name='register'), 
)

import json
import sys
import os
import string
import general                      
                      
# This function downloads injection data and extracts required fields              
def DownloadInjections():
    data = general.QueryAPI(general.INJECTIONS_URL)  
    injections = []  
    for sectiondataset in data:
    	specimen = sectiondataset['specimen']
    	sectionid = sectiondataset['id']
    	injection = specimen['injections'][0]
    	injection['section-data-set-id'] = sectionid
    	injection.pop('primary_injection_structure')
    	injection.pop('structure')
    	injections.append(injection)
    return injections
                
nargs = len(sys.argv)

#filename = sys.argv[1] if nargs > 1 else ".json"

injectfile = '../source/injections.json'

injections = DownloadInjections()
    
ifile = open(injectfile, 'w')
ifile.write(json.dumps(injections, indent=2, separators=(', ', ': ')))
ifile.close()
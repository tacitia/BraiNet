import json
import sys
import os
import string
import general
                      
                      
def DownloadStructures():
    structs = general.QueryAPI(general.STRUCTURES_URL)
    
    structHash = {}
    for s in structs:
        s['num_children'] = 0
        s['structure_id_path'] = [int(sid) for sid in s['structure_id_path'].split('/') if sid != '']
        structHash[s['id']] = s 

    for sid,s in structHash.iteritems():
        if len(s['structure_id_path']) > 1:
            parentId = s['structure_id_path'][-2]
            structHash[parentId]['num_children'] += 1

    structIds = [sid for sid,s in structHash.iteritems()]

    return sorted(structIds), structHash
            
            
nargs = len(sys.argv)

#filename = sys.argv[1] if nargs > 1 else ".json"

ext = '.json'
dir = '../output/'
structfile = dir + "structures" + ext

structIds, structHash = DownloadStructures()
    
file = open(structfile,"w")
file.write(json.dumps(structHash.values(), indent=2, separators=(', ', ': ')))
file.close()
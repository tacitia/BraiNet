import json
import urllib
import string

API_PATH = "http://api.brain-map.org/api/v2/data"
GRAPH_ID = 1
MOUSE_PRODUCT_ID = 1 # aba
PLANE_ID = 1 # coronal
TOP_N = 2000

DATA_SET_QUERY_URL = ("%s/SectionDataSet/query.json" +\
                          "?criteria=[failed$eq'false'][expression$eq'true']" +\
                          ",products[id$eq%d]" +\
                          ",plane_of_section[id$eq%d]") \
                          % (API_PATH, MOUSE_PRODUCT_ID, PLANE_ID)

UNIONIZE_FMT = "%s/StructureUnionize/query.json" +\
               "?criteria=[section_data_set_id$eq%d]" +\
               ("&include=section_data_set(products[id$in%d])" % (MOUSE_PRODUCT_ID)) +\
               "&only=id,structure_id,sum_pixels,expression_energy,section_data_set_id" 

STRUCTURES_URL = ("%s/Structure/query.json?" +\
                      "criteria=[graph_id$eq%d]") \
                      % (API_PATH, GRAPH_ID)

INJECTIONS_URL = "http://api.brain-map.org/api/v2/data/query.json?criteria=" +\
					"model::SectionDataSet," +\
					"rma::criteria," +\
					"products[id$eq5]," +\
					"rma::include," +\
					"specimen(injections(primary_injection_structure,structure))"

def GetInjectDetailUrl(id):
	url = "http://connectivity.brain-map.org/api/v2/data/ProjectionStructureUnionize/query.json?criteria=" +\
				"[section_data_set_id$eq%d]&num_rows=all" \
				% (id)
							
	return url

def QueryAPI(url):
    start_row = 0
    num_rows = 2000
    total_rows = -1
    rows = []
    done = False
    
    while not done:
        pagedUrl = url + '&start_row=%d&num_rows=%d' % (start_row,num_rows)

        print 'Downloading ' + pagedUrl + '...'
        source = urllib.urlopen(pagedUrl).read()

        response = json.loads(source)
        rows += response['msg']
        
        if total_rows < 0:
            total_rows = int(response['total_rows'])

        start_row += len(response['msg'])

        if start_row >= total_rows:
            done = True

    return rows
                      
                      
                      
                      
                      
                      
                      
                      
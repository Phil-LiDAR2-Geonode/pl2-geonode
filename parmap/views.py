from django.http import HttpResponse
import json
from django.shortcuts import render
from django.template import RequestContext, loader
from django.shortcuts import render_to_response

# Create your views here.
def other_rs(request, facettype='layers'):
    context_dict = {
        "map_type": 'rs'
    }
    
    return render_to_response('parmap/other_rs.html', RequestContext(request, context_dict))

def rs_links(request, facettype='layers', layer_name):
    context_dict = {
        "facettype": facettype,
        "layer_name": layer_name,
        "links": [
            {
                "name": 'Sample 1',
                "url": 'Sample 1',
            },
            {
                "name": 'Sample 2',
                "url": 'Sample 2',
            }
        ]
    }
    
    return HttpResponse(json.dumps(context_dict),mimetype='application/json',status=200)
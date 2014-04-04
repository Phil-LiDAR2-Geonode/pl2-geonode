import datetime

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from tastypie.test import ResourceTestCase

from geonode.layers.utils import layer_set_permissions
from geonode.search.populate_search_test_data import create_models, all_public
from geonode.layers.models import Layer

from .api import LayerResource, MapResource, DocumentResource, ResourceBaseResource


class LayerApiTests(ResourceTestCase):

    fixtures = ['initial_data.json', 'bobby']

    def setUp(self):
        super(LayerApiTests, self).setUp()

        self.user = 'admin'
        self.passwd = 'admin'
        self.list_url = reverse('api_dispatch_list', kwargs={'api_name':'api', 'resource_name':'layers'})
        create_models(type='layer')
        all_public()
        self.perm_spec = {"anonymous":"_none","authenticated":"layer_readwrite","users":[]}

    def test_layer_get_list_unauth_all_public(self):
        """ 
        Test that the correct number of layers are returned when the
        client is not logged in and all are public
        """

        resp = self.api_client.get(self.list_url)
        self.assertValidJSONResponse(resp)
        self.assertEquals(len(self.deserialize(resp)['objects']), 8)

    def test_layers_get_list_unauth_some_public(self):
        """
        Test that if a layer is not public then not all are returned when the
        client is not logged in
        """
        layer = Layer.objects.all()[0]
        layer_set_permissions(layer, self.perm_spec)

        resp = self.api_client.get(self.list_url)
        self.assertValidJSONResponse(resp)
        self.assertEquals(len(self.deserialize(resp)['objects']), 7)

    def test_layers_get_list_auth_some_public(self):
        """
        Test that if a layer is not public then all are returned if the
        client is not logged in
        """
        self.api_client.client.login(username=self.user, password=self.passwd)
        layer = Layer.objects.all()[0]
        layer_set_permissions(layer, self.perm_spec)

        resp = self.api_client.get(self.list_url)
        self.assertValidJSONResponse(resp)
        self.assertEquals(len(self.deserialize(resp)['objects']), 8)

    def test_layer_get_list_layer_private_to_one_user(self):
        """
        Test that if a layer is only visible by admin, then does not appear in the
        unauthenticated list nor in the list when logged is as bobby
        """
        perm_spec = {"anonymous":"_none","authenticated":"_none","users":
            [["admin","layer_readwrite"],["admin","layer_admin"]]}
        layer = Layer.objects.all()[0]
        layer_set_permissions(layer, perm_spec)
        resp = self.api_client.get(self.list_url)
        self.assertEquals(len(self.deserialize(resp)['objects']), 7)

        self.api_client.client.login(username='bobby', password='bob')
        resp = self.api_client.get(self.list_url)
        self.assertEquals(len(self.deserialize(resp)['objects']), 7)

        self.api_client.client.login(username=self.user, password=self.passwd)
        resp = self.api_client.get(self.list_url)
        self.assertEquals(len(self.deserialize(resp)['objects']), 8)

    def test_layer_get_detail_unauth_layer_not_public(self):
        """
        Test that layer detail gives 401 when not public and not logged in
        """
        layer = Layer.objects.all()[0]
        layer_set_permissions(layer, self.perm_spec)
        self.assertHttpUnauthorized(self.api_client.get(
            self.list_url + str(layer.id) + '/'))

        self.api_client.client.login(username=self.user, password=self.passwd)
        resp = self.api_client.get(self.list_url + str(layer.id) +'/')
        self.assertValidJSONResponse(resp)

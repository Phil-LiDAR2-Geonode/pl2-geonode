'use strict';

(function(){

  var module = angular.module('main_search', [], function($locationProvider) {
      $locationProvider.html5Mode(true);

      // make sure that angular doesn't intercept the page links
      angular.element("a").prop("target", "_self");
    });

  /*
  * Load categories and keywords
  */
  module.run(function($http, $rootScope, $location){

    // Used to set the class of the filters based on the url parameters
    function set_initial_filters_from_query(data, url_query, filter_param){
      for(var i=0;i<data.length;i++){
        if( url_query == data[i][filter_param] || url_query.indexOf(data[i][filter_param] ) != -1){
          data[i].active = 'active';
        }else{
          data[i].active = '';
        }
     }
     return data;
    }

    /*
    * Load categories and keywords and set active class if needed
    */
    var params = typeof FILTER_TYPE == 'undefined' ? {} : {'type': FILTER_TYPE};
    $http.get(CATEGORIES_ENDPOINT, {params: params}).success(function(data){
      if($location.search().hasOwnProperty('category__identifier__in')){
        data.objects = set_initial_filters_from_query(data.objects, 
          $location.search()['category__identifier__in'], 'identifier');
      }   
      $rootScope.categories = data.objects;            
    });

    $http.get(KEYWORDS_ENDPOINT, {params: params}).success(function(data){
      if($location.search().hasOwnProperty('keywords__slug__in')){
        data.objects = set_initial_filters_from_query(data.objects, 
          $location.search()['keywords__slug__in'], 'slug');
      }
      $rootScope.keywords = data.objects;
    });

    // Activate the type filters if in the url
    if($location.search().hasOwnProperty('type__in')){
      var types = $location.search()['type__in'];
      if(types instanceof Array){
        for(var i=0;i<types.length;i++){
          $('body').find("[data-filter='type__in'][data-value="+types[i]+"]").addClass('active');
        }
      }else{
        $('body').find("[data-filter='type__in'][data-value="+types+"]").addClass('active');
      }
    }

    // Activate the sort filter if in the url
    if($location.search().hasOwnProperty('order_by')){
      var sort = $location.search()['order_by'];
      $('body').find("[data-filter='order_by']").removeClass('selected');
      $('body').find("[data-filter='order_by'][data-value="+sort+"]").addClass('selected');
    }

  });

  /*
  * Main search controller 
  * Load data from api and defines the multiple and single choice handlers
  * Syncs the browser url with the selections
  */
  module.controller('MainController', function($scope, $location, $http, Configs){
    $scope.query = $location.search();
    
    // Keep in sync the page location with the query object
    $scope.$watch('query', function(){
      $location.search($scope.query);
    }, true);
      
    //Get data from apis and make them available to the page
    function query_api(data){
      $http.get(Configs.url, {params: data || {}}).success(function(data){
        $scope.results = data.objects;
      });
    };
    query_api($scope.query);

    /*
    * Add the selection behavior to the element, it adds/removes the 'active' class
    * and pushes/removes the value of the element from the query object
    */
    $scope.multiple_choice_listener = function($event){    
      var element = $($event.target);
      var query_entry = [];
      var data_filter = element.attr('data-filter');
      var value = element.attr('data-value');

      // If the query object has the record then grab it 
      if ($scope.query.hasOwnProperty(data_filter)){

        // When in the location are passed two filters of the same
        // type then they are put in an array otherwise is a single string
        if ($scope.query[data_filter] instanceof Array){
          query_entry = $scope.query[data_filter];
        }else{
          query_entry.push($scope.query[data_filter]);
        }     
      }

      // If the element is active active then deactivate it
      if(element.hasClass('active')){
        // clear the active class from it
        element.removeClass('active');

        // Remove the entry from the correct query in scope
        
        query_entry.splice(query_entry.indexOf(value), 1);
      }
      // if is not active then activate it
      else if(!element.hasClass('active')){
        // Add the entry in the correct query
        if (query_entry.indexOf(value) == -1){
          query_entry.push(value);  
        }         
        element.addClass('active');
      }

      //save back the new query entry to the scope query
      $scope.query[data_filter] = query_entry;

      //if the entry is empty then delete the property from the query
      if(query_entry.length == 0){
        delete($scope.query[data_filter]);
      }
      query_api($scope.query);
    }

    $scope.single_choice_listener = function($event){
      var element = $($event.target);
      var query_entry = [];
      var data_filter = element.attr('data-filter');
      var value = element.attr('data-value');

      // If the query object has the record then grab it 
      if ($scope.query.hasOwnProperty(data_filter)){
        query_entry = $scope.query[data_filter];
      }

      if(!element.hasClass('selected')){
        // Add the entry in the correct query
        query_entry = value;

        // clear the active class from it
        element.parents('ul').find('a').removeClass('selected');

        element.addClass('selected');

        //save back the new query entry to the scope query
        $scope.query[data_filter] = query_entry;

        query_api($scope.query);
      }     
    }

  });
})();

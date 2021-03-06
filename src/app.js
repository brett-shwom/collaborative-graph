angular.module("CollaborativeGraph", ["firebase",'angular-rickshaw', 'ngRoute'])
  .config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {

      $routeProvider
        .when('/yourEstimates', {
          template : ' ', //no need to load a new template
          controller : 'PageManager',
          resolve : {
            load: function ($route) {
              $route.current.params.pageName = 'yourEstimates' //inject the name of the page into $routeParams
            }
          }
        })
        .when('/individualEstimates', {
          template : ' ', //no need to load a new template
          controller : 'PageManager',
          resolve : {
            load: function ($route) {
              $route.current.params.pageName = 'individualEstimates' //inject the name of the page into $routeParams
            }
          }
        })
        .when('/averageEstimates', {
          template : ' ', //no need to load a new template
          controller : 'PageManager',
          resolve : {
            load: function ($route) {
              $route.current.params.pageName = 'averageEstimates' //inject the name of the page into $routeParams
            }
          }
        })
        .otherwise({
          redirectTo : '/yourEstimates'
        })


      $locationProvider
        .html5Mode(true)

    }
  ])
  .run(function() {
    FastClick.attach(document.body) //remove 250ms delay that occurs on click events on mobile
  })
  .factory("EstimateService", ["$firebase", function($firebase) {
    var ref = new Firebase("https://bruce-thing.firebaseio.com/estimates");
    return $firebase(ref);
  }])
  .factory('AngularFirebasePropertyFilter', function () {

    var angularFirebaseProperties = ["$id", "$bind", "$add", "$save", "$set", "$update", "$transaction", "$remove", "$child", "$on", "$off", "$auth", "$getIndex", "$getRef", "$value"]

    return {
        notAnAngularFirebaseProperty : function(property) {
            return angularFirebaseProperties.indexOf(property) === -1
        }
    }
  })
  .factory('MapIndividualEstimatesToRickshawSeries', ['AngularFirebasePropertyFilter', function (AngularFirebasePropertyFilter) {

      return function (estimates, seriesToCopy) {

        Object.keys(estimates)
            .filter(AngularFirebasePropertyFilter.notAnAngularFirebaseProperty) //there's gotta be some other way to do this
            .map(function (estimateSetKey) {
                return estimates[estimateSetKey]
            })
            .forEach(function(estimateSet) {
              var series = angular.copy(seriesToCopy) //deep copy


              series[0].data = estimateSet.forDays ? Object.keys(estimateSet.forDays).map(function (key) {
                return {
                  x: +key,
                  y : +estimateSet.forDays[key]
                }
              }) : []

              estimateSet.rickshawSeries = series
            })
      }
  }])
  .factory('ComputeAverageEstimateForEachDay', ["AngularFirebasePropertyFilter", function (AngularFirebasePropertyFilter) {

        //so ugly :( where's SQL when ya need it?

        return function (estimates) {
            var averages = {}

            var totalEstimates =  Object.keys(estimates)
                                    .filter(AngularFirebasePropertyFilter.notAnAngularFirebaseProperty) //TODO: maybe i could just use $value instead?
                                    .length

            Object.keys(estimates)
                    .filter(AngularFirebasePropertyFilter.notAnAngularFirebaseProperty) //there's gotta be some other way to do this
                    .map(function (estimateSetKey) {
                        return estimates[estimateSetKey]
                    })
                    .forEach(function(estimateSet) {


                        Object.keys(estimateSet.forDays)
                            .forEach(function (daysEstimate) {

                                if (!(daysEstimate in averages)) { //initialize
                                    averages[daysEstimate] = 0
                                }

                                averages[daysEstimate]+= +estimateSet.forDays[daysEstimate] === NaN ? 0 : +estimateSet.forDays[daysEstimate] //count bogus input as 0

                            })

                    })

            Object.keys(averages)
                .forEach(function(days) {
                    averages[days] = averages[days] / totalEstimates
                })

            return averages
        }
  }])
  .controller("PageManager", ['$scope', '$routeParams', function ($scope, $routeParams) {

      var viewport = document.querySelector('.viewport')

      viewport.className = 'viewport' //reset the viewport classList
      viewport.classList.add($routeParams.pageName)

  }])
  .controller("Pager", ["$scope", "$location", function ($scope, $location) {

    $scope.yourEstimatesClicked = function () {
       $location.path('/yourEstimates')
    }
    $scope.averageEstimatesClicked = function () {
      $location.path('/averageEstimates')
    }
    $scope.individualEstimatesClicked = function () {
      $location.path('/individualEstimates')
    }

  }])
  .controller("InputController", ["$scope", "EstimateService",
    function($scope, estimateService) {
      $scope.user = "Guest " + Math.round(Math.random()*101);
      $scope.allEstimates = estimateService;
      $scope.addEstimates = function() {
        $scope.allEstimates.$add({
          from: $scope.user,
          forDays : $scope.userEstimates
        }).then( function (ref) {
          //$scope.allEstimates[ref.name()]
          //ref.name() //name of key added to firebase -- this is the unique userId for our intents and purposes
        });
      };
    }
  ])
  .controller("GraphController", ["$scope", "EstimateService","ComputeAverageEstimateForEachDay","MapIndividualEstimatesToRickshawSeries",
    function($scope, estimateService, computeAverageEstimateForEachDay,mapIndividualEstimatesToRickshawSeries) {

        function recomputeRemapAndUpdateGraph() {


            /* remap */

            mapIndividualEstimatesToRickshawSeries($scope.estimates, [{
                name : 'series1',
                color : 'steelblue',
                data : []
            }])

            /* recompute averages */

            $scope.averages = computeAverageEstimateForEachDay($scope.estimates)

            $scope.averagesMappedForBarGraph = Object.keys($scope.averages).map(function (days) {
                return {
                    x : +days,
                    y: +$scope.averages[days]
                }
            })

            $scope.graph.series[0].data = $scope.averagesMappedForBarGraph

        }

        $scope.graph = {
            // features : {
            //     xAxis : true
            // },
            series : [{
                name : 'series1',
                color : 'steelblue',
                data : []
            }],
            options : {
                renderer : 'bar',
                width : 200
            }
        }

        $scope.estimates = estimateService;
        $scope.averages = {}
        $scope.estimates.$on('value', recomputeRemapAndUpdateGraph) //initial data load
        $scope.estimates.$on('child_added', recomputeRemapAndUpdateGraph)
        $scope.estimates.$on('child_removed', recomputeRemapAndUpdateGraph)
        $scope.estimates.$on('child_changed', recomputeRemapAndUpdateGraph)
    }
  ]);

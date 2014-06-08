angular.module("CollaborativeGraph", ["firebase",'angular-rickshaw'])
  .run(function() {
    FastClick.attach(document.body);
  })
  .factory("EstimateService", ["$firebase", function($firebase) {
    var ref = new Firebase("https://bruce-thing.firebaseio.com/estimates");
    return $firebase(ref);
  }])
  .factory('AngularFirebasePropertyFilter', function () {

    var angularFirebaseProperties = ["$id", "$bind", "$add", "$save", "$set", "$update", "$transaction", "$remove", "$child", "$on", "$off", "$auth", "$getIndex", "$getRef"]

    return {
        notAnAngularFirebaseProperty : function(property) {
            return angularFirebaseProperties.indexOf(property) === -1
        }
    }
  })

  .factory('ComputeAverageEstimateForEachDay', ["AngularFirebasePropertyFilter", function (AngularFirebasePropertyFilter) {

        //so ugly :( where's SQL when ya need it?

        return function (estimates) {
            var averages = {}

            var totalEstimates =  Object.keys(estimates)
                                    .filter(AngularFirebasePropertyFilter.notAnAngularFirebaseProperty)
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
  .controller("Pager", ["$scope", function ($scope) {

    var viewport = document.querySelector('.viewport')

    $scope.yourEstimatesClicked = function () {
      viewport.className = 'viewport'
      viewport.classList.add('yourEstimates')
    }
    $scope.averageEstimatesClicked = function () {
      viewport.className = 'viewport'
      viewport.classList.add('averageEstimates')
    }
    $scope.individualEstimatesClicked = function () {
      viewport.className = 'viewport'
      viewport.classList.add('individualEstimates')
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
        });
      };
    }
  ])
  .controller("GraphController", ["$scope", "EstimateService","ComputeAverageEstimateForEachDay",
    function($scope, estimateService, computeAverageEstimateForEachDay) {

        function recomputeAveragesAndUpdateGraph() {
            $scope.averages = computeAverageEstimateForEachDay($scope.estimates)

            $scope.averagesMappedForBarGraph = Object.keys($scope.averages).map(function (days) {
                return {
                    x : +days,
                    y: +$scope.averages[days]
                }
            })

            $scope.graph.series[0].data = $scope.averagesMappedForBarGraph

            console.info('averages', $scope.averages)
        }


        // $scope.$watchCollection('graph.series.0', function(newSeries, oldSeries) {
        //     debugger
        // });

        $scope.graph = {
            features : {
               // xAxis : true
            },
            series : [{
                name : 'series1',
                color : 'steelblue',
                data : []
            }],
            options : {
                renderer : 'bar',
                width : 100
            }
        }

        $scope.estimates = estimateService;
        $scope.averages = {}
        $scope.estimates.$on('value', recomputeAveragesAndUpdateGraph) //initial data load
        $scope.estimates.$on('child_added', recomputeAveragesAndUpdateGraph)
        $scope.estimates.$on('child_removed', recomputeAveragesAndUpdateGraph)
        $scope.estimates.$on('child_changed', recomputeAveragesAndUpdateGraph)
    }
  ]);

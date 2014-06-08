angular.module("CollaborativeGraph", ["firebase",'angular-rickshaw'])
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
            //$scope.graph.series.pop()
            //setTimeout(function () {$scope.graph.series.push({data : [{x:2, y:100},{x:3, y:50}]}) })//need to call update or something here...
            //$scope.$digest()
            $scope.graph.series[0].data = [{x:1, y:100},{x:2, y:100}]

            console.info('averages', $scope.averages)
        }


        // $scope.$watchCollection('graph.series.0', function(newSeries, oldSeries) {
        //     debugger
        // });

        $scope.graph = {
            features : {},
            series : [{
                name : 'series1',
                color : 'steelblue',
                data : [{x:1, y:100}]
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

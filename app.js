angular.module("myChatRoom", ["firebase"])
  .factory("EstimateService", ["$firebase", function($firebase) {
    var ref = new Firebase("https://bruce-thing.firebaseio.com/estimates");
    return $firebase(ref);
  }])
  .controller("InputController", ["$scope", "EstimateService",
    function($scope, estimateService) {
      $scope.user = "Guest " + Math.round(Math.random()*101);
      $scope.allEstimates = estimateService;
      $scope.addEstimates = function() {
        debugger
        $scope.allEstimates.$add({
          from: $scope.user,
          forDays : $scope.userEstimates
        });
      };
    }
  ])
  .controller("GraphController", ["$scope", "EstimateService",
    function($scope, estimateService) {
      $scope.estimates = estimateService;
    }
  ]);

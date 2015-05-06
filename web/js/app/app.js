var app = angular.module('MapApp',['ngRoute','ngRetina']);


app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/map', {
                templateUrl: 'js/app/view/map.html',
                controller: 'MapController'
            }).
            otherwise({
                redirectTo: '/map'
            });
    }]);

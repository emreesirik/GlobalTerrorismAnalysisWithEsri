/**
 * Created by emre on 7.2.2015.
 */
app.directive('barchart', function() {
    return {
        restrict: 'E', //E = element, A = attribute, C = class, M = comment
        template:'<div class="barchart"><span class="barchart-line" style="width: {{value*100/total}}%"></span></div>'
        ,
        scope: {
            value: '@',
            total: '@'
        },
        link: function ($scope, element, attrs) {
        }
    };
});
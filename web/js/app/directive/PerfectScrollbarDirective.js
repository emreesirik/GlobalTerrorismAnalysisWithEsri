app.directive('jscroll', function() {
    return {
        restrict: 'A', //E = element, A = attribute, C = class, M = comment
        /*scope: {
         value: '=ngModel'
         },*/
        link: function ($scope, element, attrs) {

                $(element[0]).perfectScrollbar();
            //$(element[0]).slimScroll({height:'auto',width:'auto'});


        }
    };
});

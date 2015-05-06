app.directive('tooltip', function() {
    return {
        restrict: 'A', //E = element, A = attribute, C = class, M = comment
        /*scope: {
            value: '=ngModel'
        },*/
        link: function ($scope, element, attrs) {
            var action = element[0].getAttribute("tooltip-action");
            $(element[0]).tooltipster({
                    animation: 'fade',
                    delay: 200,
                    content: attrs.tooltip,
                    trigger: action == undefined ? 'hover' : action,
                    theme: 'tooltipster-guru',
                    position: attrs.position == undefined ? 'right' : attrs.position
                    /*,trigger: "click"*/
            });
        }
    };
});
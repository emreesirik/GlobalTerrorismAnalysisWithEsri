/**
 * Created by emre on 7.2.2015.
 */
app.directive('linechart', function() {
    return {
        restrict: 'E', //E = element, A = attribute, C = class, M = comment
       scope: {
            value: '=ngModel'
        },
        link: function ($scope, element, attrs) {
            $scope.$watch('value' , function() {
                //data.getNumberOfRows();
                if($scope.value != null) {
                    $scope.data = new google.visualization.DataTable();
                    $scope.data.addColumn('number', 'Year');
                    $scope.data.addColumn('number', 'Event Count');
                    /*$scope.data.addRow([2012, 11]);
                    $scope.data.addRow([2013, 12]);
                    $scope.data.addRow([2014, 18]);*/

                    for(var i = 0 ; i< $scope.value.length;i++) {
                        $scope.data.addRow([$scope.value[i].year,$scope.value[i].count]);
                    }

                    element[0].innerHTML = '';
                    $scope.options = {
                        title: '',
                        curveType: 'function',
                        legend: 'none',
                        vAxis:{
                            baselineColor: '#fff',
                            gridlineColor: '#fff',
                            textPosition: 'none'
                        },
                        hAxis:{
                            baselineColor: '#fff',
                            gridlineColor: '#fff',
                            textPosition: 'none'
                        }
                        /*hAxis: {baselineColor: '#FFFFFF'},
                         vAxis: {baselineColor: '#FFFFFF'}*/
                    };
                    $scope.chart = new google.visualization.LineChart(element[0]);
                    $scope.chart.draw($scope.data, $scope.options);



                }
            });

            /*$scope.drawChart =function() {
                $scope.data = google.visualization.arrayToDataTable([

                ]);

                $scope.data.addColumn('number', 'Year');
                $scope.data.addColumn('number', 'Event Count');



                $scope.chart = new google.visualization.LineChart(element[0]);

                $scope.chart.draw($scope.data, $scope.options);
            }*/

            //google.setOnLoadCallback($scope.drawChart);

        }
    };
});
var MapController = function ($scope,MapService) {
    var map;
    $scope.isShowingPredictionInfo = true;
    $scope.isPlayed = false;
    $scope.heatMapLayer = "";
    $scope.year = MapController.START_YEAR;
    $scope.incidentFilter = "ALL";
    $scope.seasonFilter = "ALL";

    $scope.incidentTypes = ["ALL","Assassination","Armed Assault","Bombing/Explosion","Facility/Infrastructure Attack","Hijacking"];
    $scope.seasonTypes = ["ALL","WINTER","SUMMER","AUTUMN","SPRING"];
    $scope.status = "heatmap";

    $scope.analysisStatus = "prediction";
    $scope.attactType="bomb";
    $scope.customRadius = null;

    $scope.baseLayer = "osm";

    $scope.eventStatistic = [];

    $scope.selectedRadius = MapController.BOMB_RADIUS;

    $scope.attackStatistic = [ {value:32},{value:40},{value:55}];

    $scope.limitResultValue = 10;

    $scope.isSearchOpen = false;

    $scope.poiLayersModel = [
        {
            name:MapManager.SCHOOL,
            visible:false,
            color: '#2D8CFF',
            icon: 'img/publicschool_lay.png'
        },
        {
            name:MapManager.POLICE,
            visible:false,
            color: '#F6CD4E',
            icon: 'img/police_lay.png'
        },
        {
            name:MapManager.FIRE ,
            visible:false,
            color: '#9B59B6',
            icon: 'img/fire_lay.png'
        },
        {
            name: MapManager.HOSPITAL,
            visible:false,
            color: '#C0392B',
            icon: 'img/hospital_lay.png'
        },
        {
            name: MapManager.AIRPORT ,
            visible:false,
            color: '#38E2E4',
            icon: 'img/airport_lay.png'
        },
        {
            name:MapManager.SHOPPING ,
            visible:false,
            color: '#D2527F',
            icon: 'img/shopping_lay.png'
        },
        {
            name:  MapManager.GOVERMENT,
            visible:false,
            //TODO eesirik change color
            color: 'red',
            icon: 'img/goverment_lay.png'
        }
    ];


    $scope.initHeight = function () {
        document.getElementById("prediction-wrapper").style.height = (window.innerHeight - 70) +'px';
        document.getElementById("analysis-wrapper").style.height = (window.innerHeight - 70) +'px';
    };

    $scope.initHeight();
    window.addEventListener("resize", function() {
        $scope.initHeight();
    });

    $scope.openSearchBox = function () {
        $scope.isSearchOpen = !$scope.isSearchOpen;
        if($scope.isSearchOpen) {
            var el = document.getElementById("search").querySelector("input");
            el.setAttribute('autofocus','true');
            el.value = '';
            setTimeout(function () {
                el.focus();
            },100);


            el.onblur = function() {
              //$scope.isSearchOpen = false;
            };
        }
    };

    $scope.onHoverMyRank = function(series,x,y) {
        var dateStr = '<span class="date">' +  series.data[x].value + '</span>';
        return dateStr;
    };

    $scope.switchBaseLayer = function() {
         if($scope.baseLayer == "osm") {
             $scope.baseLayer = "satellite";
         }else if($scope.baseLayer == "satellite") {
             $scope.baseLayer = "osm";
         }
        $scope.mapViewer.switchBaselayer();
    };

    $scope.switchPoiVisible = function(poi) {
        $scope.mapViewer.map.infoWindow.hide();
        poi.visible = !poi.visible;
        $scope.mapViewer.distanceLayer.clear();
        $scope.mapViewer.getPoiLayer(poi.name).layer.setVisibility(poi.visible);
    };

    $scope.isBlackAndWhite = false;
    $scope.blackWhiteElement = null;

    $scope.blackAndWhite = function() {
        $scope.isBlackAndWhite = !$scope.isBlackAndWhite;
        if($scope.isBlackAndWhite) {
            var style = document.createElement("style");
            style.innerHTML = ".map .container .layersDiv .layerTile { -webkit-filter: grayscale(100%);filter: grayscale(100%);-moz-filter: grayscale(100%);-o-filter: grayscale(100%);-ie-filter: grayscale(100%);}";
            document.body.appendChild ( style);
            $scope.blackWhiteElement = style;
        }else {
            document.body.removeChild($scope.blackWhiteElement);
        }
    };


    require(["esri/map", "esri/layers/ArcGISDynamicMapServiceLayer", "dojo/_base/array", "dojo/dom", "esri/layers/FeatureLayer",
            "esri/layers/ImageServiceParameters", "esri/layers/ArcGISImageServiceLayer", "esri/tasks/query", "esri/tasks/QueryTask",
            "esri/renderers/HeatmapRenderer","esri/layers/WebTiledLayer","esri/dijit/Search","esri/layers/GraphicsLayer",
            "esri/symbols/SimpleMarkerSymbol","esri/Color","esri/toolbars/draw", "esri/graphic","esri/symbols/SimpleMarkerSymbol",
            "esri/geometry/Circle","esri/units","esri/renderers/ScaleDependentRenderer", "esri/renderers/DotDensityRenderer",
            "esri/tasks/ProjectParameters","esri/tasks/GeometryService",'esri/symbols/PictureMarkerSymbol',
            'esri/tasks/DistanceParameters','esri/symbols/Font','esri/symbols/TextSymbol',"dojo/domReady!"],
        function (Map, ArcGISDynamicMapServiceLayer, arrayUtils, dom, FeatureLayer, ImageServiceParameters, ArcGISImageServiceLayer,
                  Query, QueryTask, HeatmapRenderer,WebTiledLayer,Search,GraphicsLayer,SimpleMarkerSymbol,Color,Draw,Graphic,
                  SimpleMarkerSymbol,Circle,units,ScaleDependentRenderer, DotDensityRenderer,ProjectParameters,GeometryService,
                  PictureMarkerSymbol,DistanceParameters,Font,TextSymbol) {
        $scope.mapViewer = new MapManager(HeatmapRenderer,$scope.onTerroristAnalysisChange,MapService);
        $scope.initHeatmap();

            $scope.mapViewer.search.on('select-result', function(e) {
                $scope.isSearchOpen = false;
                $scope.$apply();
            });
    });

    $scope.onTerroristAnalysisChange = function(result) {
        $scope.terroristGroup = [];
        $scope.terroristGroupNameList = [];
        $scope.eventTypes= [];
        $scope.weaponTypes = [];
        $scope.weaponSubType = [];

        var total = 0;
        for(var i=0;i<result.terroristGroup.map.length;i++) {
            total+=result.terroristGroup.map[i].value;
        }

        $scope.mapViewer.allIsUnknown = result.terroristGroup.map.length > 0;
        for(var i=0;i<result.terroristGroup.map.length;i++) {
            var key = result.terroristGroup.map[i].key;
            var value = result.terroristGroup.map[i].value;
            if(key != 'Unknown') {
                var percent = value *100 / total;
                $scope.terroristGroup.push({name: key, percent:percent});
                $scope.mapViewer.allIsUnknown = false;
            }
            $scope.terroristGroupNameList.push({name: key, count:value});
        }


        $scope.terroristGroupTotal = $scope.calculateTotal(result.terroristGroup.map);
        $scope.eventTypes = result.eventType.map;
        $scope.eventTypesTotal = $scope.calculateTotal(result.eventType.map);
        $scope.weaponTypes = result.weaponType.map;
        $scope.weaponTypesTotal = $scope.calculateTotal(result.weaponType.map);
        $scope.weaponSubType = result.weaponSubType.map;
        $scope.weaponSubTypesTotal = $scope.calculateTotal(result.weaponSubType.map);
        $scope.targetTypes = result.targetType.map;
        $scope.targetTypesTotal = $scope.calculateTotal(result.targetType.map);
        $scope.damageStatus = result.damageStatus.map;
        $scope.damageStatusTotal = $scope.calculateTotal(result.damageStatus.map);
        $scope.killCount = result.killCount;
        $scope.injuredCount = result.injuredCount;
        $scope.eventStatistic = result.eventStatistic;

        $scope.$apply();
    };

    $scope.calculateTotal = function(list) {
        var total = 0 ;
        for(var i =0;i<list.length;i++) {
            total += list[i].value;
        }
        return total;
    };

    $scope.limitResult = function(limit) {
        $scope.limitResultValue = limit;
    };

    $scope.startHeatmap = function () {
        if($scope.status=="analysis") {
            $scope.initHeatmap();
            $scope.status = "heatmap";
            $scope.mapViewer.analysisLayer.setVisibility(false);
            $scope.mapViewer.attackLayer.setVisibility(false);
            $scope.mapViewer.distanceLayer.setVisibility(false);
            $scope.mapViewer.attackHistoryLayer.setVisibility(false);

            for(var i = 0 ; i<$scope.poiLayersModel.length ; i++ ) {
                $scope.mapViewer.getPoiLayer($scope.poiLayersModel[i].name).layer.setVisibility(false);
            }
        }
    };

    $scope.startAnalysis = function () {
        if($scope.status=="heatmap") {
            $scope.status = "analysis";

            $scope.heatMapLayer.setVisibility(false);
            $scope.mapViewer.analysisLayer.setVisibility(true);
            $scope.mapViewer.attackLayer.setVisibility(true);
            $scope.mapViewer.distanceLayer.setVisibility(true);
            $scope.mapViewer.attackHistoryLayer.setVisibility(true);

            for(var i = 0 ; i<$scope.poiLayersModel.length ; i++ ) {
                $scope.mapViewer.getPoiLayer($scope.poiLayersModel[i].name).layer.setVisibility($scope.poiLayersModel[i].visible);
            }
        }
    };



    $scope.initHeatmap = function() {
        setTimeout(function() {
            $scope.heatMapLayer = $scope.mapViewer.heatMapLayer;

            $scope.applyHeatmapQuery();

            $scope.mapViewer.addLayer($scope.heatMapLayer);
            $scope.heatMapLayer.on("selection-complete",function() {
                $scope.heatMapLayer.redraw();
            });
            $scope.heatMapLayer.setVisibility(true);
        },500);
    };

    $scope.changeHeatmapConf = function() {
        $scope.mapViewer.heatmapRenderer.setBlurRadius( parseInt(document.getElementById("blur").value));
        $scope.mapViewer.heatmapRenderer.setColors(document.getElementById("color").value.split("+"));
        $scope.mapViewer.heatmapRenderer.setMaxPixelIntensity(parseInt(document.getElementById("maxpixel").value));
        $scope.mapViewer.heatmapRenderer.setMinPixelIntensity(parseInt(document.getElementById("minpixel").value));
    };

    $scope.togglePlay = function() {
        $scope.isPlayed = !$scope.isPlayed;
        if($scope.isPlayed) {
            if($scope.year == MapController.END_YEAR) {
                $scope.year = MapController.START_YEAR;
            }
            $scope.playing();
        }
    };

    $scope.applyHeatmapQuery = function() {
        var query = new esri.tasks.Query();
        var sql = "iyear = " + $scope.year;
        if($scope.incidentFilter != "ALL") {
            sql+= " AND attacktype = "+$scope.getIncidentFilterIndex();
        }
        if($scope.seasonFilter != "ALL") {
            if($scope.seasonFilter != "WINTER") {
                sql+= " AND imonth IN (1,2,12)";
            }else if($scope.seasonFilter != "SUMMER") {
                sql+= " AND imonth IN (6,7,8)";
            }else if($scope.seasonFilter != "AUTUMN") {
                sql+= " AND imonth IN (9,10,11)";
            }else if($scope.seasonFilter != "AUTUMN") {
                sql+= " AND imonth IN (3,4,5)";
            }
        }
        query.where = sql;
        $scope.heatMapLayer.selectFeatures(query,esri.layers.FeatureLayer.SELECTION_NEW);

    };

    $scope.goToYear = function(year) {
        $scope.year = year;
        $scope.stopProgressAnimation();
        $scope.isPlayed = false;
        $scope.applyHeatmapQuery();
        setTimeout(function () {
            $scope.$apply();
        }, 500);
    };

    $scope.stopProgressAnimation = function() {
        var progressBar = document.getElementById("yearProgress");
        progressBar.className = "";
        progressBar.style.width = "0%";
    };

    $scope.playing = function() {
        if($scope.isPlayed) {
            var progressBar = document.getElementById("yearProgress");

            setTimeout(function () {
                progressBar.className = "width-transition";
                progressBar.style.width = "100%";
            },50);

            $scope.year++;
            $scope.applyHeatmapQuery();
            setTimeout(function () {

                $scope.$apply();
            }, 500);

            if ($scope.year == MapController.END_YEAR) {
                $scope.isPlayed = false;
            }else {
                setTimeout(function () {
                    $scope.stopProgressAnimation();
                    $scope.playing();
                }, MapController.PERIOD);
            }
        }
    };

    $scope.selectSeasonType = function (season) {
        if($scope.seasonFilter != season) {
            $scope.seasonFilter = season;
            $scope.applyHeatmapQuery();
        }
    };

    $scope.selectIncidentType = function(incident) {
        if($scope.incidentFilter != incident) {
            $scope.incidentFilter = incident;
            $scope.applyHeatmapQuery();
        }
    }

    $scope.getIncidentFilterIndex = function() {
        if($scope.incidentFilter == $scope.incidentTypes[1]) {
            return 1;
        }else if($scope.incidentFilter == $scope.incidentTypes[2]) {
            return 2;
        }
        else if($scope.incidentFilter == $scope.incidentTypes[3]) {
            return 3;
        }
        else if($scope.incidentFilter == $scope.incidentTypes[4]) {
            return 7;
        }
        else if($scope.incidentFilter == $scope.incidentTypes[5]) {
            return 4;
        }
        else if($scope.incidentFilter == $scope.incidentTypes[5]) {
            return 6;
        }
    };

    ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////
    //                  ANALYSIS                         //
    ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////
    $scope.selectAnalysisTab = function(tab) {
        if(tab=='prediction' || ($scope.mapViewer.canOpenAnalysis && tab=='analysis' )) {
            $scope.analysisStatus = tab;
        }
    };

    $scope.selectAttackType = function (attackType) {
        $scope.attactType = attackType;
        if(attackType == 'bomb') {
            $scope.selectedRadius = MapController.BOMB_RADIUS;
        }else if(attackType == 'rocket') {
            $scope.selectedRadius = MapController.ROCKET_RADIUS;
        }else if(attackType == 'c4') {
            $scope.selectedRadius = MapController.C4_RADIUS;
        }
    };

    $scope.radiusChange = function() {
        if($scope.customRadius.indexOf('mil')<0 && $scope.customRadius.indexOf('m') < 0 && $scope.customRadius.indexOf('km')<0) {
            $scope.customRadius = null;
        }else {
            $scope.attactType = 'custom';
            if($scope.customRadius.indexOf('mil') > 0 ) {
                $scope.selectedRadius = parseFloat($scope.customRadius.substr(0,$scope.customRadius.indexOf('mil'))) * 1.609344;
            }else if($scope.customRadius.indexOf('km') > 0 ) {
                $scope.selectedRadius = parseFloat($scope.customRadius.substr(0,$scope.customRadius.indexOf('km')));
            }else if($scope.customRadius.indexOf('m') > 0 ) {
                $scope.selectedRadius = parseFloat($scope.customRadius.substr(0,$scope.customRadius.indexOf('m')))/1000;
            }
        }
    };

    $scope.focusInput = function() {
        var input = document.getElementById('customRadiusInput');
        input.value = '';
        input.focus();
    };

    $scope.onClickCreateAttack = function () {
        $scope.isShowingPredictionInfo = false;
        $scope.mapViewer.createNewAttack($scope.selectedRadius);
    };

    $scope.keyPressedOnRadius = function ($event) {
        console.log($event.keyCode);
    }
};
MapController.BOMB_RADIUS = 0.3;
MapController.ROCKET_RADIUS = 0.46;
MapController.C4_RADIUS = 0.2;

MapController.PERIOD = 3000;
MapController.START_YEAR = 1978;
MapController.END_YEAR = 2013;



MapController.$inject = ['$scope' ,'MapService'];
app.controller('MapController', MapController);

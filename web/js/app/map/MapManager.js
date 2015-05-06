/**
 * Created by emre on 1.4.2015.
 */
MapManager = function(HeatmapRenderer,aOnTerroristAnalysisChange,MapService) {
    this.onTerroristAnalysisChange = aOnTerroristAnalysisChange;
    this.mapService = MapService;
    this.canOpenAnalysis = false;
    this.noResult = false;
    this.allIsUnknown = false;
    this.map = new esri.Map("mapDiv", {
        center: [-56.049, 38.485],
        zoom: 3
    });
    this.isBaseMapOSM = true;
    var url = "https://b.tiles.mapbox.com/v4/peermeshio.67595261/${level}/${col}/${row}.png?access_token=pk.eyJ1IjoicGVlcm1lc2hpbyIsImEiOiJ5XzNBd3FnIn0.V4EzZlqgoVDpKWnKA8cBEQ";
    this.vectorBaseMap = new esri.layers.WebTiledLayer(url, {
        "copyright": "",
        "id": "Night Map"
    });

    this.satelliteBaseMap = new esri.layers.WebTiledLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${row}/${col}", {
        "copyright": "",
        "id": "Satellite Esri"
    });
    this.satelliteBaseMap.setVisibility(false);

    this.map.addLayer(this.vectorBaseMap);
    this.map.addLayer(this.satelliteBaseMap);

    var self = this;
    this.map.on("zoom-end", function(e) {
        if(e.level>5) {
            self.heatmapRenderer.setBlurRadius(e.level+15);
        }else if(e.level <= 5){
            self.heatmapRenderer.setBlurRadius(13);
        }
    });
    this.initSearch();

    this.terrorismQueryTask = new esri.tasks.QueryTask("http://services5.arcgis.com/UIehWBwXHruOBSt7/arcgis/rest/services/terorism/FeatureServer/0");

    this.heatMapLayer = new esri.layers.FeatureLayer("http://services5.arcgis.com/UIehWBwXHruOBSt7/arcgis/rest/services/terorism/FeatureServer/0", {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["*"]
    });

   this.heatmapRenderer = new HeatmapRenderer({
        blurRadius: 13,
        maxPixelIntensity: 100,
        minPixelIntensity: 0,
        colors:["rgba(250, 0, 0, 0)","rgba(182, 117, 209, 0.5)","rgba(246, 156, 18, 0.5)","rgba(243, 156, 18, 0.6)","rgba(230, 229, 41, 0.8)","rgba(255, 0, 0, 0.7)"]
    });
    this.heatMapLayer.setRenderer(this.heatmapRenderer);

    this.distanceLayer = this.createGraphicLayer();
    //ANALYSIS
    this.analysisLayer = this.createGraphicLayer();

    this.attackHistoryLayer = this.createGraphicLayer();

    //define the info template that is used to display the popup content.
    var template = new esri.InfoTemplate();
    template.setTitle("");
    template.setContent(function (graphic) {
        return self.attackPopup(graphic);
    });
    this.attackHistoryLayer.infoTemplate = template;

    this.attackLayer = this.createGraphicLayer();

    this.attackLayer.on("click", function(evt){
        self.onMouseHoverAttackPoint(evt);
        evt.stopPropagation();
        evt.preventDefault();
    });
    this.map.on("click", function(evt){
        self.onMouseOutAttackPoint(evt);
    });

    this.pointSelectorController = new esri.toolbars.Draw(this.map);
    this.pointSelectorController.on("draw-end", function(evt) {
        self.pointSelectorController.deactivate();
        self.map.enableMapNavigation();
        self.createAttackGeometry(evt.geometry);
    });

    this.animatedGeometry = new AnimatedGeometry(this.analysisLayer);

    //ANALYSIS RESULT
    this.analysisResult = {
        terroristGroup : new MapUtil(),
        eventType : new MapUtil(),
        targetType:new MapUtil(),
        weaponType:new MapUtil(),
        weaponSubType: new MapUtil(),
        damageStatus: new MapUtil(),
        killCount :0,
        injuredCount:0
    };

    this.poiLayers = [];
    this.poiLayers.push({name:MapManager.SCHOOL , layer:new esri.layers.GraphicsLayer(), icon:'img/school.png'});
    this.poiLayers.push({name:MapManager.POLICE , layer:new esri.layers.GraphicsLayer(), icon:'img/police.png'});
    this.poiLayers.push({name:MapManager.FIRE , layer:new esri.layers.GraphicsLayer(), icon:'img/fire.png'});
    this.poiLayers.push({name:MapManager.HOSPITAL , layer:new esri.layers.GraphicsLayer(), icon:'img/hospital.png'});
    this.poiLayers.push({name:MapManager.AIRPORT , layer:new esri.layers.GraphicsLayer(), icon:'img/airport.png'});
    this.poiLayers.push({name:MapManager.SHOPPING , layer:new esri.layers.GraphicsLayer(), icon:'img/shopping.png'});
    this.poiLayers.push({name:MapManager.GOVERMENT , layer:new esri.layers.GraphicsLayer(), icon:'img/goverment.png'});

    for(var i=0;i<this.poiLayers.length;i++) {
        //define the info template that is used to display the popup content.
        var template = new esri.InfoTemplate();
        template.setTitle("");
        template.setContent(function (graphic) {
            return self.poiPopup(graphic);
        });

        this.poiLayers[i].layer.infoTemplate = template;

        this.map.addLayer(this.poiLayers[i].layer);
        this.poiLayers[i].layer.setVisibility(false);
    }
};

MapManager.prototype.attackPopup = function(graphic) {
        var div = "<div class='attack-popup'>";
        div+="<div class='popupTitle'><span><span class='event-key-circle' event='"+graphic.attributes[MapManager.EVENT_TYPE_KEY]+"'></span>"+graphic.attributes[MapManager.EVENT_TYPE_KEY]+"</span><div>EVENT SUMMARY</div></div>";

        div+="<div class='popup-data'><span class='popup-data-title'>City:</span>";
        div+=graphic.attributes[MapManager.CITY_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Event Year:</span>";
        div+=graphic.attributes[MapManager.YEAR_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Target:</span>";
        div+=graphic.attributes[MapManager.TARGET_TYPE_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Group:</span>";
        div+=graphic.attributes[MapManager.TERRORIST_GROUP_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Weapon:</span>";
        div+=graphic.attributes[MapManager.WEAPON_TYPE_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Prope:</span>";
        div+=graphic.attributes[MapManager.DAMAGE_STATUS_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Dead:</span>";
        div+=graphic.attributes[MapManager.KILLED_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Injured:</span>";
        div+=graphic.attributes[MapManager.INJURED_KEY];
        div+="</div>";

        div+="<div class='popup-data'><span class='popup-data-title'>Detail:</span><div>";
        div+=graphic.attributes[MapManager.DETAIL2_KEY];
        div+=graphic.attributes[MapManager.DETAIL_KEY];
        div+="</div></div>";

        div+="</div>";
        return div;

};


MapManager.prototype.poiPopup = function(graphic) {
    var div = "<div>";
    div+="<div class='popupTitle'><span>"+graphic.attributes.name+"</span></div>";
    if(graphic.attributes.photo !=undefined) {
        div+="<img src='"+graphic.attributes.photo+"' />";
    }
    if(graphic.attributes.openNow != undefined) {
        div+="<div class='popup-data'><span class='popup-data-title'>Time:</span>";
       if(graphic.attributes.openNow) {
           div+="Open Now";
       }else {
           div+="Not Open";
       }
        div+="</div>";
    }
    div+="<div class='popup-data'><span class='popup-data-title'>Adress:</span>";
    div+=graphic.attributes.vicinity;
    div+="</div>";
    div+="</div>";
    return div;
};

MapManager.prototype.switchBaselayer = function () {
    this.isBaseMapOSM = !this.isBaseMapOSM;
    var self = this;
    if(self.isBaseMapOSM) {
            self.satelliteBaseMap.setVisibility(false);
            self.vectorBaseMap.setVisibility(true);
    }else {
            self.vectorBaseMap.setVisibility(false);
            self.satelliteBaseMap.setVisibility(true);
    }
};

MapManager.prototype.onMouseHoverAttackPoint = function(evt) {
    var self = this;
    for(var i=0;i<this.poiLayers.length;i++) {
        if(this.poiLayers[i].layer.visible) {
            var graphics = this.poiLayers[i].layer.graphics;
            for(var j=0;j<graphics.length;j++) {
                var line = this.animatedGeometry.createLine(this.attackPoint,graphics[j].geometry);
                this.distanceLayer.add(line);

                this.mapService.calculateDistance(this.attackPoint,graphics[j].geometry,function(distance,center) {
                    self.distanceLayer.add(self.animatedGeometry.createLabel(distance.toFixed(2)+"mil",center));
                });
            }
        }
    }
};

MapManager.prototype.onMouseOutAttackPoint = function(evt) {
    this.distanceLayer.clear();
    var self = this;
    setTimeout(function () {
        self.distanceLayer.clear();
    },700);
};

MapManager.prototype.createGraphicLayer = function() {
    var layer = new esri.layers.GraphicsLayer();
    layer.setVisibility(false);
    this.map.addLayer(layer);
    return layer;
};

MapManager.prototype.getPoiLayer = function (name) {
    for(var i=0;i<this.poiLayers.length;i++) {
        if(this.poiLayers[i].name == name) {
            return this.poiLayers[i];
        }
    }
};

MapManager.prototype.createAttackGeometry = function(geom) {
    var self = this;

    this.map.setMapCursor("default");
    this.mapService.projectToLatLong(geom,function(geomGeodetic) {
        self.attackPoint = geomGeodetic;
    });
    this.attackLayer.clear();
    this.attackHistoryLayer.clear();
    this.animatedGeometry.createAnimatedCircle(geom,0,this.radius/2,"rgba(223, 67, 19, 0.39)",40);
    this.attackLayer.add(this.animatedGeometry.createMarker(geom));
    var scope = this;
    setTimeout(function() {
        scope.animatedGeometry.createAnimatedCircle(geom,scope.radius/2,scope.radius,"rgba(197, 102, 2, 0.39)",25);
    },1000);

    var query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = [MapManager.TERRORIST_GROUP_KEY,MapManager.EVENT_TYPE_KEY,MapManager.WEAPON_TYPE_KEY,MapManager.WEAPON_SUBTYPE_KEY,MapManager.TARGET_TYPE_KEY,MapManager.DAMAGE_STATUS_KEY,MapManager.INJURED_KEY,MapManager.KILLED_KEY,MapManager.YEAR_KEY,MapManager.CITY_KEY,MapManager.DETAIL_KEY,MapManager.DETAIL2_KEY];

    query.returnGeometry = true;
    query.geometry = new esri.geometry.Circle({
        center: geom,
        geodesic: false,
        radius: 3,
        radiusUnit:esri.Units.KILOMETERS
    });

    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    this.terrorismQueryTask.execute(query,function(result) {
        self.terroristQueryResult(result);
        self.canOpenAnalysis = true;
    });

    this.mapService.retrievePOIs(geom,3000,function(result) {
        self.createPOI(result);
    });

};

MapManager.prototype.createPOI = function(result) {
    for(var i=0;i<result.length;i++) {
        var point = new esri.geometry.Point(result[i].geometry.location.lng(),result[i].geometry.location.lat());

        var layerModel = this.findPOILayer(result[i]);
        if(layerModel !=null) {
            var marker = this.animatedGeometry.createPictureMarker(point,layerModel.icon);
            layerModel.layer.add(marker);

            marker.attributes = {};
            marker.attributes.name = result[i].name;
            if(result[i].photos != undefined && result[i].photos.length>0) {
                var url = result[i].photos[0].getUrl({maxWidth:270});
                marker.attributes.photo = url;
            }
            marker.attributes.rating = result[i].rating;
            marker.attributes.vicinity = result[i].vicinity;

            if(result[i].opening_hours != undefined) {
                marker.attributes.openNow = result[i].opening_hours.open_now;
            }
        }
    }

};

MapManager.prototype.findPOILayer = function(result) {
    for(var i = 0 ; i<result.types.length;i++) {
        var type = result.types[i];
        if(type == 'hospital') {
            return this.getPoiLayer(MapManager.HOSPITAL);
        }else if(type == 'shopping_mall') {
            return this.getPoiLayer(MapManager.SHOPPING);
        }else if(type == 'school' || type == 'university') {
            return this.getPoiLayer(MapManager.SCHOOL );
        }else if(type == 'fire_station') {
            return this.getPoiLayer(MapManager.FIRE);
        }else if(type == 'airport') {
            return this.getPoiLayer(MapManager.AIRPORT);
        }else if(type == 'police') {
            return this.getPoiLayer( MapManager.POLICE );
        }else if(type == 'local_government_office') {
            return this.getPoiLayer(MapManager.GOVERMENT);
        }
    }
};

MapManager.prototype.createNewAttack = function(radius) {
    this.noResult = false;
    this.allIsUnknown = false;
    this.canOpenAnalysis = false;
    this.analysisLayer.clear();
    this.attackLayer.clear();
    this.distanceLayer.clear();
    this.attackHistoryLayer.clear();
    for(var i=0;i<this.poiLayers.length;i++) {
            this.poiLayers[i].layer.clear();
    }

    this.radius = radius;
    this.map.disableMapNavigation();
    this.pointSelectorController.activate("point");
    this.map.setMapCursor("url(img/explosion.png) 10 10,auto");
    this.analysisResult = {
        terroristGroup : new MapUtil(),
        eventType : new MapUtil(),
        targetType:new MapUtil(),
        weaponType:new MapUtil(),
        weaponSubType: new MapUtil(),
        damageStatus: new MapUtil(),
        killCount :0,
        injuredCount:0
    };
};

MapManager.prototype.initAnalysisResult = function() {
    this.analysisResult.terroristGroup = new MapUtil();
};

MapManager.prototype.findColor =function(feature) {
    var event = feature.attributes[MapManager.EVENT_TYPE_KEY];
    if(event == "Bombing/Explosion") {
        return "#ED2028";
    }else if(event == "Assassination") {
        return "#04EAFF";
    }else if(event == "Armed Assault") {
        return "#e67e22";
    }else if(event == "Unarmed Assault") {
        return "#E74C3C";
    }else if(event == "Hijacking") {
        return "#19B5FE";
    }
    else if(event == "Facility/Infrastructure Attack") {
        return "#ED1AF0";
    }else if(event.indexOf("Hostage Taking")>=0) {
        return "#4BED1E";
    }else if(event == "Unknown") {
        return "#ECF0F1";
    }
};

MapManager.prototype.terroristQueryResult = function(results) {
    this.initAnalysisResult();
    this.analysisResult.killCount = 0;
    this.analysisResult.injuredCount = 0;
    this.analysisResult.eventStatistic = [];
    for(var i = 1978 ; i<=2013;i++) {
        this.analysisResult.eventStatistic.push({year:i,count:0});
    }
    this.noResult = results.features.length == 0;

    for(var i=0; i<results.features.length;i++) {
        var marker = this.animatedGeometry.createTerroristMarker(results.features[i].geometry,this.findColor(results.features[i]));
        marker.attributes = results.features[i].attributes;

        this.attackHistoryLayer.add(marker);
        this.analysisResult.killCount += results.features[i].attributes[MapManager.KILLED_KEY];
        this.analysisResult.injuredCount += results.features[i].attributes[MapManager.INJURED_KEY];
        var index = results.features[i].attributes[MapManager.YEAR_KEY] - 1978;
        if(index >= 0) {
            this.analysisResult.eventStatistic[index].count ++;
        }
    }
    this.analysisQueryResult(results.features,this.analysisResult.terroristGroup,MapManager.TERRORIST_GROUP_KEY);
    this.analysisQueryResult(results.features,this.analysisResult.eventType,MapManager.EVENT_TYPE_KEY);
    this.analysisQueryResult(results.features,this.analysisResult.weaponType,MapManager.WEAPON_TYPE_KEY);
    this.analysisQueryResult(results.features,this.analysisResult.weaponSubType,MapManager.WEAPON_SUBTYPE_KEY);
    this.analysisQueryResult(results.features,this.analysisResult.targetType,MapManager.TARGET_TYPE_KEY);
    this.analysisQueryResult(results.features,this.analysisResult.damageStatus,MapManager.DAMAGE_STATUS_KEY);


    this.onTerroristAnalysisChange( this.analysisResult);
};

MapManager.prototype.analysisQueryResult = function(features,result,key) {
    for(var i=0; i<features.length;i++) {
        var group = features[i].attributes[key];
        var groupValue = result.get(group);
        groupValue = groupValue == null ? 1 : groupValue+1;
        result.put(group,groupValue);
    }

};

MapManager.prototype.initSearch = function() {
      this.search = new esri.dijit.Search({
            map: this.map,
            enableInfoWindow: false,
            enableHighlight:false
        }, "search");
        this.search.startup();
};

MapManager.prototype.addLayer = function(layer) {
    this.map.addLayer(layer);
};

MapManager.prototype.removeLayer = function(layer) {
    this.map.removeLayer(layer);
};

MapManager.TERRORIST_GROUP_KEY= "gname";
MapManager.EVENT_TYPE_KEY= "attackty_1";
MapManager.TARGET_TYPE_KEY= "targtype1_";

MapManager.WEAPON_TYPE_KEY= "weaptype1_";
MapManager.WEAPON_SUBTYPE_KEY= "weapsubt_1";
MapManager.DAMAGE_STATUS_KEY= "propexte_1";
MapManager.INJURED_KEY = "nwound";
MapManager.KILLED_KEY = "nkill";
MapManager.YEAR_KEY = "iyear";
MapManager.CITY_KEY = "city";
MapManager.DETAIL_KEY = "propcommen";
MapManager.DETAIL2_KEY = "scite1";

MapManager.SCHOOL = 'Public School';
MapManager.POLICE = 'Police Department';
MapManager.FIRE = 'Fire Department';
MapManager.HOSPITAL = 'Hospitals';
MapManager.AIRPORT = 'Airport';
MapManager.SHOPPING = 'Shopping Center';
MapManager.GOVERMENT = 'Goverment';

app.factory('MapService', ['$http', function($http) {
    var factory = {};

    factory.retrievePOIs = function (geom,radius,callback) {
        factory.projectToLatLong(geom,function(geomGeodetic) {
            var map = new google.maps.Map(document.getElementById('hidden_div'));
            var request = {
                location:  new google.maps.LatLng(geomGeodetic.y,geomGeodetic.x),
                radius: radius+'',
                types: ['hospital','shopping_mall','school','university','fire_station','airport','police','local_government_office']
            };

            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, function(results,status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    callback(results);
                }
            });
        });


        //return $http.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+lat+","+lng+"&radius="+radius+"&types=hospital|shopping_mall|school|university|fire_station|airport|police|local_government_office&name=&key=AIzaSyC5Wha5MPML1R7YQiUJp7ufbQgpSPoF4UM");
    };

    factory.calculateDistance = function (geom1,geom2,success) {
        var geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
        var distParams = new esri.tasks.DistanceParameters();
        distParams.distanceUnit = esri.tasks.GeometryService.UNIT_STATUTE_MILE;

        distParams.geometry1 = geom1;
        distParams.geometry2 = geom2;
        distParams.geodesic = true;
        var scope =this;
        geometryService.distance(distParams, function(distance) {
                success(distance,scope.findCenter(geom1,geom2));

        });
    };

    factory.findCenter = function (geom1,geom2) {
        var dx = (geom1.x - geom2.x)/2;
        var dy = (geom1.y - geom2.y)/2;

        return new esri.geometry.Point(geom1.x-dx,geom1.y-dy);
    };

    factory.projectToLatLong =function(geom,success) {
        var outSR = new esri.SpatialReference(4326);
        var params = new esri.tasks.ProjectParameters();
        params.geometries = [geom.normalize()];
        params.outSR = outSR;
        var gsvc = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

        gsvc.project(params, function(projectedPoints) {
            success(projectedPoints[0]);
        });
    }

    return factory;
}]);
/**
 * Created by emre on 12.4.2015.
 */
AnimatedGeometry = function(aGraphicLayer) {
    this.lastCircle = null;
    this.graphicLayer = aGraphicLayer;

};

/*AnimatedGeometry.prototype.createMarker = function(geometry) {
    // markerSymbol is used for point and multipoint, see http://raphaeljs.com/icons/#talkq for more examples
    var markerSymbol = new esri.symbol.SimpleMarkerSymbol();
    markerSymbol.setPath("M356.208,107.051c-1.531-5.738-4.64-11.852-6.94-17.205C321.746,23.704,261.611,0,213.055,0"+
    "C148.054,0,76.463,43.586,66.905,133.427v18.355c0,0.766,0.264,7.647,0.639,11.089c5.358,42.816,39.143,88.32,64.375,131.136"+
    "c27.146,45.873,55.314,90.999,83.221,136.106c17.208-29.436,34.354-59.259,51.17-87.933c4.583-8.415,9.903-16.825,14.491-24.857"+
    "c3.058-5.348,8.9-10.696,11.569-15.672c27.145-49.699,70.838-99.782,70.838-149.104v-20.262"+
    "C363.209,126.938,356.581,108.204,356.208,107.051z M214.245,199.193c-19.107,0-40.021-9.554-50.344-35.939"+
    "c-1.538-4.2-1.414-12.617-1.414-13.388v-11.852c0-33.636,28.56-48.932,53.406-48.932c30.588,0,54.245,24.472,54.245,55.06"+
    "C270.138,174.729,244.833,199.193,214.245,199.193z");
    markerSymbol.setColor(new esri.Color("#27ae60"));
    markerSymbol.setSize(32);
    return new esri.Graphic(geometry, markerSymbol);
};*/

AnimatedGeometry.prototype.createMarker = function(geometry) {
    var markerSymbol = new esri.symbol.PictureMarkerSymbol('img/explosion.png',16,16);
    return new esri.Graphic(geometry, markerSymbol);
};

AnimatedGeometry.prototype.createTerroristMarker = function(geometry,color) {
    // markerSymbol is used for point and multipoint, see http://raphaeljs.com/icons/#talkq for more examples
    var markerSymbol = new esri.symbol.SimpleMarkerSymbol( esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE);
    //markerSymbol.setPath("M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0");
    markerSymbol.setColor(new esri.Color(color));
    markerSymbol.setSize(10);
    return new esri.Graphic(geometry, markerSymbol);
};

AnimatedGeometry.prototype.createPictureMarker = function(geometry,url) {
    var markerSymbol = new esri.symbol.PictureMarkerSymbol(url,32,32);
    return new esri.Graphic(geometry, markerSymbol);
};

AnimatedGeometry.prototype.createCircle =function(center,radius,color) {
    var symbol = new esri.symbol.SimpleFillSymbol();
    symbol.setColor(color);
    symbol.outline.setColor("#FFFFFF");

    var circle = new esri.geometry.Circle({
        center: center,
        geodesic: false,
        radius: radius,
        radiusUnit:esri.Units.KILOMETERS
    });

    return new esri.Graphic(circle, symbol);
};

AnimatedGeometry.prototype.createLine = function(point1,point2) {
        //define the symbology for the graphics
        var polylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color("rgb(204, 102, 51)"), 2);
        //draw a polyline to connect the input points
        var polyline = new esri.geometry.Polyline([[point1.x,point1.y],[point2.x,point2.y]]);
        //polyline.addPath([point1, point2]);
        return new esri.Graphic(polyline, polylineSymbol);
};

AnimatedGeometry.prototype.createLabel = function (text,point) {
    var font = new esri.symbol.Font("14px", esri.symbol.Font.STYLE_NORMAL, esri.symbol.Font.VARIANT_NORMAL, esri.symbol.Font.WEIGHT_BOLDER);
    var textSymbol = new esri.symbol.TextSymbol( text, font, new esri.Color("white"));

    return new esri.Graphic(point, textSymbol);
};

AnimatedGeometry.prototype.createAnimatedCircle =function(center,radiusStart,radius,color,tour) {
    this.lastCircle = null;
    var dif = (radius-radiusStart)/tour;
    this.createCircleFrame(center,dif,dif,tour,radiusStart,color);
};


AnimatedGeometry.prototype.createCircleFrame =function(center,radius,dif,t,radiusStart,color) {
    if(t>0) {
        if( this.lastCircle !=null) {
            this.graphicLayer .remove( this.lastCircle);
        }

        var circle = this.createCircle(center,radius+radiusStart,color);
        this.lastCircle = circle;

        this.graphicLayer.add(circle);
        var scope = this;
        setTimeout(function() {
            scope.createCircleFrame(center,radius+dif,dif,t-1,radiusStart,color);
        },20);
    }
}
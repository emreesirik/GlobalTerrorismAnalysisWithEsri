/**
 * Created by emre on 13.4.2015.
 */
MapUtil = function() {
    this.map = [];
};

MapUtil.prototype.get = function(key) {
      for(var i=0;i<this.map.length;i++) {
          if(this.map[i].key == key) {
              return this.map[i].value;
          }
      }
    return null;
};

MapUtil.prototype.put = function(key,value) {
    for(var i=0;i<this.map.length;i++) {
        if(this.map[i].key == key) {
            this.map[i].value = value;
            return;
        }
    }

    this.map.push({key:key,value:value});

};

MapUtil.prototype.clear = function() {
    this.map.clear();
};
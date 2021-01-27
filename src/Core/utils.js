const Utils = {
  getHeight: function (obj) {
    // 求解 threeObj 在 y 方向上的小于 0 的部分的长度
    vertices = obj.geometry.vertices
    let y_arr = vertices.reduce((prev, cur) => {
  
      prev.push(cur.y)
      return prev
      
    }, [])
    
    let y_max = y_arr.sort((a, b) => { return a - b})[y_arr.length - 1]
    let y_min = y_arr.sort((a, b) => { return b - a})[y_arr.length - 1]
    let scale_y = obj.scale.y
  
    // 物体实际高度
    let height = Math.abs(y_max - y_min) * scale_y
    // 获得 y 切面最小的值, 该值如果小于 0, 则证明该几何体部分位于原点以下, 需要抬升相应的高度
    let y_diff = y_min < 0 ? Math.abs(y_min) * scale_y : 0
  
    return y_diff
  },
  
  // 球面两点距离计算函数
  getSpaceDistance: function(positions) {
    var distance = 0;
    for (var i = 0; i < positions.length - 1; i++) {
      var point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
      var point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);
      var geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(point1cartographic, point2cartographic);
      var s = geodesic.surfaceDistance;
      s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
      distance = distance + s;
    }
    return distance.toFixed(2);
  }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Utils;
}
else {
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return Utils;
    });
  }
  else {
    window.Utils = Utils;
  }
}
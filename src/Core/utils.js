// 坐标偏移处理类
class LocateInfo {
  constructor(lon, lat) {
    this.longitude = lon
    this.latitude = lat
    this.isChina = true
  }
  getLongitude() {
    return this.longitude
  }
  getLatitude() {
    return this.latitude
  }
  setChina(bool) {
    this.isChina = bool
  }
  setLatitude(lat) {
    this.latitude = lat
  }
  setLongitude(lon) {
    this.longitude = lon
  }
}
// 圆周率
const pi = 3.1415926535897932384626
// 克拉索夫斯基椭球参数长半轴a
const a = 6378245.0
// 克拉索夫斯基椭球参数第一偏心率平方
const ee = 0.00669342162296594323

function isOutOfChina(lat, lon) {
  if (lon < 72.004 || lon > 137.8347) { return true }
  if (lat < 0.8293 || lat > 55.8271) { return true }
  return false
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y +
            0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLon(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 *
            Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0
  return ret
}

function transform(lat, lon) {
  let info = new LocateInfo()
  if (isOutOfChina(lat, lon)) {
    info.setChina(false)
    info.setLatitude(lat)
    info.setLongitude(lon)
    return info
  }
  let dLat = transformLat(lon - 105.0, lat - 35.0)
  let dLon = transformLon(lon - 105.0, lat - 35.0)
  let radLat = lat / 180.0 * pi
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  let sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
  let mgLat = lat + dLat
  let mgLon = lon + dLon
  info.setChina(true)
  info.setLatitude(mgLat)
  info.setLongitude(mgLon)
  return info
}

const Utils = {
  gcj02_to_wgs84: function(lon, lat) {
    const info = new LocateInfo()
    let gps = transform(lat, lon)
    let lontitude = lon * 2 - gps.getLongitude()
    let latitude = lat * 2 - gps.getLatitude()
    info.setChina(gps.isChina)
    info.setLatitude(latitude)
    info.setLongitude(lontitude)
    return info
  },
  wgs84_to_gcj02: function(lon, lat) {
    const info = new LocateInfo()
    if (isOutOfChina(lat, lon)) {
      info.setChina(false)
      info.setLatitude(lat)
      info.setLongitude(lon)
    } 
    else {
      let dLat = transformLat(lon - 105.0, lat - 35.0)
      let dLon = transformLon(lon - 105.0, lat - 35.0)
      let radLat = lat / 180.0 * pi
      let magic = Math.sin(radLat)
      magic = 1 - ee * magic * magic
      let sqrtMagic = Math.sqrt(magic)
      dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
      dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
      let mgLat = lat + dLat
      let mgLon = lon + dLon
      info.setChina(true)
      info.setLatitude(mgLat)
      info.setLongitude(mgLon)
    }
    return info
  },
  bd09_to_gcj02: function(bd_lon, bd_lat) {
    const info = new LocateInfo()
    let x = bd_lon - 0.0065
    let y = bd_lat - 0.006
    let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * pi)
    let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * pi)
    let gcj_lng = z * Math.cos(theta)
    let gcj_lat = z * Math.sin(theta)
    info.setChina(true)
    info.setLatitude(gcj_lat)
    info.setLongitude(gcj_lng)
    return info
  },

  // 求解 threeObj 在 y 方向上的小于 0 的部分的长度
  getHeight: function (obj) {
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
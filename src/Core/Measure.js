if (typeof require === "function" && global === global) {
  global.Utils = require("./Utils")
}

//角度转化为弧度(rad)
const radiansPerDegree = Math.PI / 180.0
//弧度转化为角度
const degreesPerRadian = 180.0 / Math.PI

function MeasureTool(viewer) {
  this.viewer = viewer
  this.lines = []
  this.polygons = []
  // 当前控制点
  this.cartesian = undefined
  // 临时点位记录
  this.positions = []
  // 当前的 handler
  this.handler = undefined
}
Object.assign(MeasureTool.prototype, {
  // 切换功能
  switchCommand: function (command) {
    // 取消双击事件
    this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    )
    // 清空临时点位记录变量
    this.positions = []
    if (this.handler !== undefined) {
      // 销毁处理器
      this.handler.destroy()
    }
    // 测距
    if (command == "distance") {
      this.measureDistance()
    }
    // 测面积
    else if (command == "area") {
      this.measureArea()
    }
  },
  // 测距
  measureDistance: function () {
    let { viewer, handler, cartesian, positions, lines } = this

    handler = new Cesium.ScreenSpaceEventHandler(
      viewer.scene._imageryLayerCollection
    )
    // 当前画的线
    let polyline = null
    // 当前线段的长度
    let distance = null
    handler.setInputAction(function (movement) {
      cartesian = viewer.scene.camera.pickEllipsoid(
        movement.endPosition,
        viewer.scene.globe.ellipsoid
      )
      // 拾取的点不在球面上
      if (!Cesium.defined(cartesian)) {
        return
      }
      // 绘线
      if (positions.length >= 2) {
        if (!Cesium.defined(polyline)) {
          polyline = new PolyLinePrimitive(positions)
        } else {
          // 更新移动过程的最新点位
          positions.pop()
          positions.push(cartesian)
        }
        distance = Utils.getSpaceDistance(positions)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(function (movement) {
      // 也可以使用以上的 pickEllipsoid 方法
      let ray = viewer.camera.getPickRay(movement.position)
      cartesian = viewer.scene.globe.pick(ray, viewer.scene)
      // 拾取的点不在球面上
      if (!Cesium.defined(cartesian)) {
        return
      }
      // 一开始点击的时候需要多写入一个点位才能形成点
      else if (positions.length == 0) {
        positions.push(cartesian)
      }
      positions.push(cartesian)
      // 添加点和距离标注
      let entity = new Cesium.Entity({
        name: "地球表面直线距离",
        position: positions[positions.length - 1],
        point: {
          pixelSize: 5,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      })
      if (distance !== null) {
        let label = new Cesium.LabelGraphics({
          text: distance + "米",
          font: "18px sans-serif",
          fillColor: Cesium.Color.GOLD,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(20, -20),
        })
        entity.label = label
      }
      viewer.entities.add(entity)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (movement) {
      // handler.destroy()
      positions.pop() // 最后一个点无效
      // 记录已绘制的点
      lines.push({
        name: `line${lines.length}`,
        position: positions,
      })
      // 清空临时变量
      cartesian = undefined
      polyline = null
      distance = null
      positions = []
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    let PolyLinePrimitive = function _(positions) {
      let entity_options = {
        name: "直线",
        polyline: {
          show: true,
          material: Cesium.Color.CHARTREUSE, // 黄绿色
          width: 1,
          clampToGround: true,
          positions: new Cesium.CallbackProperty(function () {
            return positions
          }, false),
        },
      }
      viewer.entities.add(entity_options)
    }
  },
  // 测面积
  measureArea: function () {
    let { viewer, handler, cartesian, positions, polygons } = this

    let polygon = null
    // 相当于 positions.pop()
    let tempPoints = []

    handler = new Cesium.ScreenSpaceEventHandler(
      viewer.scene._imageryLayerCollection
    )

    handler.setInputAction(function (movement) {
      let ray = viewer.camera.getPickRay(movement.endPosition)
      cartesian = viewer.scene.globe.pick(ray, viewer.scene)
      if (positions.length >= 2) {
        if (!Cesium.defined(polygon)) {
          polygon = new PolygonPrimitive(positions)
        } else {
          positions.pop()
          positions.push(cartesian)
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(function (movement) {
      let ray = viewer.camera.getPickRay(movement.position)
      cartesian = viewer.scene.globe.pick(ray, viewer.scene)
      if (positions.length == 0) {
        positions.push(cartesian.clone())
      }
      positions.push(cartesian)
      // 点击点坐标
      let cartographic = Cesium.Cartographic.fromCartesian(
        positions[positions.length - 1]
      )
      let longitude = Cesium.Math.toDegrees(cartographic.longitude)
      let latitude = Cesium.Math.toDegrees(cartographic.latitude)
      let height = cartographic.height
      tempPoints.push({
        lon: longitude,
        lat: latitude,
        hei: height,
      })
      viewer.entities.add({
        name: "多边形面积",
        position: positions[positions.length - 1],
        point: {
          pixelSize: 1,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (movement) {
      positions.pop()
      polygons.push({
        name: `多边形${polygons.length}`
      })
      // TODO 
      // 1.假设开始的三个点为 ABC, 求有序点位的实时三角面叠加面积, P 点在 ABC 的 OBB 包围面外部
      //   有序的求解：任意个数的时候利用重心三角坐标判断 B 点是否在 P 点与 AC 围成的 ACP 三角形内部, 
      //              若是违背了有序, 过滤处理。推理依据：初始的三个点已经形成了有序多边形的方向。
      // 2.根据有序的点位实时计算三角面积，右击后保存结果
      // 3.根据球面微分求得球面三角面积 R^2(A + B + C - PI)
      // 4.考虑到 WGS84 的椭球体曲率该怎么算呢？
      let textArea = getArea(tempPoints) + "平方公里"
      viewer.entities.add({
        name: "多边形面积",
        position: positions[positions.length - 1],
        label: {
          text: textArea,
          font: "18px sans-serif",
          fillColor: Cesium.Color.GOLD,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(20, -40),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
      // 清空临时变量
      cartesian = undefined
      tempPoints = []
      positions = []
      polygon = null
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    let PolygonPrimitive = function _(positions) {
      let entity = new Cesium.Entity({
        name: "多边形",
        polygon: {
          hierarchy: new Cesium.CallbackProperty(function() {
            return { positions }
          }, false),
          material: Cesium.Color.GREEN.withAlpha(0.5),
        },
      })
      viewer.entities.add(entity)
    }
    
    // TODO: 
    function getArea(points) {
      var res = 0
      // 拆分三角曲面
      for (var i = 0; i < points.length - 2; i++) {
        var j = (i + 1) % points.length
        var k = (i + 2) % points.length
        var totalAngle = Angle(points[i], points[j], points[k])

        var dis_temp1 = Utils.getSpaceDistance(positions[i], positions[j])
        var dis_temp2 = Utils.getSpaceDistance(positions[j], positions[k])
        res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle))
        console.log(res)
      }

      return (res / 1000000.0).toFixed(4)
    }

    /*角度*/
    function Angle(p1, p2, p3) {
      var bearing21 = Bearing(p2, p1)
      var bearing23 = Bearing(p2, p3)
      var angle = bearing21 - bearing23
      if (angle < 0) {
        angle += 360
      }
      return angle
    }
    /*方向*/
    function Bearing(from, to) {
      var lat1 = from.lat * radiansPerDegree
      var lon1 = from.lon * radiansPerDegree
      var lat2 = to.lat * radiansPerDegree
      var lon2 = to.lon * radiansPerDegree
      var angle = -Math.atan2(
        Math.sin(lon1 - lon2) * Math.cos(lat2),
        Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
      )
      if (angle < 0) {
        angle += Math.PI * 2.0
      }
      angle = angle * degreesPerRadian //角度
      return angle
    }
  },
})

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = MeasureTool
} else {
  if (typeof define === "function" && define.amd) {
    define([], function () {
      return MeasureTool
    })
  } else {
    window.MeasureTool = MeasureTool
  }
}

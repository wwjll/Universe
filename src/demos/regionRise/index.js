if (typeof require == "function" && global == global) {
  require("cesium/Source/Cesium")
}

const viewer = new Cesium.Viewer("cesiumContainer", {
  alpha: false,
  animation: false, //是否显示动画控件
  homeButton: false, //是否显示home键
  geocoder: false, //是否显示地名查找控件        如果设置为true，则无法查询
  baseLayerPicker: false, //是否显示图层选择控件
  timeline: false, //是否显示时间线控件
  fullscreenButton: false, //是否全屏显示
  scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
  infoBox: false, //是否显示点击要素之后显示的信息
  sceneModePicker: false, //是否显示投影方式控件  三维/二维
  navigationInstructionsInitiallyVisible: false,
  navigationHelpButton: false, //是否显示帮助信息控件
  selectionIndicator: false, //是否显示指示器组件
  // imageryProvider: new Cesium.UrlTemplateImageryProvider({
  //   url:
  //     "http://localhost:9000/image/519ed030403c11eb88ad417b15d3ec62/{z}/{x}/{y}",
  // }),
  fullscreenElement: "cesiumContainer",
})

// cesium 显示窗口的像素缩放比例等于设备的像素缩放比例
if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
  viewer.resolutionScale = window.devicePixelRatio
}

//是否开启抗锯齿
viewer.scene.fxaa = true
viewer.scene.postProcessStages.fxaa.enabled = true

const url = "/src/Assets/geojson/contour.geojson"
Cesium.GeoJsonDataSource.load(url).then(function (dataSource) {
  dataSource.name = "region"
  viewer.dataSources.add(dataSource)
  var entities = dataSource.entities.values
  for (var i = 0; i < entities.length; i++) {
    var entity = entities[i]
    let height = 0
    let flag = 1
    // 构造随机颜色
    let color = Cesium.Color.fromRandom({ alpha: 0.6 })
    entity.polygon.material = color
    entity.polygon.outline = false
    entity.polygon.extrudedHeight = new Cesium.CallbackProperty(function () {
      if (flag === 1) {
        height += 20 * Math.random()
        if (height > 5000) {
          flag = -1
        }
      } else if (flag === -1) {
        height -= 20 * Math.random()
        if (height < 0) {
          flag = 1
        }
      }
      return height
    }, false)
    // 得到每块多边形的坐标集合
    var polyPositions = entity.polygon.hierarchy.getValue(
      Cesium.JulianDate.now()
    ).positions
    // 根据坐标集合构造BoundingSphere获取中心点坐标
    var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center
    // 将中心点拉回到地球表面
    polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter)
    viewer.entities.add({
      position: polyCenter,
      extrudedHeight: height,
      label: {
        font: "24px sans-serif",
        text: "region",
        showBackground: true,
        scale: 0.6,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      },
    })
    viewer.zoomTo(entity)
  }
})

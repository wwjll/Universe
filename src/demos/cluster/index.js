// 支持标签引入
if (typeof require === "function" && global === global) {
  require("./CesiumThree.css")
  global.Cesium = require("cesium/Cesium")
  global.axios = require("axios")
}

const url = "/src/Assets/3dtiles/amoy/tileset.json"
const viewer = new Cesium.Viewer("cesiumContainer", {
  infoBox: false,
  selectionIndicator: false,
  navigation: false,
  animation: false,
  timeline: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  shouldAnimate: false,
  fullscreenElement: "cesiumContainer",
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: 'http://localhost:9000/image/519ed030403c11eb88ad417b15d3ec62/{z}/{x}/{y}'
  }),
})
// 开启地形检测
viewer.scene.globe.depthTestAgainstTerrain = true
// 判断是否支持图像渲染像素化处理
if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
  viewer.resolutionScale = window.devicePixelRatio
}
// 开启抗锯齿
viewer.scene.fxaa = true
viewer.scene.postProcessStages.fxaa.enabled = true
// 禁用点击
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
  Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
)
viewer.selectedEntityChanged.addEventListener(function(e) {
  console.log(e)
})
// 聚类图标集合
// let cluserImages = []
// 聚类图标样式
let cluserColors = [
  {
    value: 100, //聚合数大于等于100 红色
    color: "rgb(255,0,0)",
  },
  {
    value: 50, //聚合数大于等于50 黄
    color: "rgb(255,255,0)",
  },
  {
    value: 10, //聚合数大于等于10 蓝色
    color: "rgb(51, 133, 255)",
  },
  {
    value: 1, //聚合数大于等于1 绿
    color: "rgb(0,255,0)",
  },
] 
// 初始化聚类
function initCluster() {
  let url = "http://localhost:3000/kml/facilities.kml"
  new Cesium.KmlDataSource.load(
    url,
    {
      camera: viewer.scene.camera,
      canvas: viewer.scene.canvas,
    }
  ).then((geoJsonDataSource) => {
    viewer.dataSources.add(geoJsonDataSource)

    geoJsonDataSource.clustering.enabled = true
    geoJsonDataSource.clustering.pixelRange = 15
    geoJsonDataSource.clustering.minimumClusterSize = 3

    geoJsonDataSource.entities.values.forEach(entity => {
      let cartesian = entity.position._value
      // 设置聚类图标在地表之上
      entity.position = { 
        x: cartesian.x, 
        y: cartesian.y ,
        z: cartesian.z + 50000
      }
    })
    setClusterEvent(geoJsonDataSource)
  })
}

//设置聚合事件
function setClusterEvent(geoJsonDataSource) {
  geoJsonDataSource.clustering.clusterEvent.addEventListener(
    (clusteredEntities, cluster) => {
      // clusterEntities 和 cluster 分别代表每个聚类组的 entity 信息和 聚合成一点的信息
      cluster.billboard.show = true
      cluster.label.show = false 
      cluster.billboard.id = cluster.label.id
      cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
      cluster.billboard.image = getCluserImage(clusteredEntities.length)
    }
  )
}

//获取聚合图标
function getCluserImage(length) {
  var c = document.createElement("canvas")
  //一个数字大概 12 像素
  const d = (length + "").length * 12 + 50
  c.width = c.height = d
  var ctx = c.getContext("2d")
  //绘制大圆
  ctx.beginPath()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = getCluseColor(length) //绘制样式
  ctx.arc(d / 2, d / 2, d / 2 - 5, 0, 2 * Math.PI)
  ctx.fill()

  //绘制小圆
  ctx.beginPath()
  ctx.globalAlpha = 0.8
  ctx.fillStyle = getCluseColor(length) //绘制样式
  ctx.arc(d / 2, d / 2, d / 2 - 10, 0, 2 * Math.PI)
  ctx.fill()

  //绘制文本
  ctx.font = "20px 微软雅黑"
  ctx.globalAlpha = 1
  ctx.fillStyle = "rgb(255,255,255)"
  let fd = length.toString().length * 12 //文字的长度
  const x = d / 2 - fd / 2
  ctx.fillText(length, x, d / 2 + 10)
  return c
}
//获取聚合颜色
function getCluseColor(length) {
  for (let i = 0; i < cluserColors.length; i++) {
    const element = cluserColors[i]
    if (length >= element.value) return element.color
  }
}

// 
initCluster()
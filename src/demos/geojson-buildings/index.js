// 支持标签引入
if (typeof require === "function" && global === global) {
  require("./CesiumThree.css")
  global.Cesium = require("cesium/Cesium")
  global.axios = require('axios')
}

const sourcePath = "http://localhost:3000/"
const viewer = new Cesium.Viewer('cesiumContainer', {
  useDefaultRenderLoop: true,
  alpha: false,
  animation: false,       //是否显示动画控件
  homeButton: false,       //是否显示home键
  geocoder: false,         //是否显示地名查找控件        如果设置为true，则无法查询
  baseLayerPicker: false, //是否显示图层选择控件
  timeline: false,        //是否显示时间线控件
  fullscreenButton: false, //是否全屏显示
  scene3DOnly: true,     //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
  infoBox: false,         //是否显示点击要素之后显示的信息
  sceneModePicker: false,  //是否显示投影方式控件  三维/二维
  navigationInstructionsInitiallyVisible: false,
  navigationHelpButton: false,     //是否显示帮助信息控件
  selectionIndicator: false,        //是否显示指示器组件
  // imageryProvider: new Cesium.UrlTemplateImageryProvider({
  //   url: 'http://localhost:9000/image/519ed030403c11eb88ad417b15d3ec62/{z}/{x}/{y}'
  // }),
  terrainProvider : new Cesium.createWorldTerrain(),
  fullscreenElement: 'cesiumContainer'
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

const dataSource = new Cesium.CustomDataSource('buildings')
viewer.dataSources.add(dataSource)

axios.get(sourcePath + 'geojson-buildings/quangang.geojson').then((json) => {
  let result = json.data.features
  result.forEach(item => {
    let positions = item.geometry.coordinates[0][0]
    let positionArr = positions.reduce((prev, cur) => {
      let temp = Utils.gcj02_to_wgs84(cur[0], cur[1])
      prev.push(temp.longitude)
      prev.push(temp.latitude)
      // 未作偏移处理
      // prev.push(cur[0])
      // prev.push(cur[1])
      return prev
    }, [])
    let lvalue = item.properties.height
    let color
    if (lvalue < 10) {
      color = '151,232,173'
    } else if (lvalue >= 10 && lvalue < 20) {
      color = '244,217,99'
    } else if (lvalue >= 20 && lvalue < 30) {
      color = '247,180,45'
    } else if (lvalue >= 30 && lvalue < 45) {
      color = '241,147,3'
    } else if (lvalue >= 45 && lvalue < 60) {
      color = '239,117,17'
    } else if (lvalue >= 60 && lvalue < 70) {
      color = '238,88,31'
    } else if (lvalue >= 70 && lvalue < 80) {
      color = '224,63,22'
    } else {
      color = '208,36,14'
    }
    let entity = new Cesium.Entity({
      polygon: {
        name: 'Polygon',
        extrudedHeight: lvalue,
        outlineColor: Cesium.Color.YELLOW,
        outline: true,
        fill: true,
        // material: Cesium.Color.fromCssColorString('rgb(' + color + ')'),
        // material: new Cesium.GridMaterialProperty({
        //   color : Cesium.Color.YELLOW,
        //   cellAlpha : 0.2,
        //   lineCount : new Cesium.Cartesian2(8, 8),
        //   lineThickness : new Cesium.Cartesian2(2.0, 2.0)
        // }),
        material: new Cesium.CheckerboardMaterialProperty({
          evenColor : Cesium.Color.WHITE,
          oddColor : Cesium.Color.BLACK,
          repeat : new Cesium.Cartesian2(4,4)
        }),
        // material: new Cesium.ImageMaterialProperty({
        //   image: sourcePath + '/images/brick.jpeg',
        //   repeat : new Cesium.Cartesian2(2, 1)
        // }),
        hierarchy: Cesium.Cartesian3.fromDegreesArray(positionArr)
      }
    })
    dataSource.entities.add(entity)
  })
  viewer.zoomTo(dataSource)
})


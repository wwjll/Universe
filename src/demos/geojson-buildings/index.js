// 支持标签引入
if (typeof require === "function" && global === global) {
  require("./CesiumThree.css")
  global.Cesium = require("cesium/Cesium")
}

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
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: 'http://localhost:9000/image/519ed030403c11eb88ad417b15d3ec62/{z}/{x}/{y}'
  }),
  // imageryProvider: new Cesium.TileMapServiceImageryProvider({
  //   url: new Cesium.buildModuleUrl("node_modules/cesium/SourceAssets/Textures/NaturalEarthII")
  // }),
  fullscreenElement: 'cesiumContainer'
})

const dataSource = new Cesium.CustomDataSource('buildings')
viewer.dataSources.add(dataSource)

axios.get('http://localhost:3000/1111.geojson').then((json) => {
  let result = json.data.features
  result.forEach(item => {
    let positions = item.geometry.coordinates[0][0]
    let positionArr = positions.reduce((prev, cur) => {
      // let temp = gcj02_to_wgs84(cur[0], cur[1])
      // prev.push(temp.longitude)
      // prev.push(temp.latitude)
      // 未作偏移处理
      prev.push(cur[0])
      prev.push(cur[1])
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
        name: item.properties.floor,
        extrudedHeight: lvalue,
        outlineColor: Cesium.Color.YELLOW,
        outline: false,
        fill: true,
        material: Cesium.Color.fromCssColorString('rgb(' + color + ')'),
        hierarchy: Cesium.Cartesian3.fromDegreesArray(positionArr)
      }
    })
    dataSource.entities.add(entity)
  })
  viewer.zoomTo(dataSource)
})


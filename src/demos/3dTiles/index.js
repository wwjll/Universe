// 支持标签引入
if (typeof require === "function" && global === global) {
  require("./CesiumThree.css")
  global.Cesium = require("cesium/Cesium")
  global.axios = require("axios")
}

const url = "/src/Assets/3dtiles/amoy/tileset.json"
const viewer = new Cesium.Viewer("cesiumContainer", {
  useDefaultRenderLoop: true,
  alpha: false,
  animation: false, //是否显示动画控件
  homeButton: false, //是否显示home键
  geocoder: false, //是否显示地名查找控件        如果设置为true，则无法查询
  baseLayerPicker: false, //是否显示图层选择控件
  timeline: false, //是否显示时间线控件
  fullscreenButton: false, //是否全屏显示
  scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
  infoBox: true, //是否显示点击要素之后显示的信息
  sceneModePicker: false, //是否显示投影方式控件  三维/二维
  navigationInstructionsInitiallyVisible: false,
  navigationHelpButton: false, //是否显示帮助信息控件
  selectionIndicator: false, //是否显示指示器组件
  // imageryProvider: new Cesium.UrlTemplateImageryProvider({
  //   url: 'http://localhost:9000/image/519ed030403c11eb88ad417b15d3ec62/{z}/{x}/{y}'
  // }),
  terrainProvider: new Cesium.createWorldTerrain(),
  fullscreenElement: "cesiumContainer",
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

var tileset = new Cesium.Cesium3DTileset({
  url: url,
})

viewer.scene.primitives.add(tileset)
// // 位置调整
// var longitude = 116.3908443995411;
// var latitude = 39.91600579431837;
// height = 60.38590702090875;
// var heading = 2;
// tileset.readyPromise.then(function(argument) {
//     //经纬度、高转笛卡尔坐标
//     var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
//     var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position);
//     var rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(heading)));
//     Cesium.Matrix4.multiply(mat, rotationX, mat);
//     tileset._root.transform = mat;
// })


// 颜色的设置
tileset.style = new Cesium.Cesium3DTileStyle({
  color: {
    conditions: [
      ["${height} >= 200", 'color("red", 1)'],
      ["${height} >= 100", "rgba(150, 150, 150, 1)"],
      ["true", 'color("blue")'],
    ],
  },
})

viewer.zoomTo(tileset)

// HTML overlay for showing feature name on mouseover
var nameOverlay = document.createElement("div")
viewer.container.appendChild(nameOverlay)
nameOverlay.className = "backdrop"
nameOverlay.style.display = "none"
nameOverlay.style.position = "absolute"
nameOverlay.style.bottom = "0"
nameOverlay.style.left = "0"
nameOverlay.style["pointer-events"] = "none"
nameOverlay.style.padding = "4px"
nameOverlay.style.backgroundColor = "yellowgreen"

// Information about the currently selected feature
var selected = {
  feature: undefined,
  originalColor: new Cesium.Color(),
}

// An entity object which will hold info about the currently selected feature for infobox display
var selectedEntity = new Cesium.Entity()

// Get default left click handler for when a feature is not picked on left click
var clickHandler = viewer.screenSpaceEventHandler.getInputAction(
  Cesium.ScreenSpaceEventType.LEFT_CLICK
)

// Change the feature color.
// Information about the currently highlighted feature
var highlighted = {
  feature: undefined,
  originalColor: new Cesium.Color(),
}

// Color a feature yellow on hover.
viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
  // If a feature was previously highlighted, undo the highlight
  if (Cesium.defined(highlighted.feature)) {
    highlighted.feature.color = highlighted.originalColor
    highlighted.feature = undefined
  }
  // Pick a new feature
  var pickedFeature = viewer.scene.pick(movement.endPosition)
  if (
    !Cesium.defined(pickedFeature) ||
    !Cesium.defined(pickedFeature.getProperty)
  ) {
    nameOverlay.style.display = "none"
    return
  }
  // A feature was picked, so show its overlay content
  nameOverlay.style.display = "block"
  nameOverlay.style.bottom = viewer.canvas.clientHeight - movement.endPosition.y + "px"
  nameOverlay.style.left = movement.endPosition.x + "px"
  var name = pickedFeature.getProperty("name")
  if (!Cesium.defined(name)) {
    name = pickedFeature.getProperty("id")
  }
  nameOverlay.textContent = name
  // Highlight the feature if it's not already selected.
  if (pickedFeature !== selected.feature) {
    highlighted.feature = pickedFeature
    Cesium.Color.clone(pickedFeature.color, highlighted.originalColor)
    pickedFeature.color = Cesium.Color.YELLOW.withAlpha(0.5)
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

// Color a feature on selection and show metadata in the InfoBox.
viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
  // If a feature was previously selected, undo the highlight
  if (Cesium.defined(selected.feature)) {
    selected.feature.color = selected.originalColor
    selected.feature = undefined
  }
  // Pick a new feature
  var pickedFeature = viewer.scene.pick(movement.position)
  if (
    !Cesium.defined(pickedFeature) ||
    !Cesium.defined(pickedFeature.getProperty)
  ) {
    clickHandler(movement)
    return
  }
  // Select the feature if it's not already selected
  if (selected.feature === pickedFeature) {
    return
  }
  selected.feature = pickedFeature
  // console.log(pickedFeature.content.tile.boundingSphere.center)
  // console.log(pickedFeature.tileset.boundingSphere.center)
  // Save the selected feature's original color
  if (pickedFeature === highlighted.feature) {
    Cesium.Color.clone(highlighted.originalColor, selected.originalColor)
    highlighted.feature = undefined
  } else {
    Cesium.Color.clone(pickedFeature.color, selected.originalColor)
  }
  // Highlight newly selected feature
  pickedFeature.color = Cesium.Color.LIME.withAlpha(0.5)
  // Set feature infobox description
  var featureName = pickedFeature.getProperty("name")
  selectedEntity.name = featureName
  selectedEntity.description =
    'Loading <div class="cesium-infoBox-loading"></div>'

  selectedEntity.description =
    '<table class="cesium-infoBox-defaultTable"><tbody>'
  var propertyNames = pickedFeature.getPropertyNames()
  var length = propertyNames.length
  for (var i = 0; i < length; ++i) {
    var propertyName = propertyNames[i]
    selectedEntity.description +=
      "<tr><th>" +
      propertyName +
      "</th><td>" +
      pickedFeature.getProperty(propertyName) +
      "</td></tr>"
  }
  selectedEntity.description += "</tbody></table>"
  viewer.selectedEntity = selectedEntity
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)

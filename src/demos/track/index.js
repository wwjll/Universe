// 支持标签引入
if (typeof require === "function" && global === global) {
  require("./CesiumThree.css")
  require("cesium/Cesium")
  require("axios")
  require("three/examples/js/libs/stats.min")
  require("three/examples/js/libs/dat.gui.min")
}

const sourcePath = "http://localhost:3000/"
const speed = 50
// 路径点位
let uav_path = []
// 跟随物体
let animateEntity = undefined
const viewer = new Cesium.Viewer("cesiumContainer", {
  shouldAnimate: true,
  useDefaultRenderLoop: true,
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

// 清除跟随
function clearAnimateEntity() {
  if (animateEntity) {
    viewer.entities.remove(animateEntity)
    animateEntity = undefined
  }
}

// 计算每个点位时间与总时间
function getSiteTimes(pArr, speed) {
  let timeSum = 0
  const times = []
  for (var i = 0; i < pArr.length; i++) {
    if (i === 0) {
      // 第 0 个时间为 0
      times.push(0)
      continue
    }
    timeSum += Utils.getSpaceDistance([pArr[i - 1], pArr[i]]) / speed
    times.push(timeSum)
  }
  return {
    timeSum: timeSum,
    siteTimes: times,
  }
}
// 获取运动的动画点位
function computeCirclularFlight(pArr, startTime, siteTimes) {
  var property = new Cesium.SampledPositionProperty()
  for (var i = 0; i < pArr.length; i++) {
    const time = Cesium.JulianDate.addSeconds(
      startTime,
      siteTimes[i],
      new Cesium.JulianDate()
    )
    property.addSample(time, pArr[i])
  }
  return property
}

// 生成跟随路径
function createTrackPath(positions, showPath) {
  clearAnimateEntity()
  const timeObj = getSiteTimes(positions, speed)
  const startTime = Cesium.JulianDate.now()
  const stopTime = Cesium.JulianDate.addSeconds(
    startTime,
    timeObj.timeSum,
    new Cesium.JulianDate()
  )
  viewer.clock.startTime = startTime.clone()
  viewer.clock.stopTime = stopTime.clone()
  viewer.clock.currentTime = startTime.clone()
  // 循环
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP
  const property = computeCirclularFlight(
    positions,
    startTime,
    timeObj.siteTimes
  )
  animateEntity = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: startTime,
        stop: stopTime,
      }),
    ]),
    position: property,
    orientation: new Cesium.VelocityOrientationProperty(property),
    model: {
      uri: sourcePath + "models/CesiumAir/Cesium_Air.glb",
      shadows: true,
      scale: 1,
    },
    path: showPath ? {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.YELLOW,
      }),
      width: 5,
    } : undefined,
  })
  // console.log(viewer.dataSources, viewer.entities, viewer.scene.primitives)
}

// 加载路径数据
axios.get(sourcePath + "geojson/amoy-path.geojson").then((json) => {
  json.data.features.forEach((item) => {
    if (item.properties.name === "uav_path") {
      uav_path = item.geometry.coordinates.reduce((prev, cur) => {
        prev.push(Cesium.Cartesian3.fromDegrees(...cur, 200))
        return prev
      }, [])
    }
  })
  createTrackPath(uav_path, true)
})

// 
function entityTickListener() {
  if (!animateEntity) return
  let center = animateEntity.position.getValue(viewer.clock.currentTime)
  let orientation = animateEntity.orientation.getValue(viewer.clock.currentTime)
  // let transform = Cesium.Transforms.eastNorthUpToFixedFrame(center)
  let transform = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromQuaternion(orientation),
    center
  )
  // 相机偏移值为 heading, pitch, range(与目标距离)
  viewer.camera.lookAtTransform(transform, new Cesium.Cartesian3(-100, 0, 50))
}
// 
function removeTraceHandler() {
  /*
    Don't Touch: 
      Since Cesium.Event defines removeEventListener needs to bind scope with listener and it's not working in my case,
      So I directly remove listener whose specified name equals to 'bound mylistener'
  */
  let listeners = viewer.clock.onTick._listeners
  let length = listeners.length
  for (let i = 0; i < length; i++) {
    if (listeners[i].name === `bound ${entityTickListener.name}`) {
      console.log(listeners[i].name)
      // 必须移除不能设置为 null
      listeners.splice(i, 1)
    }
  }
  // 相机归位
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
  // clearAnimateEntity()
}



// 面板
var Options = function () {
  this.track = true
  this.message = "相机追踪"
  this.speed = speed
  this.button = function () {}
}
// 
var options = new Options()
var gui = new dat.GUI()

gui.add(options, "track")
gui.add(options, "message")
gui.add(options, "speed", -5, 5)
gui.add(options, "button")

// 时间事件监听
viewer.clock.onTick.addEventListener(function () {
  if (options.track) {
    entityTickListener()
  } else {
    removeTraceHandler()
  }
})
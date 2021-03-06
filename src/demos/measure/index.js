if (typeof(require) == 'function' && global == global) {
  const Cesium = require('cesium/Source/Cesium')
  const MeasureTool = require('../../Core/Measure')
}

const viewer = new Cesium.Viewer('cesiumContainer', {
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
  fullscreenElement: 'cesiumContainer'
})

// cesium 显示窗口的像素缩放比例等于设备的像素缩放比例
if(Cesium.FeatureDetection.supportsImageRenderingPixelated()){
  viewer.resolutionScale = window.devicePixelRatio;
}

//是否开启抗锯齿
viewer.scene.fxaa = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
// 测绘管理类
const M = new MeasureTool(viewer)
M.switchCommand('area')
// TODO: 用 dat.gui 来切换绘制方法


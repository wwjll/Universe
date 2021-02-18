
if (typeof(require) === 'function' && global === global) {
  global.Cesium = require('cesium/Cesium')
  global.THREE = require('three/build/three')
  global.Utils = require('./Utils')
}

console.warn(THREE.REVISION)
console.warn(Cesium.VERSION)

// 
function Universe() {
  this.animateList = []
  this._threeGroups = []
  this.ThreeContainer = document.getElementById("ThreeContainer")

}
Object.assign(Universe.prototype, {

  collide: function(viewer) {

    return new Promise((resolve, reject) => {
      let three = Object.create(null)
      let cesium = Object.create(null)
      // Three
      three.scene = new THREE.Scene()
      three.camera = new THREE.PerspectiveCamera(
        45, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        10 * 1000 * 1000
      )
  
      let canvas = document.createElement( 'canvas' )
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      let context = canvas.getContext( 'webgl2', { 
        alpha: true,
        antialias: true 
      })
      three.renderer = new THREE.WebGLRenderer({ 
        canvas: this.ThreeContainer,
        context: context,
        antialias : true
      })
      this.ThreeContainer.appendChild(canvas)
      //  Cesium
      if (!viewer) {
        cesium.viewer = new Cesium.Viewer('cesiumContainer', {
          useDefaultRenderLoop: false,
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

      } else {

        cesium.viewer = viewer
      }
      // 预先同步相机 fov
      three.camera.fov = Cesium.Math.toDegrees(cesium.viewer.camera.frustum.fovy)
      this.three = three
      this.cesium = cesium

      const _this = this
      window.onresize = function() {        
        three.camera.fov = Cesium.Math.toDegrees(cesium.viewer.camera.frustum.fovy)
        three.camera.updateProjectionMatrix()
        // 手动处理 resize 的时候 ThreeContainer 里的 canvas 尺寸没有随之改变
        three.renderer.setSize(window.innerWidth, window.innerHeight)
        _this.ThreeContainer.childNodes[0].width = window.innerWidth
        _this.ThreeContainer.childNodes[0].height = window.innerHeight
        
      }
      // 该 promise 状态置于 resolved
      resolve({ cesium, three })
    })
  },

  cartToVec: function(cart) {
    return new THREE.Vector3(cart.x, cart.y, cart.z)
  },
  createGroup: function(boundary) {
    /*
    / 创建一个新的基坐标, 把创建的 threeObj 置该基坐标下
    / 基座标原点位于 bounday 中心点
    / 每帧更新该基座标使得物体位于正确的 cesium 地球表面
    */
    let { minWGS84, maxWGS84 } = boundary
    let group = new THREE.Group()
    group.boundary = boundary

    let center = Cesium.Cartesian3.fromDegrees(
      (minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2
    )

    let topLeft = this.cartToVec(
      Cesium.Cartesian3.fromDegrees(minWGS84[0], minWGS84[1])
    )

    let bottomLeft = this.cartToVec(
      Cesium.Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1])
    )

    let rangeNorm = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2, 1)
    
    let latDir = new THREE.Vector3().subVectors(bottomLeft, topLeft).normalize()

    let axes = new THREE.AxesHelper(15000)
    group.add(axes)

    group.center = center
    // 基平面法向量
    group.rangeNorm = rangeNorm
    group.latDir = latDir
    this._threeGroups.push(group)
    this.three.scene.add(group)
    return group
  },
  modifyThreeObj: function(mesh, group, offset) {
    const { getHeight } = Utils
    // 保证转换后的 mesh 坐标在 cesium 球面以上
    mesh.position.y += getHeight(mesh)
    if (offset) {
      // 在 球面 划定 区域内偏移
      let { x, z } = offset
      mesh.position.x += x
      mesh.position.z += z
    }
    group.add(mesh)
  },
  createPlane: function(boundary, flyto) {
    // 根据区域划分生成 Cesium 平面
    let { minWGS84, maxWGS84 } = boundary
    let entity = {
      name: 'Polygon',
      polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray([
            minWGS84[0], minWGS84[1],
            maxWGS84[0], minWGS84[1],
            maxWGS84[0], maxWGS84[1],
            minWGS84[0], maxWGS84[1],
          ]),
          material: Cesium.Color.RED.withAlpha(0.2)
      }
    };
    this.cesium.viewer.entities.add(entity)
    
    if (flyto) {

      let center = Cesium.Cartesian3.fromDegrees(
        (minWGS84[0] + maxWGS84[0]) / 2,
        ((minWGS84[1] + maxWGS84[1]) / 2) - 1,
        200000
      )
      this.cesium.viewer.camera.flyTo({
          destination: center,
          orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-60),
              roll: Cesium.Math.toRadians(0)
          },
          duration: 1.5
      })

    }
  },

  syncGroup: function(group) {
    // 物体局部基坐标系永远朝向球心
    let { center, rangeNorm, latDir, boundary } = group

    // 先平移 
    group.position.copy(center)
    // 再旋转
    group.lookAt(rangeNorm.x, rangeNorm.y, rangeNorm.z)
    // 旋转基坐标使得 y 轴为上
    group.rotateX(Math.PI / 2)
    // 最后调整偏移(也是一次旋转)
    group.up.copy(latDir)
    // TODO: 尝试处理 resize y轴方向不同步问题

  },

  syncThree: function() {
    const { cesium, three } = this
    // 同步 threeObj 自身的坐标系
    for (let i = 0; i < this._threeGroups.length; i++) {
      this.syncGroup(this._threeGroups[i])
    }
    // 同步 three 的相机
    three.camera.matrixAutoUpdate = false
    let cvm = cesium.viewer.camera.viewMatrix
    let civm = cesium.viewer.camera.inverseViewMatrix

    three.camera.matrixWorld.set(
      civm[0], civm[4], civm[8], civm[12],
      civm[1], civm[5], civm[9], civm[13],
      civm[2], civm[6], civm[10], civm[14],
      civm[3], civm[7], civm[11], civm[15]
    )
    three.camera.matrixWorldInverse.set(
      cvm[0], cvm[4], cvm[8], cvm[12],
      cvm[1], cvm[5], cvm[9], cvm[13],
      cvm[2], cvm[6], cvm[10], cvm[14],
      cvm[3], cvm[7], cvm[11], cvm[15]
    )

    three.camera.aspect = cesium.viewer.camera.frustum.aspectRatio
    three.camera.updateProjectionMatrix()

    three.renderer.clear()
    three.renderer.render(three.scene, three.camera)
  },

  addAnimation: function(func) {
    this.animateList.push(func)
  },
  renderLoop: function() {
    requestAnimationFrame(this.renderLoop.bind(this))
    // this.cesium.viewer.resize()
    this.cesium.viewer.render()
    this.syncThree()
    try {
      for (let f of this.animateList) {
        f()
      }
    } catch (e) {
      console.log(e)
    }
  }
  
})

// 支持 script 和 module 引入, script 引入需要先引入 cesium 和 three
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Universe;
}
else {
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return Universe;
    });
  }
  else {
    window.Universe = Universe;
  }
}
// (function (global, factory) {
// 	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
// 	typeof define === 'function' && define.amd ? define(['exports'], factory) :
// 	(global = global || self, factory(global.Universe = {}));
// }(this, (function (exports) { 
//   'use strict';
//   // code 
// })))
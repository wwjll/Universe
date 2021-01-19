function getHeight(obj) {
  // 求解 threeObj 在 y 方向上的长度
  // 用于 物体局部坐标系转换, 保证绕 X 轴旋转 90 度后底部处于 Z 平面上
  vertices = obj.geometry.vertices
  let y_arr = vertices.reduce((prev, cur) => {

    prev.push(cur.y)
    return prev
    
  }, [])
  
  let ymax = y_arr.sort((a, b) => { return a - b})[y_arr.length - 1]
  let ymin = y_arr.sort((a, b) => { return b - a})[y_arr.length - 1]
  let scaleY = obj.scale.y

  return Math.abs(ymax - ymin) * scaleY
}


function Universe() {
  // 同步器列表, 
  this.syncList = []
  this._threeObjs = []
}
Object.assign(Universe.prototype, {

  collide: function() {
    return new Promise((resolve, reject) => {
      three = Object.create(null)
      cesium = Object.create(null)
  
      three.scene = new THREE.Scene()
      three.camera = new THREE.PerspectiveCamera(
        fov = 45, 
        aspect = window.innerWidth / window.innerHeight, 
        near = 1, 
        far = 10 * 1000 * 1000
      )
  
      let ThreeContainer = document.getElementById("ThreeContainer")
      let canvas = document.createElement( 'canvas' )
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      let context = canvas.getContext( 'webgl2', { 
        alpha: true,
        antialias: true 
      })
      three.renderer = new THREE.WebGLRenderer({ 
        canvas: ThreeContainer,
        context: context
      })
  
      ThreeContainer.appendChild(canvas)
      // 
      cesium.viewer = function() {
        return new Cesium.Viewer('cesiumContainer', {
            animation: false,       //是否显示动画控件
            homeButton: false,       //是否显示home键
            geocoder: false,         //是否显示地名查找控件        如果设置为true，则无法查询
            baseLayerPicker: false, //是否显示图层选择控件
            timeline: false,        //是否显示时间线控件
            fullscreenButton: true, //是否全屏显示
            scene3DOnly: true,     //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
            infoBox: true,         //是否显示点击要素之后显示的信息
            sceneModePicker: false,  //是否显示投影方式控件  三维/二维
            navigationInstructionsInitiallyVisible: false,
            navigationHelpButton: false,     //是否显示帮助信息控件
            selectionIndicator: false,        //是否显示指示器组件
            imageryProvider: new Cesium.UrlTemplateImageryProvider({
              url: 'http://localhost:9000/image/519ed030403c11eb88ad417b15d3ec62/{z}/{x}/{y}'
            }),
            fullscreenElement: 'cesiumContainer'
          });
      }()
  
      this.three = three
      this.cesium = cesium
      // this._3dObjects = []
      // 
      resolve({ cesium, three })
    })
  },

  // createCesiumObject: 
  cartToVec: function(cart) {
    return new THREE.Vector3(cart.x, cart.y, cart.z)
  },

  modifyThreeObj: function(mesh, boundary, autoAdd) {
    // 保证转换后的 mesh 坐标在 cesium 球面以上
    mesh.position.z += getHeight(mesh)
    mesh.rotateX(Math.PI / 2)
    mesh.boundary = boundary
    this._threeObjs.push(mesh)
    if (autoAdd) {
      this.three.scene.add(mesh)
    }
    return mesh

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
      cesium.viewer.camera.flyTo({
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

  syncThreeObj: function(mesh, offset) {
    // 同步 threeObj 自身的坐标系
    let { minWGS84, maxWGS84 } = mesh.boundary

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
    // 方位校准
    mesh.position.copy(center)
    // if(THREE.REVISION > )
    // mesh.lookAt(rangeNorm)
    mesh.lookAt(rangeNorm.x, rangeNorm.y, rangeNorm.z)
    mesh.up.copy(latDir)
    console.log(mesh)
    if (offset) {
      // 在 球面 划定 区域内偏移
      let { lng, lat } = offSet
      let cart3 = Cesium.Cartesian3.fromDegrees(lng, lat)
      mesh.position.set(cart3.x, cart3.y, cart3.z)
    }
  },

  syncThree: function() {
    const { three, cesium } = this
    const _this = this
    console.log()
    // 同步 threeObj 自身的坐标系
    this._threeObjs.forEach( mesh => _this.syncThreeObj(mesh) )
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

    three.camera.updateProjectionMatrix()
    let ThreeContainer = document.getElementById("ThreeContainer")
    let width = ThreeContainer.clientWidth
    let height = ThreeContainer.clientHeight
    let aspect = width / height
    three.camera.aspect = aspect
    three.camera.updateProjectionMatrix()

    three.renderer.setSize(width, height)
    three.renderer.clear()
    three.renderer.render(three.scene, three.camera)
  },


  renderLoop: function() {
    this.cesium.viewer.render()
    this.syncThree()
    requestAnimationFrame(this.renderLoop).bind(this)
  }
  
})

// demo 
let U = new Universe()
U.collide().then(data => {
  // console.log(data)

  // boundaries in WGS84 around the object
  let boundary = {
    minWGS84: [115.23, 39.55],
    maxWGS84: [116.23, 41.55]
  }

  U.createPlane(boundary, true)
  
  // 创建 threeObj

  let doubleSideMaterial = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide
  })
  let segments = 10
  let points = []
  for (let i = 0; i < segments; i++) {
    points.push(new THREE.Vector2(Math.sin(i * 0.2) * segments + 5, (i - 5) * 2))
  }
  let geometry = new THREE.LatheGeometry(points)
  let latheMesh = new THREE.Mesh(geometry, doubleSideMaterial)
  latheMesh.scale.set(1500, 1500, 1500)
  latheMesh = U.modifyThreeObj(latheMesh, boundary)

  // 
  console.log(U)
  U.renderLoop()
})
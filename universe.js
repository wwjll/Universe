function getHeight(obj) {
  // 求解 threeObj 在 y 方向上的小于 0 的部分的长度
  
  vertices = obj.geometry.vertices
  let y_arr = vertices.reduce((prev, cur) => {

    prev.push(cur.y)
    return prev
    
  }, [])
  
  let y_max = y_arr.sort((a, b) => { return a - b})[y_arr.length - 1]
  let y_min = y_arr.sort((a, b) => { return b - a})[y_arr.length - 1]
  let scale_y = obj.scale.y
  // 物体实际高度
  let height = Math.abs(y_max - y_min) * scale_y
  // 获得 y 切面最小的值, 该值如果小于 0, 则证明该几何体部分位于原点以下, 需要抬升相应的高度
  let y_diff = y_min < 0 ? Math.abs(y_min) * scale_y : 0

  return y_diff
}

function Universe() {
  this._threeGroups = []
  this.ThreeContainer = document.getElementById("ThreeContainer")
}
Object.assign(Universe.prototype, {

  collide: function() {
    console.warn(THREE.REVISION)
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
  
      let canvas = document.createElement( 'canvas' )
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      let context = canvas.getContext( 'webgl2', { 
        alpha: true,
        antialias: true 
      })
      three.renderer = new THREE.WebGLRenderer({ 
        canvas: this.ThreeContainer,
        context: context
      })
  
      this.ThreeContainer.appendChild(canvas)
      // 
      cesium.viewer = function() {
        return new Cesium.Viewer('cesiumContainer', {
            alpha: false,
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
      // 预先同步一些属性
      three.camera.fov = Cesium.Math.toDegrees(cesium.viewer.camera.frustum.fovy)
      this.three = three
      this.cesium = cesium
      // 
      resolve({ cesium, three })
    })
  },

  // createCesiumObject: 
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
    // axes.position.y += 5000
    group.add(axes)
    console.log(axes.position)

    group.center = center
    // 基平面法向量
    group.rangeNorm = rangeNorm
    group.latDir = latDir
    this._threeGroups.push(group)
    this.three.scene.add(group)
    return group
  },
  modifyThreeObj: function(mesh, group) {
    // 保证转换后的 mesh 坐标在 cesium 球面以上
    console.log(getHeight(mesh))
    // 由于旋转后将 y 轴作为球面法向量, 此时几何体地
    mesh.position.y += getHeight(mesh)
    console.log(mesh.geometry)
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

  syncGroup: function(group, offset) {
    // 物体局部基坐标系永远朝向球心
    let { center, rangeNorm, latDir } = group
    // 先平移
    group.position.copy(center)
    // 再旋转
    group.lookAt(rangeNorm.x, rangeNorm.y, rangeNorm.z)
    // 旋转基坐标使得 y 轴为上
    group.rotateX(Math.PI / 2)
    // 最后调整偏移(也是一次旋转)
    group.up.copy(latDir)

    if (offset) {
      // 在 球面 划定 区域内偏移
      // TODO: need to be test
      let { lng, lat } = offSet
      let cart3 = Cesium.Cartesian3.fromDegrees(lng, lat)
      group.position.set(cart3.x, cart3.y, cart3.z)
    }
  },

  syncThree: function() {
    const _this = this
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
    // console.log(Object.getOwnPropertyNames(this))
    requestAnimationFrame(this.renderLoop.bind(this))
    this.cesium.viewer.render()
    this.syncThree()
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
  
  // 根据边界创建 基坐标
  let group = U.createGroup(boundary)
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
  window.mesh = latheMesh
  latheMesh.scale.set(500, 500, 500)
  U.modifyThreeObj(latheMesh, group)
  // 帧更新
  U.renderLoop()
})
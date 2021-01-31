// 支持标签引入
if (typeof(require) === 'function' && global === global) {
  require('./CesiumThree.css')
  global.Universe = require('./Core/Universe')
  global.Cesium = require('cesium/Cesium')
  global.THREE = require('three/build/three')
  require( 'three/examples/js/loaders/GLTFLoader')
}

// 
function createLatheMesh(group, U) {
  let doubleSideMaterial = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide
  })
  doubleSideMaterial.wireframe = true
  let segments = 10
  let points = []
  for (let i = 0; i < segments; i++) {
    points.push(new THREE.Vector2(Math.sin(i * 0.2) * segments + 5, (i - 5) * 2))
  }
  let geometry = new THREE.LatheGeometry(points)
  let latheMesh = new THREE.Mesh(geometry, doubleSideMaterial)
  latheMesh.material.wireframe = true
  latheMesh.scale.set(500, 500, 500)
  U.modifyThreeObj(latheMesh, group, { x: 15000, z: 15000 })
}

function createThreeScene(group, U) {
  let loader = new THREE.GLTFLoader()
  loader.load('http://localhost:3000/models/harbor.glb', function(data) {
    let modelGroup = data.scene
    let animation = data.animation
    let cameras = data.cameras
    group.scale.set(500 , 500, 500)
    group.add(modelGroup)
    console.log(modelGroup)
  })
}
//
let U = new Universe()
U.collide().then(data => {
  // boundaries in WGS84 around the object
  let boundary = {
    minWGS84: [115.23, 39.55],
    maxWGS84: [116.23, 41.55]
  }

  U.createPlane(boundary, true)
  // 根据边界创建 基坐标
  let group = U.createGroup(boundary)
  createLatheMesh(group, U)
  // 
  createThreeScene(group, U)
  // 帧更新
  U.renderLoop()
})
// 支持标签引入
if (typeof(require) === 'function' && global === global) {
  require('./CesiumThree.css')
  global.Universe = require('./Core/Universe')
  global.Cesium = require('cesium/Cesium')
  global.THREE = require('three/build/three')
  global.createPerlinFire = require('./ThreeEffects/PerlinFire/index')
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

//
let U = new Universe()
U.collide().then(data => {
  // boundaries in WGS84 around the object
  // let boundary = {
  //   minWGS84: [115.23, 39.55],
  //   maxWGS84: [116.23, 41.55]
  // }
  let boundary = {
    minWGS84:           [
      109.9072265625,
      -69.97549253616161
    ],
    maxWGS84:           [
      112.1044921875,
      -70.32613725493573
    ]
  }
  U.createPlane(boundary, true)
  // 根据边界创建 基坐标
  let group = U.createGroup(boundary)
  createLatheMesh(group, U)
  // 火焰动画
  let perlinFire = createPerlinFire(group)
  U.addAnimation(function() {
    perlinFire.material.uniforms[ 'time' ].value += .0025
  })
  // 帧更新
  U.renderLoop()
})
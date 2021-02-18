// 支持标签引入
if (typeof require === "function" && global === global) {
  require("./CesiumThree.css")
  global.THREE = require("three/build/three")
  require("three/examples/js/loaders/GLTFLoader")
  require("three/examples/js/loaders/DRACOLoader")
  require("three/examples/js/controls/OrbitControls")
  require("three/examples/js/libs/stats.min")
  require("three/examples/js/libs/dat.gui.min")
  require("three/examples/js/controls/DragControls")
  require("three/examples/js/controls/TransformControls")
}
//
let mixer

const clock = new THREE.Clock()
const container = document.getElementById("ThreeContainer")

const stats = new Stats()
container.appendChild(stats.dom)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xbfe3dd)

const axis = new THREE.AxesHelper(5)
scene.add(axis)

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  1,
  100
)
camera.position.set(5, 2, 8)

const controls = new THREE.OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.5, 0)
controls.update()
controls.enablePan = false
controls.enableDamping = true

scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.4))

const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(5, 2, 8)
scene.add(dirLight)

// envmap
const path = "http://localhost:3000/images/"
const format = ".jpg"
const envMap = new THREE.CubeTextureLoader().load([
  path + "posx" + format,
  path + "negx" + format,
  path + "posy" + format,
  path + "negy" + format,
  path + "posz" + format,
  path + "negz" + format,
])

const dracoLoader = new THREE.DRACOLoader()
dracoLoader.setDecoderPath("http://localhost:3000/models/")

const loader = new THREE.GLTFLoader()

function spaceDecompose() {
  let xNum = 20
  let yNum = 20
  let zNum = 20
  let xMax = Math.ceil(xNum / 2)
  let xMin = -Math.floor(xNum / 20)
  let yMax = Math.ceil(yNum / 2)
  let yMin = -Math.floor(yNum / 20)
  let zMax = Math.ceil(zNum / 2)
  let zMin = -Math.floor(zNum / 20)
  let xLen = 10
  let yLen = 10
  let zLen = 10
  let xSize = xNum / xLen / 10
  let ySize = yNum / yLen / 10
  let zSize = zNum / zLen / 10
  for (let x = 0; x < xNum; x++) {
    for (let y = 0; y < yNum; y++) {
      for (let z = 0; z < zNum; z++) {
        let cube = new THREE.Mesh(
          new THREE.BoxGeometry(xSize, ySize, zSize),
          new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.9,
            wireframe: false,
          })
        )
        let cubeX = xMin + xSize * 1.5 * x
        let cubeY = yMin + ySize * 1.5 * y
        let cubeZ = zMin + zSize * 1.5 * z
        cube.position.set(cubeX, cubeY, cubeZ)
        scene.add(cube)
      }
    }
  }
}

function addCamera() {
  let camera = new THREE.PerspectiveCamera(45, 2, 1, 100)
  camera.position.set(new THREE.Vector3(0, 0.2, 0))
  scene.add(camera)
}

// 添加拖拽控件
function initDragControls() {
  // 添加平移控件
  var transformControls = new THREE.TransformControls(
    camera,
    renderer.domElement
  )
  scene.add(transformControls)

  // 过滤不是 Mesh 的物体,例如辅助网格对象
  var objects = []
  for (let i = 0; i < scene.children.length; i++) {
    if (scene.children[i].isMesh) {
      objects.push(scene.children[i])
    }
  }
  // 初始化拖拽控件
  var dragControls = new THREE.DragControls(
    objects,
    camera,
    renderer.domElement
  )

  // 鼠标略过事件
  dragControls.addEventListener("hoveron", function (event) {
    // 让变换控件对象和选中的对象绑定
    transformControls.attach(event.object)
  })
  // 开始拖拽
  dragControls.addEventListener("dragstart", function (event) {
    controls.enabled = false
  })
  // 拖拽结束
  dragControls.addEventListener("dragend", function (event) {
    controls.enabled = true
  })
}

loader.setDRACOLoader(dracoLoader)
loader.load(
  "http://localhost:3000/models/LittlestTokyo.glb",
  function (gltf) {
    const model = gltf.scene
    model.position.set(1, 1, 0)
    model.scale.set(0.01, 0.01, 0.01)
    model.traverse(function (child) {
      if (child.isMesh) child.material.envMap = envMap
    })

    scene.add(model)

    mixer = new THREE.AnimationMixer(model)
    mixer.clipAction(gltf.animations[0]).play()
    //
    // spaceDecompose();

    //
    // addCamera()
    // initDragControls()

    animate()
  },
  undefined,
  function (e) {
    console.error(e)
  }
)

window.onresize = function () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()

  mixer.update(delta)

  controls.update()

  stats.update()

  renderer.render(scene, camera)
}

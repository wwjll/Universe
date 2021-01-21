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

let material
function fire(group){
  const vertexShader = 
    `
    //
    // GLSL textureless classic 3D noise "cnoise",
    // with an RSL-style periodic variant "pnoise".
    // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
    // Version: 2011-10-11
    //
    // Many thanks to Ian McEwan of Ashima Arts for the
    // ideas for permutation and gradient selection.
    //
    // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
    // Distributed under the MIT license. See LICENSE file.
    // https://github.com/ashima/webgl-noise
    //

    vec3 mod289(vec3 x)
    {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x)
    {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x)
    {
        return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r)
    {
        return 1.79284291400159 - 0.85373472095314 * r;
    }

    vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
    }
    

    // Classic Perlin noise, periodic variant
    float pnoise(vec3 P, vec3 rep)
    {
    vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
    }

    // Include the Ashima code here!

    varying vec2 vUv;
    varying float noise;
    uniform float time;

    float turbulence( vec3 p ) {
    // float w = 100.0;
    float t = -.5;
    for (float f = 1.0 ; f <= 10.0 ; f++ ){  // 凸起的数量
        float power = pow( 2.0, f );
        t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
    }
    return t;
    }

    void main() {

    vUv = uv;

    noise = 10.0 *  -.10 * turbulence( .5 * normal + time );
    float b = 5.0 * pnoise( 0.05 * position + vec3( 2.0 * time ), vec3( 100.0 ) );
    float displacement = - 10. * noise + b;

    // float displacement = - 10. * noise + time; // 波浪起伏度

    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

    }
    `
  const fragmentShader = 
  `
    varying vec2 vUv;
    varying float noise;
    uniform sampler2D tExplosion;
    // uniform float time;

    float random( vec3 scale, float seed ){
    return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;
    }

    void main() {

    float r = .01 * random( vec3( 12.9898, 78.233, 151.7182 ), 0.0 );
    vec2 tPos = vec2( 0, 1.3 * noise + r );
    vec4 color = texture2D( tExplosion, tPos );
    gl_FragColor = vec4( color.rgb, 1.0 );

    }
  `

  const texture = new THREE.TextureLoader().load('texture.webp')
  // 创建一个 shader 材质
  material = new THREE.ShaderMaterial({
      uniforms: {
          tExplosion: {
              type: "t",
              value: texture
          },
          time: {
              type: "f",
              value: 0.0
          }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
  })
  
  // 创建一个球体并贴上材质
  mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(20, 4 ),
      material
  )
  mesh.scale.set(500, 500, 500)
  mesh.position.y += getHeight(mesh)
  group.add(mesh)
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

    group.center = center
    // 基平面法向量
    group.rangeNorm = rangeNorm
    group.latDir = latDir
    this._threeGroups.push(group)
    this.three.scene.add(group)
    return group
  },
  modifyThreeObj: function(mesh, group, offset) {
    // 保证转换后的 mesh 坐标在 cesium 球面以上
    console.log(getHeight(mesh))
    // 由于旋转后将 y 轴作为球面法向量, 此时几何体地
    mesh.position.y += getHeight(mesh)
    if (offset) {
      // 在 球面 划定 区域内偏移
      // TODO: need to be test
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

  syncGroup: function(group) {
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
    requestAnimationFrame(this.renderLoop.bind(this))
    this.cesium.viewer.render()
    this.syncThree()
    try {
      if(!material) return
      material.uniforms[ 'time' ].value += .0025
    } catch(e) {
      console.log(e)
    }
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
  // 
  U.modifyThreeObj(latheMesh, group, { x: 15000, z: 15000 })
  //
  try {
    fire(group)
  } catch (e) {
    console.log(e)
  }
  // 帧更新
  U.renderLoop()
})
// 支持标签引入
if (typeof require === "function" && global === global) {
  require("./CesiumThree.css")
  require("cesium/Cesium")
  require('axios')
}

const { 
  Cartesian3, PolygonGeometry, PolygonHierarchy, PolygonOutlineGeometry, PolygonGraphics,
  EllipsoidSurfaceAppearance, Primitive, GeometryInstance, Color, Material, PrimitiveCollection
} = Cesium
 
const resource = 'http://localhost:3000/'
function Water(viewer) {
  this.water_PrimitiveCollection = new PrimitiveCollection()
  viewer.scene.primitives.add(this.water_PrimitiveCollection)
}

Object.assign(Water.prototype, {
  // 加载 geojson 数据并解析
  addWaterRegion: function (waterDataUrl) {
    axios.get(waterDataUrl).then((json) => {
      json.data.features.forEach((item) => {
        // 解析 MultiPolygon 点位
        // let lnglat = item.geometry.coordinates[0][0]
        // 解析 Polygon 点位
        let lnglat = item.geometry.coordinates[0]
        lnglat = lnglat.reduce((prev, cur) => {
          prev.push(Cartesian3.fromDegrees(...cur))
          return prev
        }, [])
        let polygon = new PolygonGeometry({
          outline: true,
          extrudedHeight: 15,
          polygonHierarchy: new PolygonHierarchy(lnglat),
          perPositionHeight: true,
          vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        })
        let river = new Primitive({
          geometryInstances: new GeometryInstance({
            geometry: polygon,
          }),
          appearance: new EllipsoidSurfaceAppearance({
            aboveGround: true,
          }),
          show: true,
        })
        /* eslint-disable */
        river.appearance.material = new Material({
          fabric: {
            type: "Water",
            uniforms: {
              // baseWaterColor: Color.fromCssColorString("rgba(3, 38, 49, 0.5)"),
              // baseWaterColor: Color.fromCssColorString("#173737"),
              baseWaterColor: Cesium.Color.AQUA.withAlpha(0.3),
              normalMap: resource + "/images/waterNormalsSmall.jpg",
              frequency: 1000.0,
              animationSpeed: 0.005,
              amplitude: 10.0,
              specularIntensity: 5,
            },
          },
        })
        river.type = "water"
        this.water_PrimitiveCollection.add(river)
      })
    })
  },
  remove() {
    /*
    * cesium 中 PrimitiveCollection 在删除过程中会实时改变 length,因此循环下标需要动态改变
    * eg:
    *  for (let i = 0; i < primitives.length; i++) {
    *    primitives.remove(primitives.get(i))
    *    i--
    *  }
    * 由于 dataSource 里的元素会在渲染前计算到 viewer.scene.primitives 里
    * 因此操作 primitive 对象更好的管理方式是根据需要新建一个 collection 来进行管理
    */
    // 
    let p = this.viewer.scene.primitives
    let w = this.water_PrimitiveCollection
    p.remove(w)
  }
})
// 
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = Water
} else {
  if (typeof define === "function" && define.amd) {
    define([], function () {
      return Water
    })
  } else {
    window.Water = Water
  }
}
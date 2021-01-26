# CesiumThreejs.Demo

项目参考博客 (https://cesium.com/blog/2017/10/23/integrating-cesium-with-threejs/)
封装了一个类来同步 threejs 和 cesiumjs 渲染器
说明: 
three 版本 r87 前后分别只需要更改代码中 LookAt 位置, 参数分别为(vector) 和 (x, y, z)


清除控制台关于卫星底图的加载信息：
1.node_modules/cesium/Source/Core/TileProviderError 
148 行增加：
if (provider.constructor.name === 'UrlTemplateImageryProvider') return

2.

原理:
1. 根据 wgs84 经纬度创建一个范围
2. 同步相机 fov 角度, 创建 three Mesh， 抬高 y 方向使得其处于 cesium Z = 0 球面之上
3. 创建一个 three 基坐标(THREE.Group)
4. 每帧更新基座标的 原点, 朝向, 调整基坐标 up 方向与范围平行
5. 每帧更新 three 相机的 view 矩阵 (matrixWordInverse) 和其逆矩阵 （matrixWorld)


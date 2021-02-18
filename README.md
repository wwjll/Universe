
## Universe 类说明: 
封装了一个类来同步 threejs 和 cesiumjs 渲染器
实现参考博客 (https://cesium.com/blog/2017/10/23/integrating-cesium-with-threejs/)
three 版本 r87 前后分别只需要更改代码中 LookAt 位置, 参数分别为 (vector) 和 (x, y, z)

原理:
1. 根据 wgs84 经纬度创建一个范围
2. 同步相机 fov 角度, 创建 three Mesh， 抬高 y 方向使得其处于 cesium Z = 0 球面之上
3. 创建一个 three 基坐标(THREE.Group)
4. 每帧更新基座标的 原点, 朝向, 调整基坐标 up 方向与范围平行
5. 每帧更新 three 相机的 view 矩阵 (matrixWordInverse) 和其逆矩阵 （matrixWorld)


## Tips
### 1.清除控制台关于卫星底图的加载信息：</br>
1.node_modules/cesium/Source/Core/TileProviderError 
148 行增加：
```
if (provider.constructor.name === 'UrlTemplateImageryProvider') return
```
2.控制台 devtool 里使用过滤器过滤 ```console.error``` 信息或 使用定时器执行 
```console.clear()``` 来清空

## 2.例子程序
### 启动：
1. 进入 Assets 目录下启动静态资源服务器
  ```http-server --cors -p 3000 ```
src/demos 里的项目在 npm i 后即可在 vscode 里用 live-server 打开 html </br>


## History
### 2021.01.28: 



if (typeof(require) === 'function' && global === global) {
  global.Utils = require('./Utils')
} else {
  getSpaceDistance = Utils.getSpaceDistance
}

const Measure = {
  // 直线距离测量
  measureDistance: function() {
    // 取消双击事件-追踪该位置
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var poly = null;
    // var tooltip = document.getElementById("toolTip");
    var distance = 0;
    var cartesian = null;
    var floatingPoint;
    // tooltip.style.display = "block";

    handler.setInputAction(function (movement) {
      // tooltip.style.left = movement.endPosition.x + 3 + "px";
      // tooltip.style.top = movement.endPosition.y - 25 + "px";
      // tooltip.innerHTML = '<p>单击开始，右击结束</p>';
      // cartesian = viewer.scene.pickPosition(movement.endPosition);
      let ray = viewer.camera.getPickRay(movement.endPosition);
      cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (positions.length >= 2) {
        if (!Cesium.defined(poly)) {
          poly = new PolyLinePrimitive(positions);
        } else {
          positions.pop();
          // cartesian.y += (1 + Math.random());
          positions.push(cartesian);
        }
        distance = getSpaceDistance(positions);
        // console.log("distance: " + distance);
        // tooltip.innerHTML='<p>'+distance+'米</p>';
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function (movement) {
      // tooltip.style.display = "none";
      // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      // cartesian = viewer.scene.pickPosition(movement.position);
      let ray = viewer.camera.getPickRay(movement.position);
      cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (positions.length == 0) {
        positions.push(cartesian.clone());
      }
      positions.push(cartesian);
      //在三维场景中添加Label
      //   var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      var textDisance = distance + "米";
      // console.log(textDisance + ",lng:" + cartographic.longitude/Math.PI*180.0);
      floatingPoint = viewer.entities.add({
        name: '空间直线距离',
        // position: Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180,cartographic.height),
        position: positions[positions.length - 1],
        point: {
          pixelSize: 5,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: textDisance,
          font: '18px sans-serif',
          fillColor: Cesium.Color.GOLD,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(20, -20),
        }
      });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function (movement) {
      handler.destroy(); //关闭事件句柄
      positions.pop(); //最后一个点无效
      // viewer.entities.remove(floatingPoint);
      // tooltip.style.display = "none";

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    var PolyLinePrimitive = (function () {
      function _(positions) {
        this.options = {
          name: '直线',
          polyline: {
            show: true,
            positions: [],
            material: Cesium.Color.CHARTREUSE,
            width: 10,
            clampToGround: true
          }
        };
        this.positions = positions;
        this._init();
      }

      _.prototype._init = function () {
        var _self = this;
        var _update = function () {
          return _self.positions;
        };
        //实时更新polyline.positions
        this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
        viewer.entities.add(this.options);
      };

      return _;
    })();
  },
  measureArea: function() {
    // 区域面积测量
  },
  measureVolume: function() {
    // TODO
  }
}


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Measure;
}
else {
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return Measure;
    });
  }
  else {
    window.Measure = Measure;
  }
}
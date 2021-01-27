const Measure = {
  measureDistance: function() {
    // 直线距离测量
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
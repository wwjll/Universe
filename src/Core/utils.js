module.exports = {
  getHeight: function (obj) {
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
  
}
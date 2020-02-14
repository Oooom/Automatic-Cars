function is_within_polygon(polygon, point) {
    var t1 = true
    var t2 = true

    var a, b, c, d;

    for (var i = 0; i < polygon.length; i++) {
        var p1 = polygon[i]
        var p2 = polygon[(i + 1) % polygon.length]
        
        a = -(p2.z - p1.z)
        b = p2.x - p1.x
        c = -(a * p1.x + b * p1.z)

        var d = a * point.x + b * point.z + c

        if(t1){
            t1 = d >= 0
        }

        if(t2){
            t2 = d <= 0
        }
    }

    return t1 || t2
}

// function is_within_polygon(polygon, point){
//     var A = []
//     var B = []
//     var C = []
//     var D = []
    
//     for(var i = 0; i < polygon.length; i++){
//         var p1 = polygon[i]
//         var p2 = polygon[(i + 1) % polygon.length]

//         // calculate A, B and C
//         a = -(p2.z - p1.z)
//         b = p2.x - p1.x
//         c = -(a * p1.x + b * p1.z)

//         A.push(a)
//         B.push(b)
//         C.push(c)
//     }

//     for (var i = 0; i < A.length; i++){
//         var d = A[i] * point.x + B[i] * point.z + C[i]
//         D.push(d)
//     }

//     t1 = D.every( (d)=> d >= 0 )
//     t2 = D.every( (d)=> d <= 0 )
    
//     return t1 || t2
// }
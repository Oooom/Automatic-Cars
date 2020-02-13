function is_within_polygon(polygon, point){
    var A = []
    var B = []
    var C = []
    for(var i = 0; i < polygon.length; i++){
        var p1 = polygon[i]
        var p2 = polygon[(i + 1) % polygon.length]

        // calculate A, B and C
        a = -(p2.z - p1.z)
        b = p2.x - p1.x
        c = -(a * p1.x + b * p1.z)

        A.push(a)
        B.push(b)
        C.push(c)
    }

    var D = []
    for (var i = 0; i < A.length; i++){
        var d = A[i] * point.x + B[i] * point.z + C[i]
        D.push(d)
    }

    t1 = D.every( (d)=> d >= 0 )
    t2 = D.every( (d) => d <= 0 )
    
    return t1 || t2
}


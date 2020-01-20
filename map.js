var WALL_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide
})

var CHECKPOINT_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xa0a0fa,
    side: THREE.DoubleSide
})

function Map(start_pt, deg, width) {
    this.walls = []
    this.wallHeight = 2

    this.checkpoints = []
    this.checkpointHeight = 0.5

    this.width = width

    var tmpRotMat = new THREE.Matrix4()
    tmpRotMat.makeRotationFromEuler(new THREE.Euler(0, to_radians(deg), 0))

    
    var tmpRay = []

    //left
    tmpRay.push({
        p1: new THREE.Vector3(start_pt.x - width / 2, 0, start_pt.z + width / 2),
        p2: new THREE.Vector3(start_pt.x - width / 2, 0, start_pt.z - width / 2),
    })
    //bottom
    tmpRay.push({
        p1: new THREE.Vector3(start_pt.x - width / 2, 0, start_pt.z + width / 2),
        p2: new THREE.Vector3(start_pt.x + width / 2, 0, start_pt.z + width / 2),
    })
    //top
    tmpRay.push({
        p1: new THREE.Vector3(start_pt.x - width / 2, 0, start_pt.z - width / 2),
        p2: new THREE.Vector3(start_pt.x + width / 2, 0, start_pt.z - width / 2),
    })

    for (var i = 0; i < tmpRay.length; i++){
        tmpRay[i].p1.applyMatrix4(tmpRotMat)
        tmpRay[i].p2.applyMatrix4(tmpRotMat)

        this.walls.push(new Wall(tmpRay[i].p1, tmpRay[i].p2, this.wallHeight))
    }

    this.leftCursor = this.walls[1].p2.clone()
    this.rightCursor = this.walls[2].p2.clone()

    //map creation helpers
    this.extendRoute = function(x1, z1, x2, z2){
        
        this.extendLeftCursor(x1, z1)
        this.extendRightCursor(x2, z2)

        return this
    }

    this.extendLeftCursor = function(x, z){
        this.walls.push(
            new Wall(
                new THREE.Vector3(this.leftCursor.x, 0, this.leftCursor.z),
                new THREE.Vector3(this.leftCursor.x + x, 0, this.leftCursor.z + z),
                this.wallHeight
            )
        )

        this.leftCursor.x += x
        this.leftCursor.z += z

        return this
    }

    this.extendRightCursor = function(x, z){
        this.walls.push(
            new Wall(
                new THREE.Vector3(this.rightCursor.x, 0, this.rightCursor.z),
                new THREE.Vector3(this.rightCursor.x + x, 0, this.rightCursor.z + z),
                this.wallHeight
            )
        )

        this.rightCursor.x += x
        this.rightCursor.z += z

        return this
    }

    this.extendRouteTurnRight = function(currentDir){        
        
        switch (currentDir){
            case "N":
                    this.extendRightCursor(0, -this.width)
                    this.extendRightCursor(this.width, 0)

                break

            case "S":
                    this.extendRightCursor(0, this.width)
                    this.extendRightCursor(-this.width, 0)

                break

            case "W":
                    this.extendRightCursor(-this.width, 0)
                    this.extendRightCursor(0, -this.width)

                break

            case "E":
                    this.extendRightCursor(this.width, 0)
                    this.extendRightCursor(0, this.width)

                break

            default:
                throw new Error("Unknown Direction")
        }
    }

    this.extendRouteTurnLeft = function (currentDir) {

        switch (currentDir) {
            case "N":
                this.extendLeftCursor(0, -this.width)
                this.extendLeftCursor(-this.width, 0)

                break

            case "S":
                this.extendLeftCursor(0, this.width)
                this.extendLeftCursor(this.width, 0)

                break

            case "W":
                this.extendLeftCursor(-this.width, 0)
                this.extendLeftCursor(0, this.width)

                break

            case "E":
                this.extendLeftCursor(this.width, 0)
                this.extendLeftCursor(0, -this.width)

                break

            default:
                throw new Error("Unknown Direction")
        }
    }

    this.extendRouteStraight = function (units, current_dir){
        switch(current_dir){
            case "E":
                    this.extendRoute(units, 0, units, 0)
                break

            case "W":
                    this.extendRoute(-units, 0, -units, 0)
                break

            case "N":
                    this.extendRoute(0, -units, 0, -units)
                break

            case "S":
                    this.extendRoute(0, units, 0, units)
                break

            default:
                throw new Error("Unknown Direction")
        }
    }

    //checkpoint creation
    this.addCheckpointAtCursor = function(){
        this.checkpoints.push(new Wall(
            new THREE.Vector3(this.leftCursor.x, 0, this.leftCursor.z),
            new THREE.Vector3(this.rightCursor.x, 0, this.rightCursor.z),
            this.checkpointHeight,
            CHECKPOINT_MATERIAL
        ))
    }

    //collision helpers
    this.checkCollisions = function(vehicles){
        for(var vehicleNo of vehicles){
            if(this.checkCollisionForVehicle(CarsBatcher.car_batch[vehicleNo])){
                CarsBatcher.car_batch[vehicleNo].dead()
            }
        }
    }

    this.checkCollisionForVehicle = function(vehicle){
        var bps = vehicle.getBoundingPoints()
        var sensorState = [0, 0, 0, 0]
        var isDead = false

        for(var wall of this.walls){

            //checking for collision with wall
            for(var i = 0; i < bps.length; i++){
                var line = {
                    p1: bps[i],
                    p2: bps[ (i+1) % bps.length]
                }
    
                if(!isDead){
                    isDead = isIntersect(line, wall)
                }
            }

            if(isDead){
                break
            }

            //sensor collision checking
            for(var i = 0; i < vehicle.sensors.length; i++){
                var poi = lineLineIntersection(vehicle.sensors[i], wall)

                if(poi){
                    vehicle.sensors[i].collisionPoint.position.set(poi.x, vehicle.sensors[i].p1.y, poi.z)
                    
                    var x = poi.x - vehicle.sensors[i].p1.x                    
                    var z = poi.z - vehicle.sensors[i].p1.z

                    var distance = Math.sqrt(x*x+z*z)
                    sensorState[i] = distance
                }
            }

        }
        
        //checking for collision with checkpoint
        
        if (vehicle.lastCheckpointIndex < m.checkpoints.length - 1){
            var nextCheckpointForThisVehicle = m.checkpoints[vehicle.lastCheckpointIndex + 1]

            for (var i = 0; i < bps.length; i++) {
                var line = {
                    p1: bps[i],
                    p2: bps[(i + 1) % bps.length]
                }

                if ( isIntersect(line, nextCheckpointForThisVehicle) ){
                    vehicle.lastCheckpointIndex++
                    break
                }
            }
        }
        

        for (var i = 0; i < vehicle.sensors.length; i++) {
            if(sensorState[i] > 0){
                vehicle.sensors[i].startTrigger(sensorState[i])
            }else{
                vehicle.sensors[i].endTrigger()

                vehicle.sensors[i].collisionPoint.position.set(vehicle.sensors[i].p2.x, vehicle.sensors[i].p1.y, vehicle.sensors[i].p2.z)
            }
        }


        return isDead
    }
}

const _yAxisVec = new THREE.Vector3(0, 1, 0)

function Wall(p1, p2, height, material) {
    this.p1 = p1
    this.p2 = p2
    
    var x = p2.x - p1.x
    var z = p2.z - p1.z
    var length = Math.sqrt( x*x + z*z )

    if(length != 0){
        if(material === undefined){
            material = WALL_MATERIAL
        }

        this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(length, height), material)

        global.THREE.scene.add(this.mesh)
        this.mesh.position.set(p1.x + length/2, p1.y + height / 2, p1.z)

        var theta = Math.atan2(z, x)
        rotateAboutPoint(this.mesh, p1, _yAxisVec, -theta, true)
    }
}


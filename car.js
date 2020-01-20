// NOTE: 
//      getFitness of the car is directly bound with "m"
//      dead() is bound to population, generation and dead lists

var min_x = -1.6631166840592289
var max_x = 0
var min_y = -0.09261972741090421
var max_y = 0.06350142236672998
var min_z = -2.047034908834945
var max_z = 1.6576079261495047

var x_len = max_x - min_x
var y_len = max_y - min_y
var z_len = max_z - min_z


var CAR_SENSOR_TRANSFORMATION_MATRIX = new THREE.Matrix4()

var CAR_SENSOR_ROTATION_MATRICES = []

var degrees = [180, 0, 90, -90, 0, 45, -45]

for(var i = 0; i < degrees.length; i++){
    var m = new THREE.Matrix4()
    m.makeRotationFromEuler(new THREE.Euler(0, 0, to_radians(degrees[i])))

    CAR_SENSOR_ROTATION_MATRICES.push( m )    
}

var CAR_SENSOR_IDENTITY_MAT = new THREE.Matrix4()


var HALF_EXTENTS_CAR_DIM = new CANNON.Vec3(1.5, 1, 0.5)
var CAR_SENSOR_NOT_TRIGGERED_COLOR = 0xffff00
var CAR_SENSOR_TRIGGERED_COLOR = 0xff0000
var CAR_BODY_CHASSIS_SHAPE = new CANNON.Box(HALF_EXTENTS_CAR_DIM)
var CAR_SENSOR_POSITION_VECTOR = new THREE.Vector3()

var CAR_SENSOR_SIZE = 6.5


var MAX_STEER_VAL = 0.5;
var MAX_FORCE = 650;
var BRAKE_FORCE = 1000000;

var CAR_COLOR = 0x00FFFF
var CAR_OPACITY = 0
var CAR_HIGHLIGHT_COLOR = 0xFFC0CB
var CAR_HIGHLIGHT_OPACITY = 1


function CarWithSensors() {
    this.sensors = []
    this.lastCheckpointIndex = -1

    //to detect whether the car has crashed into the wall or not
    this.boundingPoints = [
        new THREE.Vector3(HALF_EXTENTS_CAR_DIM.x, HALF_EXTENTS_CAR_DIM.y, HALF_EXTENTS_CAR_DIM.z),
        new THREE.Vector3(HALF_EXTENTS_CAR_DIM.x, -HALF_EXTENTS_CAR_DIM.y, HALF_EXTENTS_CAR_DIM.z),
        new THREE.Vector3(-HALF_EXTENTS_CAR_DIM.x, -HALF_EXTENTS_CAR_DIM.y, HALF_EXTENTS_CAR_DIM.z),
        new THREE.Vector3(-HALF_EXTENTS_CAR_DIM.x, HALF_EXTENTS_CAR_DIM.y, HALF_EXTENTS_CAR_DIM.z)
        // new THREE.Vector3(HALF_EXTENTS_CAR_DIM.x, HALF_EXTENTS_CAR_DIM.y, -HALF_EXTENTS_CAR_DIM.z),
        // new THREE.Vector3(HALF_EXTENTS_CAR_DIM.x, -HALF_EXTENTS_CAR_DIM.y, -HALF_EXTENTS_CAR_DIM.z),
        // new THREE.Vector3(-HALF_EXTENTS_CAR_DIM.x, -HALF_EXTENTS_CAR_DIM.y, -HALF_EXTENTS_CAR_DIM.z),
        // new THREE.Vector3(-HALF_EXTENTS_CAR_DIM.x, HALF_EXTENTS_CAR_DIM.y, -HALF_EXTENTS_CAR_DIM.z)        
    ]
    var boundingPointsClone = []
    this.boundingPoints.forEach((value)=> { boundingPointsClone.push(value.clone()) })

    //sensors here
    for(var i = 0; i < CAR_SENSOR_ROTATION_MATRICES.length; i++){
        var sensor = new CarSensor(CAR_SENSOR_SIZE, 0, 0)
        sensor.setRotationMatrix(CAR_SENSOR_ROTATION_MATRICES[i])

        this.sensors.push(sensor)
    }

    //wheel options
    var options = {
        radius: 0.4,
        directionLocal: new CANNON.Vec3(0, 0, -1),
        suspensionStiffness: 30,
        suspensionRestLength: 0.3,
        frictionSlip: 5,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        maxSuspensionForce: 100000,
        rollInfluence: 0.01,
        axleLocal: new CANNON.Vec3(0, 1, 0),
        chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
        maxSuspensionTravel: 0.3,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true
    }

    this.mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(HALF_EXTENTS_CAR_DIM.x * 2, HALF_EXTENTS_CAR_DIM.y * 2, HALF_EXTENTS_CAR_DIM.z * 2),
        new THREE.MeshPhongMaterial({
            color: 0x00FFFF,
            transparent: true,
            opacity: CAR_OPACITY
        })
    )
    global.THREE.scene.add(this.mesh)

    this._wheelBodies = [];    
    this.resetBody = _resetBody

    this.tick = function () {
        for (var i = 0; i < this._vehicle.wheelInfos.length; i++) {
            this._vehicle.updateWheelTransform(i);
            var t = this._vehicle.wheelInfos[i].worldTransform;

            var wheelBody = this._wheelBodies[i];
            wheelBody.position.copy(t.position);
            wheelBody.quaternion.copy(t.quaternion);
        }

        for (var i = 0; i < this.sensors.length; i++) {
            this.sensors[i].tick(this.mesh)
        }
    }

    this.startTriggerToSensor = function (no) {
        this.sensors[no].startTrigger()
    }

    this.endTriggerToSensor = function (no) {
        this.sensors[no].endTrigger()
    }

    this.getBoundingPoints = function(){        
        for(var i = 0; i < this.boundingPoints.length; i++){
            boundingPointsClone[i].set(this.boundingPoints[i].x, this.boundingPoints[i].y, this.boundingPoints[i].z)

            boundingPointsClone[i].applyMatrix4(this.mesh.matrix)
        }

        return boundingPointsClone
    }

    this.getFitness = function(){        
        return (this.lastCheckpointIndex+1) / m.checkpoints.length 
    }


    //this is to be used only by the neural net
    // -ve goes ahead and +ve goes back
    this.applyEngineForce = function(force){
        this._vehicle.applyEngineForce(force, 2);
        this._vehicle.applyEngineForce(force, 3);
    }

    // -ve goes right and +ve goes left 
    this.turn = function(steerVal){
        this._vehicle.setSteeringValue(steerVal, 0);
        this._vehicle.setSteeringValue(steerVal, 1);
    }

    this.forward = function(end){
        this._vehicle.applyEngineForce(end ? 0 : -MAX_FORCE, 2);
        this._vehicle.applyEngineForce(end ? 0 : -MAX_FORCE, 3);
    }

    this.reverse = function (end){
        this._vehicle.applyEngineForce(end ? 0 : MAX_FORCE, 2);
        this._vehicle.applyEngineForce(end ? 0 : MAX_FORCE, 3);
    }

    this.brake = function(force){
        this._vehicle.setBrake(force, 0);
        this._vehicle.setBrake(force, 1);
        this._vehicle.setBrake(force, 2);
        this._vehicle.setBrake(force, 3);
    }

    this.turnRight = function (end){
        this._vehicle.setSteeringValue(end ? 0 : -MAX_STEER_VAL, 0);
        this._vehicle.setSteeringValue(end ? 0 : -MAX_STEER_VAL, 1);
    }

    this.turnLeft = function (end){
        this._vehicle.setSteeringValue(end ? 0 : MAX_STEER_VAL, 0);
        this._vehicle.setSteeringValue(end ? 0 : MAX_STEER_VAL, 1);
    }

    this.dead = function () {
        //so that the wheels and sensor meshes are not aage peeche wrt the vehicle
        this.mesh.position.set(this.body.position.x, this.body.position.y, this.body.position.z)
        this.tick()

        this.removeBodyAndVehicle()

        var car_no = CarsBatcher.car_batch.indexOf(this)
        population.splice(population.indexOf(car_no), 1)
    }

    this.removeBodyAndVehicle = function(){
        global.CANNON.world.remove(this.body)
        this._vehicle.removeFromWorld(global.CANNON.world)

        var obj = global.MeshBodyPairs.find((pair) => {
            return (pair.body == this.body && pair.mesh == this.mesh)
        })
        global.MeshBodyPairs.splice(global.MeshBodyPairs.indexOf(obj), 1)

        this.body = null
        this._vehicle = null
    }

    this.delete = function () {
        global.THREE.scene.remove(this.mesh)
        global.CANNON.world.remove(this.body)

        this._vehicle.removeFromWorld(global.CANNON.world)

        var obj = global.MeshBodyPairs.find((pair)=>{ 
            return (pair.body == this.body && pair.mesh == this.mesh)
        })
        global.MeshBodyPairs.splice(global.MeshBodyPairs.indexOf(obj), 1)

        var first_wheel_body = global.MeshBodyPairs.find((pair) => {
            return (pair.body == this._wheelBodies[0])
        })
        var wheel_start = global.MeshBodyPairs.indexOf(first_wheel_body)
        
        for(var i = wheel_start; i < wheel_start+4; i++){
            var pair = global.MeshBodyPairs[i]

            global.CANNON.world.removeBody(pair.body)
            global.THREE.scene.remove(pair.mesh)
        }

        global.MeshBodyPairs.splice(wheel_start, 4)

        for(var sensor of this.sensors){
            sensor.delete()
        }
    }

    this.makeMove = function(){
        var ips = [...this.sensors.map((sensor) => { return sensor.state / CAR_SENSOR_SIZE})]

        var res = this.brain.predict(ips)

        var engine_force
        var steer_val

        if(res[0] > res[1]){
            engine_force = -MAX_FORCE
        }
        else{ 
            engine_force = 0
        }

        var max_val = Math.max(res[2], res[3], res[4])

        if(max_val == res[2]){
            steer_val = -MAX_STEER_VAL
        }if(max_val == res[3]){
            steer_val = 0
        }if(max_val == res[4]){
            steer_val = MAX_STEER_VAL
        }
        

        this.applyEngineForce(engine_force)
        this.turn(steer_val)
    }

    function _resetBody(){
        if(this.body != null) return

        this.body = new CANNON.Body({
            shape: CAR_BODY_CHASSIS_SHAPE,
            mass: 150,
            collisionFilterGroup: GROUP2,
            collisionFilterMask: GROUP1
        })
        this.body.quaternion.set(-1, 0, 0, 1)
        global.CANNON.world.add(this.body)
    
        global.MeshBodyPairs.push({
            mesh: this.mesh,
            body: this.body
        })

        this._vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.body,
            collisionFilterGroup: GROUP2,
            collisionFilterMask: GROUP1
        })

        options.chassisConnectionPointLocal.set(1, 1, 0)
        this._vehicle.addWheel(options)

        options.chassisConnectionPointLocal.set(1, -1, 0)
        this._vehicle.addWheel(options)

        options.chassisConnectionPointLocal.set(-1, 1, 0)
        this._vehicle.addWheel(options)

        options.chassisConnectionPointLocal.set(-1, -1, 0)
        this._vehicle.addWheel(options)

        this._vehicle.addToWorld(global.CANNON.world)

        if(this._wheelBodies.length != 0) return

        for (var i = 0; i < this._vehicle.wheelInfos.length; i++) {
            var wheel = this._vehicle.wheelInfos[i];
            var cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);

            var wheelBody = new CANNON.Body({
                mass: 0,
                collisionFilterGroup: 0,
                collisionFilterMask: 0
            });
            wheelBody.type = CANNON.Body.KINEMATIC;
            wheelBody.collisionResponse = false

            var q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);
            this._wheelBodies.push(wheelBody);

            global.CANNON.world.addBody(wheelBody);

            var wheelMesh = new THREE.Mesh(
                new THREE.CylinderBufferGeometry(wheel.radius, wheel.radius, wheel.radius / 2, 20),
                new THREE.MeshPhongMaterial({
                    color: 0xFFFF00
                })
            )
            global.THREE.scene.add(wheelMesh)

            global.MeshBodyPairs.push({
                mesh: wheelMesh,
                body: wheelBody
            })
        }
    }
}

function setminMax(vec){
    if(vec.x < min_x){
        min_x = vec.x
    }
    if (vec.x > max_x) {
        max_x = vec.x
    }
    if (vec.y < min_y) {
        min_y = vec.y
    }
    if (vec.y > max_y) {
        max_y = vec.y
    }
    if (vec.z < min_z) {
        min_z = vec.z
    }
    if (vec.z > max_z) {
        max_z = vec.z
    }
}

//x,y,z determines the position of the second point of the line segment to be draw from the chassis center
function CarSensor(x, y, z) {
    this.state = 0
    this.p1 = new THREE.Vector3()
    this.p2 = new THREE.Vector3()

    this.collisionPoint = new THREE.Mesh(new THREE.SphereBufferGeometry(0.1),
                                         new THREE.MeshBasicMaterial({
                                           color: 0xff0000
                                         }))

    global.THREE.scene.add(this.collisionPoint)

    this.mesh = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({
        color: CAR_SENSOR_NOT_TRIGGERED_COLOR
    }))
    global.THREE.scene.add(this.mesh)

    this.mesh.geometry.vertices.push(new THREE.Vector3(0, 0, 0))
    this.mesh.geometry.vertices.push(new THREE.Vector3(0, 0, 0))
    this.transformationMatrix = CAR_SENSOR_TRANSFORMATION_MATRIX
    this.position = CAR_SENSOR_POSITION_VECTOR
    this.rotationMatrix = null

    this.setRotationMatrix = function (rotMat) {
        this.rotationMatrix = rotMat
    }

    this.tick = function (chassisMesh) {
        if (this.rotationMatrix == null) {
            throw new Error("CarSensor's Rotation Matrix not set")
        }

        this.position.set(0, 0, 0)
        this.transformationMatrix.identity()

        this.transformationMatrix.makeTranslation(x, y, z)
        this.transformationMatrix.multiplyMatrices(this.rotationMatrix, this.transformationMatrix)
        this.transformationMatrix.multiplyMatrices(chassisMesh.matrix, this.transformationMatrix)

        this.position.applyMatrix4(this.transformationMatrix)

        this.mesh.geometry.vertices[0].set(chassisMesh.position.x, chassisMesh.position.y, chassisMesh.position.z)
        this.mesh.geometry.vertices[1].set(this.position.x, this.position.y, this.position.z)
        this.mesh.geometry.verticesNeedUpdate = true

        this.p1.set(chassisMesh.position.x, chassisMesh.position.y, chassisMesh.position.z)
        this.p2.set(this.position.x, this.position.y, this.position.z)
    }

    this.startTrigger = function (value) {
        if (this.state == 1) {
            return;
        }

        this.state = value
        this.mesh.material.color.setHex(CAR_SENSOR_TRIGGERED_COLOR)
    }

    this.endTrigger = function () {
        if (this.state == 0) {
            return;
        }

        this.state = CAR_SENSOR_SIZE
        this.mesh.material.color.setHex(CAR_SENSOR_NOT_TRIGGERED_COLOR)
    }

    this.delete = function () {
        global.THREE.scene.remove(this.mesh)
    }
}
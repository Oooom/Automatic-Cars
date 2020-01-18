//support things
var groundBody = new CANNON.Body({
    mass: 0,
    collisionFilterGroup: GROUP1,
    collisionFilterMask: GROUP2 | GROUP1
})
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), to_radians(-90))
groundBody.addShape(new CANNON.Plane())
groundBody.name = "GROUND"
global.CANNON.world.addBody(groundBody)

var groundMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(50, 50), new THREE.MeshPhongMaterial({
    color: 0x444444
}))
global.THREE.scene.add(groundMesh)

global.MeshBodyPairs.push({
    mesh: groundMesh,
    body: groundBody
})

// var obstacleBody = new CANNON.Body({
//     mass: 0,
//     collisionFilterGroup: GROUP1,
//     collisionFilterMask: GROUP2 | GROUP1
// })
// obstacleBody.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)))
// obstacleBody.position.set(3, 1, 0)
// obstacleBody.name = "OBSTACLE"
// global.CANNON.world.addBody(obstacleBody)

// var obstacleMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(2, 2, 2), new THREE.MeshPhongMaterial({
//     color: 0x000FFF
// }))
// global.THREE.scene.add(obstacleMesh)

// global.MeshBodyPairs.push({
//     mesh: obstacleMesh,
//     body: obstacleBody
// })

//controls related
var controls = new THREE.TrackballControls(global.THREE.camera, canvas);
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.2;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = false;
controls.dynamicDampingFactor = 0.3;
var radius = 100;
controls.minDistance = 0.0;
controls.maxDistance = radius * 1000;
//controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
controls.screen.width = WIDTH;
controls.screen.height = HEIGHT;
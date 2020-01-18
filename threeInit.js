//threejs things: renderer, scene, camera, ambientLight
global.THREE.renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas
})
global.THREE.renderer.setPixelRatio(window.devicePixelRatio)
global.THREE.renderer.setSize(WIDTH, HEIGHT)

global.THREE.scene = new THREE.Scene()
global.THREE.scene.background = new THREE.Color("#000000")

global.THREE.camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 1000)
global.THREE.camera.position.set(0, 10, 10)
global.THREE.scene.add(global.THREE.camera)

global.THREE.ambientLight = new THREE.AmbientLight(0xffffff, 1)
global.THREE.scene.add(global.THREE.ambientLight)
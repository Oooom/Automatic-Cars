//cannonjs things:
global.CANNON.world = new CANNON.World()
global.CANNON.world.gravity.set(0, -10, 0)
global.CANNON.world.defaultContactMaterial.friction = 0;
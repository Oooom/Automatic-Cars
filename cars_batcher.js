const CarsBatcher = {
    car_batch: [],
    batchSize: 20,
    currentBatch: -1,

    //called onstart and when batchsize is resized... obviously
    reSizeCarBatch: function(){
        while (this.car_batch.length < MAX_POPULATION) {
            _population.push(this.car_batch.length)
            this.car_batch.push(new CarWithSensors())
        }
        
        while (this.car_batch.length > MAX_POPULATION) {
            this.car_batch[this.car_batch.length - 1].delete()
            this.car_batch.splice(this.car_batch.length - 1, 1)

            _population.splice(_population.length - 1, 1)
        }
    },

    resetCarBatch: function(){

        for(var car of this.car_batch){
            if(car.body)
                car.removeBodyAndVehicle()

            car.resetBody()

            car.body.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z)
            car.body.quaternion.set(spawnQuat.x, spawnQuat.y, spawnQuat.z, spawnQuat.w)
        }        

    },

    nextBatch: function(){
        if(this.currentBatch < Math.ceil(MAX_POPULATION / this.batchSize) ){
            this.setBatch(this.currentBatch+1)
        }
    },

    setBatch: function(batch){
        if (batch >= Math.ceil(MAX_POPULATION / this.batchSize)){
            throw new Error("batch no. out of bounds")
        }

        for(var i = 0; i < this.car_batch.length; i++){
            this.car_batch[i].brain = generation[i + this.batchSize*batch]
        }

        this.currentBatch = batch
        population = _population.slice()

        this.resetCarBatch()

        current_batch.innerText = this.currentBatch
        total_batch.innerText = Math.ceil(MAX_POPULATION / this.batchSize)
    },
    
    init: function(){
        this.reSizeCarBatch()
    }
}

CarsBatcher.init()
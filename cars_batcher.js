const CarsBatcher = {
    car_batch: [],
    batchSize: 20,
    currentBatch: -1,
    currentBatchLength: 0,

    //called onstart and when batchsize is resized... obviously
    reSizeCarBatch: function(){
        while (this.car_batch.length < this.batchSize) {
            _population.push(this.car_batch.length)
            this.car_batch.push(new CarWithSensors())
        }
        
        while (this.car_batch.length > this.batchSize) {
            this.car_batch[this.car_batch.length - 1].delete()
            this.car_batch.splice(this.car_batch.length - 1, 1)

            _population.splice(_population.length - 1, 1)
        }
    },

    resetCarBatch: function(){

        for(var i = 0; i < this.car_batch.length; i++){
            if(this.car_batch[i].disabled){
                this.car_batch[i].enable()
            }
            
            if(this.car_batch[i].body)
                this.car_batch[i].removeBodyAndVehicle()

            this.car_batch[i].resetBody()

            this.car_batch[i].body.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z)
            this.car_batch[i].body.quaternion.set(spawnQuat.x, spawnQuat.y, spawnQuat.z, spawnQuat.w)
            
            if(i >= this.currentBatchLength){
                this.car_batch[i].disable()
            }
        }

    },

    nextBatch: function(){
        if(this.currentBatch < Math.ceil(MAX_POPULATION / this.batchSize) ){
            this.setBatch(this.currentBatch+1)
        }
    },

    setBatch: function(batch){
        var ratio = MAX_POPULATION / this.batchSize

        if (batch >= Math.ceil(ratio)){
            throw new Error("batch no. out of bounds")
        }

        this.currentBatchLength = (batch == parseInt(ratio))? this.batchSize*(ratio-parseInt(ratio)) : this.batchSize

        for (var i = 0; i < this.currentBatchLength; i++){
            this.car_batch[i].brain = generation[i + this.batchSize*batch]
        }

        this.currentBatch = batch
        population = _population.slice()

        if(this.batchSize != this.currentBatchLength)
            population.splice(this.currentBatchLength, this.batchSize - this.currentBatchLength)

        this.resetCarBatch()

        current_batch.innerText = this.currentBatch + 1
        total_batch.innerText = Math.ceil(MAX_POPULATION / this.batchSize)
        this_batch.innerText = this.currentBatchLength
    },
    
    init: function(){
        this.reSizeCarBatch()
    }
}

CarsBatcher.init()
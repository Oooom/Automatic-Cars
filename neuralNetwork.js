/*
    {
        hiddenLayers: [4, 2] // first hidden layer will have 4 units and second will have 2
    }
    inputs: 11,
    outputs: 2,
    activation: "sigmoid",
    optimizer:,
    loss:

    @TODO: try changing the backend for tf and profile it
*/

//  constructor1 (options)              //blank
//  constructor2 (options, nn1)         //make a copy
//  constructor3 (options, nn1, nn2)    //crossover

var DEFAULT_ARCHITECTURE = {
    inputs: 7,
    outputs: 4,
    hiddenLayers: [7]
}


function NeuralNetwork(options, nn1, nn2){
    setupDefaults(options)

    this.model = tf.sequential()

    for(var i = 0; i < options.hiddenLayers.length; i++){
        var config = {
            units: options.hiddenLayers[i],
            activation: options.activation
        }

        if(i == 0)
            config.inputShape = [options.inputs]

        var layer = tf.layers.dense(config)
        this.model.add(layer)
    }

    var op_config = {
        units: options.outputs,
        activation: options.activation
    }

    if(options.hiddenLayers.length == 0)
        op_config.inputShape = [options.inputs]

    var op = tf.layers.dense(op_config)
    this.model.add(op)

    this.model.compile({
        optimizer: options.optimizer,
        loss: options.loss
    })

    this.predict = function(ips){

        //try bufferring this temporary tensor
        var res = this.model.predict( tf.tensor2d([ips]) )

        return res.dataSync()
    }

    this.cloneFrom = function(nn){
        tf.tidy(() => {
            this.model.setWeights(nn.model.getWeights())
        });
    }

    this.mutate = function(fn){        
        tf.tidy(() => {
            const w = this.model.getWeights()
            for (let i = 0; i < w.length; i++) {
                let shape = w[i].shape
                let arr = w[i].dataSync().slice()
                for (let j = 0; j < arr.length; j++) {
                    arr[j] = fn(arr[j])
                }
                let newW = tf.tensor(arr, shape)
                w[i] = newW
            }
            this.model.setWeights(w)
        });
    }

    function setupDefaults(opt){
        if(opt.hiddenLayers === undefined)
            opt.hiddenLayers = []

        if(opt.activation === undefined)
            opt.activation = "sigmoid"

        if(opt.optimizer === undefined)
            opt.optimizer = tf.train.adam(0.25)

        if(opt.loss === undefined)
            opt.loss = "meanSquaredError"
    }

    if (nn1 instanceof NeuralNetwork) {
        crossover(this, nn1, nn2)
    }

    this.getWeights = function(){
        var ray = []
        
        tf.tidy(() => {
            const w = this.model.getWeights()
            for (let i = 0; i < w.length; i++) {
                let arr = w[i].dataSync().slice()

                ray.push(arr)
            }
        });

        return ray
    }

    this.printWeights = function(){
        tf.tidy(() => {
            const w = this.model.getWeights()
            for (let i = 0; i < w.length; i++) {                
                let arr = w[i].dataSync().slice()
                
                console.log(arr)
            }            
        });
    }

    this.isSame = function(nn){
        var r1 = this.getWeights()
        var r2 = nn.getWeights()

        var flag = true
        for(var i = 0; i < r1.length; i++){
            for(var j = 0; j < r1[i].length; j++){
                if(r1[i][j] != r2[i][j]){
                    flag = false
                    break
                }
            }
        }

        return flag
    }
}
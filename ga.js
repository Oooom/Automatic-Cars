var population = []     //stores alive members of the generation, 0 - batchSize
var _population = []    //stores 0-batchSize numbers so as to copy it to population array when reiniting batch or generation
var mating_pool = []    //only contains the brains
var generation = []

var THIS_GENERATION = 0

var MAX_POPULATION = 100
max_pop.innerText = MAX_POPULATION

var MUTATION_RATE = 0.01

//must be called when next generation is to be created
function generate(){
    THIS_GENERATION++

    var i = 0

    //move all mating_pool elements to front of next generation
    for(; i < mating_pool.length; i++){
        var brain = generation.splice(mating_pool[i], 1)[0]
        generation.unshift(brain)
    }

    for(; i < MAX_POPULATION; i++){
        if(mating_pool.length == 0){
            generation[i] = new NeuralNetwork(DEFAULT_ARCHITECTURE)
        }else if(mating_pool.length == 1){
            generation[i] = new NeuralNetwork(DEFAULT_ARCHITECTURE, generation[0])
            generation[i].mutate(mutationFunction)
        }else{
            //since all previous gen best were stored at the front of the generation, find random between 0 and mating_pool length
            var par1 = getRandomInt(0, mating_pool.length)
            var par2 = getRandomInt(0, mating_pool.length)

            generation[i] = new NeuralNetwork(DEFAULT_ARCHITECTURE, generation[par1], generation[par2])
            generation[i].mutate(mutationFunction)
        }
    }

    mating_pool = []
    refreshMatingPoolDOM()

    CarsBatcher.setBatch(0)
}

function mutationFunction(x) {
    if (getRandomArbitrary(0, 1) < MUTATION_RATE) {
        let offset = RandomGaussian() * 0.5    //modified
        let newx = x + offset
        return newx;
    } else {
        return x;
    }
}

function crossover(target, nn1, nn2) {
    if (nn2 instanceof NeuralNetwork) {

        //make randomness in copying from one nn or another
        tf.tidy(() => {
            const w = target.model.getWeights()
            const w1 = nn1.model.getWeights()
            const w2 = nn2.model.getWeights()

            for (let i = 0; i < w.length; i++) {
                let shape = w[i].shape

                let arr = w[i].dataSync().slice();
                let arr1 = w1[i].dataSync()
                let arr2 = w2[i].dataSync()

                for (let j = 0; j < arr.length; j++) {
                    if (j % 2)
                        arr[j] = arr1[j]
                    else
                        arr[j] = arr2[j]
                }

                let newW = tf.tensor(arr, shape)
                w[i] = newW
            }
            target.model.setWeights(w)
        })

    } else {
        target.cloneFrom(nn1)
    }
}

function refreshMatingPoolDOM(){    
    var opstr = ""
    for(var i = 0; i < mating_pool.length; i++){
        opstr += (i + ": " + mating_pool[i] + "<br>")
    }

    mating_pool_content_container.innerHTML = opstr
}

function highlightMatingPoolDOM(color){
    mating_pool_container.style.backgroundColor = color

    setTimeout(function(){
        mating_pool_container.style.backgroundColor = "transparent"
    }, 250)
}


//TODO

// async function StringToNeuralNetwork(str){
//     const json = JSON.parse(str);
//     const weightData = new Uint32Array(stoab(json.weightData)).buffer;
//     const model = await tf.loadLayersModel(tf.io.fromMemory(json.modelTopology, json.weightSpecs, weightData));

//     return new NeuralNetwork({ isModelWrapper: true, model: model})
// }

// function stoab(s){
//     var buf = new ArrayBuffer(s.length * 2); // 2 bytes for each char
//     var bufView = new Uint32Array(buf);
//     for (var i = 0, strLen = s.length; i < strLen; i++) {
//         bufView[i] = str.charCodeAt(i);
//     }
//     return buf;
// }

// function abtos(ab){
//     return String.fromCharCode.apply(null, new Uint32Array(ab));
// }

function saveToLocalStorage(nn, identifier){
    nn.model.save("localstorage://" + identifier)
}

async function loadNeuralNetworkFromLocalStorage(identifier){
    var m = await tf.loadLayersModel("localstorage://" + identifier)

    return new NeuralNetwork({isModelWrapper: true, model: m})
}
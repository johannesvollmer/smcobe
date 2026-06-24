export { 
    filledArray, range, slidingWindows, shallowCopy, 
    indexNormalized, normRandom, indexNormalizedCyclic, indexByFloat,
    unitCos, unitSin, chunks, chars, withCharsAt, normSin, indexFromFloat, indexClamped
}

function filledArray(count, createItem) { return range(count).map(createItem) }
function range(num) { return [...Array(num).keys()] }
function chars(string){ return Array.from(string) }

function slidingWindows(windowSize, array, accumulatedWindows = []){
    if (accumulatedWindows.length > array.length - windowSize) 
        return accumulatedWindows

    const newWindow = array.slice(accumulatedWindows.length, accumulatedWindows.length + windowSize)
    return slidingWindows(windowSize, array, [...accumulatedWindows, newWindow])
}

function chunks(chunkSize, array, outputChunks = []){
    if (outputChunks.length > array.length / chunkSize) 
        return outputChunks

    const newChunk = array.slice(outputChunks.length*chunkSize, (outputChunks.length+1)*chunkSize)
    return chunks(chunkSize, array, [...outputChunks, newChunk])
}

function shallowCopy(object){
    return Object.assign({}, object)
}

function indexNormalized(array, index01){
    return indexByFloat(array, index01 * array.length)
}

function indexNormalizedCyclic(array, index01){
    return array[Math.round((index01+1)*array.length) % array.length]
}

function indexByFloat(array, floatIndex){
    return array[indexFromFloat(array.length, floatIndex)]
}

function indexFromFloat(length, floatIndex){
    return clampIndex(length, Math.floor(floatIndex))
}

function indexClamped(array, index){
    return array[clampIndex(array.length, index)]
}

function clampIndex(length, index){
    return Math.max(0, Math.min(length - 1, index))
}

function unitRandom(){ return Math.random() }
function normRandom(){ return Math.random()*2-1 }
function unitSin(x){ return normSin(x)*0.5+0.5 }
function normSin(x){ return Math.sin(x*(2*Math.PI)) }
function unitCos(x){ return Math.cos(x*(2*Math.PI))*0.5+0.5 }

function withCharsAt(string, index, replacement) {
    return string.substring(0, index) + replacement + string.substring(index + replacement.length)
}
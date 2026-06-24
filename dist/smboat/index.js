import { generatePain, generatePainObject, toJson } from "../index/lib/API.js";
import { AsciiGrid, charLayout } from "./lib/ascii-canvas.js"
import { filledArray, range, slidingWindows, shallowCopy, indexNormalized, indexClamped, normRandom, indexByFloat, unitSin, normSin, chars, chunks, withCharsAt, indexFromFloat } from "./lib/js.js"

var audio = new Audio('audio/Circus Music.mp3')
document.addEventListener("click", () => {
    audio.play()
})


const asciiColums = 70
const asciiRows = 50

const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    Composite = Matter.Composite,
    Query = Matter.Query


const physicsEngine = Engine.create()
physicsEngine.world.gravity.scale = 0

const ropeGroup = 1
const waterGroup = 2
const boatGroup = 4
const mouseGroup = 5

const rope = createSphereChain({ 
    count: 13, radius: 1, mass: 0.1, 
    position: { x:0, y:10 }, step: { x:1, y:0 },
    options: { frictionAir: 0.1, collisionFilter: { group: ropeGroup, mask: 0 } }
})

rope.firstBody.mass = 8.0
const attachedSegment = rope.lastBody
// const ropeAttachedPoint = createPositionConstraint(attachedSegment)

const waterLevel = 10
const waterElements = 24
const simulatedWaterSurface = createSphereChainAt({
    count: waterElements, radius: 0.5*asciiColums/waterElements, mass: 0.5,
    step: { x:1, y:0 },
    options: { 
        frictionAir: 0, friction: 0, 
        collisionFilter: { group: waterGroup, mask: 0 }
    },
    positioning: elementIndex => {
        const xFraction = elementIndex / waterElements
        return ({
            x: xFraction * asciiColums,
            y: waterLevel + 2 * Math.sin(xFraction * 20)
        })
    }
})

const waterLeftEndPoint = createPositionConstraint(simulatedWaterSurface.firstBody)
const waterRightEndPoint = createPositionConstraint(simulatedWaterSurface.lastBody)

const boat = Bodies.trapezoid(65,0, 4, 1, -0.5, { 
    collisionFilter: { group: boatGroup, mask: 0 },
    mass: 8
})

const mouseBody = Bodies.circle(10, 0, 0.5, {
    collisionFilter: { group: mouseGroup, mask: 0 },
    mass: 0.1
})

const mouseBodyTarget = createPositionConstraint(mouseBody, { position: {x:10,y:0}, stiffness: 0.1, length: 0 })

const fishingRod = Constraint.create({ bodyA: boat, bodyB: mouseBody, length: 14 })
const fishingRodRope = Constraint.create({ bodyA: attachedSegment, bodyB: mouseBody, length: 0 })


const waterDepth = simulatedWaterSurface.bodies.map(body => {
    const length = 17 // Math.floor(Math.random() * 8)
    return filledArray(length, index => ({
        index: index,
        body: body,
        position: { x: 2*normRandom(), y: index },
        symbol: indexNormalized(["::",":","."], index/length)
    })).filter(({index}) => Math.random() > index/length)
})



const waterlinePerPixel = filledArray(asciiColums, index => ({x: index, y:0}))
function updateWaterline(){
    for(const px of waterlinePerPixel) {
        const collisions = Query.ray(simulatedWaterSurface.bodies, {x:px.x, y:0}, {x:px.x, y:asciiRows}, 0.5) // TODO not allocate?
        if (collisions.length > 0) px.y = (collisions[0].bodyA || collisions[0].bodyB).position.y 
        else px.y = waterLevel
    }
}
function isUnderWater(x,y){
    return distanceUnderWater(x,y) > 0
}

function distanceUnderWater(x,y){
    const waterY = indexByFloat(waterlinePerPixel, x).y
    return y - waterY
}

function waterAngleAt(x){
    const index = indexFromFloat(waterlinePerPixel.length, x)
    const waterLeft = indexClamped(waterlinePerPixel, index - 1)
    const waterRight = indexClamped(waterlinePerPixel, index + 1)
    const slope = (waterRight.y - waterLeft.y) / (waterRight.x - waterRight.x)
    const radians = Math.atan(slope)
    return radians
}

let request = createRequest()

function createRequest(){
    const requestObject = generatePainObject()
    const requestText = toJson(requestObject)
    return {
        originalText: requestText,
        position: { x:-70, y:waterLevel+5 },
        collider: generateRequestColliders(requestObject, requestText),
        connectionToHookOrNull: null
    }
}

// add all of the bodies to the world and start the simulation
Composite.add(physicsEngine.world, [
    ...rope.bodies, 
    ...rope.constraints,
    ...simulatedWaterSurface.bodies,
    ...simulatedWaterSurface.constraints,
    waterRightEndPoint.constraint, 
    waterLeftEndPoint.constraint,
    boat,
    mouseBodyTarget.constraint,
    mouseBody,
    fishingRod,
    fishingRodRope
])

const bodiesToDraw = []
const gravityBodies = [...rope.bodies, boat]

const mouse = Mouse.create(document.body)
mouse.position.x = 10

const physicsRunner = Runner.create()
Runner.run(physicsRunner, physicsEngine)

const asciiGrid = AsciiGrid()
asciiGrid.resize(asciiColums, asciiRows, "X", "red")
const asciiCanvas = document.getElementById("ascii-canvas")
const asciiCanvasContext = asciiCanvas.getContext("2d", { antialias: false })
const asciiSpacing = 0.9
const deadline = asciiColums + 12

let fishCounter = 0
let lastFrameTime = Date.now()
let remainingGameSeconds = 10
let runningSeconds = 0
let timeSinceLastFishCatch = Number.NaN // nan to avoid blinking at startup
//for (const boyant of boyantBodies)
//    boyant.collisionFilter = { group: waterGroup, mask: 0 } 

update()
function update(){
    const newFrameTime = Date.now()
    const deltaTime = newFrameTime - lastFrameTime
    const deltaSeconds = deltaTime / 1000
    runningSeconds += deltaSeconds
    remainingGameSeconds -= deltaSeconds
    timeSinceLastFishCatch += deltaSeconds

    var pos = shallowCopy(mouse.position)
    var pixelsPerMeter = asciiRows / window.innerHeight 
    pos.x = pos.x * pixelsPerMeter
    pos.y = pos.y * pixelsPerMeter
    Object.assign(mouseBodyTarget.position, pos)
    // Object.assign(fishingRod.position, pos)

    request.position.x += 9.3 * deltaSeconds
    
    if (request.position.x > deadline){
        const error = generateErrorText()
        window.location.href = "../" + "#" + btoa(error)
        return
    }

    waterLeftEndPoint.position.y = waterLevel+3*(Math.sin(runningSeconds*8)+1)
    waterRightEndPoint.position.y = waterLevel+1*(Math.sin(runningSeconds*8)+1)
    //waterRightEndPoint.position.y = waterLevel+3*(Math.sin(runningSeconds*8+2)+1)

    for(const body of gravityBodies)
        Body.applyForce(body, body.position, {x:0, y:0.00981*deltaSeconds*body.mass})

    // boatTargetPoint.position.y = boat.position.y
    updateWaterline()

    const waterWindPower = 0.0001 * (unitSin(runningSeconds)*0.1+0.7)
    const waterWindForce = {x:waterWindPower*deltaSeconds, y:0}
    for(const boyant of [boat]){
        const dUnderWater = distanceUnderWater(boyant.position.x, boyant.position.y)
        if(dUnderWater > 0){
            const depth = Math.max(0, dUnderWater)
            const depthSmoothness = Math.min(depth/0.3, 1)

            const waterForce = {
                x: waterWindForce.x*10, 
                y: waterWindForce.y - 0.07*boyant.area*deltaSeconds 
            }

            Body.applyForce(boyant, boyant.position, waterForce)
            boyant.frictionAir = 0.8
        }
        else {
            boyant.frictionAir = 0.0001
        }
    }
    for(const boyant of rope.bodies){
        const underWater = isUnderWater(boyant.position.x, boyant.position.y)
        
        if(underWater){
            const waterForce = waterWindForce
            Body.applyForce(boyant, boyant.position, waterForce)
            boyant.frictionAir = 0.1
        }
        else {
            boyant.frictionAir = 0.0001
        }
    }

    if (request.connectionToHookOrNull == null) {
        Body.setPosition(request.collider.body, {
            x: request.position.x + request.collider.offset.x,
            y: request.position.y + request.collider.offset.y
        })

        const hookTouchesRect = Query.point([request.collider.body], rope.firstBody.position)
        if(hookTouchesRect.length){
            request.connectionToHookOrNull = Constraint.create({
                bodyA: rope.firstBody, bodyB: request.collider.body,
                length: 0,
            })
    
            Composite.add(physicsEngine.world, [request.connectionToHookOrNull, request.collider.body])
        }
    }
    else {
        const isCollected = Query.collides(request.collider.body, [boat]).length > 0
        if (isCollected){
            Composite.remove(physicsEngine.world, [request.connectionToHookOrNull, request.collider.body])
            request.connectionToHookOrNull = null
            console.log("You catched the fish! yay!")
            
            request = createRequest()
            timeSinceLastFishCatch = 0
            fishCounter += 1
        }

        else if (isUnderWater(request.collider.body.position.x, request.collider.body.position.y)){
            const behaviourScale = unitSin(runningSeconds*0.2)
            Body.applyForce(
                request.collider.body, 
                request.collider.body.position, // TODO with offset? at head?
                {
                    x: -0.06*unitSin(runningSeconds*1.4) *behaviourScale*deltaSeconds, 
                    y: 0.04*(normSin(runningSeconds*1.6+0.3)+0.3) *behaviourScale*deltaSeconds
                }
            )

            request.collider.body.frictionAir = 0.04
        }
        else {
            request.collider.body.frictionAir = 0.00001
        }
    }

    window.requestAnimationFrame(update)
    render(runningSeconds)
    lastFrameTime = newFrameTime
}

function render(runningSeconds) {
    if (request.position.x > deadline){
        asciiGrid.clear("X", "red")
        drawAsciiToCanvas()
        return
    }

    asciiGrid.clear()

    const rainSymbols = [";", ":", ",", "."]
    for(let x = 0; x < asciiColums; x++){
        const yEnd = waterlinePerPixel[x].y
        for(let y = 0; y < yEnd; y++){
            const mainFac = unitSin(y*0.1 +x*0.05- runningSeconds*0.9 + Math.random()*0.6)
            const variationFac = unitSin(y*0.02+x*0.7 - runningSeconds*0.99 + Math.random()*0.01)
            const color = mainFac < 0.2 && variationFac < 0.5? "#00a":"#006"
            asciiGrid.setPixel(x,y, indexNormalized(rainSymbols, variationFac+Math.random()*-0.5), color)
        }
    }

    charLayout(request.position.x, request.position.y, request.collider.requestText, (x,y,char) => {
        if (isUnderWater(x,y))
            asciiGrid.setPixel(x, y, char, "#558")
    })
    charLayout(
        request.collider.body.position.x - request.collider.value.length/2, 
        request.collider.body.position.y, 
        request.collider.value,
        (x,y,char) => {
            if (isUnderWater(x,y) || request.connectionToHookOrNull != null){
                const isRed = Math.random() < 0.003 || request.connectionToHookOrNull != null
                asciiGrid.setPixel(x, y, char, isRed? "#d58" : "#558")
            }
        }
    )

    drawWater()

    
    let boatColor = "white"
    
    const dBoatUnderWater = distanceUnderWater(boat.position.x, boat.position.y)
    if(dBoatUnderWater > 2.5) 
        boatColor = (normSin(runningSeconds*10)<0)? "#f00" : "#300"

    if(timeSinceLastFishCatch < 1.5) 
        boatColor = normSin(runningSeconds*3)<-0.3? "#020" : "#3f0"

    asciiGrid.drawLine(mouseBody.position, boat.position, boatColor)
    asciiGrid.drawPolyline(boat.vertices, boatColor, true)
    asciiGrid.setPixel(boat.position.x-2, boat.position.y-1.4, "i", boatColor)
    asciiGrid.setPixel(boat.position.x-1, boat.position.y-1.4, "i", boatColor)
    asciiGrid.drawPolyline(
        [
            {x: boat.position.x + 0, y: boat.position.y + 0 },
            {x: boat.position.x + 0, y: boat.position.y - 5 },
            {x: boat.position.x + 2, y: boat.position.y - 2 }
        ], 
        boatColor, 
        false
    )

    for (const body of bodiesToDraw) {
        var vertices = body.vertices
        asciiGrid.drawPolyline(vertices, "red", true)
    }


    const ropeSegments = rope.bodies.map(body => body.position)
    asciiGrid.drawPolyline(ropeSegments, "white", false)

    const hook = rope.firstBody.position
    asciiGrid.setPixel(hook.x, hook.y, "?", "white", Math.PI)


    if (unitSin(2*runningSeconds)<0.5)
        asciiGrid.drawText(
            asciiColums/2-request.collider.shortName.length/2+4, 3, 
            request.collider.shortName, "red"
        )

    const fishText = "processed responses: " + fishCounter
    const counterColor = normSin(runningSeconds*1.1)<-0.2? "#44d" : "white"
    asciiGrid.drawText(asciiColums - 1 - fishText.length, asciiRows - 2, fishText, counterColor)    
    
    charLayout(1,1, "SMB0AT - The Game", (x,y,char) => {
        const colorIndex = unitSin(-x*0.1 + runningSeconds*1.3)
        // < 0? "grey" : "white"
        const headerColor = indexNormalized(["#fff", "#aaf", "#55f"], colorIndex)
        asciiGrid.setPixel(x,y,char, headerColor)
    })

    const remainingWholeSeconds = Math.floor(remainingGameSeconds)
    asciiGrid.drawText(asciiColums - 10, 1, "time: " + remainingWholeSeconds, remainingWholeSeconds < 0 && normSin(runningSeconds*8)<0? "red":"white")
    drawAsciiToCanvas()
}

function generateErrorText() {
    return "programe 'smb0at.exe' failed with fetal error:\n"
        + `field ${request.collider.name}\ncould not be found in the response\n\n`
        + request.originalText;
}

function drawWater(){
    const waterSegments = simulatedWaterSurface.bodies.map(body => body.position)
    asciiGrid.drawPolyline(waterSegments, "blue", false)
   
    const warterStartY = 5

    for (const dots of waterDepth)
        for (const dot of dots)
            //if(Math.random() > Math.pow(dot.index/5, 2))
            if(dot.position.y + warterStartY > dot.body.position.y)
                asciiGrid.setPixel(
                    dot.position.x + dot.body.position.x, 
                    dot.position.y + warterStartY, // dot.position.y + dot.body.position.y+1.01, 
                    dot.symbol, "blue"
                )
}

function drawAsciiToCanvas(){
    resizeCanvasToWindow()

    const asciiFontSize = asciiCanvas.height / (asciiRows*asciiSpacing)
    const spacing = asciiFontSize * asciiSpacing
    asciiCanvasContext.clearRect(0, 0, asciiCanvas.width, asciiCanvas.height)
    asciiGrid.renderToCanvas(
        asciiCanvasContext, 
        `bold ${asciiFontSize}px DOS`, 
        { x:spacing, y:spacing }
    )
}

function resizeCanvasToWindow(){
    const canvasWidth = window.innerWidth * window.devicePixelRatio * 2
    const canvasHeight = window.innerHeight * window.devicePixelRatio * 2
    if (canvasWidth != asciiCanvas.width || canvasHeight != asciiCanvas.height){
        asciiCanvas.width = canvasWidth
        asciiCanvas.height = canvasHeight
    }
}


function createPositionConstraint(body, options = {}){
    const constraint = Constraint.create({ 
        pointA: shallowCopy(options.position || body.position), 
        bodyB: body,
        stiffness: 0.8,
        damping: 1,
        ... options
    })

    return { constraint, position: constraint.pointA }
}

function createSphereChain({ count, radius, mass, position, step, options }){
    const positioning = index => ({ 
        x: position.x + index * (step.x*radius*2), 
        y: position.y + index * (step.y*radius*2)
    })

    return createSphereChainAt({ count, radius, mass, positioning, options })
}

function createSphereChainAt({ count, radius, mass, positioning, options }){
    const bodies = filledArray(count, index => {
        const position = positioning(index)
        const body = Bodies.circle(position.x, position.y, radius, options)
        Body.setMass(body, mass)
        return body
    })

    const constraints = slidingWindows(2, bodies).map(adjacentPoints => {
        const constraint = {
            bodyA: adjacentPoints[0],
            bodyB: adjacentPoints[1],
            stiffness: 1
        }
        return Constraint.create(constraint)
    })

    return { bodies, constraints, firstBody: bodies[0], lastBody: bodies[count-1] }
}

function generateRequestColliders(requestObject, requestText){
    try { return tryGenerateRequestColliders(requestObject, requestText) }
    catch (error) {
        console.log(error) 
        return generateRequestColliders(requestObject, requestText) 
    }
}

function tryGenerateRequestColliders(requestObject, requestText){
    console.log(getAllEntries("response", requestObject))

    const props = getAllEntries("response", requestObject)
        .filter(prop => prop.value.length > 4 && prop.value.length < 25)

    if(props.length == 0) throw "no suitable property found"
    const randomProp = indexNormalized(props, Math.random())
    const randomValue = randomProp.value
    const lines = requestText.split("\n")

    let y = 0
    let totalIndex = 0
    for(const line of lines){
        const startIndexInLine = line.indexOf(randomValue)
        if (startIndexInLine != -1){
            const totalIndexInRequest = totalIndex + startIndexInLine
            requestText = withCharsAt(requestText, totalIndexInRequest, " ".repeat(randomValue.length))
            const x = startIndexInLine + 0.5 * randomValue.length
            
            const nameLen = randomProp.name.length
            const shortName = ".." + randomProp.name.substring(nameLen - 38, nameLen)

            return {
                value: randomValue,
                name: randomProp.name,
                shortName,

                offset: { x, y },
                requestText: requestText,

                body: Bodies.rectangle(x, y, randomValue.length, 1, {
                    frictionAir: 0.1, mass: 4,
                })
            }
        }

        totalIndex += line.length + 1 // (account for missing `n`) TODO might be multiple??
        y += 1
    }

    throw "property not found in lines"
}

function getAllEntries(name, value){
    if (Array.isArray(value))
        return value.flatMap((value, index) => getAllEntries(name + "[" + index + "]", value))

    else if (typeof(value) === "object" && value != null) 
        return Object.entries(value)
            .flatMap(([propName, value]) => getAllEntries(name + "." + propName, value))

    else return [{ name, value: "" + value }]
}
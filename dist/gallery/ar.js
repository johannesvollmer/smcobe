async function startAR({ canvas, assets: { painting, marker, frame } }) {
    const paintingId = painting || "0"
    const markerId = marker || "0"
    const frameId = frame || "0"

    const engine = new BABYLON.Engine(canvas, true)
    const scene = await createARSceneAsync({ engine, frameId, paintingId, markerId })

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render()
    })

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize()
    })
}

// https://doc.babylonjs.com/features/featuresDeepDive/webXR/introToWebXR
var createARSceneAsync = async function ({ engine, frameId, paintingId, markerId }) {
    if (!await BABYLON.WebXRSessionManager.IsSessionSupportedAsync("immersive-ar"))
        throw "immersive-ar mode not supported"

    var scene = new BABYLON.Scene(engine)
    var camera = new BABYLON.FreeCamera("ar-camera", new BABYLON.Vector3(0, 1, -5), scene)
    camera.setTarget(BABYLON.Vector3.Zero()) // This targets the camera to scene origin
    camera.attachControl(canvas, true) // TODO remove this?

    // created with https://www.babylonjs.com/tools/ibl/#
    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/environment.env", scene)
    scene.environmentTexture = hdrTexture
    scene.environmentIntensity = 0.7
    // hdrTexture.setReflectionTextureMatrix(BABYLON.Matrix.RotationY(BABYLON.Tools.ToRadians(hdrRotation)))

    var paintingTexture = new BABYLON.Texture("assets/images/" + paintingId + "/painting.jpg", scene, {
        invertY: true, // ... https://doc.babylonjs.com/typedoc/interfaces/BABYLON.ITextureCreationOptions
        onLoad: () => {
            console.log("painting texture loaded")
        }
    })

    const markerPath = "assets/images/" + markerId + "/marker.jpg"
    const imageWidth = 0.3 // meters

    var xr = await scene.createDefaultXRExperienceAsync({
        uiOptions: {
            sessionMode: "immersive-ar",
        },
        optionalFeatures: false,
        disableTeleportation: true,
    })


    const fm = xr.baseExperience.featuresManager
    console.log(BABYLON.WebXRFeaturesManager.GetAvailableFeatures())

    const xrImageTracking = fm.enableFeature(BABYLON.WebXRFeatureName.IMAGE_TRACKING, "latest", {
        images: [
            {
                src: markerPath,
                estimatedRealWorldWidth: imageWidth,
            },
        ],
    })

    var frameContainer = new BABYLON.TransformNode("Placed Frame Container")
    frameContainer.rotationQuaternion = new BABYLON.Quaternion()

    let addFrameToScene = undefined
    let isPlaced = false

    xrImageTracking.onTrackableImageFoundObservable.add(image => {
        if (!isPlaced) {
            console.log("found a plane to place our frame on!")
            isPlaced = true

            if (addFrameToScene) addFrameToScene()
            addFrameToScene = undefined

            image.transformationMatrix.decompose(frameContainer.scaling, frameContainer.rotationQuaternion, frameContainer.position);

            // const flipX = BABYLON.Quaternion.FromEulerAngles(180, 0, 0)
            // frameContainer.rotationQuaternion.multiplyInPlace(flipX)
        }
    })
    
    xrImageTracking.onTrackedImageUpdatedObservable.add(image => {

    })

    BABYLON.SceneLoader.LoadAssetContainer("assets/frames/", frameId + ".glb", scene, glTF => {
        console.log("loaded gltf", scene)

        const material = glTF.materials.find(mat => mat.name == "Painting")
        if (!material) throw "material must be named 'Painting'"
        material.albedoTexture = paintingTexture // might not be loaded already, but it's unlikely and it's okay
        // console.log("found painting material", material)

        const frame = glTF.getNodes().find(node => node.name == "Frame")
        if (!frame) throw "object must be named 'Frame'"
        // console.log("found frame object", frame)

        function addToScene(){
            glTF.addAllToScene()
            frame.parent = frameContainer
        }

        if (isPlaced) addToScene()
        else addFrameToScene = addToScene
    })

    
    return scene
}

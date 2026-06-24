// custom canvas adapter, which draws ascii, by github.com/johannesvollmer

import { filledArray, range, slidingWindows, indexNormalized, indexNormalizedCyclic } from "./js.js"
export { AsciiGrid, charLayout }

function AsciiGrid(){
    let pixels = Array2D()

    return {
        resize: (width, height, char, color) => 
            pixels.resize(width, height, () => ({ char, color })),

        setPixel,

        clear: (char = null, color = "white") => pixels.forEachPixel((x,y,pixel) => {
            pixel.char = char
            pixel.color = color
            pixel.rotation = 0
        }),

        drawLine,
        drawPolyline,
        drawText,
        renderToCanvas
    }

    function setPixel(x, y, char, color, rotation = 0){
        const pixel = pixels.getPixel(x, y)
        if (pixel != undefined){
            pixel.char = char
            pixel.color = color
            pixel.rotation = rotation
        }
    }

    function drawPolyline(vertices, color, isClosed){
        for (let vertexIndex = 1; vertexIndex < vertices.length; vertexIndex += 1) {
            const currentVertex = vertices[vertexIndex]
            const lastVertex = vertices[vertexIndex - 1]
            
            drawLine(currentVertex, lastVertex, color)
        }

        if (isClosed && vertices.length >= 2){
            drawLine(vertices[0], vertices[vertices.length - 1], color)
        }
    }

    function drawLine (start, end, color) {
        // https://joshbeam.com/articles/simple_line_drawing/

        const dy = end.y - start.y
        const dx = end.x - start.x
        const char = selectCharForDirection(dx, dy)
        
        if (Math.abs(dx) > Math.abs(dy)){
            const slope = dy / dx
            const maxX = Math.max(start.x, end.x)
            const minX = Math.min(start.x, end.x)
            for(let x = minX; x <= maxX; x += 1){
                let y = start.y + ((x - start.x) * slope)
                setPixel(x, y, char, color)
            }
        }
        else {
            const slope = dx / dy
            const maxY = Math.max(start.y, end.y)
            const minY = Math.min(start.y, end.y)
            for(let y = minY; y <= maxY; y += 1){
                let x = start.x + ((y - start.y) * slope)
                setPixel(x, y, char, color)
            }
        }
    }

    function drawText(x, y, text, color){
        charLayout(x, y, text, (x,y,char) => setPixel(x, y, char, color))
    }

    function renderToCanvas(context, font, spacing) {
        context.font = font
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.direction = "ltr"

        pixels.forEachPixel((x,y,pixel) => {
            const char = pixel.char
            const color = pixel.color

            if (char != " " && char != null){
                context.fillStyle = color
                const xPx = (x + 0.5) * spacing.x
                const yPx = (y - 0.5 + 1) * spacing.y
                
                if(pixel.rotation != 0){
                    context.save()
                    context.translate(xPx, yPx)
                    context.rotate(pixel.rotation)
                    context.translate(-xPx, -yPx)
                }

                context.fillText(char, xPx, yPx)

                if(pixel.rotation != 0){
                    context.restore()
                }
            }
        })
    }

    function selectCharForDirection(x, y){
        // starts right, goes counter clockwise, until on right again (wtf maths???)
        // const charByAngle = ["─", "~", "/", "1", "|", "t", "\\", "~", "─", "~", "/", "7", "|", "1", "\\", "~"]
        const charByAngle = ["─", "/", "|", "\\", "─", "/", "|", "\\"]

        // 0 is on the right, at 3 o' clock
        const angleFrom0To1 = -Math.atan2(y, x) / (2*Math.PI)
        return indexNormalizedCyclic(charByAngle, angleFrom0To1) 
    }
}

function Array2D(){
    let rows = new Array()
    let w = 0
    let h = 0

    return {
        resize: (width, height, createPixel) => {
            rows = filledArray(height, y => filledArray(width, x => createPixel(x,y)))
            w = width
            h = height
        },

        pixels: () => rows.flatMap((row, y) => 
            row.map((pixel, x) => ({ x, y, pixel }))
        ),
        
        forEachPixel(action) {
            for(let y = 0; y < h; y++){
                var row = rows[y]

                for(let x = 0; x < w; x++){
                    action(x, y, row[x])
                }
            }
        },

        getPixel(x, y) {
            if (Number.isNaN(x) || Number.isNaN(y))
                throw "x and y must be a number"

            x = Math.round(x)
            y = Math.round(y)
            if (x < w && y < h && x >= 0 && y >= 0)
                return rows[y][x] 
        }
    }

}

function charLayout(x, y, text, draw, rotation = 0){
    //const cos = Math.cos(rotation)
    //const sin = Math.sin(rotation)

    const startX = x
    const startY = y

    for(const char of text){
        if (char === "\n"){
            x = startX
            y += 1
        }
        else {
            const rotatedX = x // cos*(x-startX)-sin*(y-startY) + startX
            const rotatedY = y // sin*(x-startX)+cos*(y-startY) + startY
            draw(rotatedX, rotatedY, char)
            x += 1
        }
    }
}
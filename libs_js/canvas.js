import {is_mdarray, isBrowser, KRect, MDList} from './common.js'

class Logger {
    constructor() {
        this.depth = 0
        this._tab_char = "  "
    }
    log(...args) {
        console.log(this._tab(),...args)
    }

    _tab() {
        let str = ""
        for(let i=0; i<this.depth; i++) {
            str += this._tab_char
        }
        return str
    }
}
let l = new Logger()
export class KCanvas extends KRect {
    constructor(x,y,w,h,scale) {
        super(x,y,w,h)
        this.scale = 1
        if(typeof scale === 'number') this.scale = scale
        if(isBrowser()) {
            this.canvas = document.createElement('canvas')
            this.canvas.width = this.w*this.scale
            this.canvas.height = this.h*this.scale
            this.canvas.style.width = `${this.w*this.scale/window.devicePixelRatio}px`
            this.canvas.style.height = `${this.h*this.scale/window.devicePixelRatio}px`
            document.body.append(this.canvas)
        }
        this.globalAlpha = 1.0
    }
    get width() {
        return this.w
    }
    get height() {
        return this.h
    }
    get size() {
        return [this.w,this.h]
    }
    setPixel(xy,color) {
        if(isBrowser()) {
            this.withContext(ctx => {
                let x = Math.floor(xy.get(0))
                let y = Math.floor(xy.get(1))
                ctx.translate(0.5,0.5)
                ctx.fillStyle = color.toCSSColor()
                // console.log("fillstyle is",color.toCSSColor())
                ctx.fillRect(
                    Math.floor(x),
                    Math.floor(y),
                    1,1
                )
                // console.log("drawing at",x,y,color)
            })
        }
    }
    fillRect(rect,color) {
        this.withContext(ctx => {
            ctx.fillStyle = color.toCSSColor()
            ctx.fillRect(rect.x,rect.y,rect.w,rect.h)
        })
    }
    strokeRect(rect,color) {
        this.withContext(ctx=> {
            ctx.strokeStyle = color.toCSSColor()
            ctx.strokeRect(rect.x,rect.y,rect.w,rect.h)
        })
    }
    fillCircle(circle, color) {
        this.withContext((ctx)=>{
            ctx.globalAlpha = this.globalAlpha
            ctx.fillStyle = color.toCSSColor()
            ctx.beginPath()
            ctx.arc(circle.x,circle.y,circle.r,0,2*Math.PI)
            ctx.fill()
        })
    }
    strokeCircle(circle, color) {
        this.withContext((ctx)=>{
            ctx.globalAlpha = this.globalAlpha
            ctx.strokeStyle = color.toCSSColor()
            ctx.beginPath()
            ctx.arc(circle.x,circle.y,circle.r,0,2*Math.PI)
            ctx.stroke()
        })
    }
    fill(shapes,color) {
        if(is_mdarray(shapes)){
            shapes.each(sh => {
                this.fill(sh,color)
            })
        } else {
            if(shapes instanceof KRect) {
                return this.fillRect(shapes,color)
            }
            l.log("filling unknown shape",shapes)
            throw new Error("")
        }
    }
    stroke(shapes,color) {
        if(is_mdarray(shapes)){
            shapes.each(sh => {
                this.stroke(sh,color)
            })
        } else {
            if(shapes instanceof KRect) {
                return this.strokeRect(shapes,color)
            }
            l.log("stroking unknown shape",shapes)
            throw new Error("")
        }
    }

    clear() {
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
    }

    strokePolyline(line,color) {
        this.withContext(ctx => {
            ctx.strokeStyle = color.toCSSColor()
            // ctx.strokeStyle = 'black'
            ctx.lineWidth = 0.1
            ctx.beginPath()
            for(let i=0; i<line.length; i++) {
                let pt = line.get1(i)
                if(i === 0) {
                    ctx.moveTo(pt.get1(0),pt.get1(1))
                } else {
                    ctx.lineTo(pt.get1(0),pt.get1(1))
                }
            }
            ctx.stroke()
        })
    }

    drawImage(xy,img) {
        // console.log("drawing image at",xy,img)
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            let x = xy.get(0)
            let y = xy.get(1)
            let w = img.shape[0]
            let h = img.shape[1]
            // console.log("drawing at",x,y,w,h,img)
            let image = new ImageData(w,h)
            for(let i=0; i<img.shape[0]; i++) {
                for(let j=0; j<img.shape[1]; j++) {
                    let n2 = (i + j*img.shape[0]) * 4
                    image.data[n2+0] = img.get3(i,j,0)*255
                    image.data[n2+1] = img.get3(i,j,1)*255
                    image.data[n2+2] = img.get3(i,j,2)*255
                    image.data[n2+3] = 255
                }
            }
            let can = document.createElement('canvas')
            can.width = w
            can.height = h
            let ctx2 = can.getContext('2d')
            ctx2.putImageData(image,0,0)
            // console.log("final image data is",image)
            ctx.save()
            ctx.imageSmoothingEnabled = false;
            ctx.scale(this.scale,this.scale)
            ctx.drawImage(can,x,y,can.width*window.devicePixelRatio,can.height*window.devicePixelRatio)

            ctx.restore()
        }
    }

    withContext(param) {
        let ctx =  this.canvas.getContext('2d')
        ctx.save()
        ctx.scale(this.scale,this.scale)
        param(ctx)
        ctx.restore()
    }
}


export class DPadWrapper {
    constructor() {
        this.state = {
            'ArrowDown':false,
            'ArrowUp':false,
            'ArrowRight':false,
            'ArrowLeft':false,
        }
        this.keydown = (e) => this.state[e.code] = true
        this.keyup = (e) => this.state[e.code] = false
        document.addEventListener('keydown',this.keydown)
        document.addEventListener('keyup', this.keyup)
    }
    current() {
        let h = 0
        if(this.state.ArrowLeft)  h = -1
        if(this.state.ArrowRight) h = 1
        let v = 0
        if(this.state.ArrowUp)   v = -1
        if(this.state.ArrowDown) v = 1
        return MDList(h,v)
    }
}

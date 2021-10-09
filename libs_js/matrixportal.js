import {isBrowser, KRect} from './common.js'

export const board = {
    SWITCH:"SWITCH",
}


export class KCanvas extends KRect {
    constructor(x,y,w,h) {
        super(x,y,w,h)
        this.scale = 10
        if(isBrowser()) {
            this.canvas = document.createElement('canvas')
            this.canvas.width = this.w * this.scale
            this.canvas.height = this.h * this.scale
            document.body.append(this.canvas)
        }
    }
    get width() {
        return this.w
    }
    get size() {
        return [this.w,this.h]
    }
    setPixel(xy,color) {
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            let x = xy.get(0)
            let y = xy.get(1)
            // console.log("drawing at",x,y,color)
            ctx.fillStyle = color.toCSSColor()
            // console.log("fillstyle is",color.toCSSColor())
            ctx.fillRect(
                Math.floor(x) * this.scale,
                Math.floor(y) * this.scale,
                this.scale,
                this.scale,
            )
        }
    }
    fillRect(rect,color) {
        // console.log("filling",rect,color)
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = color.toCSSColor()
        let xx = Math.floor(rect.x)*this.scale
        let ww = Math.floor(rect.w)*this.scale
        let yy = Math.floor(rect.y)*this.scale
        let hh = Math.floor(rect.h)*this.scale

        // console.log("filling",xx,yy,ww,hh, color.toCSSColor())
        ctx.fillRect(
            xx,
            yy,
            ww,
            hh,
        )
    }
    strokeRect(rect,color) {
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = color.toCSSColor()
        // console.log("stroking",rect,color)
        let xx = Math.floor(rect.x)*this.scale
        let ww = Math.floor(rect.w)*this.scale
        let yy = Math.floor(rect.y)*this.scale
        let hh = Math.floor(rect.h)*this.scale

        // console.log("filling",xx,yy,ww,hh, color.toCSSColor())
        ctx.fillRect(xx,yy,ww,this.scale)
        ctx.fillRect(xx,yy+hh-this.scale,ww,this.scale)
        ctx.fillRect(xx,yy,this.scale,hh)
        ctx.fillRect(xx+ww-this.scale,yy,this.scale,hh)
    }

    clear() {
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
    }
}


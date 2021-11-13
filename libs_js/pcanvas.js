import fs from 'fs'
import PImage from "pureimage"
import {isHeadless} from './common.js'
import {BaseCanvas} from './canvas.js'
export class PCanvas extends BaseCanvas {
    constructor(opts) {
        super(opts)
        console.log("making canvas",opts)
        this.canvas = PImage.make(opts.w*4,opts.h*4)
        let ctx = this.canvas.getContext('2D')
        ctx.fillStyle = 'white'
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
    }
    withContext(param) {
        let ctx =  this.canvas.getContext('2d')
        ctx.save()
        ctx.scale(this.scale*4,this.scale*4)
        param(ctx)
        ctx.restore()
    }
    write_to_png(pth) {
        console.log("writing ",this.canvas,'out to',pth)
        return PImage.encodePNGToStream(this.canvas, fs.createWriteStream(pth))
    }
}


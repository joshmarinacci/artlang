export function isHeadless() {
    if(typeof process !== 'undefined' && process.env && process.env.ARTLANG_HEADLESS) return true
    return false
}
export function isBrowser() {
    return !isHeadless()
}

export function print(...args) {
    console.log(...args)
}

export function _NOW() {
    return new Date().getTime()
}

export function zip(A, B) {
    let i = 0
    let out = new MDList()
    while(true) {
        if(i >= A.length) break
        if(i >= B.length) break
        let a  = A.get(i)
        let b  = B.get(i)
        out.push(new MDList(a,b))
        i += 1
    }
    // console.log("zip produced",JSON.stringify(out,null,'  '))
    return out
}
export function zipWith(A,B,binop) {
    return zip(A, B).map((tuple) => binop(tuple.get(0), tuple.get(1)))
}

export function makeZipWith(binop) {
    return function(A,B) {
        return zipWith(A,B,binop)
    }
}

const undef = (A) => typeof A === 'undefined'

export function makeBinOp(op) {
    return function(arr1, arr2) {
        // console.log("make bin op md",arr1.rank,'op',arr2.rank)
        if(typeof arr1 === 'undefined') {
            console.error("arr1 is missing for op",op)
        }
        if(typeof arr1.rank === 'undefined' && typeof arr2.rank === 'undefined') {
            return op(arr1,arr2)
        }
        if(typeof arr1.rank === 'undefined') {
            if(arr2.rank === 1) {
                let arr3 = new MDArray(arr2.shape)
                for(let i=0; i<arr2.shape[0]; i++) {
                    let a = arr1
                    let b = arr2.get1(i)
                    let v = op(a,b)
                    arr3.set1(i, v)
                }
                return arr3
            }
            if(arr2.rank === 2) {
                let arr3 = new MDArray(arr2.shape)
                for (let i = 0; i < arr2.shape[0]; i++) {
                    for (let j = 0; j < arr2.shape[1]; j++) {
                        let a = arr1
                        let b = arr2.get2(i, j)
                        let v = op(a, b)
                        arr3.set2(i, j, v)
                    }
                }
                return arr3
            }
        }
        if(typeof arr2.rank === 'undefined') {
            if(arr1.rank === 1) {
                let arr3 = new MDArray(arr1.shape)
                for (let i = 0; i < arr1.shape[0]; i++) {
                    let a = arr1.get1(i)
                    let b = arr2
                    let v = op(a, b)
                    arr3.set1(i,v)
                }
                return arr3
            }
            if(arr1.rank === 2) {
                // console.log('array vs scalar')
                let arr3 = new MDArray(arr1.shape)
                for (let i = 0; i < arr1.shape[0]; i++) {
                    for (let j = 0; j < arr1.shape[1]; j++) {
                        let a = arr1.get2(i, j)
                        let b = arr2
                        let v = op(a, b)
                        arr3.set2(i, j, v)
                    }
                }
                return arr3
            }
        }

        if(arr1.rank !== arr2.rank) {
            throw new Error(`cannot multiply arrays of different ranks ${arr1.rank} !== ${arr2.rank}`)
        }
        // console.log(`op on arrays ${arr1.rank} vs ${arr2.rank}`)
        let arr3 = new MDArray(arr1.shape)
        if(arr1.rank === 1) {
            for(let i=0; i<arr1.shape[0]; i++) {
                let a = arr1.get1(i)
                let b = arr2.get1(i)
                let c= op(a,b)
                // console.log(i, ' ' ,a,b,c)
                arr3.set1(i,c)
            }
            // console.log("returning array",arr3)
            return arr3
        }
        if(arr1.rank === 2) {
            for (let i = 0; i < arr1.shape[0]; i++) {
                for (let j = 0; j < arr1.shape[1]; j++) {
                    let a = arr1.get2(i, j)
                    let b = arr2.get2(i, j)
                    let v = op(a, b)
                    arr3.set2(i, j, v)
                }
            }
        }
        return arr3
    }
}
function makeBinOpMDAssign(op) {
    return function(arr1, arr2) {
        if(typeof arr2.rank === 'undefined') {
            if(arr1.rank === 1) {
                for(let i=0; i<arr1.shape[0]; i++) {
                    let a = arr1.get1(i)
                    let b = arr2
                    let c= op(a,b)
                    // console.log(i, ' ' ,a,b,c)
                    arr1.set1(i,c)
                }
                return
            }
            for(let i=0; i<arr1.shape[0]; i++) {
                for (let j = 0; j < arr1.shape[1]; j++) {
                    let a = arr1.get2(i, j)
                    let b = arr2
                    let v = op(a,b)
                    // console(i,j, ' ' , a,b,v)
                    arr1.set2(i, j, v)
                }
            }
            return
        }

        if(arr1.rank !== arr2.rank) {
            throw new Error(`cannot multiply arrays of different ranks ${arr1.rank} !== ${arr2.rank}`)
        }

        for(let i=0; i<arr1.shape[0]; i++) {
            for(let j=0; j<arr1.shape[1]; j++) {
                let a = arr1.get2(i,j)
                let b = arr2.get2(i,j)
                let v = op(a,b)
                arr2.set2(i,j,v)
            }
        }
        return
    }
}

class MDPropView {
    constructor(array, name) {
        this.array = array
        this.shape = [array.length]
        this.rank = 1
        this.propname = name
    }
    toJSFlatArray() {
        let out = []
        for(let i=0; i<this.array.shape[0]; i++) {
            let v = this.array.get1(i)
            out.push(v[this.propname])
        }
        return out
    }
    get1(i) {
        let v = this.array.get1(i)
        return v[this.propname]
    }
}

export function is_mdarray(obj) {
    if(obj && obj.rank > 0) return true
    return false
}

class MDView {
    constructor(array, def) {
        if(is_mdarray(def)) def = def.data
        this.array = array
        this.sliceshape=def
        this.shape = []
        def.forEach((d,i) => {
            if(d !== WILDCARD) {
                this.shape.push(this.array.shape[i])
            }
        })
        this.rank = def.filter( t => t !== WILDCARD).length
    }
    toJSON() {
        return {
            shape:this.shape,
            rank:this.rank,
            data:this.toJSFlatArray(),
        }
    }
    get1(n) {
        if(this.sliceshape[0]!== WILDCARD && this.sliceshape[1] === WILDCARD) {
            let i = this.sliceshape[0]
            return this.array.get2(i,n)
        }
        if(this.sliceshape[0]=== WILDCARD && this.sliceshape[1] !== WILDCARD) {
            let i = this.sliceshape[1]
            return this.array.get2(n,i)
        }
        throw new Error(`unsupported sliceshape ${this.sliceshape}`)
    }

    set1(n,v) {
        if(this.sliceshape[0]!== WILDCARD && this.sliceshape[1] === WILDCARD) {
            let i = this.sliceshape[0]
            let j = n
            this.array.set2(i, j, v)
        }
    }
    fill(v) {
        if(this.sliceshape[0]!== WILDCARD && this.sliceshape[1] === WILDCARD) {
            let i = this.sliceshape[0]
            for(let j = 0; j<this.array.shape[1]; j++) {
                this.array.set2(i, j, v)
            }
        }
        if(this.sliceshape[0]=== WILDCARD && this.sliceshape[1] !== WILDCARD) {
            let j = this.sliceshape[1]
            for(let i = 0; i<this.array.shape[0]; i++) {
                this.array.set2(i,j, v)
            }
        }
    }
    each(cb) {
        if(this.sliceshape[0]!== WILDCARD && this.sliceshape[1] === WILDCARD) {
            let i = this.sliceshape[0]
            for(let j = 0; j<this.array.shape[1]; j++) {
                let r = this.array.get2(i,j)
                cb(r,j)
            }
        }
        if(this.sliceshape[0]=== WILDCARD && this.sliceshape[1] !== WILDCARD) {
            let j = this.sliceshape[1]
            for(let i = 0; i<this.array.shape[0]; i++) {
                let r = this.array.get2(i,j)
                cb(r,i)
            }
        }
        return this
    }

    toJSFlatArray() {
        // console.log("shape is",this.shape)
        let out = []
        if(this.sliceshape[0]===WILDCARD && this.sliceshape[1] !== WILDCARD){
            let i = this.sliceshape[1]
            for(let j=0; j<this.array.shape[0]; j++) {
                out.push(this.array.get2(i,j))
            }
        }
        if(this.sliceshape[0]!== WILDCARD && this.sliceshape[1] === WILDCARD) {
            let i = this.sliceshape[0]
            for(let j=0; j<this.array.shape[1]; j++) {
                out.push(this.array.get2(i,j))
            }
        }
        return out
    }

}
export class MDArray {
    constructor(shape) {
        if(shape instanceof MDArray && shape.rank === 1) {
            shape = shape.data
        }
        this.rank = shape.length
        this.shape = shape
        let data_len = 1
        for(let i=0; i<shape.length; i++) {
            data_len *= shape[i]
        }
        if(this.rank === 0) {
            this.data = 0
        } else {
            // console.log(`MDArray making rank=${this.rank} shape=${this.shape} data len=${data_len}`)
            this.data = new Array(data_len)
            this.data.fill(0)
        }
    }
    get length() {
        if(this.rank === 1) return this.shape[0]
        throw new Error(`cannot get length of a rank ${this.rank} array`)
    }
    len() {
        if(this.rank !== 1) throw new Error(`Cannot do "len" on higher rank arrays. ${this.rank}`)
        return this.shape[0]
    }
    reshape(shape) {
        let s1 = this.shape.reduce((acc,v)=>{return v*acc},1)
        let s2 = shape.data.reduce((acc,v)=>{return v*acc},1)
        if(s1 === s2) {
            let arr = new MDArray(shape)
            arr.data = this.data.slice()
            return arr
        }
    }
    shuffle() {
        if(this.rank !== 1) throw new Error(`Cannot do "shuffle" on higher rank arrays. ${this.rank}`)
        let arr1 = this.data.slice()
        let arr2 = []
        while(arr1.length > 0) {
            let n = Math.floor(Math.random() * arr1.length)
            arr2.push(arr1[n])
            arr1.splice(n,1)
        }
        let list = new MDList(...arr2)
        // console.log("shuffled",this.toJSFlatArray(),'to',list.toJSFlatArray())
        return list
    }

    sum() {
        if(this.rank !== 1) throw new Error(`Cannot do "sum" on higher rank arrays. ${this.rank}`)
        let total = 0
        for(let i=0; i<this.shape[0];i++) {
            let r = this.get1(i)
            total += r
        }
        return total
    }
    min() {
        if(this.rank !== 1) throw new Error(`Cannot do "min" on higher rank arrays. ${this.rank}`)
        let min = Number.MAX_VALUE
        for(let i=0; i<this.shape[0];i++) {
            let r = this.get1(i)
            if(r < min) min = r
        }
        return min
    }
    empty() {
        return this.len() === 0
    }
    max() {
        if(this.rank !== 1) throw new Error(`Cannot do "max" on higher rank arrays. ${this.rank}`)
        let max = Number.MIN_VALUE
        for(let i=0; i<this.shape[0];i++) {
            let r = this.get1(i)
            if(r > max) max = r
        }
        return max
    }

    take(n) {
        if(this.rank !== 1) throw new Error(`Cannot do "take" on higher rank arrays. ${this.rank}`)
        let arr = []
        for(let i=0; i<this.shape[0];i++) {
            let r = this.get1(i)
            if(i < n) arr.push(r)
        }
        return new MDList(...arr)
    }
    drop(n) {
        if(this.rank !== 1) throw new Error(`Cannot do "take" on higher rank arrays. ${this.rank}`)
        let arr = []
        for(let i=0; i<this.shape[0];i++) {
            let r = this.get1(i)
            if(i >= n) arr.push(r)
        }
        return new MDList(...arr)
    }
    partition(n) {
        console.log("partioning with",n)
        if(this.rank !== 1) throw new Error(`Cannot do "take" on higher rank arrays. ${this.rank}`)
        let before = []
        let after = []
        let len = this.shape[0]
        if (n < 0) n = len+n
        console.log("using",n)
        for(let i=0; i<len; i++) {
            let r = this.get1(i)
            if(i < n) {
                before.push(r)
            } else {
                after.push(r)
            }
        }
        return [before,after]
    }
    rotate(n) {
        if(this.rank !== 1) throw new Error(`Cannot do "take" on higher rank arrays. ${this.rank}`)
        if(n < 0) {
            let parts = this.partition(-n)
            console.log("parts are",parts)
            let arr = parts[1].concat(parts[0])
            console.log("new array is",arr)
            return new MDList(...arr)
        } else {
            let parts = this.partition(-n)
            console.log("parts are",parts)
            let arr = parts[1].concat(parts[0])
            console.log("new array is",arr)
            return new MDList(...arr)
        }
    }

    map(cb) {
        return this._iter(cb)
    }
    filter(cb) {
        if(this.rank !== 1) throw new Error(`Cannot do "filter" on higher rank arrays. ${this.rank}`)
        let arr = []
        for(let i=0; i<this.shape[0];i++) {
            let r = this.get1(i)
            let s = cb(r)
            if(s) arr.push(r)
        }
        return new MDList(...arr)
    }
    find(cb) {
        if(this.rank !== 1) throw new Error(`Cannot do "find" on higher rank arrays. ${this.rank}`)
        for(let i=0; i<this.len();i++) {
            let r = this.get1(i)
            let s = cb(r)
            if(s) return r
        }
        return null
    }
    findIndex(cb) {
        if(this.rank !== 1) throw new Error(`Cannot do "find" on higher rank arrays. ${this.rank}`)
        for(let i=0; i<this.len();i++) {
            let r = this.get1(i)
            let s = cb(r)
            if(s) return i
        }
        return null
    }
    _iter(cb) {
        if(this.rank === 1) {
            let arr = new MDArray(this.shape)
            for (let i = 0; i < this.shape[0]; i++) {
                let r = this.get1(i)
                let s = cb(r,i)
                arr.set1(i,s)
            }
            return arr
        }
        if(this.rank === 2) {
            let arr = new MDArray(this.shape)
            for(let j=0; j<this.shape[1]; j++) {
                for (let i = 0; i < this.shape[0]; i++) {
                    let r = this.get2(i,j)
                    let s = cb(r,i,j)
                    arr.set2(i,j,s)
                }
            }
            return arr
        }
        throw new Error(`can't map higher rank arrays ${this.rank}`)
    }
    each(cb) {
        this._iter(cb)
    }

    toJSFlatArray() {
        return this.data.map(v => {
            if(is_mdarray(v)) return v.toJSFlatArray()
            return v
        })
    }

    get(i) { return this.get1(i)}
    is_valid_index(i,j,k) {
        if(typeof i === 'undefined') return false
        if(this.rank === 1) {
            return i >= 0 && i < this.shape[0]
        }
        if(this.rank === 2) {
            if(is_mdarray(i)) {
                let n = i
                i = n.get(0)
                j = n.get(1)
            }
            return (
                i >= 0 && i < this.shape[0]
                && j >= 0 && j < this.shape[1]
            )
        }
    }
    index(i,j,k) {
        if(this.rank === 1) return i
        if(this.rank === 2) return i + j*this.shape[0]
        return i + j*this.shape[0] + k*this.shape[1]
    }
    _get_value(n) {
        if(n > this.data.length) throw new Error(`index out of range get2(${i},${j}) in shape ${this.shape}`)
        return this.data[n]
    }
    _set_value(n,v) {
        if(n > this.data.length) throw new Error(`index out of range get2(${i},${j}) in shape ${this.shape}`)
        this.data[n] = v
    }
    get1(i) {
        if(is_mdarray(i) && i.rank === 1) return this.get2(... i.data)
        return this._get_value(this.index(i))
    }
    set1(i, v) {
        if(is_mdarray(i) && i.rank === 1) return this.set2(...i.data,v)
        return this._set_value(this.index(i),v)
    }
    get2(i,j) {
        if(i === WILDCARD || j === WILDCARD) return this.slice([i,j])
        return this._get_value(this.index(i,j))
    }
    set2(i,j, v) {
        return this._set_value(this.index(i,j),v)
    }
    get3(i,j,k) {
        return this._get_value(this.index(i,j,k))
    }
    set3(i,j,k, v) {
        return this._set_value(this.index(i,j,k),v)
    }

    fill(val) {
        this.data.fill(val)
        return this
    }

    fillWith(cb) {
        if(this.rank === 1) {
            for(let i=0; i<this.shape[0]; i++) {
                let n = this.index(i)
                this.data[n] = cb(i)
            }
            return
        }
        for(let i=0; i<this.shape[0]; i++) {
            for (let j = 0; j < this.shape[1]; j++) {
                let n = this.index(i,j)
                this.data[n] = cb(i, j)
            }
        }
    }

    slice(def) {
        return new MDView(this, def)
    }
    propslice(name) {
        if(this.rank !== 1) throw new Error(`cannot take a property slice of an array of rank ${this.rank}`)
        return new MDPropView(this,name)
    }
    flatten() {
        let arr = []
        this.data.forEach(el => {
            if(is_mdarray(el)) {
                let data = el.flatten()
                data.each(d => {
                    arr.push(d)
                })
            } else {
                arr.push(el)
            }
        })
        return MDArray_fromList(arr,this.shape)
    }
    push_end(v) {
        if(this.rank !== 1) throw new Error(`can't push into array of rank ${this.rank}`)
        this.data.push(v)
        this.shape[0] += 1
    }
    push_end_all(arr) {
        if(this.rank !== 1) throw new Error(`can't push into array of rank ${this.rank}`)
        for(let i=0; i<arr.data.length; i++) {
            this.push_end(arr.data[i])
        }
    }
    pop_end() {
        if(this.rank !== 1) throw new Error(`can't push into array of rank ${this.rank}`)
        let v = this.data.pop()
        this.shape[0] -= 1
        return v
    }
    pop_start() {
        if(this.rank !== 1) throw new Error(`can't pop into array of rank ${this.rank}`)
        let val = this.data.shift()
        this.shape[0] -= 1
        return val
    }
    toJSON() {
        return {
            shape:this.shape,
            rank:this.rank,
            data:this.toJSFlatArray(),
        }
    }
}
export function MDArray_fromList(data, shape) {
    let arr = new MDArray(shape)
    arr.data = data
    return arr
}
export function rangeMD(min,max,step) {
    if(typeof step === 'undefined') step = 1
    if(typeof max === 'undefined') return rangeMD(0,min)
    let data = []
    // console.log("range",min,max,step)
    for(let i=min; i<max; i+=step) {
        data.push(i)
    }
    return MDArray_fromList(data,[data.length])
}
export function MDList(...data) {
    return MDArray_fromList(data,[data.length])
}


// export class KColor {
//     constructor(r,g,b) {
//         this.r = r
//         this.g = g
//         this.b = b
//     }
//     toCSSColor() {
//         return `rgb(${Math.floor(this.r*255)}, ${Math.floor(this.g*255)},${Math.floor(this.b*255)})`
//     }
// }
export class KeyColor {
    constructor(args) {
        if(!args) args = {}
        this.red = 0
        this.green = 0
        this.blue = 0
        if(args.hasOwnProperty('red')) this.red = args.red
        if(args.hasOwnProperty('r')) this.red = args.r
        if(args.hasOwnProperty('green')) this.green = args.green
        if(hasProp(args,'g')) this.green = args.g
        if(args.hasOwnProperty('blue')) this.blue = args.blue
        if(hasProp(args,'b')) this.blue = args.b
        if(args.hasOwnProperty('gray')) {
            this.red = args.gray
            this.green =  args.gray
            this.blue = args.gray
        }
        if(args.hasOwnProperty('hue')) {
            let hue = args.hue
            let sat = args.sat
            let lit = args.lit
            let [red,green,blue] = hslToRgb(hue,sat,lit)
            this.red = red
            this.green = green
            this.blue = blue
        }
    }
    toCSSColor() {
        return `rgb(${Math.floor(this.red*255)}, ${Math.floor(this.green*255)},${Math.floor(this.blue*255)})`
    }
}

export const WILDCARD = "WILDCARD"
export const BLACK = new KeyColor({})
export const BLUE  = new KeyColor({b:1})
export const RED   = new KeyColor({r:1})
export const GREEN = new KeyColor({g:1})
export const WHITE = new KeyColor({r:1, g:1, b:1})
export const YELLOW = new KeyColor({r:1, g:1})
export const GRAY = new KeyColor({r:0.5, g:0.5, b:0.5})
export const PI = Math.PI

export class KObj {
    constructor() {
    }
}
export class KPoint extends MDList {
    constructor(x,y) {
        super(x,y)
    }
}
export class KVector extends MDList{
    constructor(x,y) {
        super(x,y)
    }
}
export class KRect {
    constructor(x,y,w,h) {
        this.color = RED
        if(typeof x === 'object') {
            let opts = x
            this.x = opts.x || 0
            this.y = opts.y || 0
            this._w = opts.w || 10
            this._h = opts.h || 10
            if(hasProp(opts,'color')) this.color = opts.color
        } else {
            this.x = x
            this.y = y
            this._w = w
            this._h = h
        }
    }
    get x1() {
        return this.x
    }
    get x2() {
        return this.x + this._w
    }
    get y1() {
        return this.y
    }
    get y2() {
        return this.y + this._h
    }
    get w() {
        return this._w
    }
    get h() {
        return this._h
    }
    get size() {
        return new KPoint(this._w,this._h)
    }
    get left() {
        return this.x
    }
    get right() {
        return this.x + this._w
    }
    get top() {
        return this.y
    }
    get bottom() {
        return this.y2
    }
    split(dir,amount) {
        if (dir === 'h') return new MDList(
            new KRect({
                x:this.x1,
                y:this.y1,
                w:lerp(amount, this.x1, this.x2),
                h:this.y2
            }),
            new KRect({
                x:lerp(amount, this.x1, this.x2), y:this.y1,
            w:this.x2, h:this.y2,
            })
        )
        if (dir === 'v') return new MDList(
            new KRect({
                x:this.x1, y:this.y1,
                w:this.x2, h:lerp(amount, this.y1, this.y2)}),
            new KRect({
                x:this.x1, y:lerp(amount, this.y1, this.y2),
                w:this.x2, h:this.y2})
        )
    }
    contains(pos) {
        if(pos.get(0)<this.x) return false
        if(pos.get(1)<this.y) return false
        if(pos.get(0)>this.x2) return false
        if(pos.get(1) > this.y2) return false
        return true
    }
}
export class KLine {
    constructor(args) {
        this.x1 = 0
        this.y1 = 0
        this.x2 = 0
        this.y2 = 0
        if(hasProp(args,'x')) this.x1 = args.x
        if(hasProp(args,'y')) this.y1 = args.y
        if(hasProp(args,'x1')) this.x1 = args.x1
        if(hasProp(args,'y1')) this.y1 = args.y1
        if(hasProp(args,'x2')) this.x2 = args.x2
        if(hasProp(args,'y2')) this.y2 = args.y2
        this.lineWidth = 1
        if(hasProp(args,'lineWidth')) this.lineWidth = args.lineWidth
        this.color = RED
        if(hasProp(args,'color')) this.color = args.color

        if(hasProp(args,'start')) {
            this.x1 = args.start.get1(0)
            this.y1 = args.start.get1(1)
        }
        if(hasProp(args,'end')) {
            this.x2 = args.end.get1(0)
            this.y2 = args.end.get1(1)
        }
    }
}
export class KCircle{
    constructor(args) {
        if(hasProp(args,'x')) this.x = args.x
        if(hasProp(args,'y')) this.y = args.y
        if(hasProp(args,'r')) this.r = args.r
        if(hasProp(args,'radius')) this.r = args.radius
    }
    get center() {
        return new KPoint(this.x,this.y)
    }
    set center(kp) {
        this.x = kp.data[0]
        this.y = kp.data[1]
    }
    get radius() {
        return this.r
    }
}
export class KLabel {
    constructor(opts) {
        this.xy = new MDList(0,0)
        this.text = "-???-"
        this.color = BLACK
        if(hasProp(opts,'xy')) this.xy = opts.xy
        if(hasProp(opts,'x')) this.xy.set1(0,opts.x)
        if(hasProp(opts,'y')) this.xy.set1(1,opts.y)
        if(hasProp(opts,'text')) this.text = opts.text
        if(hasProp(opts,'color')) this.color = opts.color
    }
}

export function hasProp(args,name) {
    return args.hasOwnProperty(name)
}



export const add = makeBinOp((a,b)=>a+b)
export const subtract = makeBinOp((a,b)=>a-b)
export const multiply = makeBinOp((a,b)=>a*b)
export const divide = makeBinOp((a,b)=>a/b)
export const lessthan = makeBinOp((a,b)=>a<b)
export const greaterthan = makeBinOp((a,b)=>a>b)
export const lessthanorequal = makeBinOp((a,b)=>a<=b)
export const greaterthanorequal = makeBinOp((a,b)=>a>=b)
export const equal = makeBinOp((a,b)=>a===b)
export const notequal = makeBinOp((a,b)=>a!==b)
export const or    = makeBinOp((a,b)=>a||b)
export const and    = makeBinOp((a,b)=>a&&b)
export const not   = (a) => !a
export const mod   = makeBinOp((a,b) => a%b)


function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
            h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function sfc32(a, b, c, d) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

export class RandomNumberGenerator {
    constructor(seed_str) {
        let seed = xmur3(seed_str)
        this.randfun = sfc32(seed(), seed(), seed(), seed());
    }
    random() {
        return this.randfun()
    }
}
export function makeRandom(seed_str) {
    if(!seed_str) seed_str = "artlang"
    return new RandomNumberGenerator(seed_str)
}
export function choose(list) {
    let n = Math.floor(Math.random()*list.length)
    return list.get(n)
}
export function randi(min,max) {
    if(typeof max === 'undefined') return randi(0,min)
    return Math.floor(Math.random()*(max-min) + min)
}
export function randf(min,max) {
    if(typeof max === 'undefined')  return randf(0,min)
    return Math.random()*(max-min) + min
}
export function range(min,max,step) {
    if(typeof max === 'undefined') return range(0,min,1)
    if(typeof step === 'undefined') step = 1
    let arr = []
    for(let i=min; i<max; i=i+step) {
        arr.push(i)
    }
    return new MDList(...arr)
}
export function deal(N,min,max) {
    if(is_mdarray(min)) return min.shuffle().take(N)
    if(Number.isInteger(max)) return range(N).map(() => randi(min,max))
    if(max && !Number.isNaN(max)) return range(N).map(() => randf(min,max))
    if(Number.isInteger(min)) return range(N).map(() => randi(min))
    if(min && !Number.isNaN(min)) return range(N).map(() => randf(min))
    if(N && !min && !max) return range(N).map(()=>randf())
    throw new Error(`can't run deal(${N},${min},${max}). min or max is bad`)
}
export function wait(time) {
    // console.log('waiting for time',time)
}

function get_at(arr,i) {
    if(arr.data) return arr.get(i)
    return arr[i]
}
function triple_map(a,b,c,cb) {
    let res = []
    for(let i=0; i<a.length; i++) {
        let aa = get_at(a,i)
        let bb = get_at(b,i)
        let cc = get_at(c,i)
        res.push(cb(aa,bb,cc))
    }
    return new MDList(...res)
}

export function wrap(val, min, max) {
    // console.log('wrapping',val,'between',min,'and',max)
    if(val.data ) {
        // console.log("wrapping a list")
        return triple_map(val,min,max,(a,b,c)=>{
            return wrap(a,b,c)
        })
        // return new KList([
        //     wrap(val.get(0),min.get(0),max.get(0)),
        //     wrap(val.get(1),min.get(1),max.get(1))
        // ])
    }
    if(val < min) return val + (max-min)
    if(val > max) return val - (max-min)
    return val
}
export function lerp(t,min,max) {
    return ((max - min) * t) + min
}
export function remap(val, min, max, MIN, MAX) {
    let t = (val - min) / (max - min)
    return ((MAX - MIN) * t) + MIN
}

export function sleep(dur) {
    return new Promise((res,rej)=>{
        setTimeout(()=>{
            res()
        },Math.floor(dur*1000))
    })
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r,g,b]//, Math.round(g * 255), Math.round(b * 255)];
}

// export function HSL(h,s,v) {
//     let rgb8 = hslToRgb(h,s,v)
//     return new KColor(rgb8[0]/255,rgb8[1]/255,rgb8[2]/255)
// }
export const STD_SCOPE = {
    List:(...args)=> new MDList(...args),
    getPart:(obj,name) => obj[name],
    range,
    add,
    subtract,
    divide,
    multiply,
    lessthan,
    greaterthan,
    lessthanorequal,
    greaterthanorequal,
    equal,
    notequal,
    not,
    or,
    and,
    mod,
    randi,
    randf,
    choose,
    wrap,
    lerp,
    remap,
    WILDCARD:WILDCARD,
    floor:Math.floor,
    sleep,
    sine1: (v) => remap(Math.sin(v), -1, 1, 0,1),
    Color:(...args) => new KeyColor(...args),
    KeyColor:(...args) => new KeyColor(...args),
    // Canvas:(...args) => new KCanvas(...args),
    Obj:(...args) => new KObj(...args),
    Point:(...args) => new KPoint(...args),
    Vector:(...args) => new KVector(...args),
    Rect:(...args) => new KRect(...args),
    Circle:(...args) => new KCircle(...args),
    Line:(...args) => new KLine(...args),
    Label:(...args) => new KLabel(...args),
    MDArray:(...args) => new MDArray(...args),
    NOTHING:Symbol('nothing'),
    RETURN:Symbol('return'),
    _test:(val) => {
        if(typeof val === 'boolean') return val
        // console.log("testing value",val, typeof val)
        if(is_mdarray(val)) {
            let good = true
            val.map((v,i,j)=>{
                // console.log("checking element",v)
                if(!v) good = false
            })
            return good
        }
        return true
    },
    ifcond:(p,t,e) => {
        if(p) {
            return t()
        }  else {
            return e()
        }
    }
}

export class TaskManager {
    constructor() {
        this.tasks = []
    }
    register(name,fun,type) {
        this.register_task(type,name,fun)
    }

    register_task(type, name, fun) {
        this.tasks.push({
            name:name,
            type:type,
            fun:fun,
            start:_NOW(),
            delay:0,
            pending:false,
        })
    }

    _run_task(task) {
        // console.log("task is",task.name)
        if(task.pending) {
            // console.log(`${task.name} already running`)
            return
        }
        // console.log(`starting ${task.name}`)
        task.pending = true
        let prom = task.fun()
        // if(!prom) console.error("task did not return a promise!")
        if(prom) {
            prom.then(() => task.pending = false)
        } else {
            task.pending = false
        }
    }

    start() {
        print("starting the task master")
        this.tasks.filter(t => t.type === 'start').forEach(this._run_task)
    }
    cycle() {
        // print("task master cycling")
        this.tasks.filter(t => t.type === 'event').forEach(this._run_task)
        this.tasks.filter(t => t.type === 'loop').forEach(this._run_task)
        this.tasks.filter(t => t.type === 'mode').forEach(this._run_task)
    }
}

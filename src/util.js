import fs from 'fs'
import path from 'path'
import child_process from 'child_process'
import {promisify} from 'util'
import {ast_to_js, unreturn, ast_preprocess} from './generate_js.js'
import {is_mdarray, STD_SCOPE} from '../libs_js/common.js'
import {make_grammar_semantics} from './grammar.js'

const exec = promisify(child_process.exec);

const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

export function log(...args) {
    console.info(...args)
}

export async function file_exists(src_file) {
    try {
        await fs.promises.stat(src_file)
        return true
    } catch(e) {
        return false
    }
}
export async function file_to_string(src_file) {
    // log("reading from", src_file)
    let raw = await fs.promises.readFile(src_file)
    return raw.toString()
}

export async function write_to_file(path, data) {
    // log("writing to", path)
    await fs.promises.writeFile(path, data)
}

export async function copy_file(src, dst) {
    let data = await file_to_string(src)
    await write_to_file(dst, data)
}

export async function mkdirs(dir) {
    // log("making dir", dir)
    await fs.promises.mkdir(dir, {recursive: true})
}

function mdarray_compare(A, B) {
    // console.log("comparing mdarrays",A,B)
    if(A.rank !== B.rank) return false
    let a = A.toJSFlatArray()
    let b = B.toJSFlatArray()
    // console.log('data',a,b)
    if(a.length !== b.length) return false
    for(let i=0; i<a.length; i++) {
        // console.log("vals",a[i],b[i])
        if(!checkEqual(a[i],b[i])) return false
    }
    return true
}

export function checkEqual(A, B) {
    // console.log("comparing",A,B)
    if (typeof A !== typeof B) throw new Error(`different types "${typeof A}" not equal "${typeof B}"`)
    // don't compare functions if they already have the same name
    if (typeof A === 'function') return true
    // console.log("testing",A,B, A===B)
    if (A === B) return true
    if (typeof A === 'object') {
        // console.log("checking", A, B)
        if(is_mdarray(A) && is_mdarray(B))  return mdarray_compare(A,B)
        let a_keys = Object.getOwnPropertyNames(A)
        let b_keys = Object.getOwnPropertyNames(B)
        if (a_keys.length !== b_keys.length) throw new Error("different number of keys")
        for (let i = 0; i < a_keys.length; i++) {
            if (a_keys[i] !== b_keys[i]) throw new Error(`different keys ${a_keys[i]} != ${b_keys[i]}`)
        }
        Object.keys(A).forEach((key) => {
            // console.log('checking',key,A[key])
            // console.log('checking',B[key])
            checkEqual(A[key], B[key])
        })
        return true
    }
    if (A !== B) throw new Error(`Not equal: ${A} ${B}`)
    return true
}

export async function force_delete(tempOutDir) {
    try {
        await fs.promises.rm(tempOutDir, {recursive: true})
    } catch (e) {

    }
}

export async function test_js(scope, code, ans) {
    const [grammar, semantics] = await make_grammar_semantics()
    console.log(`parsing: "${code}"`)
    let result = grammar.match(code, 'Exp')
    if (!result.succeeded()) throw new Error(`failed parsing: ${code}`)
    await mkdirs("temp")
    let ast = semantics(result).ast()
    // console.log("ast is",JSON.stringify(ast,null,'  '))
    let ast2 = ast_preprocess(ast)
    let res = ast_to_js(ast2)
    // console.log("initial res is",res)
    if(Array.isArray(res)) {
        let last = res[res.length-1]
        last = 'return '+unreturn(last)
        // console.log('last is',last)
        res[res.length-1] = last
        res = res.join("\n")
    } else {
        if(!res.startsWith('return')) res = 'return ' + res
    }
    let imports = Object.keys(STD_SCOPE).map(key => {
        return `const ${key} = lib.STD_SCOPE.${key}`
    }).join("\n")
    res = `import * as lib from "../libs_js/common.js"
        ${imports}
export function doit() {
    ${res}
}
console.log(JSON.stringify(doit(),null,'  '))
        `
    // console.log("generated code", res)
    let pth = `temp/generated_${Math.floor(Math.random()*10000)}.js`
    await write_to_file(pth, res)
    try {
        console.log("going to run the node code",pth)
        // console.log(res)
        let {stdout, stderr}  = await exec(`node ${pth}`)
        let ans_str = JSON.stringify(ans,null,'  ')
        stdout = stdout.trim().trim()
        console.log(`comparing ${stdout}`,stderr,'vs answer',ans_str)
        if (!checkEqual(stdout, ans_str)) throw new Error("not equal")
    } catch (e) {
        console.log("error happened",e)
        console.log('file://'+path.resolve(pth))
        throw e
    }
}

export async function test_raw_py(code, ans) {
    await mkdirs("temp")
    console.log('generated source is',code)
    let pth = `temp/generated_${Math.floor(Math.random()*10000)}.py`
    await write_to_file(pth, code)
    try {
        console.log("going to run the python code",pth)
        let {stdout, stderr}  = await exec(`python3 ${pth}`)
        stdout = stdout.trim()
        console.log(`comparing \n---\n${stdout}\n---`,stderr,'\nvs',`\n----\n${ans}\n----\n`)
        if (!checkEqual(stdout, ans.trim())) throw new Error("not equal")
    } catch (e) {
        console.log("error happened",e)
        console.log("from code",code)
        throw e
    }
}

export function genid(s) {
    return `${s}_${Math.floor(Math.random() * 10000)}`
}

import fs from "fs"
import path from 'path'
import express from "express"
import {copy_file, file_exists, file_to_string, genid, mkdirs, write_to_file} from './util.js'
import {make_grammar_semantics} from './grammar.js'
import {STD_SCOPE} from '../libs_js/common.js'
import {ast_preprocess, ast_to_js} from './generate_js.js'
import {ast_preprocess_py, ast_to_py, PyOutput} from './generate_py.js'
import {BOARDS} from './boards.js'

function strip_directives(ast) {
    let directives = ast.body.filter(c => c.type === 'directive')
    ast.body = ast.body.filter(c => c.type !== 'directive')
    return directives
}

async function compile_js(src_file,out_dir, opts) {
    let src = await file_to_string(src_file)
    src = "\n{\n" + src + "\n}\n" //add the implicit block braces
    let generated_src_prefix = calc_basename(src_file)
    let generated_src_out_name = generated_src_prefix + ".js"
    const [grammar, semantics] = await make_grammar_semantics()
    let result = grammar.match(src,'Exp')
    if(!result.succeeded()) {
        console.log(result.shortMessage)
        console.log(result.message)
        return
    }
    let ast = ast_preprocess(semantics(result).ast())
    let directives = strip_directives(ast)

    let before = []
    before.push(`import * as lib from "./common.js"`)

    let board = BOARDS.canvas
    let after = []
    directives.forEach(dir => {
        // console.log("directive",dir)
        if(dir.name.name === 'board') {
            board = BOARDS[dir.args[0].value]
        }
        if(dir.name.name === 'type') {
            if(dir.args[0].value === 'start') {
                // console.log("got a setup directive",dir)
                let name = dir.args[1].name
                after.push(`tm.register("${name}",${name},'start')`)
            }
            if(dir.args[0].value === 'loop') {
                // console.log("got a loop directive")
                let name = dir.args[1].name
                after.push(`tm.register("${name}",${name},'loop')`)
            }
            if(dir.args[0].value === 'event') {
                // console.log("got an event directive",dir)
                let name = dir.args[1].name
                let fun = dir.args[2].name
                after.push(`const event_wrapper = ()=> {
                    if(${name}.wasClicked()) {
                       ${fun}()
                    }
                    ${name}.clear()
                }`)
                after.push(`tm.register("${name}",event_wrapper,'event')`)
            }
        }
    })

    if(opts && opts.board) board = BOARDS[opts.board]
    console.log("using board",board)
    let generated_src = ast_to_js(ast).join("\n")

    let imports = Object.keys(STD_SCOPE).map(key => {
        return `const ${key} = lib.STD_SCOPE.${key}`
    }).join("\n")

    before.push(imports)
    before.push(`import {GREEN, RED, BLACK, WHITE, BLUE, GRAY, YELLOW, isHeadless, TaskManager, print, makeRandom} from './common.js'`)
    if(board.javascript.before) before.push(board.javascript.before)
    before.push("const tm = new TaskManager()")
    before.push(`let system = {
    startTime: new Date().getTime()/1000,
    currentTime:0
      }\n`)

    if(board.javascript.standard_cycle===true) {
        after.push(`
            tm.start()
            function do_cycle() {
                system.currentTime = new Date().getTime()/1000
                system.time = system.currentTime-system.startTime
                tm.cycle()
                setTimeout(do_cycle,100)
            }
            do_cycle()
        `)
    }
    if(board.javascript.after) after.push(board.javascript.after)
    generated_src = before.join("\n") + generated_src + after.join("\n")
    // console.log('final',generated_src)
    let outfile = path.join(out_dir, generated_src_out_name)
    console.log("writing",outfile)
    await write_to_file(outfile, generated_src)
    await web_template(src_file, out_dir, board)
}

async function prep(outdir) {
    await mkdirs(outdir)
}

function calc_basename(src) {
    let n = src.lastIndexOf('.')
    let ext = ""
    if(n >0) ext = src.substring(0,n)
    src = path.basename(src,ext)
    return src
}

async function web_template(src, out_dir, board) {
    console.log("doing html template for",board)
    let TEMPLATE_PATH = "templates/web_template.html"
    if(board.javascript.template_path) TEMPLATE_PATH = board.javascript.template_path
    console.log("using template",TEMPLATE_PATH)
    let name = calc_basename(src)
    let templ = await file_to_string(TEMPLATE_PATH)
    templ = templ.replace("${LIB_SRC}","./common.js")
    templ = templ.replace("${APP_SRC}","./"+name+".js")
    templ = templ.replace("${RELOAD}","./reload.js")
    await write_to_file(path.join(out_dir, name+".html"), templ)
}

async function copy_js_libs(out_dir) {
    await copy_file("./libs_js/common.js",path.join(out_dir,'common.js'))
    await copy_file("./libs_js/canvas.js",path.join(out_dir,'canvas.js'))
    await copy_file("./libs_js/pcanvas.js",path.join(out_dir,'pcanvas.js'))
    await copy_file("./libs_js/matrixportal.js",path.join(out_dir,'matrixportal.js'))
    await copy_file("./libs_js/trellis.js",path.join(out_dir,'trellis.js'))
    await copy_file("./libs_js/thumby.js",path.join(out_dir,'thumby.js'))
    await copy_file("./libs_js/trinkey.js",path.join(out_dir,'trinkey.js'))
    await copy_file("./templates/reload.js",path.join(out_dir,'reload.js'))
}

async function start_webserver(src,outdir) {
    let basename = calc_basename(src)
    let watchfile = path.join(outdir,basename+".js")
    const PORT = 8080
    let app = express()
    app.use('/',express.static('build'))
    console.log('watching for changes in the webserver',watchfile)
    app.get("/lastmod.json",async (req,res)=>{
        let stats = await fs.promises.stat(watchfile)
        res.send({"mod":stats.mtime})
    })
    await app.listen(PORT,()=>{
        console.log(`app listening at http://localhost:${PORT}/${basename}.html`)
    })
    console.log("webserver started")
}

async function start_filewatcher(src,outdir, cb) {
    try {
        console.log("watching",src)
        let base = path.basename(src)
        const watcher = fs.promises.watch(src);
        for await (const event of watcher) {
            console.log(event);
            if(event.eventType === 'change' && event.filename === base) {
                console.log("we need to recompile the page")
                await cb()
                console.log("recompiled",src)
            }
        }
    } catch (err) {
        if (err.name === 'AbortError')
            return;
        throw err;
    }

    // await compile(src,outdir)
}

export async function compile_py(opts) {
    let src_path = opts.src
    let outdir = opts.outdir
    console.log("processing",src_path,'to python dir',outdir)
    let src = await file_to_string(src_path)
    src = "\n{\n" + src + "\n}\n" //add the implicit block braces
    let generated_src_prefix = calc_basename(src_path)
    let generated_src_out_name = generated_src_prefix + ".py"
    if(opts.outfile) generated_src_out_name = opts.outfile
    const [grammar, semantics] = await make_grammar_semantics()
    let result = grammar.match(src,'Exp')
    if(!result.succeeded()) {
        console.log(result.shortMessage)
        console.log(result.message)
        return
    }
    let board = null
    let ast = semantics(result).ast()
    ast = ast_preprocess_py(ast)
    let directives = strip_directives(ast)
    directives.forEach(dir => {
        // console.log(dir)
        if(dir.name.name === 'board') {
            board = BOARDS[dir.args[0].value]
        }

    })
    console.log("board",board)
    // console.log("ast is",ast)
    let out = new PyOutput()
    ast_to_py(ast,out)
    // console.log("end result is",out)
    let generated_src = out.generate()
    let TEMPLATE_PATH = "circuitpython_template.py"
    if(board.python.template_path) TEMPLATE_PATH = board.python.template_path
    console.log("using template path", TEMPLATE_PATH)
    let template = await file_to_string(TEMPLATE_PATH)
    template = template.replace("${BOARD_IMPORTS}",board.python.imports)
    template = template.replace("${USER_VARIABLES}","")
    let after = []
    directives.forEach(dir => {
        // console.log("dirs",dir)
        if (dir.name.name === 'type') {
            if (dir.args[0].value === 'start') {
                // console.log("got a setup directive",dir)
                let name = dir.args[1].name
                after.push(`tm.register("${name}",${name},'start') #compiler.js`)
            }
            if (dir.args[0].value === 'loop') {
                // console.log("got a loop directive")
                let name = dir.args[1].name
                after.push(`tm.register("${name}",${name},'loop') #compiler.js`)
            }
            if (dir.args[0].value === 'event') {
                console.log("got an event directive",dir)
                let input = dir.args[1].name
                let fun_name = dir.args[2].name
                let wrapper_name = genid('wrapper_' + fun_name)
                if(input === 'buttons') {
                    console.log("need to generate buttons code")
                    after.push(`
def ${wrapper_name}():
    while True:
        event = buttons.events.get()
        if event:
            ${fun_name}(event)
        yield 0.01
    # end while
                    `)
                } else {
                    after.push(`
def ${wrapper_name}():
    while True:
        ${input}.update()
        if ${input}.fell:
            ${fun_name}()
        yield 0.01
    # end while
`)
                }
                after.push(`tm.register("${fun_name}",${wrapper_name},'event') #compiler.js`)
            }
        }
    })

    template = template.replace("${USER_FUNCTIONS}",generated_src + '\n' + after.join("\n"))


    let outfile = path.join(outdir, generated_src_out_name)
    console.log(`writing ${outfile}`)
    await write_to_file(outfile, template)

    const MPY_ENABLED = false
    console.log('doing libs for board',board.python.libs)
    for(let name of board.python.libs) {
        let use_mpy = await file_exists(`libs_py/${name}.mpy`)
        if(use_mpy && MPY_ENABLED) {
            await copy_file(`libs_py/${name}.mpy`, path.join(outdir,`${name}.mpy`))
        } else {
            await copy_file(`libs_py/${name}.py`, path.join(outdir, `${name}.py`))
        }
        console.log("doing library",name)
    }

    // let CP_ROOT = "/Users/josh/Desktop/Hardware\ Hacking/MatrixPortal/adafruit-circuitpython-bundle-6.x-mpy-20210903"
    // let src_lib = path.join(CP_ROOT,'lib','neopixel.mpy')
    // let dst_lib = path.join(outdir,'lib/neopixel.mpy')
    // console.log('copying',src_lib,'to',dst_lib)
    // await copy_file(src_lib,dst_lib)
}

async function copy_py_libs(outdir) {
    // await copy_file("libs_py/tasks.py",path.join(outdir,'tasks.py'))
    // await copy_file("libs_py/common.py",path.join(outdir,'common.py'))
    // await copy_file("libs_py/matrix.py",path.join(outdir,'matrix.py'))
}

export async function build(opts) {
    await prep(opts.outdir)
    if(opts.target === 'js') {
        if (opts.browser) await start_webserver(opts.src, opts.outdir)
        await compile_js(opts.src, opts.outdir, opts)
        await copy_js_libs(opts.outdir)
        if (opts.browser) await start_filewatcher(opts.src, opts.outdir,async ()=>{
            await compile_js(opts.src,opts.outdir,opts)
        })
    }
    if(opts.target === 'py') {
        await compile_py(opts)
        await copy_py_libs(opts.outdir)
        if (opts.watch) await start_filewatcher(opts.src, opts.outdir, async () => {
            await compile_py(opts)
        })
    }
}


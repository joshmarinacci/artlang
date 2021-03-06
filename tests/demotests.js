import {build} from '../src/compile.js'
import {file_to_string, force_delete} from '../src/util.js'
import {join} from 'path'
import child_process from 'child_process'
import {promisify} from 'src/util.js'

const exec2 = promisify(child_process.exec);

async function run_demo(src_path) {
    let outdir = "temp_out_dir"
    await build({
        src:src_path,
        outdir:outdir,
        target:'js',
        browser:false
    })

    let gen_src = join(outdir,'falling_dots.js')
    let src = await file_to_string(gen_src)
    // console.log("generated source",src)

    let {stdout, stderr} = await exec2(`node ${gen_src}`,{
        env:{
            ARTLANG_HEADLESS:true
        }
    })
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
}

async function run_all_demos() {
    await run_demo("demos/falling_dots.art")
    await run_demo("demos/split_rects.key")
    await run_demo("demos/mouse_afk.key")
    await run_demo("demos/test_led_button.key")

    await force_delete("temp_out_dir")
}
run_all_demos().then(()=>console.log("all done"))

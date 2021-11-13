import {build} from './compile.js'

// console.log(process.argv)
if(process.argv.length < 3) {
    console.log("needs src file and dst file")
    process.exit(1)
}
let opts = {
    src:process.argv[2],
    watch:false,
    browser:false,
    outdir:'build',
    target:'js',
    outfile:process.argv[3],
    board:'nodejs'
}
// console.log(opts)

build(opts).then(()=>console.log("done compiling"))

export const BOARDS = {
    "canvas":{
        name:"canvas",
        javascript:{
            before:`import {KCanvas, KSceneGraph, DPadWrapper} from './canvas.js'`,
            standard_cycle:true,
            template_path: 'templates/canvas.html'
        },
    },

    "nodejs":{
        name:"nodejs",
        javascript:{
            before:`import {PCanvas as KCanvas} from './pcanvas.js'`,
            standard_cycle:false,
            after:`
            tm.start_only()
            let pth = "./output.png"
            console.log("writing out",pth)
            screen.write_to_png(pth).then(()=>console.log("finished"))
            `,
            template_path: 'templates/node_template.js'
        }
    },


    "matrix":{
        name:"matrix",
        javascript:{
            before:`
        import {KCanvas} from './matrixportal.js'
        let screen = new KCanvas(0,0,64,32)`,
            standard_cycle:true,
        },
        python:{
            libs:[
                'common',
                'tasks',
                'matrix',
                'lists',
            ],
            imports: ``.trim(),
            template_path:'templates/matrix_template.py'
        }
    },


    "trellis":{
        name:"trellis",
        javascript: {
            before: `import {Trellis} from './trellis.js'
        let trellis = new Trellis(8,4)`,
            standard_cycle: true,
        },
        python:{
            libs:[
                'common',
                'tasks',
                'trellis',
                'lists',
            ],
            imports:`
from lists import List
from trellis import KeyColor
            `,
            template_path:'templates/trellis.py'
        }
    },


    "trinkey":{
        name:"trinkey",
        javascript:{
            before:`import {board, Button, NeoPixel, print, GREEN, RED, BLACK, WHITE, BLUE, TaskManager, _NOW} from './trinkey.js'`,
            standard_cycle:true,
        },
        python: {
            libs:[
                'common',
                'tasks',
                'trinkey',
            ],
            imports:`
            `,
            template_path:'templates/trinkey.py'
        }
    },


    "thumby":{
        name:"thumby",
        javascript: {
            before: `import {board, ThumbyCanvas, Button, DPad} from './thumby.js'`,
            standard_cycle: true,
            template_path: 'templates/thumby.html',
        },
        python: {
            libs:[
                'common',
                'tasks',
            ],
            imports:``,
            template_path:'templates/thumby.py'
        }
    },


    "pygamer":{
        name:"pygamer",
        javascript: {
            before: `import {board, PygamerCanvas, Button, DPad} from './pygamer.js'`,
            standard_cycle: true,
            template_path: 'templates/pygamer.html',
        },
        python: {
            libs:[
                'common',
                'pygamer',
                'lists',
                'tasks',
            ],
            imports:``,
            template_path:'templates/pygamer_template.py'
        }
    }
}

import {eval_ast, make_grammar_semantics} from '../src/grammar.js'
import {
    add,
    KeyColor,
    MDList,
    KObj,
    KPoint,
    KRect, KVector,
    STD_SCOPE, MDArray
} from '../libs_js/common.js'
import {checkEqual, file_to_string, test_js} from '../src/util.js'
import path from 'path'
import fs from 'fs'


const scope = STD_SCOPE


async function unit_tests() {
    const [grammar, semantics] = await make_grammar_semantics()
    function test_eval(scope,code,ans) {
        // console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error(`failed parsing ${code}`)
        let ast = semantics(result).ast()
        let res = eval_ast(ast,scope)
        // console.log("comparing",res,ans)
        if(!checkEqual(res,ans)) throw new Error("not equal")
    }



    //evaluations
    test_eval('','4',4)
    test_eval('','4.8',4.8)
    test_eval('',"'foo'","foo")
    test_eval('','4+5',9)
    test_eval('','5 mod 4',1)
    test_eval('','true',true)
    test_eval('','false',false)
    test_eval('','true and true',true)
    test_eval('','true and false',false)
    test_eval('','true or false',true)
    test_eval('','false or true',true)
    test_eval('','false or false',false)
    test_eval('','not true',false)
    test_eval('','not false',true)
    test_eval('','if true 5',5)
    test_eval('','if (false) { 5 } else { 6 }',6)

    //lists
    test_eval(scope,'List(0,0,0)',new MDList(0,0,0))
    test_eval(scope, '[0,0,0]', new MDList(0,0,0))
    test_eval(scope,'range(3)',new MDList(0,1,2))
    // test_eval(scope,`getPart(range(3),'get')`,new KList().get)
    test_eval(scope,'part = 3',3)
    // test_eval(scope,`foo = getPart(range(3),'get')`,new KList().get)
    // test_eval(scope,`getPart(range(3),'get')(1)`,1)
    // test_eval(scope, `() => {5}`,(x)=>{5})
    // test_eval(scope, `(x) => {add(x,1)}`,(x)=>{add(x,1)})
    // test_eval(scope, `range(3).map(() => {5})`,[5,5,5])
    // test_eval(scope, `range(3).map((x) => {add(x,1)})`,[1,2,3])

    await test_js(scope,`5`,5)
    await test_js(scope,`'foo'`,"foo")
    await test_js(scope,`add(4,5)`,9)
    await test_js(scope, '4.8',4.8)


    // assignment
    await test_js(scope,'{var foo = 5 foo}',5)
    await test_js(scope,'{var foo := 5 foo}',5)

    // operations
    await test_js(scope,'4<5',true)
    await test_js(scope,'4<=5',true)
    await test_js(scope, '5>=4', true)
    await test_js(scope, '{ var a = 4  a + 5 }',9)
    await test_js(scope, '{ var a = 4  a = 5 }',5)
    await test_js(scope, '{ var a = 4  a += 5 }',9)
    await test_js(scope, '{ var a = 4  a -= 5 }',-1)
    await test_js(scope, '{ var a = 4  a *= 5 }',4*5)
    await test_js(scope, '{ var a = 4  a /= 5 }',4/5)
    await test_js(scope, `{ var arr1 = [1,1,1] var arr2 = [2,2,2]  arr1+=arr2 }`,new MDList(3,3,3))

    //functions
    await test_js(scope, 'List(0,1,2)',new MDList(0,1,2))
    await test_js(scope, 'range(3)',new MDList(0,1,2))
    await test_js(scope, `{ let palette = List() palette }`, new MDList())
    await test_js(scope, `{ let black = Color() black }`, new KeyColor({}))
    await test_js(scope, `{ let red = Color(r:1) red}`, new KeyColor({r:1}))
    await test_js(scope, `{ let black = KeyColor(red:0, blue:0, green:0) black }`, new KeyColor({red:0,blue:0,green:0}))
    await test_js(scope, `{ let gray = KeyColor(gray:0.5) gray }`, new KeyColor({red:0.5,blue:0.5,green:0.5}))
    await test_js(scope, `{ let red = KeyColor(hue:0, sat:1, lit:0.5) red }`, new KeyColor({hue:0,sat:1,lit:0.5}))
    // await test_js(scope, `{ let screen = Canvas(0,0,64,32) screen}`, new KCanvas(0,0,64,32))
    {
        await test_js(scope, `{
        let black = Color()
        let red = Color(r:1)
        let green = Color(g:1)
        let blue = Color(b:1)
        let palette = List(black,red,green,blue)
        palette
        }
        `, new MDList(new KeyColor({}), new KeyColor({r:1}), new KeyColor({g:1}), new KeyColor({b:1})))
    }
    await test_js(scope, '{let dot = Obj() dot}', new KObj())
    await test_js(scope, '{let dot = Obj() dot.five = 5 dot.five}', 5)

    {
        let dot = new KObj()
        dot.xy = new KPoint(5, 6)
        dot.v =  new KVector(1,1)
        dot.xy = add(dot.xy,dot.v)
        await test_js(scope, `{
            let dot = Obj() 
            dot.xy := Point(5,6) 
            dot.v := Vector(1,1) 
            dot.xy := add(dot.xy , dot.v) 
            dot}`, dot)
    }

    {
        await test_js(scope, '{let screen = Rect(0,0,64,32) screen}',new KRect({w:64, h:32}))
    }
    {
        await test_js(scope, `{range(10).map(@5).length}`, 10)
        await test_js(scope, `{let dots = range(20).map(@Obj()) dots.length}`, 20)
    }

    {
        await test_js(scope, `4+2`,6)
        await test_js(scope, `List(4,4)+List(2,2)`,new MDList(6,6))
        await test_js(scope, `[4,4]+[2,2]`,new MDList(6,6))
        await test_js(scope, `4-2`,2)
        await test_js(scope, `4/2`,2)
        await test_js(scope, `4*2`,8)
    }

    //array syntax
    {
        //get and set 1d array
        await test_js(scope, '[4,2,42]',new MDList(4,2,42))
        await test_js(scope, `{ var l = [4,2,42] return l[0] }`,4)
        await test_js(scope, `{ var l = [4,2,42] return l[2] }`,42)
        await test_js(scope, `{ var l = [4,2,42] l[0] = 88 return l[0] }`,88)
        await test_js(scope, `{ var l = [4,2,42] l[0] = 88 return l }`,new MDList(88,2,42))

        await test_js(scope, `{var l2 = MDArray([3,3]) return l2}`,new MDArray([3,3]))
        await test_js(scope, `{var l2 = MDArray([3,3]) l2.fill(42) return l2}`,new MDArray([3,3]).fill(42))

        //set array element in 2d array
        await test_js(scope, `{
        var l2 = MDArray([3,3]) 
        l2.fill(42) 
        l2[0,0]=88  
        return l2[0,0]}`,88)

        //set element of 1d array
        await test_js(scope, `{
        var l2 = MDArray([3]) 
        l2.fill(42) 
        l2[2]=88  
        return l2[2]}`,88)


        await test_js(scope, `{
            var l2 = MDArray([3,3])
            l2[0,0] = 88
            return l2[?,0]
        }`, MDList(88,0,0))

        await test_js(scope, `{
            var l2 = MDArray([3,3])
            l2[2,2] = 88
            return l2[2,?]
        }`, MDList(0,0,88))

        await test_js(scope,`{
            var l2 = MDArray([3,3])
            l2[2,2] = 88
            var pos = [2,2]
            return l2[pos]
        }`,88)
    }
    // conditionals
    {
        await test_js(scope,`if(true) {4} else {5}`,4)
        await test_js(scope,`if(true) {4}`,4)
        await test_js(scope,`if(not true) {4} else {5}`,5)
        await test_js(scope,`if(true) {return 5}`,5)
        await test_js(scope,`if(true) {
            var foo = "barz"
            var foz = 5
            return 9
        }`,9)
        await test_js(scope,`{[1,2]}`,MDList(1,2))
        await test_js(scope,`{[1,2].map(@(x)=>{x*2})}`,MDList(2,4))
        await test_js(scope, '(4+5) == 9',true)
        // await test_js(scope, '4+5 == 9',true)
        // await test_js(scope, '4+5 == 10',false)
        await test_js(scope,`if true 4`,4)
        await test_js(scope,`if not false 4`,4)
        await test_js(scope, `if (add(4,5) == 9) 4`,4)
        await test_js(scope, `if not (4 == 5) 4`,4)
        await test_js(scope, `if (4+5 == 9) 4`,4)
        // await test_js(scope, `if (not (4+5 == 10)) 4`,4)
        // await test_js(scope, `if not (add(4+5) == 10) 4`,4)
        // if not nth(count,6) grid[0] = 5     cond w/ assignment then clause w/o parens or braces

        await test_js(scope,`{
        var d1 = [0,0] 
        if (d1 == [0,1]) { 5 } else { 7 }
        }`,7)
    }
    //returns
    {
        await test_js(scope,'if(true) return 42',42)
        await test_js(scope, 'if(true) 42',42)
        await test_js(scope,'add(4,2)',6)
        await test_js(scope,'return add(4,2)',6)
        await test_js(scope,'if(true) { return add(4,2 ) }',6)
        await test_js(scope,'if true 42',42)
        await test_js(scope,'if true add(4,2)',6)
        await test_js(scope, `{ if (true) {return 5} else {7} return 6}`, 5)
    }


    //pipeline syntax
    {
        await test_js(scope,'multiply(add(1,2),3)',9)
        await test_js(scope,'add(1,2) >> multiply(3)',9)
    }

}

async function test_demo(code) {
    const [grammar, semantics] = await make_grammar_semantics()
    code = "\n{\n" + code + "\n}\n" //add the implicit block braces
    // console.log(`parsing: "${code}"`)
    let result = grammar.match(code, 'Exp')
    if(!result.succeeded()) {
        console.log(result.shortMessage)
        console.log(result.message)
        throw new Error(`failed parsing`)
    }
}

async function dir_list(dir) {
    return await fs.promises.readdir(dir)
}

async function demo_tests() {
    //test parse all demos/canvas/*
    let files = await dir_list('demos/canvas')
    for(let file of files) {
        let filepath = path.join('demos/canvas',file)
        console.log("parsing",filepath)
        let code = await file_to_string(filepath)
        await test_demo(code)
    }

}

async function operation_tests() {
    // operation ordering
    await test_js(scope, '4+4',13)
    // await test_js(scope, '(4+4) < 5',false)
    await test_js(scope, '4+5*6',34)
    // await test_js(scope, '5*6+4',34)
    await test_js(scope, '(6/2)+3',6)
    // await test_js(scope, '6/2+3',6)
    await test_js(scope, '(4+5) == 9',true)
    // await test_js(scope, '4+5 == 9',true)
    await test_js(scope, '{var foo = 4+5 foo}',9)
    await test_js(scope, '{ fun foo(x) {return x*2} foo(5) } ',10)

    // await test_js(scope, '{ fun foo(x) x*2 foo(5) } ', 10)
    // await test_js(scope, '{ fun foo(x) ^x*2 foo(5) } ',10)
    // await test_js(scope,`if true 4 else 5`,4)
    // await test_js(scope,`{foo := if true 4 else 5 foo}`,4)
    // await test_js(scope,`{ if true 4 else 5 >> foo }`,4)
    // await test_js(scope,`+2`,2)
    // await test_js(scope,`2**+2`,4)
    // await test_js(scope,`2**-2`,0.25)//1/2/2)
    // await test_js(scope,`2**(1/2)`,Math.sqrt(2))
}

async function all_tests() {
    await unit_tests()
    await operation_tests()
    // await demo_tests()
}


all_tests().then(()=>console.log("all tests pass"))

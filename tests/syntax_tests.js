import {AST_TYPES, eval_ast, make_grammar_semantics} from '../src/grammar.js'
import {checkEqual, test_js} from '../src/util.js'
import {ast_preprocess} from '../src/generate_js.js'

async function syntax_tests() {
    const [grammar, semantics] = await make_grammar_semantics()
    function test_parse(code) {
        // console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error(`failed parsing ${code} ${result}`)
        let ast = semantics(result).ast()
        // console.log('result is',ast)
    }
    function test_parse_fail(code,res) {
        // console.log(`parsing for failure: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(result.succeeded()) throw new Error("failed parsing")
    }
    test_parse('4')
    test_parse('-4')
    test_parse('4.8')
    test_parse('0.5')
    test_parse("'foo'")
    test_parse(`"foo"`)
    test_parse('true')
    test_parse('false')

    // simple assignment
    test_parse('dot = 5')
    test_parse('dot = true')
    test_parse('dot = tod')
    test_parse('dot := 5')
    test_parse('dot := true')
    test_parse('dot := tod')

    //operations
    test_parse('4<5')
    test_parse('4<=5')
    test_parse('5>=4')
    test_parse('5 mod 6')
    test_parse('not true')
    test_parse('a + b')
    test_parse('a += b ')

    //function call with positional arguments
    test_parse('foo()')
    test_parse('foo(5)')
    test_parse(`foo('bar')`)
    test_parse(`foo('bar','baz')`)
    test_parse(`foo('bar',foo('baz'))`)
    test_parse(`dot = foo('bar')`)
    test_parse('range(10).map()')

    //function call with keyword arguments
    test_parse(`foo()`)
    test_parse(`foo(x:5)`)
    test_parse(`foo(x:5,y:"foo")`)
    test_parse(`foo(y:'foo', x:5)`)
    test_parse(`foo(x:5,y:"foo")`)


    //group with parens
    test_parse( '(4+5) == 9')
    test_parse( '9 == (4+5)')


    //property access
    test_parse("GET_PROP(dots,'length')")
    test_parse('fun foo() { }')

    test_parse_fail('1abc')
    test_parse_fail('0xFF')
    // test_parse_fail('1.2.3')
    test_parse_fail(`"foo'`)
    test_parse_fail('else.part')
    test_parse_fail('var true')
    test_parse_fail('var if')
    test_parse_fail('var else')
    test_parse_fail('var fun')
    test_parse_fail('var and')
    test_parse('var andy')
    test_parse_fail('var or')
    test_parse('var orion')
    test_parse_fail('var not')
    test_parse('var nottingham')



    //conditionals
    test_parse(`if(true){}`)
    test_parse('a or b')
    test_parse('a and b')
    test_parse('not a')
    test_parse('a and not b')
    test_parse('a or not b')
    test_parse('if(a){b}')
    //test_parse('if a {b}')
    test_parse('if a b')
    test_parse(`if a a==false`)
    test_parse('if (true) { a = 5}')
    test_parse(`{var a = 4 if (true) { a = 5}}`)
    test_parse(`{var a = 4 if true a = 5}`)
    test_parse(`if [0,0] == [0,0] 5`)
    test_parse(`if (add(4,5) == 9) 4`)


    // list literals
    test_parse('[0]')
    test_parse('[1,2]')
    test_parse('[1,2,3]')
    test_parse('[a,b,c]')
    test_parse('[4+5,5,"foo"]')

    // list / array syntax
    test_parse('foo[0]')
    test_parse('foo[0,0]')
    test_parse('foo[0] = 5')
    test_parse('foo[0,0] = 5')
    test_parse('foo[0,?]')
    test_parse('5 == foo[0,?]')
    test_parse('foo[0,?] == 5')
    test_parse('foo[0] == 5')
    test_parse(`foo[bar]`)
    test_parse(`foo[bar]=5`)
    test_parse(`foo[bar]==5`)
    test_parse(`foo[?]`)
    test_parse(`foo[?]=5`)

    test_parse(`foo.bar()`)
    // test_parse(`foo[0].bar()`)
    // grid[0,?].fill(1)


    //lambda syntax
    test_parse('var foo = 42')
    test_parse('var foo = @(x)=>{x+42}')
    test_parse('var foo = @x=>x+42')
    test_parse('var foo = @it+42')
    test_parse('var foo = @print(it)')


    //while loop syntax
    test_parse('while (true) { v = v+1 }')


    //pipeline syntax
    test_parse('bar(foo())')
    test_parse('foo() >> bar()')

    //complex edge cases
    test_parse('r.x = 5')
    test_parse('(4)/2')
    test_parse('(screen.width - r.w)/2')
    test_parse('r.x = (screen.width - r.w)/2')


    //return expressions
    test_parse('return 5')
    test_parse('return foo()')
}

async function simple_math_tests() {
    const [grammar, semantics] = await make_grammar_semantics()
    function test_eval(code,ans) {
        // console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error("failed parsing")
        let ast = semantics(result).ast()
        // console.log("ast",ast)
        let res = eval_ast(ast,'')
        // console.log("comparing",res,ans)
        if(!checkEqual(res,ans)) throw new Error("not equal")
    }
    test_eval('4',4)
    test_eval('4+2',6)
    test_eval('4+2',6)
    test_eval( '(4+5) == 9',true)
    // test_eval(`{var a = 4 if (true) { a = 5}}`,5)
    // test_eval( '4+5 == 9',true)


}

async function parse_tree_tests() {
    const [grammar, semantics] = await make_grammar_semantics()
    function test_parse(code, ans) {
        // console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error(`failed parsing ${code} ${result}`)
        let ast = semantics(result).ast()
        ast = ast_preprocess(ast)

        function dump(ast) {
            return JSON.stringify(ast,null,'   ')
        }

        console.log('result is',dump(ast))
        console.log("ans is",dump(ans))
        checkEqual(ast,ans)
    }
    test_parse('5',{type:AST_TYPES.literal, kind:AST_TYPES.integer, value:5})
    test_parse('bar = foo+5',{
        type:AST_TYPES.assignment,
        name:{type:AST_TYPES.identifier, name:'bar'},
        expression: {
            type: AST_TYPES.binexp,
            op:"+",
            exp1:{type: AST_TYPES.identifier, name: 'foo'},
            exp2:{type: AST_TYPES.literal, kind:AST_TYPES.integer, value:5}
        }
    })
    test_parse('bar += 5',{
        type:AST_TYPES.assignment,
        name:{type:AST_TYPES.identifier, name:'bar'},
        expression: {
            type: AST_TYPES.binexp,
            op:"+",
            exp1:{type: AST_TYPES.identifier, name: 'bar'},
            exp2:{type: AST_TYPES.literal, kind:AST_TYPES.integer, value:5}
        }
    })
    test_parse('foo[0]',{
        type:AST_TYPES.array_access,
        name: {type:AST_TYPES.identifier, name:'foo'},
        args:[{type:AST_TYPES.literal, kind:AST_TYPES.integer, value:0}]
    })
    test_parse('bar = foo[0]',{
        type:AST_TYPES.assignment,
        name:{type:AST_TYPES.identifier, name:'bar'},
        expression: {
            type: AST_TYPES.array_access,
            name: {type: AST_TYPES.identifier, name: 'foo'},
            args: [{type: AST_TYPES.literal, kind: AST_TYPES.integer, value: 0}]
        }
    })
    test_parse('foo[0] = bar',{
        type:AST_TYPES.array_assignment,
        array:{
            type:AST_TYPES.array_set_access,
            name:{type:AST_TYPES.identifier, name:'foo'},
            args:[{ type:AST_TYPES.literal, kind:AST_TYPES.integer, value:0 }],
        },
        expression: {type: AST_TYPES.identifier, name: 'bar'}
    })


    test_parse(`foo[0] := foo[0] + 1`,{
        type:AST_TYPES.array_assignment,
        array:{
            type:AST_TYPES.array_set_access,
            name:{type:AST_TYPES.identifier, name:'foo'},
            args:[{ type:AST_TYPES.literal, kind:AST_TYPES.integer, value:0 }],
        },
        expression: {
            type: AST_TYPES.binexp,
            op:"+",
            exp1: {
                type: AST_TYPES.array_access,
                name: {type: AST_TYPES.identifier, name: 'foo'},
                args: [{type: AST_TYPES.literal, kind: AST_TYPES.integer, value: 0}],
            },
            exp2:{type: AST_TYPES.literal, kind:AST_TYPES.integer, value:1},
        }
    })

    test_parse(`foo[0] += 1`,{
        type:AST_TYPES.array_assignment,
        array:{
            type:AST_TYPES.array_set_access,
            name:{type:AST_TYPES.identifier, name:'foo'},
            args:[{ type:AST_TYPES.literal, kind:AST_TYPES.integer, value:0 }],
        },
        expression: {
            type: AST_TYPES.binexp,
            op:"+",
            exp1: {
                type: AST_TYPES.array_access,
                name: {type: AST_TYPES.identifier, name: 'foo'},
                args: [{type: AST_TYPES.literal, kind: AST_TYPES.integer, value: 0}],
            },
            exp2:{type: AST_TYPES.literal, kind:AST_TYPES.integer, value:1},
        }
    })
}

async function all_tests() {
    await syntax_tests()
    await simple_math_tests()
    await parse_tree_tests()
}

all_tests().then(()=>console.log("all tests pass"))

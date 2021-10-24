import {AST_TYPES, FUN_CALL_TYPES} from './grammar.js'
import {genid} from './util.js'

const UN_OPS = {
    'not':{
        name:'not'
    }
}
const BIN_OPS = {
    '+': {
        name: 'add'
    },
    '-': {
        name: 'subtract'
    },
    '*': {
        name: 'multiply'
    },
    '/': {
        name: 'divide'
    },
    '<': {
        name: 'lessthan'
    },
    '>': {
        name:'greaterthan'
    },
    '==': {
        name: 'equal'
    },
    '<=': {
        name:'lessthanorequal'
    },
    '>=': {
        name:'greaterthanorequal'
    },
    'or':{
        name: 'or'
    },
    'and':{
        name:'and',
    },
    'mod':{
        name: 'mod'
    }
}

const ASSIGN_OPS = {
    '+=':'+',
    '-=':'-',
    '*=':'*',
    '/=':'/',
}

function lambdawrap(then_clause, ast) {
    if(ast && ast.type === 'body') {
        if(Array.isArray(then_clause)) {
            let last = then_clause.pop()
            return `() => { ${then_clause.join("\n")}\n return ${unreturn(last)} }`
        }
    }
    return `()=>{return ${unreturn(then_clause)}}`
}

export function unreturn(str) {
    if(Array.isArray(str) && str.length === 1) str = str[0]
    if(str.startsWith('return')) return str.substring('return'.length)
    return str
}

export function ast_preprocess(ast) {
    // console.log("checking", ast)
    if(ast.type === AST_TYPES.fundef) {
        ast.block = ast_preprocess(ast.block)
    }
    if(ast.type === AST_TYPES.body) {
        ast.body = ast.body.map(a => ast_preprocess(a))
    }
    if(ast.type === AST_TYPES.binexp) {
        if(ast.op === AST_TYPES.pipeline_operator) {
            // console.log('rewriting pipeline',ast, ast.exp2)
            ast = {
                type:AST_TYPES.funcall,
                name: ast.exp2.name,
                form: ast.exp2.form,
                args: [ast.exp1, ast.exp2.args].flat()
            }
            // console.log('new ast is',ast)
        }
        if(ASSIGN_OPS[ast.op]) {
            // console.log("rewriting assignments")
            ast = {
                type:'assignment',
                name: ast.exp1,
                expression: { type:'binexp', op:ASSIGN_OPS[ast.op], exp1: ast.exp1, exp2: ast.exp2  }
            }
        }
    }
    return ast
}
export function ast_to_js(ast) {
    if (ast.type === 'comment') {
        return ""
    }
    if (ast.type === AST_TYPES.array_wildcard) return "WILDCARD"
    if (ast.type === 'literal') {
        if (ast.kind === 'integer') return "" + ast.value
        if (ast.kind === 'boolean') return "" + ast.value
        if (ast.kind === 'float') return "" + ast.value
        if (ast.kind === 'string') return `"${ast.value}"`
    }
    if (ast.type === 'identifier') return "" + ast.name
    if (ast.type === AST_TYPES.listliteral) {
        let elements = ast.elements.map(a => ast_to_js(a))
        return 'List(' + elements.join(", ") + ')'
    }
    if (ast.type === 'funcall') {
        let args = ast.args.map(a => ast_to_js(a))
        let name = ast_to_js(ast.name)
        if(name === 'wait') {
            return `sleep(${args.join(",")})`
        }
        if(ast.form === FUN_CALL_TYPES.keyword) {
            return `${name}({${args.join(',')}})`
        } else {
            return `${name}(${args.join(",")})`
        }
    }
    if (ast.type === AST_TYPES.assignment) {
        let name = ast_to_js(ast.name)
        let value = ast_to_js(ast.expression)
        return [`${name} = ${value}`]
    }
    if (ast.type === AST_TYPES.array_assignment) {
        let arr = ast_to_js(ast.array)
        let ex = ast_to_js(ast.expression)
        let N = arr.args.length
        return `${arr.name}.set${N}(${arr.args.join(',')},${ex})`
    }
    if (ast.type === AST_TYPES.vardec) {
        let name = ast_to_js(ast.name)
        if(ast.expression) {
            let value = ast_to_js(ast.expression)
            return ['let ' + name + ' = '+ value]
        }
        return ['let ' + name]
    }
    const INDENT = "    "
    const ind = (arr) => arr.map(s => INDENT+s)
    if (ast.type === 'fundef') {
        let args = ast.args.map(a => ast_to_js(a))
        return [
            `function ${ast_to_js(ast.name)}(${args}){`,
            ...ast_to_js(ast.block).map(s => INDENT + s),
            `}`
        ]
    }
    if (ast.type === 'body') {
        return ast.body.map(b => ast_to_js(b)).flat()
    }
    if (ast.type === 'lambda') {
        let args = ast.args.map(a => ast_to_js(a)).flat()
        let body = ast_to_js(ast.body)
        let last = ""
        if (Array.isArray(body) && body.length > 1) {
            last = body.pop()
            let hasreturn = last.startsWith('return')
            if(hasreturn) last = last.substring('return'.length)
        } else {
            last = body
            body = []
        }
        return `(${args.join(",")}) => {
            ${ind(body).join("\n")} 
        return ${last} 
        }`
    }
    if (ast.type === AST_TYPES.deref) {
        let before = ast_to_js(ast.before)
        let after = ast_to_js(ast.after)
        return `${before}.${after}`
    }
    if (ast.type === AST_TYPES.array_access) {
        // console.log("doing array access",ast)
        let args = ast.args.map(a => ast_to_js(a)).flat()
        // console.log("args len",args, args.length)
        let n = args.length
        if(n === 3) return `${ast_to_js(ast.name)}.get3(${args})`
        if(n === 2) return `${ast_to_js(ast.name)}.get2(${args})`
        if(n === 1) return `${ast_to_js(ast.name)}.get1(${args})`
        let str = `${ast_to_js(ast.name)}.get_invalid(${args})`
        // console.log("generated",str)
        return str
    }
    if (ast.type === AST_TYPES.array_set_access) {
        let args = ast.args.map(a => ast_to_js(a)).flat()
        return {
            name:ast_to_js(ast.name),
            args:args
        }
    }
    if (ast.type === AST_TYPES.binexp) {
        let op = BIN_OPS[ast.op]
        if (op) return `${op.name}(${ast_to_js(ast.exp1)},${ast_to_js(ast.exp2)})`
    }
    if (ast.type === AST_TYPES.unexp) {
        let op = UN_OPS[ast.op]
        if (op) return `${op.name}(${ast_to_js(ast.exp)})`
    }
    if (ast.type === AST_TYPES.conditional) {
        let cond = ast_to_js(ast.condition)
        let then_clause = ast_to_js(ast.then_block)
        let else_clause = 'null';//lambdawrap('null',null)
        if(ast.has_else)  else_clause = ast_to_js(ast.else_block)
        let retval = genid('retval')
        let last = then_clause
        let rest = ""
        if(Array.isArray(then_clause)) {
            last = then_clause.pop()
            rest = then_clause.join("\n")
        }
        if(!last.startsWith('return')) {
            last = `${retval} = ${last}`
        }
        return [
            `let ${retval} = null`,
            `if(_test(${cond})) {`,
                rest,
                last,
            '} else {',
                `${retval} = ${else_clause}`,
            '}',
            retval
        ]
    }
    if (ast.type === 'return') return `return ${unreturn(ast_to_js(ast.exp))}`
    if (ast.type === AST_TYPES.keywordarg) return `${ast_to_js(ast.name)}:${ast_to_js(ast.value)}`
    console.log('converting to js', ast)
    throw new Error(`unknown AST node ${ast.type}`)
}

function print(...args) {
    console.log(...args)
}

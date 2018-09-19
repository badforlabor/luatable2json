import * as fs from 'fs'

function parseLuaJson(obj, output) {

    let body = obj["body"]
    parseBody(body, output)
}
// 处理所有的"body"
function parseBody(obj, output) {
    let body = obj

    if (!body || body.length != 1) {
        throw "无法识别json文件"
    }

    let type = body[0]['type']
    if (!type || type != 'ReturnStatement') {
        throw '无法识别json文件'
    }

    let args = body[0]['arguments']
    if (!args || args.length != 1) {
        throw '无法识别json文件'
    }

    let one = args[0]
    parseArguments(one, output)
}

// 处理所有的“arguments”
function parseArguments(obj, output) {

    if (obj["type"] == 'TableConstructorExpression') {
        parseFields(obj['fields'], output)
    }
}

// 处理所有的"fields"
function parseFields(obj, output) {
    for (let i = 0; i < obj.length; i++) {
        parseField(obj[i], output)
    }
}
function parseField(obj, output) {

    // field是key-value格式的。

    let t = obj['type']
    if (t == 'TableKeyString' || t == 'TableKey') {
        let key = getKey(obj['key'])
        let value = getValue(obj['value'])

        output['' + key] = value
    } else if (t == 'TableKey') {
        let key = getKey(obj['key'])
        let value = getValue(obj['value'])

        output['' + key] = value

    } else {
        throw '无法识别的field:' + t
    }
}


// 处理所有"key"字段
function getKey(obj): any {
    let t = obj['type']
    if (t == 'Identifier') {
        return obj['name']
    }
    if (t == 'NumericLiteral') {
        return obj['value'].toString()
    }
    throw '无法识别的key'
}

// 处理所有"value"字段
function getValue(obj): any {

    let t = obj['type']
    if (t == 'TableConstructorExpression') {

        let fields = obj['fields']
        if (fields.length > 0 && fields[0]['type'] == 'TableValue') {
            let output = []
            for (let i = 0; i < fields.length; i++) {
                let f = fields[i]
                output.push(getValue(f['value']))
            }
            return output
        } else {
            let output = {}
            parseFields(obj['fields'], output);
            return output
        }
    } else if (t == 'NumericLiteral') {
        return obj['raw']
    } else if (t == 'StringLiteral') {
        return obj['value']
    } else if (t == 'UnaryExpression') {
        let op = obj['operator']
        if (op != '-') {
            throw '无法识别的操作符:' + op
        }
        return op + getValue(obj['argument'])
    }

    throw '无法识别的value:' + t
}

function main() {
    // 读取json文件
    let path = "1.json"
    let data = fs.readFileSync(path)

    let obj = JSON.parse(data.toString())
    let output = {}
    parseLuaJson(obj, output)
    // console.log(JSON.stringify(output))
    fs.writeFileSync('2.json', JSON.stringify(output, null, '\t'))
}

main()
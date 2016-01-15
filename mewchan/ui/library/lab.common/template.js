// method:
//      -> template(template, parameters, options)
//      -> template.execute(template, parameters, options)

// options:
//      -> log: true or false
//      -> echo: function (value){console.log(value);}
//      -> functors: {"a": function (template, call, parameters, options, ...){...}, ...}
//      -> parser: "text/plain", "text/html", (not implemented: "text/json", "text/xml")
//      -> parametersMutable: true or false
//      -> functionAvailable: true or false

// syntax:
//      -> number: 1.2
//      -> string: "text", 'text'
//      -> regular expression: #reg#
//      -> list: [1,2,3]
//      -> object: {'a': b}
//      -> get property: a.b, a[b]
//      -> call function: a(b,c)
//      -> define operator: {a,b,c,defintion}, {+}, {func?}
//      -> call operator: call({+}, a, b)
//      -> get argument: $1, $2
//      -> get operator: $0
//      -> arguments: $a
//      -> number of argument: $n
//      -> result of last statement: $x
//      -> fill times: $t
//      -> constants: null, true, false, undefined, nan, infinity

// logic and task sample:
//      -> statements: a;b;
//      -> condition: if(condition, true_action, false_action)
//      -> switching: condition; {a? b, c? d, e? f, default}
//      -> loop: map(seq(1, times), {index, action})
//      -> recursion: call({if(continue, call($0, a), initial}, a)
//
//      -> element iterator: map(list, {element, index, list, action})
//      -> key iterator: map(keys(object), {key, index, keys, action})
//      -> property iterator: each(object, {key, value, object, action})
//
//      -> call operator: call(operator, a, b)
//      -> call operator: execute(operator, [a, b])
//      -> define variant: define(name, value)
//
//      -> convert pair to map: fold(pairs, {}, {mix($1, {$2.key: $2.value})})
//      -> convert map to pair: fold(keys(map), [], {push($1, {"key": $2, "value": map[$2]})})
//
//      -> get all data: data()

// operator:
//      -> ! ~
//      -> * / %
//      -> + -
//      -> << >>
//      -> < > <= >=
//      -> == !=
//      -> &
//      -> ^
//      -> |
//      -> &&
//      -> ||
//      -> ;

// function:
//
//      System
//      -> if default
//      -> call
//      -> execute
//      -> echo
//      -> define
//      -> sandbox
//      -> typeOf
//      -> data
//
//      Math
//      -> sin cos tan asin acos atan
//      -> sinh cosh tanh asinh acosh atanh
//      -> angle
//      -> log power cbrt sqrt
//      -> round ceil floor
//      -> max min
//      -> random
//      -> e pi
//
//      Date
//      -> date timeunit format
//      -> isDate
//
//      List
//      -> fold count map filter sort
//      -> join
//      -> slice seq fill
//      -> push pop shift unshift splice
//      -> concat include exclude
//      -> reverse
//      -> isList
//
//      String
//      -> lowerCase upperCase
//      -> slice match search replace
//      -> trim
//      -> split
//      -> string code
//      -> template
//      -> isString
//
//      Regular expression
//      -> match search replace
//      -> isRegex
//
//      Number
//      -> parse fixed precision
//      -> isNumber
//
//      Object
//      -> mix
//      -> keys values
//      -> each
//      -> isObject
//      -> via

// entrance
//      -> template(template, parameters, options)
//      -> template.compile(template, options)
//      -> template.run(call, parameters, options)
//      -> template.execute(template, parameters, options)

// example
//      -> template("3 + 4 = ${3 + 4}")
//      -> template("It is ${format('YYYY-MM-DD hh:mm:ss.SSS', date)} now", {"date": new Date()})
//      -> template("The sum of 1 to 50 is ${fold(seq(1, 50), 0, {+}}")
//      -> template("${'[' + join(list, ',') + ']'} could be sort as ${'[' + join(sort(list, {$1>$2}), ',') + ']'}", {"list": [1,3,42,2,4,7]})
//      -> template("Even number from 1 to 100 is ${filter(seq(1, 100), {num, num % 2 == 0})}")
//      -> template("${define('n', 5);n}! is ${call({if($1 == 1, 1, $1 * call($0, $1 - 1))}, n)}")
//      -> template("Get 4 random number: ${join(map(seq(1,4), {random?}), ', ')}")

var finalTemplate = function (template, parameters, options) {

    if (!options) {
        options = "text/plain";
    }

    if (options.constructor == String) {
        options = {
            "parser": options
        };
    }

    if (!options.parser) {
        options.parser = "text/plain";
    }

    if (!parameters) {
        parameters = {};
    } else {
        if (!options.parametersMutable) {

            var newParameters = {};

            for (var name in parameters)
            {
                newParameters[name] = parameters[name];
            }

            parameters = newParameters;

        }
    }

    if (finalTemplate.parsers[options.parser]) {
        return finalTemplate.parsers[options.parser](template, parameters, options);
    } else {
        return null;
    }

};

finalTemplate.operators = {};
finalTemplate.operatorQueue = [
    ["right",  "!", "~"],
    ["left",   "*", "/", "%"],
    ["left",   "+", "-"],
    ["left",   "<<", ">>"],
    ["left",   "<", ">", "<=", ">="],
    ["left",   "==", "!="],
    ["left",   "&"],
    ["left",   "^"],
    ["left",   "|"],
    ["left",   "&&"],
    ["left",   "||"],
    ["right",  ";"]
];

finalTemplate.functors = {};

finalTemplate.parsers = {};

finalTemplate.lexer = {};

finalTemplate.Operator = function (template, parameters, options, namedArguments, definition) {

    this.call = function (callTemplate, call, callParameters, callOptions) {

        var callArguments = [].slice.call(arguments, 4);

        var newParameters = {};
        for (var name in parameters) {
            newParameters[name] = parameters[name];
        }

        if (newParameters["$n"]) {
            var looper = 1;
            while (looper <= newParameters["$n"]) {

                delete newParameters["$" + looper];

                ++looper;
            }
        }

        namedArguments.forEach(function (name, index) {
            newParameters[name] = callArguments[index];
        });

        newParameters["$0"] = this;
        newParameters["$n"] = callArguments.length;
        newParameters["$a"] = callArguments;
        newParameters["^"] = parameters;

        callArguments.forEach(function (value, index) {
            newParameters["$" + (index + 1)] = value;
        });

        return finalTemplate.run(template, definition, newParameters, options);

    };

    return this;

};

finalTemplate.lexer.stringify = function (queue) {

    if (queue.type != "blk") {
        queue = [queue];
        queue.type = "blk";
        queue.operator = "";
        queue.index = queue[0].index;
    }

    var ends = {
        "(": ")",
        "[": "]",
        "{": "}"
    };

    var end = ends[queue.operator];
    if (!end) {
        end = queue.operator;
    }

    var code = [];

    code.push(queue.operator);

    queue.forEach(function (symbol) {

        if (!symbol) {

            code.push("");

            return;
        }

        switch (symbol.type) {

            case "qot": {

                code.push("\"" + symbol.content.replace(/\\/gim, "\\\\").replace(/\n/gim, "\\n").replace(/"/gim, "\\\"") + "\"");

                break;
            }

            case "num":
            case "sym":
            case "opr": {

                code.push(symbol.content);

                break;
            }

            case "fnc":
            case "opc": {

                code.push(symbol.content);
                code.push("(");

                var callArguments = [];

                symbol.arguments.forEach(function (argument) {
                    callArguments.push(finalTemplate.lexer.stringify(argument));
                });

                code.push(callArguments.join(","));

                code.push(")");

                break;
            }

            case "reg": {

                code.push("#" + symbol.content.source.replace(/#/gim, "\\#") + "#");

                break;
            }

            case "blk": {

                code.push(finalTemplate.lexer.stringify(symbol));

                break;
            }

            default: {
                break;
            }

        }

    });

    code.push(end);

    return code.join("");
};

finalTemplate.lexer.getSymbol = function (template, index) {

    // Skip whitespaces
    // 9: tab
    // 10, 13: line feed
    // 32: space
    //
    while ((index < template.length) &&
           ([9, 10, 13, 32].indexOf(template.charCodeAt(index)) != -1)) {
        ++index;
    }

    if (index < template.length) {

        var charCode = template.charCodeAt(index);
        switch (charCode) {

            case 34:            // double quotation
            case 39:            // single quotation
            {

                var result = [];

                var code = 0;
                var index2 = index + 1;
                while ((index2 < template.length) &&
                       ((code = template.charCodeAt(index2)) != charCode)) {

                    if (code == 92) {

                        var next = template.charCodeAt(index2 + 1);
                        switch (next) {
                            case 110: { result.push("\n"); break; }
                            case 92: { result.push("\\"); break; }
                            case 34: { result.push("\""); break; }
                            case 39: { result.push("\'"); break; }
                            default: {
                                return {
                                    "type": "err",
                                    "description": "Invalid escaped character",
                                    "content": null,
                                    "index": index2 + 1,
                                };
                            }
                        }

                        index2 += 2;

                    } else {

                        result.push(template[index2]);

                        ++index2;
                    }

                }

                if (index2 < template.length) {

                    return {
                        "type": "qot",
                        "content": result.join(""),
                        "index": index,
                        "next": index2 + 1
                    };

                } else {

                    return {
                        "type": "err",
                        "description": "Quotation not be terminated",
                        "content": null,
                        "index": template.length,
                    };

                }

            }

            case 35: {

                var result = [];

                var code = 0;
                var index2 = index + 1;
                while ((index2 < template.length) &&
                       ((code = template.charCodeAt(index2)) != 35)) {

                    if (code == 92) {

                        var next = template.charCodeAt(index2 + 1);
                        if (next == 35) {
                            result.push("#");
                        } else {
                            result.push(String.fromCharCode(92, next));
                        }

                        index2 += 2;

                    } else {

                        result.push(template[index2]);

                        ++index2;
                    }
                }

                if (index2 < template.length) {

                    return {
                        "type": "reg",
                        "content": new RegExp(result.join(""), "gm"),
                        "index": index,
                        "next": index2 + 1
                    };

                } else {
                    return {
                        "type": "err",
                        "description": "Regular expression not be terminated",
                        "content": null,
                        "index": template.length,
                    };
                }

            }

            case 48:            // 0
            case 49:            // 1
            case 50:            // 2
            case 51:            // 3
            case 52:            // 4
            case 53:            // 5
            case 54:            // 6
            case 55:            // 7
            case 56:            // 8
            case 57:            // 9
            {

                var hasDot = false;
                var code = 0;
                var index2 = index;
                while ((index2 < template.length) &&
                       ([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 46].indexOf(code = template.charCodeAt(index2)) != -1)) {

                    if (code == 46) {
                        if (hasDot) {

                            return {
                                "type": "err",
                                "description": "Two dots have been found in number",
                                "content": null,
                                "index": index2,
                            };

                        } else {
                            hasDot = true;
                        }
                    }

                    ++index2;
                }

                var symbol = template.substring(index, index2);
                if (hasDot) {
                    return {
                        "type": "num",
                        "content": parseFloat(symbol),
                        "index": index,
                        "next": index2
                    };
                }
                else
                {
                    return {
                        "type": "num",
                        "content": parseInt(symbol),
                        "index": index,
                        "next": index2
                    };
                }

            }

            case 46:            // .
            case 43:            // +
            case 45:            // -
            case 61:            // =
            case 42:            // *
            case 47:            // /
            case 38:            // &
            case 33:            // !
            case 94:            // ^
            case 37:            // %
            case 126:           // ~
            case 60:            // <
            case 62:            // >
            case 44:            // ,
            case 63:            // ?
            case 58:            // :
            case 59:            // ;
            case 124:           // |
            case 40:            // (
            case 41:            // )
            case 91:            // [
            case 93:            // ]
            case 123:           // {
            case 125:           // }
            {

                var combinedOperators = ["&&", "||", ">=", "<=", "!=", "==", ">>", "<<"];
                if ((index + 1 < template.length) &&
                    (combinedOperators.indexOf(template[index] + template[index + 1]) != -1)) {
                    return {
                        "type": "opr",
                        "content": template[index] + template[index + 1],
                        "index": index,
                        "next": index + 2
                    };
                }
                else
                {
                    return {
                        "type": "opr",
                        "content": template[index],
                        "index": index,
                        "next": index + 1
                    };
                }

            }

            default: {

                var code = 0;
                var index2 = index;
                while ((index2 < template.length) &&
                       ([
                        9, 10, 13, 32,
                        34, 39,
                        35,
                        46, 43, 45, 61, 42, 47, 38, 33, 94, 37, 126, 60, 62, 44, 63, 58, 59, 124, 40, 41, 91, 93, 123, 125
                        ].indexOf(code = template.charCodeAt(index2)) == -1)) {
                    ++index2;
                }

                var symbol = template.substring(index, index2);

                return {
                    "type": "sym",
                    "content": symbol,
                    "index": index,
                    "next": index2
                };

            }
        }

    } else {

        return {
            "type": "eot",
            "content": null,
            "index": template.length,
        };

    }

};

finalTemplate.lexer.convertCharacter = function (template) {

    var symbols = [];

    var looper = 0;
    while (looper < template.length) {

        var symbol = finalTemplate.lexer.getSymbol(template, looper);
        switch (symbol.type) {

            case "err": {

                var content = symbol.description + ". ";

                content += "Code: " + template.substring(Math.max(symbol.index - 10, 0),
                                                         Math.min(symbol.index + 10, template.length));

                throw new Error(content);
            }

            case "eot": {

                looper = template.length;

                break;
            }

            case "num":
            case "opr":
            case "sym":
            case "qot":
            case "reg":
            default: {

                symbols.push(symbol);

                looper = symbol.next;

                break;
            }

        }

    }

    return symbols;

};

finalTemplate.lexer.convertBracket = function (template, symbols) {

    var queue = [];
    queue.type = "blk";
    queue.operator = "";
    queue.symbol = symbols[0];

    var current = queue;

    symbols.forEach(function (symbol) {

        if (symbol.type == "opr") {

            switch (symbol.content) {

                case "(":
                case "[":
                case "{": {

                    var newQueue = [];

                    newQueue.superqueue = current;

                    newQueue.type = "blk";
                    newQueue.operator = symbol.content;
                    newQueue.symbol = symbol;
                    newQueue.index = symbol.index;

                    current.push(newQueue);

                    current = newQueue;

                    break;
                }

                case ")":
                case "]":
                case "}": {

                    if (!current.superqueue) {

                        var symbol2 = current.symbol;
                        if (current.length > 0) {

                            symbol2 = current[current.length - 1];
                            if (symbol2.type == "blk")
                            {
                                symbol2 = symbol2.symbol;
                            }

                        }

                        if (!symbol2) {
                            symbol2 = symbols[symbols.length - 1];
                        }

                        var code = template.substring(Math.max(symbol2.index - 10, 0),
                                                      Math.min(symbol2.index + 10, template.length));

                        throw new Error("No close brackets found. Code: " + code);

                    }

                    if ((current.operator == "") ||
                        ((current.operator != "(") && (symbol.content == ")")) ||
                        ((current.operator != "[") && (symbol.content == "]")) ||
                        ((current.operator != "{") && (symbol.content == "}"))) {

                        var symbol2 = current.symbol;
                        if (current.length > 0) {

                            symbol2 = current[current.length - 1];

                            if (symbol2.type == "blk") {
                                symbol2 = symbol2.symbol;
                            }

                        }

                        if (!symbol2) {
                            symbol2 = symbols[symbols.length - 1];
                        }

                        var code = template.substring(Math.max(symbol2.index - 10, 0),
                                                      Math.min(symbol2.index + 10, template.length));

                        throw new Error("Brackets not matched. Code: " + code);

                    }

                    current = current.superqueue;

                    break;
                }

                default: {

                    current.push(symbol);

                    break;
                }
            }

        } else {
            current.push(symbol);
        }

    });

    return queue;

};

finalTemplate.lexer.convertSugar = function (template, queue) {

    var newQueue = [];
    newQueue.symbol = queue.symbol;
    newQueue.type = queue.type;
    newQueue.operator = queue.operator;

    var nextIndex = 0;

    queue.forEach(function (symbol, index) {

        if (nextIndex > index) {
            return;
        }

        switch (symbol.type) {

            case "opr": {

                if (symbol.content == ".") {

                    var lastSymbols = [];

                    while ((newQueue.length > 0) &&
                           (newQueue[newQueue.length - 1].type != "opr")) {
                        lastSymbols.unshift(newQueue.pop());
                    }

                    var nextSymbol = queue[index + 1];

                    newQueue.push({
                        "type": "ops",
                        "content": ".",
                        "index": symbol.index,
                        "next": symbol.next
                    });

                    var block = [];
                    block.symbol = symbol;
                    block.type = "blk";
                    block.operator = "(";

                    lastSymbols.forEach(function (lastSymbol) {
                        block.push(lastSymbol);
                    });

                    block.push({
                        "type": "opr",
                        "content": ",",
                        "index": symbol.index,
                        "next": symbol.next
                    });

                    if (nextSymbol.type != "sym") {

                        var code = template.substring(Math.max(nextSymbol.index - 10, 0),
                                                      Math.min(nextSymbol.index + 10, template.length));

                        throw new Error("Invalid usage of dot on syntax. Code: " + code);

                    }

                    block.push({
                        "type": "qot",
                        "content": nextSymbol.content,
                        "index": nextSymbol.index,
                        "next": nextSymbol.next
                    });

                    newQueue.push(block);

                    nextIndex = index + 2;

                } else if (symbol.content == ";") {

                    if (index < queue.length - 1) {
                        newQueue.push(symbol);
                    }

                } else {
                    newQueue.push(symbol);
                }

                break;
            }

            case "blk": {

                if (symbol.operator == "[") {

                    var lastSymbols = [];

                    while ((newQueue.length > 0) &&
                           (newQueue[newQueue.length - 1].type != "opr")) {
                        lastSymbols.unshift(newQueue.pop());
                    }

                    var nextSymbol = finalTemplate.lexer.convertSugar(template, symbol);

                    newQueue.push({
                        "type": "ops",
                        "content": ((lastSymbols.length > 0) ? "." : "#"),
                        "index": symbol.index,
                        "next": symbol.next
                    });

                    var block = [];
                    block.symbol = symbol;
                    block.type = "blk";
                    block.operator = "(";

                    if (lastSymbols.length > 0) {

                        lastSymbols.forEach(function (lastSymbol) {
                            block.push(lastSymbol);
                        });

                        block.push({
                            "type": "opr",
                            "content": ",",
                            "index": symbol.index,
                            "next": symbol.next
                        });

                    }

                    nextSymbol.forEach(function (symbol) {
                        block.push(symbol);
                    });

                    newQueue.push(block);

                } else if (symbol.operator == "{") {

                    var isObject = symbol.filter(function (subsymbol) {
                        return ((subsymbol.type == "opr") && (subsymbol.content == ":"));
                    }).length > 0;

                    var isSwitch = symbol.filter(function (subsymbol) {
                        return ((subsymbol.type == "opr") && (subsymbol.content == "?"));
                    }).length > 0;

                    if (isObject && isSwitch) {

                        var code = template.substring(Math.max(symbol.index - 10, 0),
                                                      Math.min(symbol.index + 10, template.length));

                        throw new Error("Undetermined definition of object or switch. Code: " + code);

                    }

                    if ((symbol.length > 0) && (!isObject) && (!isSwitch)) {

                        var nextSymbol = finalTemplate.lexer.convertSugar(template, symbol);

                        newQueue.push({
                            "type": "ops",
                            "content": "$",
                            "index": symbol.index,
                            "next": symbol.next
                        });

                        var block = [];
                        block.symbol = symbol;
                        block.type = "blk";
                        block.operator = "(";
                        block.index = symbol.index;

                        if ((nextSymbol.length == 1) &&
                            (nextSymbol[0].type == "opr")) {

                            var newSymbol = function (type, content) {
                                return {
                                    "type": type,
                                    "content": content,
                                    "index": nextSymbol[0].index,
                                    "next": nextSymbol[0].next
                                };
                            };

                            switch (nextSymbol[0].content) {

                                case "-": {

                                    block.push(newSymbol("sym", "if"));

                                    var block2 = [];
                                    block2.symbol = nextSymbol[0];
                                    block2.type = "blk";
                                    block2.operator = "(";

                                    block2.push(newSymbol("sym", "$n"));
                                    block2.push(newSymbol("opr", "=="));
                                    block2.push(newSymbol("num", 1));
                                    block2.push(newSymbol("opr", ","));
                                    block2.push(newSymbol("opr", nextSymbol[0].content));
                                    block2.push(newSymbol("sym", "$1"));
                                    block2.push(newSymbol("opr", ","));
                                    block2.push(newSymbol("sym", "$1"));
                                    block2.push(newSymbol("opr", nextSymbol[0].content));
                                    block2.push(newSymbol("sym", "$2"));

                                    block.push(block2);

                                    break;
                                }

                                case "~":
                                case "!": {

                                    block.push(newSymbol("opr", nextSymbol[0].content));
                                    block.push(newSymbol("sym", "$1"));

                                    break;
                                }

                                default: {

                                    block.push(newSymbol("sym", "$1"));
                                    block.push(newSymbol("opr", nextSymbol[0].content));
                                    block.push(newSymbol("sym", "$2"));

                                    break;
                                }
                            }

                        } else {

                            nextSymbol.forEach(function (symbol) {
                                block.push(symbol);
                            });

                        }

                        newQueue.push(block);

                    } else if ((symbol.length == 2) && isSwitch && (symbol[0].type == "sym")) {

                        var newSymbol = function (type, content) {
                            return {
                                "type": type,
                                "content": content,
                                "index": symbol[0].index,
                                "next": symbol[0].next
                            };
                        };

                        newQueue.push({
                            "type": "ops",
                            "content": "$",
                            "index": symbol.index,
                            "next": symbol.next
                        });

                        var block = [];
                        block.symbol = symbol;
                        block.type = "blk";
                        block.operator = "(";
                        block.index = symbol.index;

                        block.push(newSymbol("sym", "execute"));

                        var block2 = [];
                        block2.symbol = symbol;
                        block2.type = "blk";
                        block2.operator = "(";
                        block2.index = symbol.index;

                        block2.push(newSymbol("qot", symbol[0].content));
                        block2.push(newSymbol("opr", ","));
                        block2.push(newSymbol("sym", "$a"));

                        block.push(block2);

                        newQueue.push(block);

                    }
                    else
                    {

                        var nextSymbol = finalTemplate.lexer.convertSugar(template, symbol);

                        newQueue.push({
                            "type": "ops",
                            "content": (isObject ? "@" : "?"),
                            "index": symbol.index,
                            "next": symbol.next
                        });

                        var block = [];
                        block.symbol = symbol;
                        block.type = "blk";
                        block.operator = "(";

                        var expect = (isObject ? ":" : "?");
                        nextSymbol.forEach(function (symbol) {

                            if ((symbol.type == "opr") &&
                                ((symbol.content == ",") || (symbol.content == ":") || (symbol.content == "?"))) {

                                if (symbol.content != expect) {

                                    var code = template.substring(Math.max(symbol.index - 10, 0),
                                                                  Math.min(symbol.index + 10, template.length));

                                    throw new Error("Invalid inline object syntax. Code: " + code);

                                } else {

                                    block.push({
                                        "type": "opr",
                                        "content": ",",
                                        "index": symbol.index,
                                        "next": symbol.next
                                    });

                                    expect = ((symbol.content == ",") ? (isObject ? ":" : "?") : ",");

                                }

                            } else {
                                block.push(symbol);
                            }

                        });

                        if ((nextSymbol[nextSymbol.length - 1].type == "opr") &&
                            ((nextSymbol[nextSymbol.length - 1].content == "?") ||
                             (nextSymbol[nextSymbol.length - 1].content == ":"))) {

                            var code = template.substring(Math.max(nextSymbol[nextSymbol.length - 1].index - 10, 0),
                                                          Math.min(nextSymbol[nextSymbol.length - 1].index + 10, template.length));

                            throw new Error("Invalid inline object syntax. Code: " + code);

                        }

                        newQueue.push(block);

                    }

                } else {
                    newQueue.push(finalTemplate.lexer.convertSugar(template, symbol));
                }

                break;
            }

            case "num":
            case "sym":
            case "qot":
            case "reg":
            default: {

                newQueue.push(symbol);

                break;
            }
        }
    });

    return newQueue;

};

finalTemplate.lexer.convertCall = function (template, queue) {

    var newQueue = [];
    newQueue.symbol = queue.symbol;
    newQueue.type = queue.type;
    newQueue.operator = queue.operator;

    var nextIndex = 0;

    queue.forEach(function (symbol, index) {

        if (nextIndex > index) {
            return;
        }

        switch (symbol.type) {

            case "blk": {

                if (symbol.operator == "(") {

                    if ((newQueue.length > 0) &&
                        ((newQueue[newQueue.length - 1].type == "sym") ||
                         (newQueue[newQueue.length - 1].type == "ops"))) {

                        var name = newQueue.pop();

                        var callArguments = [];

                        var block = [];

                        block.type = "blk";
                        block.operator = "";
                        block.symbol = symbol;

                        callArguments.push(block);

                        symbol.forEach(function (subsymbol) {

                            if ((subsymbol.type == "opr") && (subsymbol.content == ",")) {

                                if (callArguments[callArguments.length - 1].length == 0) {

                                    var code = template.substring(Math.max(subsymbol.index - 10, 0),
                                                                  Math.min(subsymbol.index + 10, template.length));

                                    throw new Error("No argument found. Code: " + code);

                                }

                                var block = [];

                                block.type = "blk";
                                block.operator = "";
                                block.symbol = symbol;

                                callArguments.push(block);

                            } else {
                                callArguments[callArguments.length - 1].push(subsymbol);
                            }

                        });

                        var looper = 0;
                        while (looper < callArguments.length) {

                            callArguments[looper] = finalTemplate.lexer.convertCall(template, callArguments[looper]);

                            ++looper;
                        }

                        if ((callArguments.length == 1) && (callArguments[0].length == 0)) {
                            callArguments = [];
                        }

                        newQueue.push({
                            "type": ((name.type == "sym") ? "fnc" : "opc"),
                            "content": name.content,
                            "arguments": callArguments,
                            "symbol": name,
                            "index": name.index,
                            "next": name.next
                        });

                    } else {
                        newQueue.push(finalTemplate.lexer.convertCall(template, symbol));
                    }

                } else {
                    newQueue.push(finalTemplate.lexer.convertCall(template, symbol));
                }

                break;
            }

            case "opr":
            case "ops":
            case "num":
            case "sym":
            case "qot":
            case "reg":
            default: {

                newQueue.push(symbol);

                break;
            }

        }

    });

    return newQueue;

};

finalTemplate.lexer.convertOperator = function (template, queue) {

    if (queue.operatorNo) {
        return queue;
    }

    var newQueue = queue.slice(0);
    newQueue.symbol = queue.symbol;
    newQueue.type = queue.type;
    newQueue.operator = queue.operator;
    newQueue.operatorNo = true;

    var step = 0;
    while (step < finalTemplate.operatorQueue.length) {

        var left = (finalTemplate.operatorQueue[step][0] == "left");

        var looper = left ? 0 : newQueue.length - 1;
        while ((looper < newQueue.length) && (looper >= 0)) {

            if ((newQueue[looper].type == "opr") &&
                (finalTemplate.operatorQueue[step].indexOf(newQueue[looper].content) > 0)) {


                if ((newQueue[looper].content == "!") ||
                    (newQueue[looper].content == "~") ||
                    ((looper == 0) && (newQueue[looper].content == "-"))) {

                    if (looper + 1 >= newQueue.length) {

                        var code = template.substring(Math.max(newQueue[looper].index - 10, 0),
                                                      Math.min(newQueue[looper].index + 10, template.length));

                        throw new Error("No operatee found for operator \"" + newQueue[looper].content + "\". Code: " + code);

                    }

                    var callArguments = [];

                    var block = [];

                    block.type = "blk";
                    block.operator = "";
                    block.symbol = newQueue[looper];

                    callArguments.push(block);

                    block.push(newQueue[looper + 1]);

                    var index = looper;

                    var offset = 1;
                    while (newQueue[index + offset].type == "opr") {

                        if (index + offset >= newQueue.length) {

                            var code = template.substring(Math.max(newQueue[index + offset].index - 10, 0),
                                                          Math.min(newQueue[index + offset].index + 10, template.length));

                            throw new Error("No operatee found for operator \"" + newQueue[index + offset].content + "\". Code: " + code);

                        }

                        block.push(newQueue[index + offset + 1]);

                        if (left) {
                            ++looper;
                            ++offset;
                        } else {
                            --looper;
                            --offset;
                        }

                    }

                    newQueue.splice(index, 1 + offset, {
                        "type": "opc",
                        "content": newQueue[index].content,
                        "arguments": callArguments,
                        "symbol": newQueue[index],
                        "index": newQueue[index].index,
                        "next": newQueue[index].next
                    });

                } else {

                    var callArguments = [];

                    if ((looper + 1 >= newQueue.length) ||
                        (looper < 1)) {

                        var code = template.substring(Math.max(newQueue[looper].index - 10, 0),
                                                      Math.min(newQueue[looper].index + 10, template.length));

                        throw new Error("No operatee found for operator \"" + newQueue[looper].content + "\". Code: " + code);

                    }

                    var block = [];

                    block.type = "blk";
                    block.operator = "";
                    block.symbol = newQueue[looper];

                    callArguments.push(block);

                    block.push(newQueue[looper - 1]);

                    block = [];

                    block.type = "blk";
                    block.operator = "";
                    block.symbol = newQueue[looper];

                    callArguments.push(block);

                    block.push(newQueue[looper + 1]);

                    var index = looper;

                    var offset = 1;
                    while (newQueue[index + offset].type == "opr") {

                        if (index + offset >= newQueue.length) {

                            var code = template.substring(Math.max(newQueue[index + offset].index - 10, 0),
                                                          Math.min(newQueue[index + offset].index + 10, template.length));

                            throw new Error("No operatee found for operator \"" + newQueue[index + offset].content + "\". Code: " + code);

                        }

                        block.push(newQueue[index + offset + 1]);

                        if (left) {
                            ++looper;
                        } else {
                            --looper;
                        }

                        ++offset;

                    }

                    newQueue.splice(index - 1, offset + 2, {
                        "type": "opc",
                        "content": newQueue[index].content,
                        "arguments": callArguments,
                        "symbol": newQueue[index],
                        "index": newQueue[index].index,
                        "next": newQueue[index].next
                    });

                    if (left) {
                        --looper;
                    }

                }

            }

            if (left) {
                ++looper;
            } else {
                --looper;
            }

        }

        ++step;
    }

    var result = [];
    result.symbol = queue.symbol;
    result.type = queue.type;
    result.operator = queue.operator;
    result.operatorNo = true;

    newQueue.forEach(function (symbol) {

        switch (symbol.type) {

            case "blk": {

                result.push(finalTemplate.lexer.convertOperator(template, symbol));

                break;
            }

            case "fnc":
            case "opc": {

                var callArguments = [];
                symbol.arguments.forEach(function (argument) {
                    callArguments.push(finalTemplate.lexer.convertOperator(template, argument));
                });

                result.push({
                    "type": symbol.type,
                    "content": symbol.content,
                    "arguments": callArguments,
                    "symbol": symbol.symbol,
                    "index": symbol.index,
                    "next": symbol.next
                });

                break;
            }

            case "opr":
            case "ops":
            case "num":
            case "sym":
            case "qot":
            case "reg":
            default: {

                result.push(symbol);

                break;
            }

        }

    });

    return result;
};

finalTemplate.lexer.convertQueue = function (template, queue) {

    if ((!queue) || (queue.length == 0)) {
        return null;
    }

    if (queue.length > 1) {

        var code = template.substring(Math.max(queue[0].index - 10, 0),
                                      Math.min(queue[0].index + 10, template.length));

        console.log(queue);

        throw new Error("Queue could not be simplfied to pure function calls. Code: " + code);
    }

    switch (queue[0].type) {

        case "fnc":
        case "opc": {

            var callArguments = [];

            queue[0].arguments.forEach(function (argument) {
                callArguments.push(finalTemplate.lexer.convertQueue(template, argument));
            });

            return {
                "type": queue[0].type,
                "content": queue[0].content,
                "arguments": callArguments,
                "index": queue[0].index,
            };
        }

        case "blk": {
            return finalTemplate.lexer.convertQueue(template, queue[0]);
        }

        case "sym":
        case "qot":
        case "reg":
        case "num": {
            return queue[0];
        }

        case "opr":
        case "ops":
        default: {

            var code = template.substring(Math.max(queue[0].index - 10, 0),
                                          Math.min(queue[0].index + 10, template.length));

            throw new Error("Queue could not be simplfied to pure function calls. Code: " + code);

        }

    }

};

finalTemplate.run = function (template, call, parameters, options) {

    switch (call.type) {

        case "fnc":
        case "opc": {

            var action = null;
            if (call.type == "fnc") {

                if (options.functors) {
                    action = options.functors[call.content];
                }

                if (!action) {
                    action = finalTemplate.functors[call.content];
                }

            } else {
                action = finalTemplate.operators[call.content];
            }

            if ((action === Function) || (action === eval)) {
                action = null;
            }

            if (!action) {

                var code = template.substring(Math.max(call.index - 20, 0),
                                              Math.min(call.index + 20, template.length));

                throw new Error("Function or operator definition not found: " + code);

            }

            var lazyArguments = [];
            call.arguments.forEach(function (argument) {

                var result = null;
                var called = false;

                lazyArguments.push(function () {

                    if (!called) {

                        result = finalTemplate.run(template, argument, parameters, options);

                        called = true;
                    }

                    return result;
                });
            });

            if (!action.lazy) {
                lazyArguments = lazyArguments.map(function (argument) {
                    return argument();
                });
            }

            var callArguments = [template, call, parameters, options];

            lazyArguments.forEach(function (lazyArgument) {
                callArguments.push(lazyArgument);
            });

            var result = null;

            result = action.apply(null, callArguments);

            return result;
        }

        case "sym": {

            switch (call.content) {

                case "true": {
                    return true;
                }

                case "false": {
                    return false;
                }

                case "null": {
                    return null;
                }

                case "undefined": {
                    return undefined;
                }

                case "nan": {
                    return NaN;
                }

                case "infinity": {
                    return Infinity;
                }

                default: {
                    return parameters[call.content];
                }

            }

        }

        case "num":
        case "qot":
        case "reg": {
            return call.content;
        }

        case "opr":
        case "ops":
        default: {

            var code = template.content.substring(Math.max(call.index - 10, 0),
                                          Math.min(call.index + 10, template.length));

            throw new Error("Invalid code: " + code);

        }

    }

};

finalTemplate.execute = function (template, parameters, options) {

    if (!parameters) {
        parameters = {};
    } else {
        if (!options.parametersMutable) {

            var newParameters = {};

            for (var name in parameters) {
                newParameters[name] = parameters[name];
            }

            parameters = newParameters;

        }
    }

    if (!options) {
        options = {};
    }

    if (options.log) {
        console.log("Code:   " + template);
    }

    var symbols = finalTemplate.lexer.convertCharacter(template);

    if (symbols.length == 0) {
        return null;
    }

    var queue = finalTemplate.lexer.convertBracket(template, symbols);

    var queue = finalTemplate.lexer.convertSugar(template, queue);

    var queue = finalTemplate.lexer.convertCall(template, queue);

    var queue = finalTemplate.lexer.convertOperator(template, queue);

    if (options.log) {
        console.log("Queue:  " + finalTemplate.lexer.stringify(queue));
    }

    var call = finalTemplate.lexer.convertQueue(template, queue);

    if (options.log) {
        console.log("Call:   " + finalTemplate.lexer.stringify(call));
    }

    var result = finalTemplate.run(template, call, parameters, options);

    if (options.log) {
        console.log("Result: " + result);
    }

    return result;

};

finalTemplate.compile = function (template, options) {

    if (!options) {
        options = {};
    }

    if (options.log) {
        console.log("Code:   " + template);
    }

    var symbols = finalTemplate.lexer.convertCharacter(template);

    if (symbols.length == 0) {
        return null;
    }

    var queue = finalTemplate.lexer.convertBracket(template, symbols);

    var queue = finalTemplate.lexer.convertSugar(template, queue);

    var queue = finalTemplate.lexer.convertCall(template, queue);

    var queue = finalTemplate.lexer.convertOperator(template, queue);

    if (options.log) {
        console.log("Queue:  " + finalTemplate.lexer.stringify(queue));
    }

    var call = finalTemplate.lexer.convertQueue(template, queue);

    if (options.log) {
        console.log("Call:   " + finalTemplate.lexer.stringify(call));
    }

    return call;

};

finalTemplate.operators["."] = function (template, call, parameters, options, superobject, subordinateName) {

    if ((superobject === null) || (superobject === undefined)) {
        return null;
    }

    var result = superobject[subordinateName];

    if (options["functionAvailable"]) {

        if ((result === Function) || (result === eval)) {
            result = null;
        }

    } else if (result && (result.constructor == Function)) {
        result = null;
    }

    return result;

};

finalTemplate.operators["*"] = function (template, call, parameters, options, a, b) {
    return a * b;
};

finalTemplate.operators["/"] = function (template, call, parameters, options, a, b) {
    return a / b;
};

finalTemplate.operators["%"] = function (template, call, parameters, options, a, b) {
    return a % b;
};

finalTemplate.operators["+"] = function (template, call, parameters, options, a, b) {
    return a + b;
};

finalTemplate.operators["-"] = function (template, call, parameters, options, a, b) {

    if (arguments.length == 5) {
        return -a;
    } else {
        return a - b;
    }

};

finalTemplate.operators["!"] = function (template, call, parameters, options, value) {
    return !value;
};

finalTemplate.operators["~"] = function (template, call, parameters, options, value) {
    return ~value;
};

finalTemplate.operators["&"] = function (template, call, parameters, options, a, b) {
    return a() & b();
};

finalTemplate.operators["|"] = function (template, call, parameters, options, a, b) {
    return a() | b();
};

finalTemplate.operators["^"] = function (template, call, parameters, options, a, b) {
    return a() ^ b();
};

finalTemplate.operators["&&"] = function (template, call, parameters, options, a, b) {
    return a() && b();
};

finalTemplate.operators["||"] = function (template, call, parameters, options, a, b) {
    return a() || b();
};

finalTemplate.operators[">"] = function (template, call, parameters, options, a, b) {
    return a > b;
};

finalTemplate.operators["<"] = function (template, call, parameters, options, a, b) {
    return a < b;
};

finalTemplate.operators[">="] = function (template, call, parameters, options, a, b) {
    return a >= b;
};

finalTemplate.operators["<="] = function (template, call, parameters, options, a, b) {
    return a <= b;
};

finalTemplate.operators[">>"] = function (template, call, parameters, options, a, b) {
    return a >> b;
};

finalTemplate.operators["<<"] = function (template, call, parameters, options, a, b) {
    return a << b;
};

finalTemplate.operators["=="] = function (template, call, parameters, options, a, b) {
    return a === b;
};

finalTemplate.operators["!="] = function (template, call, parameters, options, a, b) {
    return a !== b;
};

finalTemplate.operators["#"] = function (template, call, parameters, options) {
    return [].slice.call(arguments, 4);
};

finalTemplate.operators["@"] = function (template, call, parameters, options) {

    var namesAndValues = [].slice.call(arguments, 4);

    if (namesAndValues.length % 2 == 1) {

        var code = template.substring(Math.max(call.arguments[call.arguments.length - 1].index - 10, 0),
                                      Math.min(call.arguments[call.arguments.length - 1].index + 10, template.length));

        throw new Error("Invalid inline object syntax. Code: " + code);

    } else {

        var object = {};

        var looper = 0;
        while (looper < namesAndValues.length) {

            object[namesAndValues[looper]] = namesAndValues[looper + 1];

            looper += 2;
        }

        return object;
    }

};

finalTemplate.operators["$"] = function (template, call, parameters, options) {

    var namedArguments = call.arguments.slice(0, call.arguments.length - 1).map(function (argument) {

        if (argument.type != "sym") {

            var code = template.substring(Math.max(argument.index - 10, 0),
                                          Math.min(argument.index + 10, template.length));

            throw new Error("Invalid argument definition. Code: " + code);

        }

        return argument.content;
    });

    var definition = call.arguments[call.arguments.length - 1];

    return new (finalTemplate.Operator)(template, parameters, options, namedArguments, definition);

};

finalTemplate.operators[";"] = function (template, call, parameters, options, a, b) {

    var result = a();

    parameters['$x'] = result;

    return b();

};

finalTemplate.operators["?"] = function (template, call, parameters, options) {

    var condition = parameters["$x"];

    var testsAndValues = [].slice.call(arguments, 4);

    var looper = 0;
    while (looper < testsAndValues.length) {

        if (looper == testsAndValues.length - 1) {

            return testsAndValues[looper]();

        } else {

            var test = testsAndValues[looper]();

            if (test === condition) {
                return testsAndValues[looper + 1]();
            }

        }

        looper += 2;
    }

    return null;

};

finalTemplate.operators["&"].lazy = true;
finalTemplate.operators["|"].lazy = true;
finalTemplate.operators["^"].lazy = true;
finalTemplate.operators["&&"].lazy = true;
finalTemplate.operators["||"].lazy = true;
finalTemplate.operators["$"].lazy = true;
finalTemplate.operators[";"].lazy = true;
finalTemplate.operators["?"].lazy = true;

finalTemplate.functors["call"] = function (template, call, parameters, options, name) {
    return finalTemplate.functors["execute"](template, call, parameters, options, name, [].slice.call(arguments, 5));
};

finalTemplate.functors["execute"] = function (template, call, parameters, options, name, arguments) {

    if (!name) {
        return null;
    }

    if (!arguments) {
        arguments = [];
    }

    var callArguments = arguments.slice();

    callArguments.unshift(options);
    callArguments.unshift(parameters);
    callArguments.unshift(call);
    callArguments.unshift(template);

    if (name.constructor == finalTemplate.Operator) {

        return name.call.apply(name, callArguments);

    } else if (name.constructor == String) {

        if (finalTemplate.functors[name]) {
            return finalTemplate.functors[name].apply(this, callArguments);
        } else {
            return null;
        }

    } else {
        return null;
    }

};

finalTemplate.functors["echo"] = function (template, call, parameters, options, content) {

    if (options && options.echo) {
        options.echo(content);
    } else {
        console.log("Echo:   " + content);
    }

    return content;

};

finalTemplate.functors["if"] = function (template, call, parameters, options, condition, trueCall, falseCall) {

    if (condition()) {
        return trueCall();
    } else {
        return falseCall();
    }

};

finalTemplate.functors["default"] = function (template, call, parameters, options, condition, defaultValue) {

    if (condition()) {
        return condition();
    } else {
        return defaultValue();
    }

};

finalTemplate.functors["round"] = function (template, call, parameters, options, value) {
    return Math.round(value);
};

finalTemplate.functors["floor"] = function (template, call, parameters, options, value) {
    return Math.floor(value);
};

finalTemplate.functors["ceil"] = function (template, call, parameters, options, value) {
    return Math.ceil(value);
};

finalTemplate.functors["min"] = function (template, call, parameters, options) {

    var callArguments = [].slice.call(arguments, 4);

    return Math.min.apply(Math, callArguments);

};

finalTemplate.functors["max"] = function (template, call, parameters, options) {

    var callArguments = [].slice.call(arguments, 4);

    return Math.max.apply(Math, callArguments);

};

finalTemplate.functors["trim"] = function (template, call, parameters, options, text) {
    return text.trim();
};

finalTemplate.functors["split"] = function (template, call, parameters, options, text, delimiter) {
    return text.split(delimiter);
};

finalTemplate.functors["join"] = function (template, call, parameters, options, array, delimiter) {
    return array.join(delimiter);
};

finalTemplate.functors["slice"] = function (template, call, parameters, options, array, start, end) {
    return array.slice(start, end);
};

finalTemplate.functors["search"] = function (template, call, parameters, options, object, searching, start)
{
    return object.indexOf(searching, start);
};

finalTemplate.functors["string"] = function (template, call, parameters, options) {

    var callArguments = [].slice.call(arguments, 4);

    return String.fromCharCode.apply(String, callArguments);

};

finalTemplate.functors["code"] = function (template, call, parameters, options, string) {

    var result = [];

    var looper = 0;
    while (looper < string.length) {

        result.push(string.charCodeAt(looper));

        ++looper;
    }

    return result;

};

finalTemplate.functors["lowerCase"] = function (template, call, parameters, options, text) {
    return text.toLocaleLowerCase();
};

finalTemplate.functors["upperCase"] = function (template, call, parameters, options, text) {
    return text.toLocaleUpperCase();
};

finalTemplate.functors["date"] = function (template, call, parameters, options, year, month, date, hours, minutes, seconds, milliseconds) {

    if (arguments.length == 4) {

        return new Date();

    } else if (arguments.length == 5) {

        if (/^(\-?)[0-9]+(\.[0-9]+)?$/.test(year)) {
            return new Date(year * 1000);
        } else {
            return new Date(year);
        }

    } else if (arguments.length == 7) {

        var result = new Date(year, month - 1, date);

        result.setFullYear(year);

        return result;

    } else if (arguments.length == 10) {

        var result = new Date(year, month - 1, date, hours, minutes, seconds);

        result.setFullYear(year);

        return result;

    } else if (arguments.length == 11) {

        var result = new Date(year, month - 1, date, hours, minutes, seconds, milliseconds);

        result.setFullYear(year);

        return result;

    } else {
        return null;
    }

};

finalTemplate.functors["timeunit"] = function (template, call, parameters, options, date, unit) {

    switch (unit) {

        case "year": { return date.getFullYear(); }
        case "month": { return date.getMonth() + 1; }
        case "date": { return date.getDate(); }

        case "day": { return date.getDay(); }

        case "hour": { return date.getHours(); }
        case "minute": { return date.getMinutes(); }
        case "second": { return date.getSeconds(); }

        case "millisecond": {return date.getMilliseconds(); }

        case "timestamp": { return date.getTime() / 1000; }

        default: { return null; }

    }

};

finalTemplate.functors["replace"] = function (template, call, parameters, options, text, searching, replacement, start) {
    return text.replace(searching, replacement, start);
};

finalTemplate.functors["match"] = function (template, call, parameters, options, text, expression) {
    return expression.test(text);
};

finalTemplate.functors["format"] = function (template, call, parameters, options, template, date) {

    var toString = function (number, length) {

        number = number + "";
        while (number.length < length) {
            number = "0" + number;
        }

        return number;
    };

    var result = [];

    var looper = 0;
    while (looper < template.length) {

        switch (template[looper]) {

            case "Y": {

                if (template[looper + 1] == "Y") {

                    if ((template[looper + 2] == "Y") && (template[looper + 3] == "Y")) {

                        result.push(toString(date.getFullYear(), 4));

                        looper += 4;

                    } else {

                        result.push(toString(date.getFullYear() % 100, 2));

                        looper += 2;

                    }

                } else {

                    result.push(date.getFullYear() + "");

                    ++looper;

                }

                break;
            }

            case "M": {

                if (template[looper + 1] == "M") {

                    result.push(toString(date.getMonth() + 1, 2));

                    looper += 2;

                } else {

                    result.push((date.getMonth() + 1) + "");

                    ++looper;

                }

                break;
            }

            case "D": {

                if (template[looper + 1] == "D") {

                    result.push(toString(date.getDate(), 2));

                    looper += 2;

                } else {

                    result.push(date.getDate() + "");

                    ++looper;

                }

                break;
            }

            case "h": {

                if (template[looper + 1] == "h") {

                    result.push(toString(date.getHours(), 2));

                    looper += 2;

                } else {

                    result.push(date.getHours() + "");

                    ++looper;

                }

                break;
            }

            case "m": {

                if (template[looper + 1] == "m") {

                    result.push(toString(date.getMinutes(), 2));

                    looper += 2;

                } else {

                    result.push(date.getMinutes() + "");

                    ++looper;

                }

                break;
            }

            case "s": {

                if (template[looper + 1] == "s") {

                    result.push(toString(date.getSeconds(), 2));

                    looper += 2;

                } else {

                    result.push(date.getSeconds() + "");

                    ++looper;

                }

                break;
            }

            case "S": {

                if ((template[looper + 1] == "S") && (template[looper + 2] == "S")) {

                    result.push(toString(date.getMilliseconds(), 3));

                    looper += 3;

                } else {

                    result.push(date.getMilliseconds() + "");

                    ++looper;

                }

                break;
            }

            case "\"":
            case "'": {

                var offset = 1;
                while ((template[looper + offset] != template[looper]) &&
                       (looper + offset < template.length)) {

                    if (template[looper + offset] == "\\") {

                        result.push(template[looper + offset + 1]);

                        offset += 2;

                    } else {

                        result.push(template[looper + offset]);

                        ++offset;

                    }

                }

                looper += offset + 1;

                break;
            }

            default: {

                result.push(template[looper]);

                ++looper;

                break;
            }
        }
    }

    return result.join("");

};

finalTemplate.functors["parse"] = function (template, call, parameters, options, text) {

    if (text.indexOf(".") != -1) {

        return parseFloat(text);

    } else {

        return parseInt(text);

    }

};

finalTemplate.functors["fixed"] = function (template, call, parameters, options, number, size) {
    return number.toFixed(size);
};

finalTemplate.functors["precision"] = function (template, call, parameters, options, number, size) {
    return number.toPrecision(size);
};

finalTemplate.functors["filter"] = function (template, call, parameters, options, list, filter) {
    return list.filter(function (element, index, list) {
        return filter.call(template, call, parameters, options, element, index, list);
    });
};

finalTemplate.functors["map"] = function (template, call, parameters, options, list, operator) {
    return list.map(function (element, index, list) {
        return operator.call(template, call, parameters, options, element, index, list);
    });
};

finalTemplate.functors["count"] = function (template, call, parameters, options, list, filter) {

    if (filter) {
        return list.filter(function (element, index, list) {
            return filter.call(template, call, parameters, options, element, index, list);
        }).length;
    } else {
        return list.length;
    }

};

finalTemplate.functors["sort"] = function (template, call, parameters, options, list, comparator) {

    list = list.slice(0);

    if (comparator) {
        return list.sort(function (a, b) {
            return comparator.call(template, call, parameters, options, a, b);
        });
    } else {
        return list.sort();
    }

};

finalTemplate.functors["fold"] = function (template, call, parameters, options, list, initial, calculator) {

    list.forEach(function (element, index, list) {
        initial = calculator.call(template, call, parameters, options, initial, element, index, list);
    });

    return initial;

};

finalTemplate.functors["log"] = function (template, call, parameters, options, value, base) {

    if (arguments.length == 5) {
        return Math.log(value);
    } else {
        return Math.log(value)/Math.log(base);
    }

};

finalTemplate.functors["power"] = function (template, call, parameters, options, base, value) {

    if (arguments.length == 5) {
        return Math.pow(Math.E, arguments[4]);
    } else {
        return Math.pow(base, value);
    }

};

finalTemplate.functors["sqrt"] = function (template, call, parameters, options, value) {
    return Math.sqrt(value);
};

finalTemplate.functors["cbrt"] = function (template, call, parameters, options, value) {
    return Math.cbrt(value);
};

finalTemplate.functors["sin"] = function (template, call, parameters, options, value) {
    return Math.sin(value);
};

finalTemplate.functors["cos"] = function (template, call, parameters, options, value) {
    return Math.cos(value);
};

finalTemplate.functors["tan"] = function (template, call, parameters, options, value) {
    return Math.tan(value);
};

finalTemplate.functors["asin"] = function (template, call, parameters, options, value) {
    return Math.asin(value);
};

finalTemplate.functors["acos"] = function (template, call, parameters, options, value) {
    return Math.acos(value);
};

finalTemplate.functors["atan"] = function (template, call, parameters, options, value) {
    return Math.atan(value);
};

finalTemplate.functors["angle"] = function (template, call, parameters, options, x, y) {
    return Math.atan2(y, x);
};

finalTemplate.functors["sinh"] = function (template, call, parameters, options, value) {
    return Math.sinh(value);
};

finalTemplate.functors["cosh"] = function (template, call, parameters, options, value) {
    return Math.cosh(value);
};

finalTemplate.functors["tanh"] = function (template, call, parameters, options, value) {
    return Math.tanh(value);
};

finalTemplate.functors["asinh"] = function (template, call, parameters, options, value) {
    return Math.asinh(value);
};

finalTemplate.functors["acosh"] = function (template, call, parameters, options, value) {
    return Math.acosh(value);
};

finalTemplate.functors["atanh"] = function (template, call, parameters, options, value) {
    return Math.atanh(value);
};

finalTemplate.functors["e"] = function (template, call, parameters, options) {
    return Math.E;
};

finalTemplate.functors["pi"] = function (template, call, parameters, options) {
    return Math.PI;
};

finalTemplate.functors["seq"] = function (template, call, parameters, options, start, end, step) {

    if (arguments.length < 7) {
        if (start < end) {
            step = 1;
        } else {
            step = -1;
        }
    }

    var list = [];

    var looper = start;
    do {

        list.push(looper);

        looper += step;
    } while ((start < end) ? (looper <= end) : (looper >= end));

    return list;

};

finalTemplate.functors["fill"] = function (template, call, parameters, options, content, length) {

    var list = [];

    var looper = 0;
    while (looper < length) {

        if (content.constructor == finalTemplate.Operator) {
            list.push(content.call(template, call, parameters, options));
        } else {
            list.push(content);
        }

        ++looper;
    }

    return list;

};

finalTemplate.functors["push"] = function (template, call, parameters, options, list) {

    var list = list.slice(0);

    list.push.apply(list, [].slice.call(arguments, 5));

    return list;

};

finalTemplate.functors["pop"] = function (template, call, parameters, options, list) {

    var list = list.slice(0);

    list.pop();

    return list;

};

finalTemplate.functors["unshift"] = function (template, call, parameters, options, list) {

    var list = list.slice(0);

    list.unshift.apply(list, [].slice.call(arguments, 5));

    return list;

};

finalTemplate.functors["shift"] = function (template, call, parameters, options, list) {

    var list = list.slice(0);

    list.shift();

    return list;

};

finalTemplate.functors["splice"] = function (template, call, parameters, options, list) {

    var list = list.slice(0);

    list.splice.apply(list, [].slice.call(arguments, 5));

    return list;

};

finalTemplate.functors["include"] = function (template, call, parameters, options, list, list2) {

    var list = list.slice(0);

    list2.forEach(function (element) {
        if (list.indexOf(element) == -1)
        {
            list.push(element);
        }
    });

    return list;

};

finalTemplate.functors["exclude"] = function (template, call, parameters, options, list, list2) {

    var list = list.slice(0);

    list2.forEach(function (element) {
        var index = list.indexOf(element);
        if (index != -1)
        {
            list.splice(index, 1);
        }
    });

    return list;

};

finalTemplate.functors["concat"] = function (template, call, parameters, options, list, list2) {

    var list = list.slice(0);

    list2.forEach(function (element) {
        list.push(element);
    });

    return list;

};

finalTemplate.functors["keys"] = function (template, call, parameters, options, object) {

    var list = [];

    for (var key in object) {
        list.push(key);
    }

    return list;

};

finalTemplate.functors["values"] = function (template, call, parameters, options, object) {

    var list = [];

    for (var key in object) {
        if (object.indexOf(object[key]) == -1) {
            list.push(object[key]);
        }
    }

    return list;

};

finalTemplate.functors["each"] = function (template, call, parameters, options, object, operator) {

    var result = {};

    for (var key in object) {
        result[key] = operator.call(template, call, parameters, options, key, object[key], object);
    }

    return result;

};

finalTemplate.functors["mix"] = function (template, call, parameters, options, object, object2) {

    var result = {};

    for (var key in object) {
        result[key] = object[key];
    }

    for (var key in object2) {
        result[key] = object2[key];
    }

    return result;

};

finalTemplate.functors["template"] = function (template, call, parameters, options, template, templateParameters) {

    var newOptions = {};
    for (var name in options) {
        newOptions[name] = options;
    }

    newOptions["parser"] = "text/plain";

    return finalTemplate(template, templateParameters, newOptions);

};



finalTemplate.functors["reverse"] = function (template, call, parameters, options, list) {
    return list.slice(0).reverse();
};

finalTemplate.functors["define"] = function (template, call, parameters, options, name, value) {

    if (!/^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(name)) {
        throw new Error("Invalid variant name: " + name);
    }

    if (!parameters.hasOwnProperty(name)) {
        parameters[name] = value;
    }

    while (parameters["^"]) {
        parameters = parameters["^"];
        parameters[name] = value;
    }

    return parameters[name];

};

finalTemplate.functors["random"] = function (template, call, parameters, options) {
    return Math.random();
};

finalTemplate.functors["sandbox"] = function (template, call, parameters, options) {

    var newParameters = {};
    for (var name in parameters) {
        newParameters[name] = parameters[name];
    }

    delete newParameters["^"];

    var operator = finalTemplate.run(template, call.arguments[0], newParameters, options);

    operator.call(template, call, newParameters, options);

};

finalTemplate.functors["isNumber"] = function (template, call, parameters, options, object) {
    return (object !== null) && (object !== undefined) && (object.constructor === Number);
};

finalTemplate.functors["isString"] = function (template, call, parameters, options, object) {
    return (object !== null) && (object !== undefined) && (object.constructor === String);
};

finalTemplate.functors["isList"] = function (template, call, parameters, options, object) {
    return (object !== null) && (object !== undefined) && ((object.constructor === Array) || (object instanceof Array));
};

finalTemplate.functors["isDate"] = function (template, call, parameters, options, object) {
    return (object !== null) && (object !== undefined) && (object.constructor === Date);
};

finalTemplate.functors["isRegex"] = function (template, call, parameters, options, object) {
    return (object !== null) && (object !== undefined) && (object.constructor === RegExp);
};

finalTemplate.functors["isObject"] = function (template, call, parameters, options, object) {
    return (object !== null) && (object !== undefined);
};

finalTemplate.functors["typeOf"] = function (template, call, parameters, options, object) {

    if ((object === null) || (object === undefined)) {
        return "null";
    } else if (object.constructor === Number) {
        return "number";
    } else if (object.constructor === String) {
        return "string";
    } else if (object.constructor === Date) {
        return "date";
    } else if (object.constructor === RegExp) {
        return "regex";
    } else if ((object.constructor === Array) || (object instanceof Array)) {
        return "list";
    } else {
        return "object";
    }

};

finalTemplate.functors["via"] = function (template, call, parameters, options, object, path) {

    var value = object;

    path.split(".").filter(function (key) {
        return (key.length > 0)
    }).forEach(function (key) {
        if ((value !== null) && (value != undefined)) {
            value = value[key];
        }
    });

    return value;
};

finalTemplate.functors["data"] = function (template, call, parameters, options) {
    return parameters;
};

finalTemplate.functors["if"].lazy = true;
finalTemplate.functors["default"].lazy = true;
finalTemplate.functors["sandbox"].lazy = true;

finalTemplate.parsers["text/plain"] = function (template, parameters, options) {

    var result = [];

    var looper = 0;
    while (looper < template.length) {

        if ((template[looper] == "$") &&
            (looper + 1 < template.length) &&
            (template[looper + 1] == "{")) {

            var symbols = [];

            looper += 2;

            var start = looper;

            var level = 1;

            while ((level > 0) && (looper < template.length)) {

                var symbol = finalTemplate.lexer.getSymbol(template, looper);

                if (symbol.type == "opr") {
                    if (symbol.content == "{") {
                        ++level;
                    } else if (symbol.content == "}") {
                        --level;
                    }
                }

                symbols.push(symbol);

                looper = symbol.next;

            }

            if (level > 0) {

                var code = template.substring(Math.max(looper - 10, 0),
                                              Math.min(looper + 10, template.length));

                throw new Error("Bracket not terminated. Code: " + code);

            }

            symbols.pop();

            if (symbols.length > 0) {

                if (options.log) {
                    console.log("Code:   " + template.substring(start, looper - 1));
                }

                var queue = finalTemplate.lexer.convertBracket(template, symbols);

                var queue = finalTemplate.lexer.convertSugar(template, queue);

                var queue = finalTemplate.lexer.convertCall(template, queue);

                var queue = finalTemplate.lexer.convertOperator(template, queue);

                if (options.log) {
                    console.log("Queue:  " + finalTemplate.lexer.stringify(queue));
                }

                var call = finalTemplate.lexer.convertQueue(template, queue);

                if (options.log) {
                    console.log("Call:   " + finalTemplate.lexer.stringify(call));
                }

                var expressionResult = finalTemplate.run(template, call, parameters, options);

                if (options.log) {
                    console.log("Result: " + expressionResult);
                }

                result.push(expressionResult);

            }

        } else {

            result.push(template[looper]);

            ++looper;
        }

    }

    return result.join("");

};
module.exports = {
    "format": finalTemplate,
    "compile": finalTemplate.compile,
    "execute": function () {
        if (arguments[0].constructor === String) {
            return finalTemplate.execute.apply(finalTemplate, arguments);
        } else {
            return finalTemplate.run.apply(finalTemplate, arguments);
        }
    }
};

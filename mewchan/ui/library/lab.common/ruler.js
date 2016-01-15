var foundation = require('./foundation.js');
var comparator = require('./comparator.js');
// simple ruler parses rules like :
//{
//   "mewchan.token:includes" : ["$data"],
//   "mewchan.token:excludes" : ["$data"],
//   "mewchan.token:equals"  : "$data",
//   "mewchan.token:not" : "$data",
//   "!data" : {
//       "data" : "value"
//   }
//}
var SimpleRuler = function SimpleRuler() {

};

SimpleRuler.prototype.exportRules = function(currentRules) {
    var rules = [];
    if (currentRules.rules) {
        Object.keys(currentRules.rules).forEach(function(key) {
            currentRules.rules[key].forEach(function(rule) {
                rules.push(rule);
            });
        });
    }
    return rules;
};
SimpleRuler.prototype.addRules = function(currentRules, newRules) {


    if (foundation.isKindOf(newRules, Array)) {
        rulesToAdd = newRules;
    } else {
        throw new Error("Rule Type Not Supported");
    }

    if (!currentRules) {
        currentRules = {
            "rules": {},
            "compiled": {}
        };
    } else {
        if (!currentRules.rules) {
            currentRules.rules = {}
        }
        if (!currentRules.compiled) {
            currentRules.compiled = {}
        }
    }

    var ruler = this;

    newRules.forEach(function(newRule) {

        // build hash for Rule
        var hashObject = {};
        Object.keys(newRule).forEach(function(ruleName) {
            if (ruleName[0] !== '!') {
                hashObject[ruleName] = newRule[hashObject];
            }
        });

        var hashString = "";
        Object.keys(hashObject).sort(comparator.naturalComparator).forEach(function(hashKey) {
            if (foundation.isKindOf(newRule[hashKey], String) || foundation.isKindOf(newRule[hashKey], Array)) {
                hashString = hashString + "{" + hashKey + "=" + newRule[hashKey].toString() + "}";
            } else {
                throw new Error("Hash Key Error : ["+hashKey+"]="+newRule[hashKey]);
            }
        });

        var hash = foundation.stringHash(hashString).toString(16);


        var compiled = ruler.compileRule(newRule);
        var operation = newRule["!operation"] || "merge";

        if (currentRules.compiled[hash]) {
            switch (operation) {
                case "merge":
                    currentRules.rules[hash].push(newRule);
                    break;

                case "assign":
                    currentRules.rules[hash] = [newRule];
                    break;

                case "clear":
                    delete currentRules.rules[hash];
                    break;
            }
            if (operation === "clear") {
                delete currentRules.compiled[hash];
            } else {

                Object.keys(compiled.fields).forEach(function(key) {
                    Object.keys(compiled.fields[key]).forEach(function(operator) {
                        switch (operation) {
                            case "merge":
                                compiled.fields[key][operator].forEach(function(token) {
                                    if (currentRules.compiled[hash][key][operator].indexOf(token) < 0) {
                                        currentRules.compiled[hash][key][operator].push(token);
                                    }
                                });
                                break;
                            case "assign":
                                currentRules.compiled[hash][key][operator] = compiled.fields[key][operator];
                                break;
                        }
                    });
                });

            }

        } else {
            currentRules.rules[hash] = [newRule];
            currentRules.compiled[hash] = compiled.fields;
        }

    });

    return currentRules;
};

SimpleRuler.prototype.match = function(rules, object) {

    if (object && foundation.isKindOf(object, Object) && rules && rules.compiled) {
        var shouldPass = false;
        Object.keys(rules.compiled).forEach(function(rule) {
            if (!shouldPass) {
                var singleRule = rules.compiled[rule];
                var passed = true;
                Object.keys(singleRule).forEach(function(ruleKey) {
                    if (passed && object[ruleKey]) {
                        Object.keys(singleRule[ruleKey]).forEach(function(operator) {
                            if (passed) {
                                if (foundation.isKindOf(object[ruleKey], String)) {
                                    switch (operator) {
                                        case "not":
                                            passed = singleRule[ruleKey][operator].toString() !== object[ruleKey]
                                            break;
                                        case "includes":
                                            passed = singleRule[ruleKey][operator].indexOf(object[ruleKey]) >= 0;
                                            break;
                                        case "equals":
                                            passed = singleRule[ruleKey][operator].toString() == object[ruleKey]
                                            break;
                                        case "excludes":
                                            passed = singleRule[ruleKey][operator].indexOf(object[ruleKey]) < 0;
                                            break;
                                    }
                                } else if (foundation.isKindOf(object[ruleKey], Array)) {
                                    object[ruleKey].forEach(function(entry) {
                                        if (passed) {
                                            if (foundation.isKindOf(entry, String)) {
                                                switch (operator) {
                                                    case "not":
                                                        passed = singleRule[ruleKey][operator].toString() !== entry
                                                        break;
                                                    case "includes":
                                                        passed = singleRule[ruleKey][operator].indexOf(entry) >= 0;
                                                        break;
                                                    case "equals":
                                                        passed = singleRule[ruleKey][operator].toString() == entry
                                                        break;
                                                    case "excludes":
                                                        passed = singleRule[ruleKey][operator].indexOf(entry) < 0;
                                                        break;
                                                }
                                            } else {
                                                passed = false;
                                            }
                                        }

                                    });
                                } else {
                                    passed = false;
                                }

                            }
                        });
                    }
                });
                if (passed) {
                    shouldPass = true;
                }
            }
        });

        return shouldPass;
    } else {
        return true;
    }

};


Object.defineProperty(SimpleRuler.prototype, "compileRule", {
    "enumerable": false,
    "value": function(newRule) {

        var ruleData = newRule["!data"];
        if (!ruleData) {
            ruleData = {};
        }

        var compiledRule = {
            "fields": {}
        };
        var usefulRule = false;

        Object.keys(newRule).forEach(function(ruleName) {

            usefulRule = true;

            if (ruleName[0] !== '!') {

                var operation;
                var ruleKey;
                if (ruleName.indexOf(":") < 0) {
                    operation = "equals";
                    ruleKey = ruleName;
                } else {
                    operation = ruleName.substr(ruleName.lastIndexOf(":") + 1);
                    ruleKey = ruleName.substr(0, ruleName.lastIndexOf(":"));
                }

                if (["equals", "includes", "excludes", "not"].indexOf(operation) < 0) {
                    throw new Error("Operation not support");
                }

                var ruleBody = newRule[ruleName];

                if (foundation.isKindOf(ruleBody, String)) {

                    if (ruleBody[0] == '$') {
                        ruleBody = ruleData[ruleBody.substr(1)];
                        if (!ruleBody) {
                            throw new Error("No Key Found In Data");
                        }
                    }

                } else if (foundation.isKindOf(ruleBody, Array)) {

                    if (ruleBody.length) {
                        for (var i = 0; i < ruleBody.length; ++i) {
                            if (foundation.isKindOf(ruleBody[i][0], String)) {
                                if (ruleBody[i][0] == '$') {
                                    ruleBody[i] = ruleData[ruleBody[i].substr(1)];
                                    if (!ruleBody[i]) {
                                        throw new Error("No Key Found In Data");
                                    }
                                }
                            } else {
                                throw new Error("Rule Body Type not supported");
                            }

                        }
                    } else {
                        throw new Error("Useless Rule");
                    }
                } else {
                    throw new Error("Rule Type not supported")
                }

                if (!compiledRule.fields[ruleKey]) {
                    compiledRule.fields[ruleKey] = {}
                }

                if (!compiledRule.fields[ruleKey][operation]) {
                    compiledRule.fields[ruleKey][operation] = [];
                }

                if (Array.isArray(ruleBody)) {

                    ruleBody.forEach(function(body) {

                        if (compiledRule.fields[ruleKey][operation].indexOf(body) < 0) {
                            compiledRule.fields[ruleKey][operation].push(body);
                        }
                    });

                } else {

                    if (compiledRule.fields[ruleKey][operation].indexOf(ruleBody.toString()) < 0) {
                        compiledRule.fields[ruleKey][operation].push(ruleBody.toString());
                    }

                }

            } else {
                compiledRule[ruleName] = newRule[ruleName];
            }

        });

        if (!usefulRule) {
            throw new Error("Useless Rule");
        }

        return compiledRule;

    }
});


module.exports.simple = new SimpleRuler();

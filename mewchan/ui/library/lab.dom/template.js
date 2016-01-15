$.template.namespaceURI = "http://project.spiritate.org/template";

$.template.xnamespaceURI = "http://project.spiritate.org/templatex";

$.template.external = {};

$.template.safeEventQueue = {};

$.template.parsers["text/html"] = function(template, parameters, options) {

    var originalParametersMutable = options["parametersMutable"];

    options["parametersMutable"] = true;

    options["animated"] = options["animated"] ? true : false;

    options["defaultAnimationDuration"] = parseInt(options["defaultAnimationDuration"]);
    if (isNaN(options["defaultAnimationDuration"])) {
        options["defaultAnimationDuration"] = 1000;
    }

    options["minimumIntervalBetweenUpdates"] = parseInt(options["minimumIntervalBetweenUpdates"]);
    if (isNaN(options["minimumIntervalBetweenUpdates"])) {
        options["minimumIntervalBetweenUpdates"] = options["defaultAnimationDuration"];
    }

    if (options["minimumIntervalBetweenUpdates"] < options["defaultAnimationDuration"] + 50) {
        options["minimumIntervalBetweenUpdates"] = options["defaultAnimationDuration"] + 50
    }

    if (!options["animated"]) {
        options["minimumIntervalBetweenUpdates"] = 0;
    }

    if (!$.template.animations[options["defaultAnimation"]]) {
        options["defaultAnimation"] = "fading";
    }

    var noAnimationOptions = {};
    for (var name in options) {
        noAnimationOptions[name] = options[name];
    }

    noAnimationOptions["animated"] = false;

    var maximumIntervalBetweenUpdates = options["minimumIntervalBetweenUpdates"] * 2;
    if (maximumIntervalBetweenUpdates < 100) {
        maximumIntervalBetweenUpdates = 100;
    }

    var textOptions = {};
    for (var name in options) {
        textOptions[name] = options[name];
    }

    textOptions["parser"] = "text/plain";

    parameters["$t"] = 1;

    var fillers = [];
    var currentFillers = fillers;

    var documentFragment = document.createDocumentFragment();

    var container = documentFragment;

    var templates = {};

    var getAnimationTag = function(nodes) {

        nodes = $(nodes);

        var looper = 0;
        while (looper < nodes.length) {

            if (nodes[looper].nodeType == Node.ELEMENT_NODE) {
                var query = $(nodes[looper]);

                var display = query.css("display");
                if ((display != "inline") && (display != "none")) {
                    return "div";
                } else {
                    if (getAnimationTag(query.children()) == "div") {
                        return "div";
                    }
                }
            }

            ++looper;
        }

        return "span";
    };

    var getAnimation = function(template, options) {

        var getAttribute = function(name, optionName, operator) {

            var attribute = null;

            var node = template;

            while (((attribute === null) || (attribute === "")) && node) {

                var attribute = node.getAttributeNS ? node.getAttributeNS($.template.namespaceURI, name) : null;
                if (operator) {
                    attribute = operator(attribute);
                }

                node = node.parentNode;

            }

            if ((attribute === null) || (attribute == "")) {
                return options[optionName];
            } else {
                return attribute;
            }

        };

        var duration = getAttribute("duration", "defaultAnimationDuration",
            function(value) {

                value = parseInt(value);

                return (isNaN(value)) ? null : value;
            })

        var animation = getAttribute("animation", "defaultAnimation");

        var animated = getAttribute("animated", "animated",
            function(value) {

                if (value === "yes") {
                    return true;
                } else if (value === "no") {
                    return false;
                } else {
                    return null;
                }

            })

        return ({
            "duration": duration,
            "name": animation,
            "animated": animated
        });

    };

    var getParentElement = function(parentElement) {

        if (documentFragment == parentElement) {
            return container;
        } else {
            return parentElement;
        }

    };

    var getInnerXML = function(node) {

        var serializer = new XMLSerializer();

        return [].map.call(node.childNodes,
            function(childNode) {
                return serializer.serializeToString(childNode);
            }).join("");

    };

    var getInnerCode = function(node) {

        var result = [];

        [].forEach.call(node.childNodes, function(childNode) {
            if ((childNode.nodeType == Node.TEXT_NODE) ||
                (childNode.nodeType == Node.COMMENT_NODE)) {
                result.push(childNode.nodeValue);
            }
        });

        return result.join("");

    };

    var clearNode = function(node) {

        var firstEmptyNodes = [];
        var firstMet = false;
        var lastEmptyNodes = [];

        [].forEach.call(node.childNodes, function(childNode) {
            if ((childNode.nodeType === Node.TEXT_NODE) &&
                (childNode.nodeValue.trim().length === 0)) {
                if (!firstMet) {
                    firstEmptyNodes.push(childNode);
                } else {
                    lastEmptyNodes.push(childNode);
                }
            } else {
                firstMet = true;
                lastEmptyNodes = [];
            }
        });

        firstEmptyNodes.forEach(function(childNode) {
            childNode.nodeValue = "";
        });

        lastEmptyNodes.forEach(function(childNode) {
            childNode.nodeValue = "";
        });

        return node;

    };

    var process = function(parentElement, template, parameters, options, parentNodes) {

        var appendChildNodes = function(nodes) {

            nodes.forEach(function(node) {
                getParentElement(parentElement).appendChild(node)
            });

            return nodes;
        };

        var templateText = function(template, filler) {

            if (template.indexOf("${") != -1) {

                var value = $.template(template, parameters, textOptions);

                if (filler) {

                    currentFillers.push(function(parameters, options, next) {

                        filler($.template(template, parameters, textOptions), options);

                        next();

                    });

                    filler(value, options);

                }

                return value;

            } else {

                if (filler) {
                    filler(template, options);
                }

                return template;
            }

        };

        var getAttributeValue = function(parameters, node, name, filler) {

            var attribute = node.getAttribute(name);

            if (!attribute) {
                attribute = "";
            }

            if (attribute.substr(0,2) == '${' && attribute.substr(attribute.length - 1) == '}' ){
                attribute = attribute.substr(2,attribute.length - 3);
            }

            var value = $.template.execute(attribute, parameters, options);
            if (filler) {

                currentFillers.push(function(parameters, options, next) {

                    filler($.template.execute(attribute, parameters, options), options);

                    next();

                });

                filler(value, options);

            }

            return value;

        };

        switch (template.nodeType) {

            case Node.ELEMENT_NODE:
                {

                    if (template.namespaceURI == $.template.namespaceURI) {

                        switch (template.localName) {

                            case "if":
                                {
                                    var placeholderNode = document.createTextNode("");

                                    appendChildNodes([placeholderNode]);

                                    var nodes = [];

                                    var lastIfNode = null;

                                    var newFillers = [];

                                    var firstTime = true;

                                    var filler = function(parameters, options, next) {

                                        var condition = getAttributeValue(parameters, template, "test");

                                        if (condition) {

                                            if (lastIfNode != template) {

                                                var animation = getAnimation(template, options);

                                                var span = document.createElement(getAnimationTag(nodes));
                                                span.className = "template-animation";

                                                getParentElement(parentElement).insertBefore(span, placeholderNode);

                                                nodes.forEach(function(node) {
                                                    span.appendChild(node);
                                                });

                                                var action = function() {

                                                    while (span.firstChild) {
                                                        span.removeChild(span.firstChild);
                                                    }

                                                    nodes = [];

                                                    var lastFillers = currentFillers;
                                                    newFillers = [];
                                                    currentFillers = newFillers;

                                                    [].slice.call(template.childNodes, 0).forEach(function(childNode2) {
                                                        process(parentElement, childNode2, parameters, options, nodes).forEach(function(newNode) {

                                                            $(newNode).detach();

                                                            nodes.push(newNode);

                                                        });
                                                    });

                                                    currentFillers = lastFillers;

                                                    nodes.forEach(function(node) {
                                                        span.appendChild(node);
                                                    });

                                                    clearNode(span);

                                                };

                                                var complete = function() {

                                                    nodes.forEach(function(node) {
                                                        getParentElement(parentElement).insertBefore(node, placeholderNode);
                                                    });

                                                    clearNode(getParentElement(parentElement));

                                                    $(span).detach();

                                                    var callbacked = newFillers.length;

                                                    if (callbacked == 0) {
                                                        next();
                                                    } else {
                                                        newFillers.forEach(function(filler) {
                                                            filler(parameters, options, function() {

                                                                --callbacked;

                                                                if (callbacked === 0) {
                                                                    next();
                                                                }

                                                            });
                                                        });
                                                    }

                                                };

                                                if (animation.animated && (!firstTime)) {
                                                    $.template.animations[animation.name](animation.duration,
                                                        action,
                                                        $(span),
                                                        $(span),
                                                        complete);
                                                } else {
                                                    action();
                                                    complete();
                                                }
                                            } else {
                                                var callbacked = newFillers.length;

                                                if (callbacked == 0) {
                                                    next();
                                                } else {
                                                    newFillers.forEach(function(filler) {
                                                        filler(parameters, options, function() {

                                                            --callbacked;

                                                            if (callbacked === 0) {
                                                                next();
                                                            }

                                                        });
                                                    });

                                                }


                                            }

                                            lastIfNode = template;

                                        } else {

                                            var animation = getAnimation(template, options);

                                            var span = document.createElement(getAnimationTag(nodes));
                                            span.className = "template-animation";

                                            getParentElement(parentElement).insertBefore(span, placeholderNode);

                                            nodes.forEach(function(node) {
                                                span.appendChild(node);
                                            });

                                            var action = function() {

                                                while (span.firstChild) {
                                                    span.removeChild(span.firstChild);
                                                }

                                                nodes = [];

                                                newFillers = [];

                                                clearNode(span);

                                            };

                                            var complete = function() {

                                                clearNode(getParentElement(parentElement));

                                                $(span).detach();

                                                next();

                                            };

                                            if (animation.animated && (!firstTime)) {
                                                $.template.animations[animation.name](animation.duration,
                                                    action,
                                                    $(span),
                                                    $(span),
                                                    complete);
                                            } else {
                                                action();
                                                complete();
                                            }

                                            lastIfNode = null;
                                        }



                                    };

                                    currentFillers.push(filler);

                                    filler(parameters, options, function() {});

                                    firstTime = false;

                                    var resultNodes = nodes.slice(0);

                                    resultNodes.push(placeholderNode);

                                    return resultNodes;

                                    break;
                                }

                            case "switch":
                                {

                                    var placeholderNode = document.createTextNode("");

                                    appendChildNodes([placeholderNode]);

                                    var nodes = [];

                                    var lastCaseNode = null;

                                    var newFillers = [];

                                    var firstTime = true;

                                    var filler = function(parameters, options, next) {


                                        var condition = getAttributeValue(parameters, template, "condition");

                                        var aimed = false;

                                        [].slice.call(template.childNodes, 0).forEach(function(childNode) {
                                            if ((childNode.nodeType == Node.ELEMENT_NODE) &&
                                                (childNode.namespaceURI == $.template.namespaceURI) &&
                                                (childNode.localName == "case")) {

                                                if ((!aimed) &&
                                                    ((!childNode.getAttribute("value")) ||
                                                        (getAttributeValue(parameters, childNode, "value") === condition))) {
                                                    aimed = true;

                                                    if (lastCaseNode != childNode) {

                                                        var animation = getAnimation(template, options);

                                                        var span = document.createElement(getAnimationTag(nodes));
                                                        span.className = "template-animation";

                                                        getParentElement(parentElement).insertBefore(span, placeholderNode);

                                                        nodes.forEach(function(node) {
                                                            span.appendChild(node);
                                                        });

                                                        var action = function() {

                                                            while (span.firstChild) {
                                                                span.removeChild(span.firstChild);
                                                            }

                                                            nodes = [];

                                                            var lastFillers = currentFillers;
                                                            newFillers = [];
                                                            currentFillers = newFillers;

                                                            [].slice.call(childNode.childNodes, 0).forEach(function(childNode2) {
                                                                process(parentElement, childNode2, parameters, options, nodes).forEach(function(newNode) {

                                                                    $(newNode).detach();

                                                                    nodes.push(newNode);

                                                                });
                                                            });

                                                            currentFillers = lastFillers;

                                                            nodes.forEach(function(node) {
                                                                span.appendChild(node);
                                                            });

                                                            clearNode(span);

                                                        };

                                                        var complete = function() {

                                                            nodes.forEach(function(node) {
                                                                getParentElement(parentElement).insertBefore(node, placeholderNode);
                                                            });

                                                            clearNode(getParentElement(parentElement));

                                                            $(span).detach();

                                                            next();

                                                        };

                                                        if (animation.animated && (!firstTime)) {
                                                            $.template.animations[animation.name](animation.duration,
                                                                action,
                                                                $(span),
                                                                $(span),
                                                                complete);
                                                        } else {
                                                            action();
                                                            complete();
                                                        }

                                                    } else {

                                                        var callbacked = newFillers.length;

                                                        if (callbacked == 0) {
                                                            next();
                                                        } else {
                                                            newFillers.forEach(function(filler) {
                                                                filler(parameters, options, function() {

                                                                    --callbacked;

                                                                    if (callbacked === 0) {
                                                                        next();
                                                                    }

                                                                });
                                                            });
                                                        }
                                                    }
                                                    lastCaseNode = childNode;

                                                }

                                            }
                                        });

                                        if (!aimed) {

                                            var animation = getAnimation(template, options);

                                            var span = document.createElement(getAnimationTag(nodes));
                                            span.className = "template-animation";

                                            getParentElement(parentElement).insertBefore(span, placeholderNode);

                                            nodes.forEach(function(node) {
                                                span.appendChild(node);
                                            });

                                            var action = function() {

                                                while (span.firstChild) {
                                                    span.removeChild(span.firstChild);
                                                }

                                                nodes = [];

                                                newFillers = [];

                                                clearNode(span);

                                            };

                                            var complete = function() {

                                                clearNode(getParentElement(parentElement));

                                                $(span).detach();

                                                next();

                                            };

                                            if (animation.animated && (!firstTime)) {
                                                $.template.animations[animation.name](animation.duration,
                                                    action,
                                                    $(span),
                                                    $(span),
                                                    complete);
                                            } else {
                                                action();
                                                complete();
                                            }

                                            lastCaseNode = null;

                                        }

                                    };

                                    currentFillers.push(filler);

                                    filler(parameters, options, function() {});

                                    firstTime = false;

                                    var resultNodes = nodes.slice(0);

                                    resultNodes.push(placeholderNode);

                                    return resultNodes;
                                }

                            case "map":
                                {

                                    var placeholderNode = document.createTextNode("");

                                    appendChildNodes([placeholderNode]);

                                    var lastNodePairs = [];

                                    var nodes = [];

                                    var firstTime = true;

                                    var filler = function(parameters, options, next) {

                                        var list = getAttributeValue(parameters, template, "list");

                                        var itemVariantName = template.getAttribute("item-variant-name");
                                        if (!/^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(itemVariantName) ||
                                            (itemVariantName && (itemVariantName.length == 0))) {
                                            itemVariantName = "item";
                                        }

                                        if (!itemVariantName) {
                                            itemVariantName = "item";
                                        }


                                        var indexVariantName = template.getAttribute("index-variant-name");
                                        if (!/^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(indexVariantName) ||
                                            (indexVariantName && (indexVariantName.length == 0))) {
                                            indexVariantName = "index";
                                        }

                                        if (!indexVariantName) {
                                            indexVariantName = "index";
                                        }

                                        var listVariantName = template.getAttribute("list-variant-name");
                                        if (!/^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(indexVariantName) ||
                                            (listVariantName && (indexVariantName.length == 0))) {
                                            listVariantName = "list";
                                        }

                                        if (!listVariantName) {
                                            listVariantName = "list";
                                        }

                                        var sortScript = template.getAttribute("sort");

                                        if (sortScript) {
                                            var sortParameters = {};

                                            for (var name in parameters) {
                                                sortParameters[name] = parameters[name];
                                            }

                                            sortParameters["^"] = parameters;

                                            if (listVariantName) {
                                                sortParameters[listVariantName] = list;
                                            }

                                            $.template.execute(sortScript, sortParameters, options);

                                        }

                                        nodes = [];

                                        var restNodes = [];

                                        lastNodePairs.forEach(function(pair) {
                                            restNodes.push(pair.nodes);
                                        });

                                        var newNodePairs = [];

                                        var lastActions = [];

                                        var cleared = false;

                                        var actedTimes = 0;

                                        var clearLastActions = function() {
                                            ++actedTimes;

                                            if (list.length + restNodes.length == actedTimes) {

                                                cleared = true;

                                                lastActions.forEach(function(action) {
                                                    action();
                                                });
                                            }
                                        };

                                        var callbacked = list.length;

                                        if (list.length == 0) {
                                            next();
                                        }

                                        list.forEach(function(item, index, list) {

                                            var newParameters = {};

                                            for (var name in parameters) {
                                                newParameters[name] = parameters[name];
                                            }

                                            newParameters["^"] = parameters;

                                            if (itemVariantName) {
                                                newParameters[itemVariantName] = item;
                                            }

                                            if (indexVariantName) {
                                                newParameters[indexVariantName] = index;
                                            }

                                            var lastPair = null;

                                            var id = null;
                                            var idGetter = getAttributeValue(newParameters, template, "id-getter");
                                            if (idGetter) {

                                                id = idGetter.call("", null, newParameters, options);

                                                lastNodePairs.forEach(function(pair) {

                                                    if (!lastPair) {

                                                        var index = restNodes.indexOf(pair.nodes);

                                                        if (pair.hasOwnProperty("id") && (pair.id === id) && (index != -1)) {

                                                            lastPair = pair;

                                                            restNodes.splice(index, 1);

                                                        }

                                                    }

                                                });

                                                newNodePairs.forEach(function(pair) {
                                                    if (pair.id === id) {
                                                        throw new Error("Duplicated ID found for map: " + id);
                                                    }
                                                });

                                            }

                                            if (lastPair) {

                                                var animation = getAnimation(template, options);

                                                var placeholderNode2 = document.createElement("span");

                                                getParentElement(parentElement).insertBefore(placeholderNode2, lastPair.nodes[0]);

                                                var firstPairNode = null;
                                                var looper = 0;
                                                while ((looper < lastPair.nodes.length) && (!firstPairNode)) {

                                                    if (lastPair.nodes[looper].nodeType == Node.TEXT_NODE) {
                                                        if (lastPair.nodes[looper].nodeValue.trim().length > 0) {
                                                            firstPairNode = placeholderNode2;
                                                        }
                                                    } else if (lastPair.nodes[looper].nodeType == Node.ELEMENT_NODE) {
                                                        firstPairNode = lastPair.nodes[looper];
                                                    }

                                                    ++looper;
                                                }

                                                if (!firstPairNode) {
                                                    firstPairNode = placeholderNode2;
                                                }

                                                var contentPosition = $(firstPairNode).offsetParent().positionFromPage($(firstPairNode).positionToPage({
                                                    "x": 0,
                                                    "y": 0
                                                }));

                                                $(placeholderNode2).detach();

                                                var supernode = document.createElement(getAnimationTag(lastPair.nodes));
                                                supernode.className = "template-animation";

                                                getParentElement(parentElement).insertBefore(supernode, placeholderNode);

                                                var action = function() {

                                                    supernode.style.position = "absolute";
                                                    supernode.style.width = $(getParentElement(parentElement)).css("width");
                                                    supernode.style.left = (contentPosition.x - parseFloat($(firstPairNode).css("marginLeft"))) + "px";
                                                    supernode.style.top = (contentPosition.y - parseFloat($(firstPairNode).css("marginTop"))) + "px";

                                                    var fakeFirstNode = null;

                                                    var fakeContainerNode = document.createElement("span");
                                                    fakeContainerNode.className = "template-animation";
                                                    fakeContainerNode.style.color = "transparent";

                                                    lastPair.nodes.forEach(function(node) {

                                                        supernode.appendChild(node);

                                                        var fakeNode = node.cloneNode(true);
                                                        if (fakeNode.nodeType == Node.ELEMENT_NODE) {
                                                            fakeNode.style.opacity = 0;
                                                            if (!fakeFirstNode) {
                                                                fakeFirstNode = fakeNode;
                                                            }
                                                        } else if (fakeNode.nodeType == Node.TEXT_NODE) {
                                                            if ((fakeNode.nodeValue.trim().length > 0) && (!fakeFirstNode)) {
                                                                fakeFirstNode = fakeContainerNode;
                                                            }
                                                        }

                                                        fakeContainerNode.appendChild(fakeNode);

                                                    });

                                                    if (!fakeFirstNode) {
                                                        fakeFirstNode = fakeContainerNode;
                                                    }

                                                    getParentElement(parentElement).insertBefore(fakeContainerNode, supernode);

                                                    if (animation.animated) {

                                                        lastActions.push(function() {

                                                            $.delay(-1, function() {

                                                                var placeholderNode2 = document.createElement("span");

                                                                getParentElement(parentElement).insertBefore(placeholderNode2, fakeContainerNode);

                                                                var contentPosition2 = $(fakeFirstNode).offsetParent().positionFromPage($(fakeFirstNode).positionToPage({
                                                                    "x": 0,
                                                                    "y": 0
                                                                }));

                                                                $(placeholderNode2).detach();

                                                                var complete = function() {

                                                                    $(fakeContainerNode).detach();

                                                                    lastPair.nodes.forEach(function(node) {
                                                                        getParentElement(parentElement).insertBefore(node, supernode);
                                                                    });

                                                                    $(supernode).detach();

                                                                };

                                                                $(supernode).animate({
                                                                        "left": (contentPosition2.x - parseFloat($(fakeFirstNode).css("marginLeft"))) + "px",
                                                                        "top": (contentPosition2.y - parseFloat($(fakeFirstNode).css("marginTop"))) + "px"
                                                                    },
                                                                    animation.duration / 2,
                                                                    "swing",
                                                                    complete);

                                                            });

                                                        });
                                                    } else {

                                                        $(fakeContainerNode).detach();

                                                        lastPair.nodes.forEach(function(node) {
                                                            getParentElement(parentElement).insertBefore(node, supernode);
                                                        });

                                                        $(supernode).detach();

                                                    }

                                                    clearLastActions();

                                                };

                                                var callbacked2 = lastPair.fillers.length;
                                                var animationFinished = false;

                                                if ((callbacked2 === 0) && animationFinished) {
                                                    --callbacked;

                                                    if (callbacked === 0) {
                                                        next();
                                                    }
                                                } else {
                                                    lastPair.fillers.forEach(function(filler) {

                                                        filler(newParameters, options, function() {

                                                            --callbacked2;

                                                            if ((callbacked2 === 0) && animationFinished) {
                                                                --callbacked;

                                                                if (callbacked === 0) {
                                                                    next();
                                                                }
                                                            }

                                                        });

                                                    });
                                                }

                                                newNodePairs.push(lastPair);

                                                var complete = function() {

                                                    animationFinished = true;

                                                    if (callbacked2 === 0) {
                                                        --callbacked;

                                                        if (callbacked === 0) {
                                                            next();
                                                        }
                                                    }

                                                };

                                                if (animation.animated) {
                                                    $.template.animations["none"](animation.duration,
                                                        action,
                                                        $(lastPair.nodes),
                                                        $(lastPair.nodes),
                                                        complete);
                                                } else {

                                                    action();

                                                    complete();

                                                }

                                            } else {

                                                var lastFillers = currentFillers;
                                                var newFillers = [];
                                                currentFillers = newFillers;

                                                var pair = null;
                                                if (idGetter) {

                                                    pair = {
                                                        "id": id,
                                                        "nodes": [],
                                                        "fillers": newFillers
                                                    };

                                                    newNodePairs.push(pair);

                                                } else {

                                                    pair = {
                                                        "nodes": [],
                                                        "fillers": newFillers
                                                    };

                                                    newNodePairs.push(pair);

                                                }

                                                var newNodes = [];

                                                [].slice.call(template.childNodes, 0).forEach(function(childNode) {
                                                    process(parentElement, childNode, newParameters, options, newNodes).forEach(function(newNode) {

                                                        nodes.push(newNode);

                                                        newNodes.push(newNode);

                                                        if (pair) {
                                                            pair.nodes.push(newNode);
                                                        }

                                                    });
                                                });

                                                currentFillers = lastFillers;

                                                var placeholderNode2 = document.createTextNode("");

                                                getParentElement(parentElement).insertBefore(placeholderNode2, placeholderNode);

                                                var span = document.createElement(getAnimationTag(newNodes));
                                                span.className = "template-animation";

                                                newNodes.forEach(function(newNode) {
                                                    span.appendChild(newNode);
                                                });
                                                clearNode(span);

                                                var animation = getAnimation(template, options);

                                                var action = function() {

                                                    getParentElement(parentElement).insertBefore(span, placeholderNode2);

                                                    clearLastActions();
                                                };

                                                var complete = function() {

                                                    Array.prototype.slice.call(span.childNodes, 0).forEach(function(childNode) {
                                                        getParentElement(parentElement).insertBefore(childNode, placeholderNode2);
                                                    });

                                                    $(span).detach();

                                                    $(placeholderNode2).detach();

                                                    clearNode(getParentElement(parentElement));

                                                    --callbacked;
                                                    if (callbacked === 0) {
                                                        next();
                                                    }

                                                };

                                                if (animation.animated) {
                                                    $.template.animations[animation.name](animation.duration,
                                                        action,
                                                        $(span),
                                                        $(span),
                                                        complete);
                                                } else {
                                                    action();
                                                    complete();
                                                }

                                            }

                                        });

                                        restNodes.forEach(function(restNodeList) {

                                            if (restNodeList.length > 0) {

                                                var animation = getAnimation(template, options);

                                                var span = document.createElement(getAnimationTag(restNodeList));
                                                span.className = "template-animation";

                                                restNodeList[0].parentNode.insertBefore(span, restNodeList[0]);

                                                restNodeList.forEach(function(restNode) {
                                                    span.appendChild(restNode);
                                                });

                                                var action = function() {
                                                    $(span).detach();
                                                };

                                                lastActions.push(action);

                                                if (animation.animated) {
                                                    $.template.animations[animation.name](animation.duration,
                                                        function() {
                                                            clearLastActions();
                                                        },
                                                        $(span),
                                                        $());
                                                } else {
                                                    clearLastActions();
                                                }

                                            } else {
                                                clearLastActions();
                                            }

                                        });

                                        lastNodePairs = newNodePairs;

                                    };

                                    filler(parameters, options, function() {});

                                    firstTime = false;

                                    currentFillers.push(filler);

                                    var resultNodes = nodes.slice(0);

                                    resultNodes.push(placeholderNode);

                                    return resultNodes;
                                }

                            case "html":
                                {

                                    var childNodes = [];

                                    var divNode = document.createElement("div");

                                    var placeholderNode = document.createTextNode("");

                                    appendChildNodes([placeholderNode]);

                                    var code = getInnerCode(template);

                                    var firstTime = true;

                                    var filler = function(parameters, options, next) {

                                        var animation = getAnimation(template, options);

                                        var value = $.template.execute(code, parameters, options);

                                        divNode.innerHTML = value;

                                        var newChildNodes = [].slice.call(divNode.childNodes, 0);

                                        var span = document.createElement(getAnimationTag(childNodes));
                                        span.className = "template-animation";

                                        getParentElement(parentElement).insertBefore(span, placeholderNode);

                                        childNodes.forEach(function(childNode) {
                                            span.appendChild(childNode);
                                        });

                                        clearNode(span);

                                        var action = function() {

                                            childNodes.forEach(function(childNode) {
                                                $(childNode).detach();
                                            });

                                            newChildNodes.forEach(function(childNode) {
                                                span.appendChild(childNode);
                                            });

                                            clearNode(span);

                                            childNodes = newChildNodes;

                                        };

                                        var complete = function() {

                                            newChildNodes.forEach(function(childNode) {
                                                getParentElement(parentElement).insertBefore(childNode, placeholderNode);
                                            });

                                            $(span).detach();

                                            clearNode(getParentElement(parentElement));

                                            next();

                                        };

                                        if (animation.animated && (!firstTime)) {
                                            $.template.animations[animation.name](animation.duration,
                                                action,
                                                $(span),
                                                $(span),
                                                complete);
                                        } else {

                                            action();

                                            complete();

                                        }

                                    };

                                    filler(parameters, options, function() {});

                                    firstTime = false;

                                    var nodes = childNodes.slice(0);

                                    nodes.unshift(placeholderNode);

                                    currentFillers.push(filler);

                                    return nodes;
                                }

                            case "script":
                                {

                                    var code = getInnerCode(template);

                                    var elementVariantName = template.getAttribute("element-variant-name");

                                    var filler = function(parameters, options, next) {

                                        var newParameters = {};
                                        for (var key in parameters) {
                                            newParameters[key] = parameters[key];
                                        }

                                        if (elementVariantName && (elementVariantName.length > 0)) {
                                            newParameters[elementVariantName] = getParentElement(parentElement);
                                        }

                                        $.template.execute(code, newParameters, options);

                                        next();

                                    };

                                    filler(parameters, options, function() {});

                                    currentFillers.push(filler);

                                    return [];
                                }

                            case "sandbox":
                                {

                                    var nodes = [];

                                    var firstTime = true;

                                    var newFillers = [];

                                    var filler = function(parameters, options, next) {

                                        nodes = [];

                                        var newParameters = {};
                                        for (var name in parameters) {
                                            newParameters[name] = parameters[name];
                                        }

                                        delete newParameters["^"];

                                        if (firstTime) {

                                            var lastFillers = currentFillers;
                                            newFillers = [];
                                            currentFillers = newFillers;

                                            [].slice.call(template.childNodes, 0).forEach(function(childNode) {
                                                process(parentElement, childNode, newParameters, options, nodes).forEach(function(newNode) {
                                                    nodes.push(newNode);
                                                });
                                            });

                                            currentFillers = lastFillers;

                                            next();

                                        } else {

                                            var callbacked = newFillers.length;

                                            newFillers.forEach(function(filler) {
                                                filler(newParameters, options, function() {

                                                    --callbacked;

                                                    if (callbacked === 0) {
                                                        next();
                                                    }

                                                });
                                            });
                                        }

                                    };

                                    filler(parameters, options, function() {});

                                    firstTime = false;

                                    currentFillers.push(filler);

                                    return nodes;
                                }

                            case "filler":
                                {

                                    if (options["fillerAvailable"]) {

                                        var code = getInnerCode(template);

                                        var templateVariantName = template.getAttribute("template-variant-name");
                                        if (templateVariantName && /^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(templateVariantName)) {
                                            code = templateVariantName + " = arguments[0];" + code;
                                        }

                                        var parametersVariantName = template.getAttribute("parameters-variant-name");
                                        if (parametersVariantName && /^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(parametersVariantName)) {
                                            code = parametersVariantName + " = arguments[1];" + code;
                                        }

                                        var optionsVariantName = template.getAttribute("options-variant-name");
                                        if (optionsVariantName && /^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(optionsVariantName)) {
                                            code = optionsVariantName + " = arguments[2];" + code;
                                        }

                                        var containerVariantName = template.getAttribute("container-variant-name");
                                        if (containerVariantName && /^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(containerVariantName)) {
                                            code = containerVariantName + " = arguments[3];" + code;
                                        }

                                        var fillerAction = window.eval("(function (){" + code + "})");

                                        var filler = function(parameters, options, next) {

                                            fillerAction(template, parameters, options, container);

                                            next();

                                        };

                                        filler(parameters, options, function() {});

                                        currentFillers.push(filler);

                                    } else {
                                        throw new Error("Filler is not available for current options");
                                    }

                                    return [];
                                }

                            case "template":
                                {

                                    templates[template.getAttribute("name")] = template;

                                    return [];
                                }

                            case "apply":
                                {

                                    var templateName = template.getAttribute("template");

                                    var templateNode = templates[templateName];

                                    var nodes = [];

                                    var placeholderNode = document.createTextNode("");

                                    appendChildNodes([placeholderNode]);

                                    var newFillers = [];

                                    var firstTime = true;

                                    var filler = function(parameters, options, next) {

                                        var mixParameters = getAttributeValue(parameters, template, "mix-parameters");

                                        var newParameters = {}
                                        for (var name in parameters) {
                                            newParameters[name] = parameters[name];
                                        }

                                        for (var name in mixParameters) {
                                            newParameters[name] = mixParameters[name];
                                        }

                                        if (firstTime) {

                                            var lastFillers = currentFillers;
                                            newFillers = [];
                                            currentFillers = newFillers;

                                            [].forEach.call(templateNode.childNodes, function(childNode) {
                                                process(parentElement, childNode, newParameters, options, nodes).forEach(function(newNode) {
                                                    nodes.push(newNode);
                                                });
                                            });

                                            clearNode({
                                                "childNodes": nodes
                                            });

                                            currentFillers = lastFillers;

                                            next();

                                        } else {

                                            var callbacked = newFillers.length;

                                            newFillers.forEach(function(filler) {
                                                filler(newParameters, options, function() {

                                                    --callbacked;

                                                    if (callbacked === 0) {
                                                        next();
                                                    }

                                                });

                                            });
                                        }

                                    };

                                    filler(parameters, options, function() {});

                                    firstTime = false;

                                    currentFillers.push(filler);

                                    var resultNodes = nodes.slice(0);

                                    resultNodes.push(placeholderNode);

                                    return resultNodes;
                                }

                            case "listener":
                                {

                                    var event = template.getAttribute("event");

                                    var action = template.getAttribute("action");

                                    var eventVariantName = template.getAttribute("event-variant-name");
                                    if (!/^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(eventVariantName) ||
                                        ((!eventVariantName) || (eventVariantName === ""))) {
                                        eventVariantName = "event";
                                    }

                                    var elementVariantName = template.getAttribute("element-variant-name");
                                    if (!/^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/g.test(elementVariantName) ||
                                        ((!elementVariantName) || (elementVariantName === ""))) {
                                        elementVariantName = "element";
                                    }

                                    var newParameters = parameters;

                                    var data = {};

                                    currentFillers.push(function(parameters, options, next) {

                                        newParameters = parameters;

                                        update();

                                        next();

                                    });

                                    var update = function() {

                                        Array.prototype.forEach.call(template.attributes, function(node) {
                                            if (node.nodeName.indexOf(":") === -1) {
                                                if (/^\$\{(.*)\}$/.test(node.nodeValue)) {
                                                    data[node.nodeName] = $.template.execute(node.nodeValue.substring(2, node.nodeValue.length - 1), parameters, options);
                                                } else {
                                                    data[node.nodeName] = node.nodeValue;
                                                }
                                            }
                                        });

                                    };

                                    update();

                                    $(getParentElement(parentElement)).on(event, data, function(event) {

                                        var eventParameters = {};
                                        for (var name in newParameters) {
                                            eventParameters[name] = newParameters[name];
                                        }

                                        if (eventVariantName) {
                                            eventParameters[eventVariantName] = event;
                                        }

                                        if (elementVariantName) {
                                            eventParameters[elementVariantName] = getParentElement(parentElement);
                                        }

                                        $.template.execute(action, eventParameters, options);

                                    });

                                    break;
                                }

                            default:
                                {
                                    throw new Error("Invalid template tag found: " + template.nodeName);
                                }

                        }

                        return null;

                    } else if (template.namespaceURI == $.template.xnamespaceURI) {

                        var localName = template.localName;

                        if ($.template.external[localName]) {

                            var wrapperNode = document.createElement("div");

                            var childNodes = [];

                            var placeholderNode = document.createTextNode("");

                            var outletNode = null;

                            appendChildNodes([placeholderNode]);

                            var firstTime = true;

                            var filler = function(parameters, options, next) {

                                var animation = getAnimation(template, options);

                                $.template.external[localName].call(parameters, template, function(error, value , outlet ) {

                                    if (error) {

                                        next();

                                    } else {

                                        $(wrapperNode).append($(value));

                                        var newChildNodes = [].slice.call(wrapperNode.childNodes, 0);

                                        var span = document.createElement(getAnimationTag(childNodes));

                                        span.className = "template-animation";

                                        getParentElement(parentElement).insertBefore(span, placeholderNode);

                                        childNodes.forEach(function(childNode) {

                                            span.appendChild(childNode);
                                        });

                                        clearNode(span);

                                        var lastFillers = currentFillers;

                                        var newFillers = [];

                                        currentFillers = newFillers;

                                        var newOutletNode = null;

                                        if (outlet){
                                            newOutletNode = $(outlet);
                                        }

                                        var action = function() {

                                            childNodes.forEach(function(childNode) {
                                                $(childNode).detach();
                                            });

                                            if (outletNode){
                                                $(outletNode).detach();
                                            }

                                            newChildNodes.forEach(function(childNode) {
                                                span.appendChild(childNode);
                                                if (parentNodes.indexOf(childNode) < 0) {
                                                    parentNodes.push(childNode);
                                                }
                                            });

                                            clearNode(span);

                                            childNodes = newChildNodes;

                                            outletNode = newOutletNode;

                                            currentFillers = lastFillers;

                                        };

                                        var complete = function() {

                                            newChildNodes.forEach(function(childNode) {
                                                $(childNode).css('opacity', '1');
                                                $(childNode).removeClass('template-animation');
                                                getParentElement(parentElement).insertBefore(childNode, placeholderNode);
                                            });

                                            $(span).detach();

                                            clearNode(getParentElement(parentElement));

                                            var nodes = childNodes.slice(0);

                                            nodes.unshift(placeholderNode);

                                            if (firstTime) {

                                                firstTime = false;

                                                next();

                                            } else {

                                                var callbacked = newFillers.length;

                                                if (callbacked == 0) {
                                                    next();
                                                } else {

                                                    newFillers.forEach(function(filler) {

                                                        filler(newParameters, options, function() {

                                                            --callbacked;

                                                            if (callbacked === 0) {

                                                                next();
                                                            }

                                                        });

                                                    });
                                                }

                                            }

                                        };

                                        animation.animated = false;

                                        if (animation.animated && (!firstTime)) {

                                            $.template.animations[animation.name](animation.duration,
                                                action,
                                                $(span),
                                                $(span),
                                                complete);

                                        } else { // first time filler is called

                                            //newFillers = [];
                                            //currentFillers = newFillers;

                                            action();
                                            complete();

                                        }

                                    }
                                });


                            };

                            currentFillers.push(filler);

                            filler(parameters, options, function() {});

                            return [wrapperNode];

                        } else {
                            return [];
                        }



                    } else {

                        var namespaceURI = template.namespaceURI;
                        if (!namespaceURI) {
                            namespaceURI = document.body.namespaceURI;
                        }

                        var node = null;

                        if (namespaceURI === document.body.namespaceURI) {
                            node = document.createElement(template.nodeName);
                        } else {
                            node = document.createElementNS(namespaceURI, template.nodeName);
                        }

                        [].forEach.call(template.attributes, function(attributeNode) {

                            if (attributeNode.namespaceURI === $.template.namespaceURI) {

                                if (attributeNode.localName.substring(0, 3) === "on-") {

                                    var eventName;
                                    var safe = false;

                                    if (attributeNode.localName.substring(3, 8) === "safe-") {
                                        eventName = attributeNode.localName.substring(8);
                                        safe = true;
                                    } else {
                                        eventName = attributeNode.localName.substring(3);
                                    }

                                    var script = attributeNode.value;

                                    var newParameters = parameters;

                                    var data = {};

                                    var actionDelegate = template.getAttributeNS($.template.namespaceURI, "action-delegate");
                                    if (actionDelegate) {
                                        data["delegate"] = $.template.execute(actionDelegate, parameters, options);
                                    }

                                    currentFillers.push(function(parameters, options, next) {

                                        newParameters = parameters;

                                        next();

                                    });

                                    $(node).on(eventName, data, function(event) {

                                        var eventParameters = {};
                                        for (var name in newParameters) {
                                            eventParameters[name] = newParameters[name];
                                        }

                                        eventParameters["event"] = event;
                                        eventParameters["element"] = node;

                                        if (safe) {
                                            var safeAsync = function() {
                                                return $.async(function() {
                                                    var step = this;
                                                    var callbacked = false;
                                                    var timeout = setTimeout(function() {
                                                        if (!callbacked) {
                                                            callbacked = true;
                                                            step.next();
                                                        }
                                                    }, 1500);

                                                    eventParameters["next"] = function() {
                                                        if (!callbacked) {
                                                            callbacked = true;
                                                            step.next();
                                                            clearTimeout(timeout);
                                                        }
                                                    };
                                                    $.template.execute(script, eventParameters, options);
                                                });
                                            }
                                            if (!$.template.safeEventQueue[eventName]) {
                                                $.template.safeEventQueue[eventName] = $.async(function() {
                                                    safeAsync().then(this.next);
                                                }).finished(function() {
                                                    delete $.template.safeEventQueue[eventName];
                                                })
                                            }
                                        } else {
                                            $.template.execute(script, eventParameters, options);
                                        }

                                    });

                                } else {
                                    // Omit it
                                }

                            } else if (attributeNode.namespaceURI != "http://www.w3.org/2000/xmlns/") {
                                templateText(attributeNode.value, function(value) {

                                    node.setAttributeNS(attributeNode.namespaceURI,
                                        attributeNode.nodeName,
                                        value);

                                    if ((namespaceURI == document.body.namespaceURI) &&
                                        (node.localName == "input") &&
                                        (attributeNode.localName == "value")) {
                                        node.value = value;
                                    }

                                });
                            }

                        });

                        var newFillers = [];

                        var hasTextNode = false;

                        [].slice.call(template.childNodes, 0).forEach(function(childNode) {
                            process(node, childNode, parameters, options, []);
                        });

                        return appendChildNodes([clearNode(node)]);

                    }

                }

            case Node.TEXT_NODE:
                {

                    var lastFillers = currentFillers;
                    newFillers = [];
                    currentFillers = newFillers;

                    var placeholderNode = document.createTextNode("");

                    var textNode = document.createTextNode("");

                    var changed = false;

                    templateText(template.nodeValue, function(value) {

                        changed = (textNode.nodeValue != value);

                        textNode.nodeValue = value;

                    });

                    currentFillers = lastFillers;

                    if (newFillers.length > 0) {
                        currentFillers.push(function(parameters, options, next) {

                            var animation = getAnimation(template, options);

                            if (animation.animated) {

                                var span = document.createElement("span");
                                span.className = "template-animation";

                                getParentElement(parentElement).insertBefore(span, placeholderNode);

                                span.appendChild(textNode);

                                var oldText = textNode.nodeValue;

                                var action = function() {
                                    newFillers.forEach(function(filler) {
                                        filler(parameters, options, function() {});
                                    });
                                };

                                var complete = function() {

                                    getParentElement(parentElement.insertBefore(textNode, placeholderNode));

                                    $(span).detach();

                                    next();

                                };

                                action();

                                if (changed) {

                                    textNode.nodeValue = oldText;

                                    $.template.animations[animation.name](animation.duration,
                                        action,
                                        $(span),
                                        $(span),
                                        complete);

                                } else {
                                    complete();
                                }

                            } else {

                                var callbacked = newFillers.length;

                                newFillers.forEach(function(filler) {
                                    filler(parameters, options, function() {

                                        --callbacked;

                                        if (callbacked === 0) {
                                            next();
                                        }

                                    });
                                });
                            }

                        });
                    }

                    return appendChildNodes([textNode, placeholderNode]);
                }

            case Node.COMMENT_NODE:
                {

                    var commentNode = document.createComment("");

                    commentNode.nodeValue = template.nodeValue;

                    return appendChildNodes([commentNode]);
                }

            case Node.CDATA_SECTION_NODE:
            case Node.ATTRIBUTE_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE:
            case Node.DOCUMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE:
            case Node.ENTITY_NODE:
            case Node.ENTITY_REFERENCE_NODE:
            case Node.NOTATION_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
            default:
                {
                    throw new Error("Impossible node type has been found: " + template.nodeType);
                }

        }

    };

    var code = $.replaceHTMLEntityForXML(template);

    if (options.prependNamespaces) {

        if ((options.autoappendTemplateNamespace ||
                (options.autoappendTemplateNamespace === null) ||
                (options.autoappendTemplateNamespace === undefined)) &&
            (!options.prependNamespaces["template"])) {
            options.prependNamespaces["template"] = $.template.namespaceURI;
        }

        code = "<div " + Object.keys(options.prependNamespaces).map(function(prefix) {

            if (prefix) {
                return "xmlns:" + prefix + "=\"" + $.escapeXML(options.prependNamespaces[prefix]) + "\"";
            } else {
                return "xmlns=\"" + $.escapeXML(options.prependNamespaces[prefix]) + "\"";
            }

        }).join(" ") + ">" + code + "</div>";

    } else if (options.autoappendTemplateNamespace ||
        (options.autoappendTemplateNamespace === null) ||
        (options.autoappendTemplateNamespace === undefined)) {

        code = "<div xmlns:template=\"" + $.template.namespaceURI + "\">" + code + "</div>";

    } else {

        code = "<div>" + code + "</div>";

    }

    var parser = new DOMParser();

    var xmlDocument = parser.parseFromString(code, "text/xml");

    if ((!xmlDocument) || xmlDocument.getElementsByTagName("parsererror").length) {

        var errors = Array.prototype.map.call(xmlDocument.getElementsByTagName("parsererror"), function(node) {
            return node.getElementsByTagName("div")[0].innerHTML;
        }).join("\n");

        var lineNumber = parseInt(errors.split(/(^|\s)line\s/im).filter(function(element) {
            return element ? (element.trim().length > 0) : false;
        }).slice(-1)[0]);

        var invalidCode = code;
        if (isFinite(lineNumber)) {
            invalidCode = code.split("\n").slice(Math.max(0, lineNumber - 4), lineNumber + 3).join("\n");
        }

        if (options.couldTryToReadAsHTML || (options.couldTryToReadAsHTML === undefined) || (options.couldTryToReadAsHTML === null)) {

            console.warn("Invalid XHTML, " + errors + "\n" + invalidCode);

            xmlDocument = {
                "documentElement": $(code)[0]
            };

        } else {
            throw new Error("Invalid XHTML, " + errors + "\n" + invalidCode);
        }

    }

    [].slice.call(xmlDocument.documentElement.childNodes, 0)
        .forEach(function(childNode) {
            process(documentFragment, childNode, parameters, options, []);
        });

    var firstNode = document.createTextNode("");
    if (documentFragment.firstChild) {
        documentFragment.insertBefore(firstNode, documentFragment.firstChild);
    } else {
        documentFragment.appendChild(firstNode);
    }

    var lastNode = document.createTextNode("");
    documentFragment.appendChild(lastNode);

    var actions = [];

    var clearActions = function() {

        var now = new Date();

        var queues = [];

        var looper = actions.length;
        while (looper > 0) {
            --looper;

            if ((now.getTime() - actions[looper].date.getTime() > maximumIntervalBetweenUpdates) && actions[looper].skippable) {

                var removable = true;
                if (actions[looper].queues) {
                    actions[looper].queues.forEach(function(queue) {
                        if (queues.indexOf(queue) == -1) {

                            queues.push(queue);

                            removable = false;

                        }
                    });
                }

                if (removable) {
                    actions.splice(looper, 1);
                }

            }

        }

    };

    var consuming = false;

    var consumeAction = function() {

        clearActions();

        if (actions.length > 0) {

            var action = actions[0];

            var callbacked = false;

            var next = function() {
                if (!callbacked) {

                    callbacked = true;

                    var index = actions.indexOf(action);
                    if (index != -1) {
                        actions.splice(index, 1);
                    }

                    if (actions.length > 0) {
                        $.delay(50, consumeAction);
                    }

                }
            };

            consuming = true;

            action.act(next);

            consuming = false;

            if (!action.directly) {
                $.delay(options["minimumIntervalBetweenUpdates"], next);
            } else {
                next();
            }

        }

    };

    documentFragment.act = function(directly, skippable, action, queues) {

        if (consuming) {
            action(function() {});
        } else {

            actions.push({
                "act": action,
                "date": new Date(),
                "directly": directly,
                "skippable": skippable,
                "queues": queues
            });

            if (actions.length == 1) {
                consumeAction();
            }

        }

        return this;

    };

    documentFragment.getAllNodes = function() {

        var nodes = [];

        var firstMeet = false;
        var lastMeet = false;

        [].slice.call(container.childNodes, 0).forEach(function(childNode) {

            if ((!firstMeet) && (childNode == firstNode)) {
                firstMeet = true;
            }

            if (firstMeet && (!lastMeet)) {
                nodes.push(childNode);
            }

            if ((!lastMeet) && (childNode == lastNode)) {
                lastMeet = true;
            }

        });

        return $(nodes);
    };

    var times = 1;

    documentFragment.fill = function(parameters, callback) {
        documentFragment.act(false, true, function(next) {
            ++times;

            var newParameters = {};
            if (originalParametersMutable) {
                newParameters = parameters;
            } else {

                for (var name in parameters) {
                    newParameters[name] = parameters[name];
                }

                newParameters["$t"] = times;

            }
            //var fillerBrushed = [];
            parameters = newParameters;

            // fillers.forEach(function(filler) {
            //     fillerBrushed.push(filler.toString());
            // });

            if (fillers.length > 0) {

                var callbacked = fillers.length;

                fillers.forEach(function(filler) {

                    filler(parameters, options, function() {

                        --callbacked;
                        //
                        // var fuckedIndex = fillerBrushed.indexOf(filler.toString());
                        //
                        // fillerBrushed.splice(fuckedIndex, 1);
                        //
                        // console.log(fuckedIndex);

                        if (callbacked === 0) {

                            $.reinit(documentFragment.getAllNodes());

                            if (callback) {
                                callback();
                            }

                            $.delay(-1, next);

                        }

                    });
                });

            } else {

                if (callback) {
                    callback();
                }

                $.delay(-1, next);

            }

        }, ["fill"]);

        return this;

    };

    documentFragment.render = function(newContainer, rendering, completed) {

        if (!newContainer) {
            newContainer = documentFragment;
        }

        if ((typeof newContainer === "string") || (newContainer instanceof String)) {
            newContainer = $(newContainer);
        }

        if (!(newContainer instanceof Node)) {
            newContainer = newContainer[0];
        }

        if (!newContainer) {
            newContainer = documentFragment;
        }

        var targetPlaceholderNode = document.createTextNode("");
        newContainer.appendChild(targetPlaceholderNode);

        documentFragment.act(false, false, function(next) {

            if (newContainer.length == 1) {
                newContainer = newContainer[0];
            }

            var lastContainer = container;

            container = newContainer;

            var span = document.createElement("div");
            span.className = "template-animation";

            var firstMeet = false;
            var lastMeet = false;

            var placeholderNode = document.createTextNode("");
            lastContainer.insertBefore(placeholderNode, firstNode);

            [].slice.call(lastContainer.childNodes, 0).forEach(function(childNode) {

                if ((!firstMeet) && (childNode == firstNode)) {
                    firstMeet = true;
                }

                if (firstMeet && (!lastMeet)) {
                    span.appendChild(childNode);
                }

                if ((!lastMeet) && (childNode == lastNode)) {
                    lastMeet = true;
                }

            });

            lastContainer.insertBefore(span, placeholderNode);

            $(placeholderNode).detach();

            var action = function() {

                container.insertBefore(span, targetPlaceholderNode);

                if (rendering) {
                    rendering();
                }

            };

            var complete = function() {

                [].slice.call(span.childNodes, 0).forEach(function(childNode) {
                    container.insertBefore(childNode, targetPlaceholderNode);
                });

                $(span).detach();

                $(targetPlaceholderNode).detach();

                $.reinit(documentFragment.getAllNodes());

                if (completed) {
                    completed();
                }

                $.delay(-1, next);

            };

            var animation = getAnimation(lastContainer, options);

            if (animation.animated) {
                $.template.animations[animation.name](animation.duration,
                    action,
                    $(span),
                    $(span),
                    complete);
            } else {

                action();

                complete();

            }

        }, ["fill", "render"]);

        return this;

    };

    if (options.fillInTarget) {
        documentFragment.render($(options.fillInTarget)[0]);
    }

    return documentFragment;

};


$.template.animations = {};

$.template.animations["none"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {

    var span = document.createElement("span");
    span.className = "template-animation";

    $(span).animate({
        "opacity": 0
    }, duration * 0.5, "swing", function() {

        action();

        $(span).animate({
            "opacity": 1
        }, duration * 0.5, "swing", function() {
            if (complete) {
                complete();
            }
        });

    });

};

$.template.animations["fading"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 0
    }, duration * 0.5, function() {

        action();

        nodesToShow.css({
            "opacity": 0
        }).transition({
            "opacity": 1
        }, duration * 0.5, function() {
            if (complete) {
                complete();
            }
        });

    });
};

$.template.animations["forward"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scale": 0.001,
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "scale": 0.001,
                "opacity": 0
            })
            .transition({
                "scale": "1",
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["backward"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scale": 2,
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "scale": 2,
                "opacity": 0
            })
            .transition({
                "scale": "1",
                "opacity": 1,
                "delay": 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["bubble"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scale": 2,
        "opacity": 0
    }, duration * 0.35, function() {

        action();

        nodesToShow
            .css({
                "scale": 0.001,
                "opacity": 0
            })
            .transition({
                "scale": 1,
                "opacity": 1,
                "delay": duration * 0.3
            }, duration * 0.35, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["stamp"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scale": 0.001,
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "scale": 2,
                "opacity": 0
            })
            .transition({
                "scale": 1,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["compress"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scaleY": 0.001,
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "scaleY": 0.001,
                "opacity": 0
            })
            .transition({
                "scaleY": 1,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["narrow"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scaleX": 0.001,
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "scaleX": 0.001,
                "opacity": 0
            })
            .transition({
                "scaleX": 1,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["expand"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scaleY": 2,
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "scaleY": 2,
                "opacity": 0
            })
            .transition({
                "scaleY": 1,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["fat"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "scaleX": 2,
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "scaleX": 2,
                "opacity": 0
            })
            .transition({
                "scaleX": 1,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["top"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "y": "-100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "y": "-100%",
                "opacity": 0
            })
            .transition({
                "y": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["bottom"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "y": "100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "y": "100%",
                "opacity": 0
            })
            .transition({
                "y": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["left"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "x": "-100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "x": "-100%",
                "opacity": 0
            })
            .transition({
                "x": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["right"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "x": "100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "x": "100%",
                "opacity": 0
            })
            .transition({
                "x": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["up"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "y": "-100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "y": "100%",
                "opacity": 0
            })
            .transition({
                "y": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["down"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "y": "100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "y": "-100%",
                "opacity": 0
            })
            .transition({
                "y": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["pass"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "x": "-100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "x": "100%",
                "opacity": 0
            })
            .transition({
                "x": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

$.template.animations["back"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "x": "100%",
        "opacity": 0
    }, duration * 0.4, function() {

        action();

        nodesToShow
            .css({
                "x": "-100%",
                "opacity": 0
            })
            .transition({
                "x": 0,
                "opacity": 1,
                "delay": duration * 0.2
            }, duration * 0.4, function() {
                if (complete) {
                    complete();
                }
            });

    });
};

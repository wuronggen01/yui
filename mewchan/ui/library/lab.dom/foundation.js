$(function () {

    var eventListenersSymbol = Symbol("eventListeners");

    var eventListeners = function (node) {

        if (!node.hasOwnProperty(eventListenersSymbol)) {
            node[eventListenersSymbol] = {};
        }

        return node[eventListenersSymbol];
    };

    var wildcardRegex = function (value) {
        
        if ($.isKindOf(value, RegExp)) {

            return value;

        } else if (!$.isNull(value)) {

            var regex = new RegExp("^" + (value + "").replace(/[\$\^\(\)\-\+\[\]\{\}\\\|\,\?\/\.]/g, function (character) {
                return "\\" + character;
            }).replace(/(\\\.)*(\*+)(\\\.)*/g, function (string) {

                if (string.slice(0, 2) === "\\.") {
                    if (string.slice(-2) === "\\.") {
                        return "(\\.|\\..+\\.)";
                    } else {
                        return "(\\..+)?";
                    }
                } else if (string.slice(-2) === "\\.") {
                    return "(.+\\.)?";
                } else {
                    return ".*";
                }

            }) + "$", "m");

            regex.fromString = value;

            return regex;

        } else {

            return /$^/;

        }

    };


    var XMLSerializer = function () {

    };

    XMLSerializer.prototype.serializeToString = function (node, namespaces) {

        if (!namespaces) {
            namespaces = {};
        } else {
            namespaces = $.merge({}, namespaces);
        }

        var serializer = this;

        switch (node.nodeType) {

            case Node.TEXT_NODE: {
                return $.escapeXML(node.nodeValue);
            }

            case Node.ATTRIBUTE_NODE: {
                return $.escapeXML(node.nodeName) + "=\"" + $.escapeXML(node.nodeValue) + "\"";
            }

            case Node.CDATA_SECTION_NODE: {
                return "<![CDATA[" + node.nodeValue + "]]>";
            }

            case Node.COMMENT_NODE: {
                return "<!--" + node.nodeValue + "-->";
            }
                                       
            case Node.ELEMENT_NODE: {

                var xml = ["<"];

                var namespaceURI = node.namespaceURI;
                var nodeName = node.nodeName;
                var prefix = node.prefix;

                var newNSMap = {};

                if (namespaceURI === "http://www.w3.org/1999/xhtml") {

                    nodeName = nodeName.toLocaleLowerCase();

                    var components = nodeName.split(":");
                    if (components.length > 1) {
                        prefix = components[0];
                        namespaceURI = namespaces[namespaceURI];
                    } else {
                        namespaceURI = null;
                    }

                }

                xml.push(nodeName);

                if (node.attributes.length > 0) {

                    xml.push(" ");

                    xml.push(Array.prototype.map.call(node.attributes, function (attribute) {

                        var namespaceURI = null;
                        var prefix = null;
                        if (attribute.nodeName === "xmlns") {
                            prefix = "";
                            namespaceURI = attribute.nodeValue;
                        } else if (attribute.nodeName.indexOf("xmlns:") === 0) {
                            prefix = attribute.nodeName.substring(6);
                            namespaceURI = attribute.nodeValue;
                        } else {

                        }

                        if (namespaceURI) {
                            namespaces[prefix] = namespaceURI;
                        }

                        if (attribute.namespaceURI && (attribute.namespaceURI !== "http://www.w3.org/2000/xmlns/")) {
                            prefix = attribute.prefix ? attribute.prefix : "";
                            newNSMap[prefix] = attribute.namespaceURI;
                        }

                        return serializer.serializeToString(attribute);

                    }).join(" "));

                }

                if (namespaceURI) {

                    if ((namespaces[prefix ? prefix : ""] !== namespaceURI) && namespaceURI) {
                        if (prefix) {
                            namespaces[prefix] = namespaceURI;
                            xml.push(" xmlns:" + prefix + "=\"" + namespaceURI + "\"");
                        } else {
                            namespaces[""] = namespaceURI;
                            xml.push(" xmlns=\"" + namespaceURI + "\"");
                        }
                    }

                } else {

                    if ((!prefix) && (namespaces[""] !== node.namespaceURI) && node.namespaceURI) {
                        xml.push(" xmlns=\"" + node.namespaceURI + "\"");
                        namespaces[""] = node.namespaceURI;
                    }

                }

                Object.keys(newNSMap).forEach(function (prefix) {
                    if (namespaces[prefix] !== newNSMap[prefix]) {

                        namespaces[prefix] = newNSMap[prefix];

                        if (prefix) {
                            xml.push(" xmlns:" + prefix + "=\"" + newNSMap[prefix] + "\"");
                        } else {
                            xml.push(" xmlns=\"" + newNSMap[prefix] + "\"");
                        }

                    }
                });

                if (node.childNodes.length > 0) {

                    xml.push(">");

                    xml.push(Array.prototype.map.call(node.childNodes, function (childNode) {
                        return serializer.serializeToString(childNode, namespaces);
                    }).join(""));

                    xml.push("<");
                    xml.push("/");
                    xml.push(nodeName);
                    xml.push(">");

                } else {
                    xml.push("/");
                    xml.push(">");
                }

                return xml.join("");
            }

            case Node.DOCUMENT_FRAGMENT_NODE: 
            case Node.DOCUMENT_NODE: {

                var xml = [];

                Array.prototype.forEach.call(node.childNodes, function (childNode) {
                    xml.push(serializer.serializeToString(childNode));
                });

                return xml.join("");
            }

            case Node.DOCUMENT_TYPE_NODE:
            case Node.ENTITY_NODE: 
            case Node.ENTITY_REFERENCE_NODE: 
            case Node.PROCESSING_INSTRUCTION_NODE: 
            case Node.NOTATION_NODE: 
            default: { break; }
        }

    };

    $.escapeXML = function (text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    var htmlEntities = {
        "&amp;": "&#x26;",
        "&lt;": "&#x3C;",
        "&gt;": "&#x3E;",
        "&nbsp;": "&#xA0;",
        "&iexcl;": "&#xA1;",
        "&cent;": "&#xA2;",
        "&pound;": "&#xA3;",
        "&curren;": "&#xA4;",
        "&yen;": "&#xA5;",
        "&brvbar;": "&#xA6;",
        "&sect;": "&#xA7;",
        "&uml;": "&#xA8;",
        "&copy;": "&#xA9;",
        "&ordf;": "&#xAA;",
        "&laquo;": "&#xAB;",
        "&not;": "&#xAC;",
        "&shy;": "&#xAD;",
        "&reg;": "&#xAE;",
        "&macr;": "&#xAF;",
        "&deg;": "&#xB0;",
        "&plusmn;": "&#xB1;",
        "&sup2;": "&#xB2;",
        "&sup3;": "&#xB3;",
        "&acute;": "&#xB4;",
        "&micro;": "&#xB5;",
        "&para;": "&#xB6;",
        "&middot;": "&#xB7;",
        "&cedil;": "&#xB8;",
        "&sup1;": "&#xB9;",
        "&ordm;": "&#xBA;",
        "&raquo;": "&#xBB;",
        "&frac14;": "&#xBC;",
        "&frac12;": "&#xBD;",
        "&frac34;": "&#xBE;",
        "&iquest;": "&#xBF;",
        "&Agrave;": "&#xC0;",
        "&Aacute;": "&#xC1;",
        "&Acirc;": "&#xC2;",
        "&Atilde;": "&#xC3;",
        "&Auml;": "&#xC4;",
        "&Aring;": "&#xC5;",
        "&AElig;": "&#xC6;",
        "&Ccedil;": "&#xC7;",
        "&Egrave;": "&#xC8;",
        "&Eacute;": "&#xC9;",
        "&Ecirc;": "&#xCA;",
        "&Euml;": "&#xCB;",
        "&Igrave;": "&#xCC;",
        "&Iacute;": "&#xCD;",
        "&Icirc;": "&#xCE;",
        "&Iuml;": "&#xCF;",
        "&ETH;": "&#xD0;",
        "&Ntilde;": "&#xD1;",
        "&Ograve;": "&#xD2;",
        "&Oacute;": "&#xD3;",
        "&Ocirc;": "&#xD4;",
        "&Otilde;": "&#xD5;",
        "&Ouml;": "&#xD6;",
        "&times;": "&#xD7;",
        "&Oslash;": "&#xD8;",
        "&Ugrave;": "&#xD9;",
        "&Uacute;": "&#xDA;",
        "&Ucirc;": "&#xDB;",
        "&Uuml;": "&#xDC;",
        "&Yacute;": "&#xDD;",
        "&THORN;": "&#xDE;",
        "&szlig;": "&#xDF;",
        "&agrave;": "&#xE0;",
        "&aacute;": "&#xE1;",
        "&acirc;": "&#xE2;",
        "&atilde;": "&#xE3;",
        "&auml;": "&#xE4;",
        "&aring;": "&#xE5;",
        "&aelig;": "&#xE6;",
        "&ccedil;": "&#xE7;",
        "&egrave;": "&#xE8;",
        "&eacute;": "&#xE9;",
        "&ecirc;": "&#xEA;",
        "&euml;": "&#xEB;",
        "&igrave;": "&#xEC;",
        "&iacute;": "&#xED;",
        "&icirc;": "&#xEE;",
        "&iuml;": "&#xEF;",
        "&eth;": "&#xF0;",
        "&ntilde;": "&#xF1;",
        "&ograve;": "&#xF2;",
        "&oacute;": "&#xF3;",
        "&ocirc;": "&#xF4;",
        "&otilde;": "&#xF5;",
        "&ouml;": "&#xF6;",
        "&divide;": "&#xF7;",
        "&oslash;": "&#xF8;",
        "&ugrave;": "&#xF9;",
        "&uacute;": "&#xFA;",
        "&ucirc;": "&#xFB;",
        "&uuml;": "&#xFC;",
        "&yacute;": "&#xFD;",
        "&thorn;": "&#xFE;",
        "&yuml;": "&#xFF;",
        "&fnof;": "&#x192;",
        "&Alpha;": "&#x391;",
        "&Beta;": "&#x392;",
        "&Gamma;": "&#x393;",
        "&Delta;": "&#x394;",
        "&Epsilon;": "&#x395;",
        "&Zeta;": "&#x396;",
        "&Eta;": "&#x397;",
        "&Theta;": "&#x398;",
        "&Iota;": "&#x399;",
        "&Kappa;": "&#x39A;",
        "&Lambda;": "&#x39B;",
        "&Mu;": "&#x39C;",
        "&Nu;": "&#x39D;",
        "&Xi;": "&#x39E;",
        "&Omicron;": "&#x39F;",
        "&Pi;": "&#x3A0;",
        "&Rho;": "&#x3A1;",
        "&Sigma;": "&#x3A3;",
        "&Tau;": "&#x3A4;",
        "&Upsilon;": "&#x3A5;",
        "&Phi;": "&#x3A6;",
        "&Chi;": "&#x3A7;",
        "&Psi;": "&#x3A8;",
        "&Omega;": "&#x3A9;",
        "&alpha;": "&#x3B1;",
        "&beta;": "&#x3B2;",
        "&gamma;": "&#x3B3;",
        "&delta;": "&#x3B4;",
        "&epsilon;": "&#x3B5;",
        "&zeta;": "&#x3B6;",
        "&eta;": "&#x3B7;",
        "&theta;": "&#x3B8;",
        "&iota;": "&#x3B9;",
        "&kappa;": "&#x3BA;",
        "&lambda;": "&#x3BB;",
        "&mu;": "&#x3BC;",
        "&nu;": "&#x3BD;",
        "&xi;": "&#x3BE;",
        "&omicron;": "&#x3BF;",
        "&pi;": "&#x3C0;",
        "&rho;": "&#x3C1;",
        "&sigmaf;": "&#x3C2;",
        "&sigma;": "&#x3C3;",
        "&tau;": "&#x3C4;",
        "&upsilon;": "&#x3C5;",
        "&phi;": "&#x3C6;",
        "&chi;": "&#x3C7;",
        "&psi;": "&#x3C8;",
        "&omega;": "&#x3C9;",
        "&thetasym;": "&#x3D1;",
        "&upsih;": "&#x3D2;",
        "&piv;": "&#x3D6;",
        "&bull;": "&#x2022;",
        "&hellip;": "&#x2026;",
        "&prime;": "&#x2032;",
        "&Prime;": "&#x2033;",
        "&oline;": "&#x203E;",
        "&frasl;": "&#x2044;",
        "&weierp;": "&#x2118;",
        "&image;": "&#x2111;",
        "&real;": "&#x211C;",
        "&trade;": "&#x2122;",
        "&alefsym;": "&#x2135;",
        "&larr;": "&#x2190;",
        "&uarr;": "&#x2191;",
        "&rarr;": "&#x2192;",
        "&darr;": "&#x2193;",
        "&harr;": "&#x2194;",
        "&crarr;": "&#x21B5;",
        "&lArr;": "&#x21D0;",
        "&uArr;": "&#x21D1;",
        "&rArr;": "&#x21D2;",
        "&dArr;": "&#x21D3;",
        "&hArr;": "&#x21D4;",
        "&forall;": "&#x2200;",
        "&part;": "&#x2202;",
        "&exist;": "&#x2203;",
        "&empty;": "&#x2205;",
        "&nabla;": "&#x2207;",
        "&isin;": "&#x2208;",
        "&notin;": "&#x2209;",
        "&ni;": "&#x220B;",
        "&prod;": "&#x220F;",
        "&sum;": "&#x2211;",
        "&minus;": "&#x2212;",
        "&lowast;": "&#x2217;",
        "&radic;": "&#x221A;",
        "&prop;": "&#x221D;",
        "&infin;": "&#x221E;",
        "&ang;": "&#x2220;",
        "&and;": "&#x2227;",
        "&or;": "&#x2228;",
        "&cap;": "&#x2229;",
        "&cup;": "&#x222A;",
        "&int;": "&#x222B;",
        "&there4;": "&#x2234;",
        "&sim;": "&#x223C;",
        "&cong;": "&#x2245;",
        "&asymp;": "&#x2248;",
        "&ne;": "&#x2260;",
        "&equiv;": "&#x2261;",
        "&le;": "&#x2264;",
        "&ge;": "&#x2265;",
        "&sub;": "&#x2282;",
        "&sup;": "&#x2283;",
        "&nsub;": "&#x2284;",
        "&sube;": "&#x2286;",
        "&supe;": "&#x2287;",
        "&oplus;": "&#x2295;",
        "&otimes;": "&#x2297;",
        "&perp;": "&#x22A5;",
        "&sdot;": "&#x22C5;",
        "&lceil;": "&#x2308;",
        "&rceil;": "&#x2309;",
        "&lfloor;": "&#x230A;",
        "&rfloor;": "&#x230B;",
        "&lang;": "&#x2329;",
        "&rang;": "&#x232A;",
        "&loz;": "&#x25CA;",
        "&spades;": "&#x2660;",
        "&clubs;": "&#x2663;",
        "&hearts;": "&#x2665;",
        "&diams;": "&#x2666;"
    };

    $.replaceHTMLEntityForXML = function (code) {

        return code.replace(/&[a-zA-Z0-9]+;/g, function (entity) {
            
            var result = htmlEntities[entity];
            if (!result) {
                result = "";
            }

            return result;
            
        });

    };

    var prefixedStyles = {};
    (function () {

        var style = window.getComputedStyle(document.body);

        var looper = 0;
        while (looper < style.length) {

            if (style[looper][0] === "-") {
                prefixedStyles[style[looper][0].split("-").slice(2).join("-")] = style[looper][0];
            }

            ++looper;    
        }

    })();

    $.actualStyleName = function (name) {
        if (prefixedStyles.hasOwnProperty(name)) {
            return prefixedStyles[name];
        } else {
            return name;
        }
    };

    var eventAdapters = {};

    $.upgrade({
        "domain": "dom",
        "test": function (list) {
            return (list.length === 1) && ($.isKindOf(list[0], String) || $.isKindOf(list[0], Node));
        },
        "initializer": function (list) {

            if ($.isKindOf(list[0], $.Query)) {

                var query = this;

                list[0].forEach(function (element) {
                    query.include(element);
                });
                
            } else if ($.isKindOf(list[0], Node)) {
                this.include(list[0]);
            } else if (list[0].trim()[0] === "<") {
                $.parse("html", list[0]).operateOn(this, function (list, item) {
                    list.include(item);
                });
            } else {
                $.query(document.querySelectorAll(list[0])).operateOn(this, function (list, item) {
                    list.include(item);
                });
            }

        },
        "addons": {

            "feature": function () {

                if (arguments.length === 0) {
                    return this.features()[0];
                } else if ((arguments.length === 1) && 
                    (!$.isKindOf(arguments[0], Array)) && (!$.isKindOf(arguments[0], String))) {
                    return this.features.apply(this, arguments)[0];
                } else {
                    return this.features.apply(this, arguments);
                }

            },
            "features": function () {

                var name = null;
                var target = null;
                var list = null;

                if ((arguments.length > 0) && 
                    (!$.isKindOf(arguments[0], Array)) && (!$.isKindOf(arguments[0], String))) {

                    var settings = arguments[0];

                    name = settings.name;
                    if (!name) {
                        name = "class";
                    }

                    target = settings.target;
                    if (!target) {
                         target = "attribute";
                    }

                    list = settings.values;
                    if (!$.isNull(list)) {
                        if ($.isKindOf(list, String)) {
                            list = list.split(/\s+/);
                        } else {
                            list = Array.prototype.slice.call(list, 0);
                        }
                    } else {
                        list = null;
                    }

                    if (arguments.length > 1) {

                        if (!list) {
                            list = [];
                        }

                        Array.prototype.slice.call(arguments, 1).forEach(function (item) {

                            if (!$.isKindOf(item, Array)) {
                                item = [item];
                            }

                            item.forEach(function (item2) {
                                item2.split(/\s+/).forEach(function (item3) {
                                    list.push(item3);
                                });
                            });

                        });

                    }

                } else {

                    name = "className";
                    target = "property";

                    if (arguments.length > 0) {

                        list = [];

                        Array.prototype.slice.call(arguments, 0).forEach(function (item) {

                            if (!$.isKindOf(item, Array)) {
                                item = [item];
                            }

                            item.forEach(function (item2) {
                                item2.split(/\s+/).forEach(function (item3) {
                                    list.push(item3);
                                });
                            });

                        });

                    }

                }

                if ($.isNull(list)) {

                    switch (target) {

                        case "property": {
                            return this.map(function (element) {

                                var list = [];

                                if (element[name]) {
                                    element[name].toString().split(/\s+/).forEach(function (item) {
                                        if (list.indexOf(item) === -1) {
                                            list.push(item);
                                        }
                                    });
                                }

                                return list;
                            });
                        }

                        case "attribute":
                        default: {
                            return this.map(function (element) {

                                var list = [];

                                var attribute = null;
                                if ($.isKindOf(name, Array)) {
                                    attribute = element.getAttributeNS(name[0], name[1]);
                                } else {
                                    attribute = element.getAttribute(name);
                               }

                                if (attribute) {
                                    attribute.split(/\s+/).forEach(function (item) {
                                        if (list.indexOf(item) === -1) {
                                            list.push(item);
                                        }
                                    });
                                }

                                return list;
                            });
                        }

                    }

                } else {

                    var values = [];
                    list.forEach(function (item) {
                        if (values.indexOf(item) === -1) {
                            values.push(item);
                        }
                    });

                    values = values.sort($.insensitiveNaturalComparator).join(" ");

                    switch (target) {

                        case "property": {
                            return this.forEach(function (element) {
                                element[name] = values;
                            });
                        }

                        case "attribute": 
                        default: {
                            return this.forEach(function (element) {
                                if ($.isKindOf(name, Array)) {
                                    element.setAttributeNS(name[0], name[1], values);
                                } else {
                                    element.setAttribute(name, values);
                                }
                            })
                        }
                    }

                }

            },
            "addFeatures": function () {

                var name = null;
                var target = null;
                var list = null;

                if ((arguments.length > 0) && 
                    (!$.isKindOf(arguments[0], Array)) && (!$.isKindOf(arguments[0], String))) {

                    var settings = arguments[0];

                    name =  settings.name;
                    if (!name) {
                        name = "class";
                    }

                    target = settings.target;
                    if (!target) {
                         target = "attribute";
                    }

                    list = settings.values;
                    if (!$.isNull(list)) {
                        if ($.isKindOf(list, String)) {
                            list = list.split(/\s+/);
                        } else {
                            list = Array.prototype.slice.call(list, 0);
                        }
                    } else {
                        list = null;
                    }

                    if (arguments.length > 1) {

                        if (!list) {
                            list = [];
                        }

                        Array.prototype.slice.call(arguments, 1).forEach(function (item) {

                            if (!$.isKindOf(item, Array)) {
                                item = [item];
                            }

                            item.forEach(function (item2) {
                                item2.split(/\s+/).forEach(function (item3) {
                                    list.push(item3);
                                });
                            });

                        });

                    }

                } else {

                    name = "className";
                    target = "property";

                    if (arguments.length > 0) {

                        list = [];
                        
                        Array.prototype.slice.call(arguments, 0).forEach(function (item) {

                            if (!$.isKindOf(item, Array)) {
                                item = [item];
                            }

                            item.forEach(function (item2) {
                                item2.split(/\s+/).forEach(function (item3) {
                                    list.push(item3);
                                });
                            });

                        });

                    }

                }

                var values = [];
                if (!$.isNull(list)) {
                    list.forEach(function (item) {
                        if (values.indexOf(item) === -1) {
                            values.push(item);
                        }
                    });
                }

                return this.forEach(function (element) {

                    var list = null;
                    switch (target) {
                        case "property": { list = element[name]; break; }
                        case "attribute": 
                        default: {

                            if ($.isKindOf(name, Array)) {
                                list = element.getAttributeNS(name[0], name[1]);
                            } else {
                                list = element.getAttribute(name);
                            }

                            break;
                        }
                    }

                    if (list) {
                        list = list.split(/\s+/);
                    } else {
                        list = [];
                    }

                    var newValues = values.slice(0);

                    list.forEach(function (item) {
                        if (newValues.indexOf(item) === -1) {
                            newValues.push(item);
                        }
                    });

                    newValues = newValues.sort($.insensitiveNaturalComparator).join(" ");

                    switch (target) {
                        case "property": { element[name] = newValues; break; }
                        case "attribute": 
                        default: {

                            if ($.isKindOf(name, Array)) {
                                element.setAttributeNS(name[0], name[1], newValues);
                            } else {
                                element.setAttribute(name, newValues);
                            }

                            break;
                        }
                    }

                });

            },
            "removeFeatures": function () {

                var name = null;
                var target = null;
                var list = null;

                if ((arguments.length > 0) && 
                    (!$.isKindOf(arguments[0], Array)) && (!$.isKindOf(arguments[0], String))) {

                    var settings = arguments[0];
                
                    name = settings.name;
                    if (!name) {
                        name = "class";
                    }

                    target = settings.target;
                    if (!target) {
                         target = "attribute";
                    }

                    list = settings.values;
                    if (!$.isNull(list)) {
                        if ($.isKindOf(list, String)) {
                            list = list.split(/\s+/);
                        } else {
                            list = Array.prototype.slice.call(list, 0);
                        }
                    } else {
                        list = null;
                    }

                    if (arguments.length > 1) {

                        if (!list) {
                            list = [];
                        }

                        Array.prototype.slice.call(arguments, 1).forEach(function (item) {

                            if (!$.isKindOf(item, Array)) {
                                item = [item];
                            }

                            item.forEach(function (item2) {
                                item2.split(/\s+/).forEach(function (item3) {
                                    list.push(item3);
                                });
                            });

                        });

                    }

                } else {

                    name = "className";
                    target = "property";

                    if (arguments.length > 0) {

                        list = [];
                        
                        Array.prototype.slice.call(arguments, 0).forEach(function (item) {

                            if (!$.isKindOf(item, Array)) {
                                item = [item];
                            }

                            item.forEach(function (item2) {
                                item2.split(/\s+/).forEach(function (item3) {
                                    list.push(item3);
                                });
                            });

                        });

                    }

                }

                var values = [];
                if (!$.isNull(list)) {
                    list.forEach(function (item) {
                        if (values.indexOf(item) === -1) {
                            values.push(item);
                        }
                    });
                }

                return this.forEach(function (element) {

                    var list = null;
                    switch (target) {
                        case "property": { list = element[name]; break; }
                        case "attribute": 
                        default: {

                            if ($.isKindOf(name, Array)) {
                                list = element.getAttributeNS(name[0], name[1]);
                            } else {
                                list = element.getAttribute(name);
                            }

                            break;
                        }
                    }

                    if (list) {
                        list = list.split(/\s+/);
                    } else {
                        list = [];
                    }

                    var newValues = [];

                    list.forEach(function (item) {
                        if ((values.indexOf(item) === -1) && (newValues.indexOf(item) === -1)) {
                            newValues.push(item);
                        }
                    });

                    newValues = newValues.sort($.insensitiveNaturalComparator).join(" ");

                    switch (target) {
                        case "property": { element[name] = newValues; break; }
                        case "attribute": 
                        default: {

                            if ($.isKindOf(name, Array)) {
                                element.setAttributeNS(name[0], name[1], newValues);
                            } else {
                                element.setAttribute(name, newValues);
                            }

                            break;
                        }
                    }

                });

            },

            // Get and set attribute for dom nodes
            // ->
            // -> name
            // -> [namespaceURI, name]
            // -> name, value
            // -> [namespaceURI, name], value 
            // -> settings
            // -> settings, namespacesURIs
            //
            "attribute": function () {

                if ((arguments.length === 0) || 
                    ((arguments.length === 1) && ($.isKindOf(arguments[0], String) || 
                                                  $.isKindOf(arguments[0], Array)))) {
                    return this.attributes.apply(this, arguments)[0];
                } else {
                    return this.attributes.apply(this, arguments);
                }

            },
            "attributes": function () {

                if ((arguments.length === 0) || 
                    ((arguments.length === 1) && ($.isKindOf(arguments[0], String) || 
                                                  $.isKindOf(arguments[0], Array)))) {

                    var name = null;
                    if (arguments.length === 1) {
                        name = arguments[0];
                    }

                    return this.map(function (element) {

                        var attributes = [];

                        var looper = 0;
                        while (looper < element.attributes.length) {

                            var attribute = element.attributes[looper];

                            attributes.push({
                                "prefix": attribute.prefix,
                                "localName": attribute.localName,
                                "namespaceURI": attribute.namespaceURI,
                                "value": attribute.value
                            });

                            ++looper;
                        }

                        return attributes;

                    }).map(function (attributes) {

                        if (name !== null) {

                            if ($.isKindOf(name, Array)) {
                                return attributes.filter(function (attribute) {
                                    return $.isEqual(attribute.namespaceURI, name[0]) && $.isEqual(attribute.localName, name[1]);
                                }).map(function (attribute) {
                                    return attribute.value;
                                })[0];
                            } else {
                                return attributes.filter(function (attribute) {
                                    return $.isEqual(attribute.localName, name);
                                }).map(function (attribute) {
                                    return attribute.value;
                                })[0];
                            }

                        } else {
                            return attributes;
                        }

                    });

                } else {

                    var settings = {};
                    var namespaceURIs = {};
                    if (arguments.length === 2) {

                        if ($.isKindOf(arguments[0], String)) {

                            settings[arguments[0]] = arguments[1];

                        } else if ($.isKindOf(arguments[0], Array)) {

                            settings[arguments[0][1]] = arguments[1];

                            var prefix = arguments[0][1].split(":");
                            if (prefix.length > 1) {
                                prefix = prefix[0];
                            } else {
                                prefix = "";
                            }

                            namespaceURIs[prefix] = arguments[0][0];

                        } else {

                            settings = arguments[0];
                            namespaceURIs = arguments[1];

                        }

                    } else {
                        settings = arguments[0];
                    }

                    return this.forEach(function (element) {

                        for (var key in settings) {

                            var prefix = null;
                            var localName = null;

                            var pair = key.split(":");
                            if (pair.length > 1) {
                                prefix = pair[0];
                                localName = pair.slice(1).join(":");
                            } else {
                                prefix = "";
                                localName = pair[0];
                            }

                            var namespaceURI = namespaceURIs[prefix];
                            if (namespaceURI) {
                                if (!$.isNull(settings[key])) {
                                    element.setAttributeNS(namespaceURI, key, settings[key]);
                                } else {
                                    element.removeAttributeNS(namespaceURI, key);
                                }
                            } else {
                                if (!$.isNull(settings[key])) {
                                    element.setAttribute(localName, settings[key]);
                                } else {
                                    element.removeAttribute(localName, settings[key]);
                                }
                            }

                        }

                    });

                }

            },

            // Get and set style for dom nodes
            // -> 
            // -> name
            // -> name, value
            // -> settings
            //
            "style": function () {

                if ((arguments.length === 0) || 
                    ((arguments.length === 1) && $.isKindOf(arguments[0], String))) {
                    return this.styles.apply(this, arguments)[0];
                } else {
                    return this.styles.apply(this, arguments);
                }

            },
            "styles": function () {

                if ((arguments.length === 0) || 
                    ((arguments.length === 1) && $.isKindOf(arguments[0], String))) {

                    var name = null;
                    if (arguments.length === 1) {
                        name = arguments[0];
                    }

                    return this.map(function (element) {

                        var style = window.getComputedStyle(element);

                        var simplified = {};

                        var looper = 0;
                        while (looper < style.length) {

                            var name = style[looper];
                            if (name[0] === "-") {
                                name = name.split("-").slice(2).join("-");
                            }

                            simplified[name] = style[style[looper]];
                            ++looper;
                        }

                        return simplified;

                    }).map(function (style) {

                        if (name !== null) {
                            return style[name];
                        } else {
                            return style;
                        }

                    });

                } else {

                    var settings = {};
                    if (arguments.length === 2) {
                        settings[arguments[0]] = arguments[1];
                    } else {
                        settings = arguments[0];
                    }

                    return this.forEach(function (element) {
                        for (var key in settings) {
                            element.style[$.actualStyleName(key)] = settings[key];
                        }
                    });

                }

            },

            "ancestors": function (filter, until, all) {

                if ($.isKindOf(until, String)) {
                    until = (function (until) {
                        return function (node) {
                            if (node.parentElement) {
                                return Array.prototype.slice.call(node.parentElement.querySelectorAll(until), 0).indexOf(node) !== -1;
                            } else {
                                return true;
                            }
                        };
                    })(until);
                }

                return this.map(function (element) {

                    var ancestors = [];

                    while (element) {
                        ancestors.push(element);
                        element = element.parentElement;
                    }

                    ancestors.shift();

                    var noMore = false;
                    ancestors = ancestors.filter(function (ancestor) {

                        if (!noMore) {

                            if (until && until(ancestor)) {
                                noMore = true;
                            } else {

                                if (!filter) {
                                    return true;
                                } else if (ancestor.parentElement) {
                                    return (Array.prototype.slice.call(ancestor.parentElement.querySelectorAll(filter), 0).indexOf(ancestor) !== -1);
                                } else {
                                    return false;
                                }

                            }

                        } else {
                            return false;
                        }
                    });

                    if (all) {
                        return ancestors;
                    } else {
                        return ancestors[0];
                    }

                }).lifted.valueSet;

            },

            "parents": function (filter) {

                return this.map(function (element) {
                    return element.parentElement;
                }).valueSet.filter(filter);

            },

            "children": function (filter) {

                return this.map(function (element) {
                    return element.childNodes;
                }).lifted.filter(filter);

            },

            "filter": function (filter) {

                if ($.isKindOf(filter, String)) {

                    filter = (function (filter) {

                        return function (element) {

                            var childNodes = [];

                            var nodes = [];
                            if (element.parentElement) {
                                nodes = Array.prototype.slice.call(element.parentElement.querySelectorAll(filter), 0);
                            }

                            return (nodes.indexOf(element) !== -1);

                        };

                    })(filter);

                }

                return arguments.callee.super.call(this, [filter]);

            },

            "query": function (selector) {

                return this.map(function (element) {
                    return element.querySelectorAll(selector);
                }).lifted.valueSet;

            },

            "prepend": function () {

                return $.query(arguments).lifted.operateOn(this, function (that, child) {
                    if (that.length > 0) {
                        that[0].insertBefore(child, that[0].firstChild);
                    }
                });

            },

            "append": function () {

                return $.query(arguments).lifted.operateOn(this, function (that, child) {
                    if (that.length > 0) {
                        that[0].appendChild(child);
                    }
                });

            },

            "insert": function (children, index) {

                if ($.isKindOf(index, Query)) {
                    index = index[0];
                }

                return $.query(children).operateOn(this, function (that, child) {
                    if (that.length > 0) {
                        var correctIndex = index;
                        if ($.isKindOf(correctIndex, Number)) {
                            ++index;
                        } else {
                            var indices = $.query(that[0].childNodes).find(correctIndex);
                            if (indices.length > 0) {
                                correctIndex = indices[0];
                            } else {
                                correctIndex = that[0].childNodes.length;
                            }
                        }

                        if (correctIndex === that[0].childNodes.length) {
                            that[0].appendChild(child);
                        } else {
                            that[0].insertBefore(child, that[0].childNodes[correctIndex]);
                        }

                    }
                });

            },

            "detach": function () {

                return this.forEach(function (element) {
                    if (element.parentElement) {
                        element.parentElement.removeChild(element);
                    }
                });

            },

            "fire": function (event) {

                return this.forEach(function (element) {
                    element.dispatchEvent(event);
                });

            },

            "upgradeEventListener": function (eventName, adapter) {

                if (!eventAdapters.hasOwnProperty(eventName)) {
                    eventAdapters[eventName] = [];
                }

                eventAdapters[eventName].push(adapter);

                return this;
            },

            "on": function (domains, listener) {

                return this.forEach(function (element) {
                    domains.split(/\s+/).forEach(function (domain) {

                        var eventName = domain.split(".").slice(-1)[0];

                        var queryListener = function (event) {
                            listener.apply(this, arguments);
                        };

                        queryListener.listener = listener;

                        if (eventAdapters.hasOwnProperty(eventName)) {
                            eventAdapters[eventName].forEach(function (adapter) {
                                queryListener = adapter(domain, queryListener);
                            })
                        }

                        element.addEventListener(eventName, queryListener);

                        var listeners = eventListeners(element);

                        if (!listeners.hasOwnProperty(eventName)) {
                            listeners[eventName] = [];
                        }

                        listeners[eventName].push({
                            "domain": domain,
                            "eventName": eventName,
                            "listener": queryListener
                        });

                    });
                });

            },

            "off": function (domain) {

                var domainTest = wildcardRegex(domain);

                return this.forEach(function (element) {

                    var listeners = eventListeners(element);

                    Object.keys(listeners).forEach(function (eventName) {
                        if (listeners[eventName] instanceof Array) {
                            listeners[eventName].forEach(function (record) {
                                if (domainTest.test(record.domain)) {
                                    element.removeEventListener(record.eventName, record.listener);
                                }
                            });
                        }
                    });

                });

            },

            "snapshots": function (deep) {

                return this.map(function (element) {
                    return element.cloneNode(deep);
                });

            },

            "text": function (text) {

                if (arguments.length === 0) {
                    return this.map(function (element) {
                        return element.textContent;
                    });
                } else {
                    return this.forEach(function (element) {
                        element.textContent = text;
                    });
                }

            },

            "html": function (html) {

                if (arguments.length === 0) {

                    return $.serialize("html", this);

                } else {

                    return this.forEach(function (element) {

                        while (element.firstChild) {
                            element.removeChild(element.firstChild);
                        }

                        $.parse("html", html).forEach(function (child) {
                            element.appendChild(child);
                        }); 

                    });

                }

            },

            "namespaces": function () {

                var namespaces = {};

                this.forEach(function (element) {

                    while (element && element.attributes) {

                        if (element.namespaceURI === "http://www.w3.org/1999/xhtml") {

                            Array.prototype.forEach.call(element.attributes, function (attribute) {
                                if ((attribute.localName === "xmlns") && (!attribute.namespaceURI)) {
                                    if (!namespaces[""]) {
                                        namespaces[""] = attribute.value;
                                    }
                                } else if (attribute.localName.substring(0, 6) === "xmlns:") {
                                    var prefix = attribute.localName.substring(6);
                                    if (!namespaces[prefix]) {
                                        namespaces[prefix] = attribute.value;
                                    }
                                }
                            });
                        }

                        element = element.parentElement;
                    }

                });

                return namespaces;

            },

            "xml": function (xml) {

                if (arguments.length === 0) {

                    return $.serialize("xml", this);

                } else {

                    this.forEach(function (element) {

                        while (element.firstChild) {
                            element.removeChild(element.firstChild);
                        }

                        [].slice.call($.parse("xml", "<xml>" + code + "</xml>").documentElement.childNodes, 0)
                            .forEach(function (childNode) {
                                node.appendChild(childNode);
                            });

                        return this;

                    });

                }

            }

        }
    });

    $.parse.parsers["html"] = function (usage, content, options) {

        var element = document.createElement("div");

        element.innerHTML = $.query(content).array.join("");

        return $.create("dom", element.childNodes);

    };

    $.serialize.serializers["html"] = function (usage, content, options) {

        var html = $.query(content).map(function (element) {
            return element.innerHTML;
        }).array.join("");

        return html;

    };

    var convertNodesForHTML = function (nodes, options) {

        var result = [];

        var looper = 0;
        while (looper < nodes.length) {

            var node = nodes[looper];

            var newNode = null;

            if (node.nodeType === Node.ELEMENT_NODE) {

                if (node.namespaceURI) {
                    newNode = document.createElementNS(node.namespaceURI, node.nodeName);
                } else {
                    newNode = document.createElement(node.localName);
                }

                var looper2 = 0;
                while (looper2 < node.attributes.length) {

                    var attribute = node.attributes[looper2];

                    if (attribute.namespaceURI) {
                        newNode.setAttributeNS(attribute.namespaceURI, attribute.nodeName, attribute.value);
                    } else {
                        newNode.setAttribute(attribute.localName, attribute.value);
                    }

                    ++looper2;
                }

                convertNodesForHTML(node.childNodes, options).forEach(function (childNode) {
                    newNode.appendChild(childNode);
                });

            } else {

                newNode = document.importNode(node, true);

            }

            result.push(newNode);

            ++looper;
        }

        return result;

    };

    $.parse.parsers["xml"] = function (usage, content, options) {

        if ($.isNull(options)) {
            options = {
                "defaultNamespaceHTML": true
            };
        } else if ($.isKindOf(options, Boolean)) {
            options = {
                "defaultNamespaceHTML": options
            };
        }

        if (content.indexOf("?>") !== -1) {
            content = content.replace("?>", "?><xml>") + "</xml>";
        } else {
            content = "<xml>" + content + "</xml>";
        }

        var xmlDocument = new DOMParser().parseFromString(content, "text/xml"); 

        var result = $.create("dom");

        if (options.defaultNamespaceHTML) {

            convertNodesForHTML(xmlDocument.documentElement.childNodes).forEach(function (node) {
                result.push(node);
            });

        } else {

            var looper = 0;
            while (looper < xmlDocument.documentElement.childNodes.length) { 

                result.push(xmlDocument.documentElement.childNodes[looper]);

                ++looper;
            }

        }

        return result;
    };

    $.serialize.serializers["xml"] = function (usage, content, options) {

        var serializer = new XMLSerializer();

        var query = $.create("dom", content);

        var namespaces = query.namespaces();

        return query.map(function (element) {

            return $.parse("xml", "<xml " + Object.keys(namespaces).map(function (prefix) {

                if (prefix) {
                    return "xmlns:" + prefix + "=\"" + $.escapeXML(namespaces[prefix]) + "\"";
                } else {
                    return "xmlns=\"" + $.escapeXML(namespaces[prefix]) + "\"";
                }

            }).join(" ") + ">" + $.replaceHTMLEntityForXML(Array.prototype.map.call(element.childNodes, function (childNode) {

                return serializer.serializeToString(childNode);

            }).join("")) + "</xml>").children().map(function (childNode) {

                return serializer.serializeToString(childNode);

            }).array.join("");

        }).array.join("");

    };

});
$(function () {

    var JQueryXMLSerializer = function () {

    };

    JQueryXMLSerializer.prototype.serializeToString = function (node, nsmap) {

        if (!nsmap) {
            nsmap = {};
        } else {
            nsmap = $.extend({}, nsmap);
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
                        namespaceURI = nsmap[namespaceURI];
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
                            nsmap[prefix] = namespaceURI;
                        }

                        if (attribute.namespaceURI && (attribute.namespaceURI !== "http://www.w3.org/2000/xmlns/")) {
                            prefix = attribute.prefix ? attribute.prefix : "";
                            newNSMap[prefix] = attribute.namespaceURI;
                        }

                        return serializer.serializeToString(attribute);

                    }).join(" "));

                }

                if (namespaceURI) {

                    if ((nsmap[prefix ? prefix : ""] !== namespaceURI) && namespaceURI) {
                        if (prefix) {
                            nsmap[prefix] = namespaceURI;
                            xml.push(" xmlns:" + prefix + "=\"" + namespaceURI + "\"");
                        } else {
                            nsmap[""] = namespaceURI;
                            xml.push(" xmlns=\"" + namespaceURI + "\"");
                        }
                    }

                } else {

                    if ((!prefix) && (nsmap[""] !== node.namespaceURI) && node.namespaceURI) {
                        xml.push(" xmlns=\"" + node.namespaceURI + "\"");
                        nsmap[""] = node.namespaceURI;
                    }

                }

                Object.keys(newNSMap).forEach(function (prefix) {
                    if (nsmap[prefix] !== newNSMap[prefix]) {

                        nsmap[prefix] = newNSMap[prefix];

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
                        return serializer.serializeToString(childNode, nsmap);
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


    $.fn.extend({

        "nsmap": function () {

            var namespaces = {};

            this.each(function () {

                var node = this;

                while (node && node.attributes) {

                    // if (node.namespaceURI === "http://www.w3.org/1999/xhtml") {
                        Array.prototype.forEach.call(node.attributes, function (attribute) {
                            if (attribute.localName === "xmlns") {
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
                    // }

                    node = node.parentNode;
                }

            });

            return namespaces;

        },

        "advattrns": function (namespaces, namespaceURI, nodeName) {

            namespaces = $.extend(this.nsmap(), namespaces);

            var node = this[0];

            prefixes = Object.keys(namespaces).filter(function (prefix) {
                return ((prefix !== "") && (namespaces[prefix] === namespaceURI));
            });

            var localName = nodeName.split(":").slice(-1)[0];
            var result = node.getAttributeNS(namespaceURI, localName);

            prefixes.forEach(function (prefix) {
                if (!result) {
                    result = node.getAttribute(prefix + ":" + localName.toLocaleLowerCase());
                }
            });

            if ((!result) && (nodeName.split(":") > 1)) {
                result = node.getAttribute(nodeName);
            }

            return ((result === null) ? undefined : result);

        },

        // Get attribute with namespace URI
        //
        //   -> nodeName
        //   -> namespaceURI, nodeName
        //   -> namespaceURI, nodeName, value
        //
        "attrns": function () {

            var namespaceURI = null;
            var nodeName = null;
            var value = null;

            switch (arguments.length) {
                case 1: { nodeName = arguments[0]; break; }
                case 2: { namespaceURI = arguments[0]; nodeName = arguments[1]; break; }
                case 3: default: { namespaceURI = arguments[0]; nodeName = arguments[1]; value = arguments[2]; break; }
            }

            var node = this[0];

            if (!namespaceURI) {
                return node.getAttribute(nodeName);
            }

            var prefixes = [];

            var namespaces = this.nsmap();

            node = this[0];

            prefixes = Object.keys(namespaces).filter(function (prefix) {
                return ((prefix !== "") && (namespaces[prefix] === namespaceURI));
            });

            if ((value === null) || (value === undefined)) {

                var localName = nodeName.split(":").slice(-1)[0];
                var result = node.getAttributeNS(namespaceURI, localName);

                prefixes.forEach(function (prefix) {
                    if (!result) {
                        result = node.getAttribute(prefix + ":" + localName.toLocaleLowerCase());
                    }
                });

                if ((!result) && (nodeName.split(":") > 1)) {
                    result = node.getAttribute(nodeName);
                }

                return ((result === null) ? undefined : result);

            } else {

                var localName = nodeName.split(":").slice(-1)[0];

                prefixes.forEach(function (prefix) {
                    node.removeAttribute(prefix + ":" + localName.toLocaleLowerCase());
                });

                if ((!result) && (nodeName.split(":") > 1)) {
                    node.removeAttribute(nodeName);
                }

                node.setAttributeNS(namespaceURI, nodeName, value);

                return this;

            }

        },

        "xml": function (xml) {

            if (arguments.length === 0) {

                var namespaces = this.nsmap();

                // The XML serializer implemented in Android L is incorrect, it will generate HTML code, not XML code
                //
                // var serializer = new XMLSerializer();
                //
                var serializer = new JQueryXMLSerializer();

                return Array.prototype.slice.call($.parseXML("<xml " + Object.keys(namespaces).map(function (prefix) {

                    if (prefix) {
                        return "xmlns:" + prefix + "=\"" + $.escapeXML(namespaces[prefix]) + "\"";
                    } else {
                        return "xmlns=\"" + $.escapeXML(namespaces[prefix]) + "\"";
                    }

                }).join(" ") + ">" + $.replaceHTMLEntityForXML(Array.prototype.map.call(this[0].childNodes, function (childNode) {

                    return serializer.serializeToString(childNode);

                }).join("")) + "</xml>").documentElement.childNodes, 0).map(function (childNode) {

                    return serializer.serializeToString(childNode);

                }).join("");

            } else {

                var node = this[0];
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }

                [].slice.call(jQuery.parseXML("<xml>" + code + "</xml>").documentElement.childNodes, 0)
                    .forEach(function (childNode)
                    {
                        node.appendChild(childNode);
                    });

                return this;

            }

        }

    })

});

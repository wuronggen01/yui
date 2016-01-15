$(function () {

    var ruler = $("<div>").css({
        "width": "10000pt",
        "height": "10000mm",
        "pointer-events": "none",
        "position": "absolute"
    });

    $(document.body).append(ruler);

    var ptSize = parseFloat(ruler.css("width")) / 10000;
    var mmSize = parseFloat(ruler.css("height")) / 10000;

    ruler.detach();

    var scale = 0;

    if (window.matchMedia) {
        var looper = 0.01;
        while (looper < 8) {

            if (window.matchMedia("(min-resolution: " + looper + "dppx)").matches) {
                scale = looper;
            }

            if (window.matchMedia("(-webkit-min-resolution: " + looper + "dppx)").matches) {
                scale = looper;
            }

            if (window.matchMedia("(min-device-pixel-ratio: " + looper + ")").matches) {
                scale = looper;
            }

            if (window.matchMedia("(-webkit-min-device-pixel-ratio: " + looper + ")").matches) {
                scale = looper;
            }

            looper += 0.01;
        }
    } else {
        scale = 1;
    }

    scale = parseFloat(scale.toFixed(5));

    var minScreen = Math.min(window.screen.width, window.screen.height) / mmSize;

    var touchable = true;
    try {
        document.createEvent("TouchEvent");
    } catch (error) {
        touchable = false;
    }

    var body = $(document.body);

    var isIOS = /(ipad|iphone|ipod)/g.test(navigator.userAgent.toLowerCase());
    var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") !== -1;
    var isWindows = navigator.userAgent.toLowerCase().indexOf("windows") !== -1;
    var isLinux = navigator.userAgent.toLowerCase().indexOf("linux") !== -1;
    var isOSX = navigator.userAgent.toLowerCase().indexOf("macintosh") !== -1;

    var isTablet = /ipad/g.test(navigator.userAgent.toLowerCase());
    var isMobile = /(iphone|ipod)/g.test(navigator.userAgent.toLowerCase());

    var isChrome = navigator.userAgent.toLowerCase().indexOf("chrome") !== -1;
    var isMSIE = (navigator.userAgent.toLowerCase().indexOf("msie") !== -1) ||
        (navigator.userAgent.toLowerCase().indexOf("trident") !== -1);
    var isEdge = navigator.userAgent.toLowerCase().indexOf("edge") !== -1;
    var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") !== -1;
    var isSafari = navigator.userAgent.toLowerCase().indexOf("safari") !== -1;
    var isOpera = navigator.userAgent.toLowerCase().indexOf("presto") !== -1;

    var minPhoneWidth = 120;

    if (isChrome) {
        isSafari = false;
    }

    if (isMSIE || isEdge) {
        isChrome = false;
        isSafari = false;
    }

    if (isAndroid || (navigator.userAgent.toLowerCase().indexOf("mobile") !== -1)) {
        if (minScreen > minPhoneWidth) {
            isTablet = true;
            isMobile = false;
        } else {
            isTablet = false;
            isMobile = true;
        }
    }

    if (isChrome || isAndroid) {
        $.browser = {
            "name": "chrome",
            "layout": "blink"
        }
    } else if (isMSIE) {
        $.browser = {
            "name": "msie",
            "layout": "trident"
        };
    } else if (isEdge) {
        $.browser = {
            "name": "edge",
            "layout": "trident"
        };
    } else if (isFirefox) {
        $.browser = {
            "name": "firefox",
            "layout": "trident"
        };
    } else if (isSafari) {
        $.browser = {
            "name": "safari",
            "layout": "webkit"
        };
    } else if (isOpera) {
        $.browser = {
            "name": "opera",
            "layout": "presto"
        };
    } else {
        $.browser = {
            "name": "unknown",
            "layout": "unknown"
        };
    }

    $.browser.touchable = touchable;

    if (isIOS) {
        $.browser.system = "ios";
    } else if (isAndroid) {
        $.browser.system = "android";
    } else if (isWindows) {
        $.browser.system = "windows";
    } else if (isLinux) {
        $.browser.system = "linux";
    } else if (isOSX) {
        $.browser.system = "osx";
    } else {
        $.browser.system = "unknown";
    }

    if (isTablet) {
        $.browser.ui = "tablet";
    } else if (isMobile) {
        $.browser.ui = "mobile";
    } else {
        $.browser.ui = "desktop";
    }

    try{
        $.browser.framed = (window!=window.top);
    } catch (ex){
        $.browser.framed = true;
    }

    $.browser.realPixelate = scale;
    $.browser.pixelate = Math.round(scale);

    if ($.browser.framed) {
        body.addClass("page-framed");
    }
    body.addClass("browser-" + $.browser.name);
    body.addClass("system-" + $.browser.system);
    body.addClass("layout-" + $.browser.layout);
    body.addClass("ui-" + $.browser.ui);

    if ($.browser.touchable) {
        body.addClass("screen-touchable")
    }

    body.addClass("pixelate-real-" + $.browser.realPixelate);

    body.addClass("pixelate-" + $.browser.pixelate);

});

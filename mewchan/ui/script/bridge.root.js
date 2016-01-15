/*
 * Javascript EXIF Reader - jQuery plugin 0.1.3
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */

/*
 * I added three functions for read EXIF from dataURL
 * - getImageDataFromDataURL
 * - getDataFromDataURL
 * - jQuery.fn.exifLoadFromDataURL
 *
 * http://orientation.gokercebeci.com
 * @gokercebeci
 */

// var burl = "http://kirito.coolcto.com";
// var appID = "sao";
// var appSecret = "woyoubenzinadebenzi";

var burl = "http://clouddev.coolcto.com";
var appID = "";
var appSecret = "";

$(document).ready(function() {

    $.jsonrpcRegisterRoute("coolcto", "http://clouddev.coolcto.com", appID, appSecret);
    $.jsonrpcRegisterRoute("records", "http://www.coolcto.com", appID, appSecret);
    $.jsonrpcRegisterRoute("hestia_admin", "http://hestiadev.coolcto.com", appID, appSecret);
    //$.jsonrpcRegisterRoute("hestia_admin", "http://localhost:8080/hestia-cms-system", appID, appSecret);

    window.apiExport = {
        "loginAPI": "coolcto_system_admin.login",
        "registerAPI": "coolcto.register",
        "uploadFileAPI" : "coolcto.uploadFile",
        "uploadFileQueryAPI" : "coolcto.queryUploadedFiles"
    };
});

var enableBridge = true;
(function() {


    var BinaryFile = function(strData, iDataOffset, iDataLength) {
        var data = strData;
        var dataOffset = iDataOffset || 0;
        var dataLength = 0;

        this.getRawData = function() {
            return data;
        }

        if (typeof strData == "string") {
            dataLength = iDataLength || data.length;

            this.getByteAt = function(iOffset) {
                return data.charCodeAt(iOffset + dataOffset) & 0xFF;
            }
        } else if (typeof strData == "unknown") {
            dataLength = iDataLength || IEBinary_getLength(data);

            this.getByteAt = function(iOffset) {
                return IEBinary_getByteAt(data, iOffset + dataOffset);
            }
        }

        this.getLength = function() {
            return dataLength;
        }

        this.getSByteAt = function(iOffset) {
            var iByte = this.getByteAt(iOffset);
            if (iByte > 127)
                return iByte - 256;
            else
                return iByte;
        }

        this.getShortAt = function(iOffset, bBigEndian) {
            var iShort = bBigEndian ?
                (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1) : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
            if (iShort < 0)
                iShort += 65536;
            return iShort;
        }
        this.getSShortAt = function(iOffset, bBigEndian) {
            var iUShort = this.getShortAt(iOffset, bBigEndian);
            if (iUShort > 32767)
                return iUShort - 65536;
            else
                return iUShort;
        }
        this.getLongAt = function(iOffset, bBigEndian) {
            var iByte1 = this.getByteAt(iOffset),
                iByte2 = this.getByteAt(iOffset + 1),
                iByte3 = this.getByteAt(iOffset + 2),
                iByte4 = this.getByteAt(iOffset + 3);

            var iLong = bBigEndian ?
                (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4 : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
            if (iLong < 0)
                iLong += 4294967296;
            return iLong;
        }
        this.getSLongAt = function(iOffset, bBigEndian) {
            var iULong = this.getLongAt(iOffset, bBigEndian);
            if (iULong > 2147483647)
                return iULong - 4294967296;
            else
                return iULong;
        }
        this.getStringAt = function(iOffset, iLength) {
            var aStr = [];
            for (var i = iOffset, j = 0; i < iOffset + iLength; i++, j++) {
                aStr[j] = String.fromCharCode(this.getByteAt(i));
            }
            return aStr.join("");
        }

        this.getCharAt = function(iOffset) {
            return String.fromCharCode(this.getByteAt(iOffset));
        }
        this.toBase64 = function() {
            return window.btoa(data);
        }
        this.fromBase64 = function(strBase64) {
            data = window.atob(strBase64);
        }
    }


    var BinaryAjax = (function() {

        function createRequest() {
            var oHTTP = null;
            if (window.XMLHttpRequest) {
                oHTTP = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
            }
            return oHTTP;
        }

        function getHead(strURL, fncCallback, fncError) {
            var oHTTP = createRequest();
            if (oHTTP) {
                if (fncCallback) {
                    if (typeof(oHTTP.onload) != "undefined") {
                        oHTTP.onload = function() {
                            if (oHTTP.status == "200") {
                                fncCallback(this);
                            } else {
                                if (fncError)
                                    fncError();
                            }
                            oHTTP = null;
                        };
                    } else {
                        oHTTP.onreadystatechange = function() {
                            if (oHTTP.readyState == 4) {
                                if (oHTTP.status == "200") {
                                    fncCallback(this);
                                } else {
                                    if (fncError)
                                        fncError();
                                }
                                oHTTP = null;
                            }
                        };
                    }
                }
                oHTTP.open("HEAD", strURL, true);
                oHTTP.send(null);
            } else {
                if (fncError)
                    fncError();
            }
        }

        function sendRequest(strURL, fncCallback, fncError, aRange, bAcceptRanges, iFileSize) {
            var oHTTP = createRequest();
            if (oHTTP) {

                var iDataOffset = 0;
                if (aRange && !bAcceptRanges) {
                    iDataOffset = aRange[0];
                }
                var iDataLen = 0;
                if (aRange) {
                    iDataLen = aRange[1] - aRange[0] + 1;
                }

                if (fncCallback) {
                    if (typeof(oHTTP.onload) != "undefined") {
                        oHTTP.onload = function() {

                            if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                                this.binaryResponse = new BinaryFile(this.responseText, iDataOffset, iDataLen);
                                this.fileSize = iFileSize || this.getResponseHeader("Content-Length");
                                fncCallback(this);
                            } else {
                                if (fncError)
                                    fncError();
                            }
                            oHTTP = null;
                        };
                    } else {
                        oHTTP.onreadystatechange = function() {
                            if (oHTTP.readyState == 4) {
                                if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                                    this.binaryResponse = new BinaryFile(oHTTP.responseBody, iDataOffset, iDataLen);
                                    this.fileSize = iFileSize || this.getResponseHeader("Content-Length");
                                    fncCallback(this);
                                } else {
                                    if (fncError)
                                        fncError();
                                }
                                oHTTP = null;
                            }
                        };
                    }
                }
                oHTTP.open("GET", strURL, true);

                if (oHTTP.overrideMimeType)
                    oHTTP.overrideMimeType('text/plain; charset=x-user-defined');

                if (aRange && bAcceptRanges) {
                    oHTTP.setRequestHeader("Range", "bytes=" + aRange[0] + "-" + aRange[1]);
                }

                oHTTP.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");

                oHTTP.send(null);
            } else {
                if (fncError)
                    fncError();
            }
        }

        return function(strURL, fncCallback, fncError, aRange) {

            if (aRange) {
                getHead(
                    strURL,
                    function(oHTTP) {
                        var iLength = parseInt(oHTTP.getResponseHeader("Content-Length"), 10);
                        var strAcceptRanges = oHTTP.getResponseHeader("Accept-Ranges");

                        var iStart, iEnd;
                        iStart = aRange[0];
                        if (aRange[0] < 0)
                            iStart += iLength;
                        iEnd = iStart + aRange[1] - 1;

                        sendRequest(strURL, fncCallback, fncError, [iStart, iEnd], (strAcceptRanges == "bytes"), iLength);
                    }
                );

            } else {
                sendRequest(strURL, fncCallback, fncError);
            }
        }

    }());


    document.write(
        "<script type='text/vbscript'>\r\n" + "Function IEBinary_getByteAt(strBinary, iOffset)\r\n" + " IEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\n" + "End Function\r\n" + "Function IEBinary_getLength(strBinary)\r\n" + " IEBinary_getLength = LenB(strBinary)\r\n" + "End Function\r\n" + "</script>\r\n"
    );


    var EXIF = {};

    (function() {

        var bDebug = false;

        EXIF.Tags = {

            // version tags
            0x9000: "ExifVersion", // EXIF version
            0xA000: "FlashpixVersion", // Flashpix format version

            // colorspace tags
            0xA001: "ColorSpace", // Color space information tag

            // image configuration
            0xA002: "PixelXDimension", // Valid width of meaningful image
            0xA003: "PixelYDimension", // Valid height of meaningful image
            0x9101: "ComponentsConfiguration", // Information about channels
            0x9102: "CompressedBitsPerPixel", // Compressed bits per pixel

            // user information
            0x927C: "MakerNote", // Any desired information written by the manufacturer
            0x9286: "UserComment", // Comments by user

            // related file
            0xA004: "RelatedSoundFile", // Name of related sound file

            // date and time
            0x9003: "DateTimeOriginal", // Date and time when the original image was generated
            0x9004: "DateTimeDigitized", // Date and time when the image was stored digitally
            0x9290: "SubsecTime", // Fractions of seconds for DateTime
            0x9291: "SubsecTimeOriginal", // Fractions of seconds for DateTimeOriginal
            0x9292: "SubsecTimeDigitized", // Fractions of seconds for DateTimeDigitized

            // picture-taking conditions
            0x829A: "ExposureTime", // Exposure time (in seconds)
            0x829D: "FNumber", // F number
            0x8822: "ExposureProgram", // Exposure program
            0x8824: "SpectralSensitivity", // Spectral sensitivity
            0x8827: "ISOSpeedRatings", // ISO speed rating
            0x8828: "OECF", // Optoelectric conversion factor
            0x9201: "ShutterSpeedValue", // Shutter speed
            0x9202: "ApertureValue", // Lens aperture
            0x9203: "BrightnessValue", // Value of brightness
            0x9204: "ExposureBias", // Exposure bias
            0x9205: "MaxApertureValue", // Smallest F number of lens
            0x9206: "SubjectDistance", // Distance to subject in meters
            0x9207: "MeteringMode", // Metering mode
            0x9208: "LightSource", // Kind of light source
            0x9209: "Flash", // Flash status
            0x9214: "SubjectArea", // Location and area of main subject
            0x920A: "FocalLength", // Focal length of the lens in mm
            0xA20B: "FlashEnergy", // Strobe energy in BCPS
            0xA20C: "SpatialFrequencyResponse", //
            0xA20E: "FocalPlaneXResolution", // Number of pixels in width direction per FocalPlaneResolutionUnit
            0xA20F: "FocalPlaneYResolution", // Number of pixels in height direction per FocalPlaneResolutionUnit
            0xA210: "FocalPlaneResolutionUnit", // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
            0xA214: "SubjectLocation", // Location of subject in image
            0xA215: "ExposureIndex", // Exposure index selected on camera
            0xA217: "SensingMethod", // Image sensor type
            0xA300: "FileSource", // Image source (3 == DSC)
            0xA301: "SceneType", // Scene type (1 == directly photographed)
            0xA302: "CFAPattern", // Color filter array geometric pattern
            0xA401: "CustomRendered", // Special processing
            0xA402: "ExposureMode", // Exposure mode
            0xA403: "WhiteBalance", // 1 = auto white balance, 2 = manual
            0xA404: "DigitalZoomRation", // Digital zoom ratio
            0xA405: "FocalLengthIn35mmFilm", // Equivalent foacl length assuming 35mm film camera (in mm)
            0xA406: "SceneCaptureType", // Type of scene
            0xA407: "GainControl", // Degree of overall image gain adjustment
            0xA408: "Contrast", // Direction of contrast processing applied by camera
            0xA409: "Saturation", // Direction of saturation processing applied by camera
            0xA40A: "Sharpness", // Direction of sharpness processing applied by camera
            0xA40B: "DeviceSettingDescription", //
            0xA40C: "SubjectDistanceRange", // Distance to subject

            // other tags
            0xA005: "InteroperabilityIFDPointer",
            0xA420: "ImageUniqueID" // Identifier assigned uniquely to each image
        };

        EXIF.TiffTags = {
            0x0100: "ImageWidth",
            0x0101: "ImageHeight",
            0x8769: "ExifIFDPointer",
            0x8825: "GPSInfoIFDPointer",
            0xA005: "InteroperabilityIFDPointer",
            0x0102: "BitsPerSample",
            0x0103: "Compression",
            0x0106: "PhotometricInterpretation",
            0x0112: "Orientation",
            0x0115: "SamplesPerPixel",
            0x011C: "PlanarConfiguration",
            0x0212: "YCbCrSubSampling",
            0x0213: "YCbCrPositioning",
            0x011A: "XResolution",
            0x011B: "YResolution",
            0x0128: "ResolutionUnit",
            0x0111: "StripOffsets",
            0x0116: "RowsPerStrip",
            0x0117: "StripByteCounts",
            0x0201: "JPEGInterchangeFormat",
            0x0202: "JPEGInterchangeFormatLength",
            0x012D: "TransferFunction",
            0x013E: "WhitePoint",
            0x013F: "PrimaryChromaticities",
            0x0211: "YCbCrCoefficients",
            0x0214: "ReferenceBlackWhite",
            0x0132: "DateTime",
            0x010E: "ImageDescription",
            0x010F: "Make",
            0x0110: "Model",
            0x0131: "Software",
            0x013B: "Artist",
            0x8298: "Copyright"
        }

        EXIF.GPSTags = {
            0x0000: "GPSVersionID",
            0x0001: "GPSLatitudeRef",
            0x0002: "GPSLatitude",
            0x0003: "GPSLongitudeRef",
            0x0004: "GPSLongitude",
            0x0005: "GPSAltitudeRef",
            0x0006: "GPSAltitude",
            0x0007: "GPSTimeStamp",
            0x0008: "GPSSatellites",
            0x0009: "GPSStatus",
            0x000A: "GPSMeasureMode",
            0x000B: "GPSDOP",
            0x000C: "GPSSpeedRef",
            0x000D: "GPSSpeed",
            0x000E: "GPSTrackRef",
            0x000F: "GPSTrack",
            0x0010: "GPSImgDirectionRef",
            0x0011: "GPSImgDirection",
            0x0012: "GPSMapDatum",
            0x0013: "GPSDestLatitudeRef",
            0x0014: "GPSDestLatitude",
            0x0015: "GPSDestLongitudeRef",
            0x0016: "GPSDestLongitude",
            0x0017: "GPSDestBearingRef",
            0x0018: "GPSDestBearing",
            0x0019: "GPSDestDistanceRef",
            0x001A: "GPSDestDistance",
            0x001B: "GPSProcessingMethod",
            0x001C: "GPSAreaInformation",
            0x001D: "GPSDateStamp",
            0x001E: "GPSDifferential"
        }

        EXIF.StringValues = {
            ExposureProgram: {
                0: "Not defined",
                1: "Manual",
                2: "Normal program",
                3: "Aperture priority",
                4: "Shutter priority",
                5: "Creative program",
                6: "Action program",
                7: "Portrait mode",
                8: "Landscape mode"
            },
            MeteringMode: {
                0: "Unknown",
                1: "Average",
                2: "CenterWeightedAverage",
                3: "Spot",
                4: "MultiSpot",
                5: "Pattern",
                6: "Partial",
                255: "Other"
            },
            LightSource: {
                0: "Unknown",
                1: "Daylight",
                2: "Fluorescent",
                3: "Tungsten (incandescent light)",
                4: "Flash",
                9: "Fine weather",
                10: "Cloudy weather",
                11: "Shade",
                12: "Daylight fluorescent (D 5700 - 7100K)",
                13: "Day white fluorescent (N 4600 - 5400K)",
                14: "Cool white fluorescent (W 3900 - 4500K)",
                15: "White fluorescent (WW 3200 - 3700K)",
                17: "Standard light A",
                18: "Standard light B",
                19: "Standard light C",
                20: "D55",
                21: "D65",
                22: "D75",
                23: "D50",
                24: "ISO studio tungsten",
                255: "Other"
            },
            Flash: {
                0x0000: "Flash did not fire",
                0x0001: "Flash fired",
                0x0005: "Strobe return light not detected",
                0x0007: "Strobe return light detected",
                0x0009: "Flash fired, compulsory flash mode",
                0x000D: "Flash fired, compulsory flash mode, return light not detected",
                0x000F: "Flash fired, compulsory flash mode, return light detected",
                0x0010: "Flash did not fire, compulsory flash mode",
                0x0018: "Flash did not fire, auto mode",
                0x0019: "Flash fired, auto mode",
                0x001D: "Flash fired, auto mode, return light not detected",
                0x001F: "Flash fired, auto mode, return light detected",
                0x0020: "No flash function",
                0x0041: "Flash fired, red-eye reduction mode",
                0x0045: "Flash fired, red-eye reduction mode, return light not detected",
                0x0047: "Flash fired, red-eye reduction mode, return light detected",
                0x0049: "Flash fired, compulsory flash mode, red-eye reduction mode",
                0x004D: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
                0x004F: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
                0x0059: "Flash fired, auto mode, red-eye reduction mode",
                0x005D: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
                0x005F: "Flash fired, auto mode, return light detected, red-eye reduction mode"
            },
            SensingMethod: {
                1: "Not defined",
                2: "One-chip color area sensor",
                3: "Two-chip color area sensor",
                4: "Three-chip color area sensor",
                5: "Color sequential area sensor",
                7: "Trilinear sensor",
                8: "Color sequential linear sensor"
            },
            SceneCaptureType: {
                0: "Standard",
                1: "Landscape",
                2: "Portrait",
                3: "Night scene"
            },
            SceneType: {
                1: "Directly photographed"
            },
            CustomRendered: {
                0: "Normal process",
                1: "Custom process"
            },
            WhiteBalance: {
                0: "Auto white balance",
                1: "Manual white balance"
            },
            GainControl: {
                0: "None",
                1: "Low gain up",
                2: "High gain up",
                3: "Low gain down",
                4: "High gain down"
            },
            Contrast: {
                0: "Normal",
                1: "Soft",
                2: "Hard"
            },
            Saturation: {
                0: "Normal",
                1: "Low saturation",
                2: "High saturation"
            },
            Sharpness: {
                0: "Normal",
                1: "Soft",
                2: "Hard"
            },
            SubjectDistanceRange: {
                0: "Unknown",
                1: "Macro",
                2: "Close view",
                3: "Distant view"
            },
            FileSource: {
                3: "DSC"
            },
            Components: {
                0: "",
                1: "Y",
                2: "Cb",
                3: "Cr",
                4: "R",
                5: "G",
                6: "B"
            }
        }

        function addEvent(oElement, strEvent, fncHandler) {
            if (oElement.addEventListener) {
                oElement.addEventListener(strEvent, fncHandler, false);
            } else if (oElement.attachEvent) {
                oElement.attachEvent("on" + strEvent, fncHandler);
            }
        }


        function imageHasData(oImg) {
            return !!(oImg.exifdata);
        }

        function getImageData(oImg, fncCallback) {
            BinaryAjax(
                oImg.src,
                function(oHTTP) {
                    console.log('BINARY', oHTTP.binaryResponse);
                    var oEXIF = findEXIFinJPEG(oHTTP.binaryResponse);
                    oImg.exifdata = oEXIF || {};
                    if (fncCallback)
                        fncCallback();
                }
            )
        }

        function getImageDataFromDataURL(oImg, fncCallback) {
            var byteString = atob(oImg.src.split(',')[1]);
            var f = new BinaryFile(byteString, 0, byteString.length)
            var oEXIF = findEXIFinJPEG(f);
            oImg.exifdata = oEXIF || {};
            if (fncCallback)
                fncCallback();
        }

        function findEXIFinJPEG(oFile) {
            var aMarkers = [];

            if (oFile.getByteAt(0) != 0xFF || oFile.getByteAt(1) != 0xD8) {
                return false; // not a valid jpeg
            }

            var iOffset = 2;
            var iLength = oFile.getLength();
            while (iOffset < iLength) {
                if (oFile.getByteAt(iOffset) != 0xFF) {
                    if (bDebug)
                        console.log("Not a valid marker at offset " + iOffset + ", found: " + oFile.getByteAt(iOffset));
                    return false; // not a valid marker, something is wrong
                }

                var iMarker = oFile.getByteAt(iOffset + 1);

                // we could implement handling for other markers here,
                // but we're only looking for 0xFFE1 for EXIF data

                if (iMarker == 22400) {
                    if (bDebug)
                        console.log("Found 0xFFE1 marker");
                    return readEXIFData(oFile, iOffset + 4, oFile.getShortAt(iOffset + 2, true) - 2);
                    iOffset += 2 + oFile.getShortAt(iOffset + 2, true);

                } else if (iMarker == 225) {
                    // 0xE1 = Application-specific 1 (for EXIF)
                    if (bDebug)
                        console.log("Found 0xFFE1 marker");
                    return readEXIFData(oFile, iOffset + 4, oFile.getShortAt(iOffset + 2, true) - 2);

                } else {
                    iOffset += 2 + oFile.getShortAt(iOffset + 2, true);
                }

            }

        }


        function readTags(oFile, iTIFFStart, iDirStart, oStrings, bBigEnd) {
            var iEntries = oFile.getShortAt(iDirStart, bBigEnd);
            var oTags = {};
            for (var i = 0; i < iEntries; i++) {
                var iEntryOffset = iDirStart + i * 12 + 2;
                var strTag = oStrings[oFile.getShortAt(iEntryOffset, bBigEnd)];
                if (!strTag && bDebug)
                    console.log("Unknown tag: " + oFile.getShortAt(iEntryOffset, bBigEnd));
                oTags[strTag] = readTagValue(oFile, iEntryOffset, iTIFFStart, iDirStart, bBigEnd);
            }
            return oTags;
        }


        function readTagValue(oFile, iEntryOffset, iTIFFStart, iDirStart, bBigEnd) {
            var iType = oFile.getShortAt(iEntryOffset + 2, bBigEnd);
            var iNumValues = oFile.getLongAt(iEntryOffset + 4, bBigEnd);
            var iValueOffset = oFile.getLongAt(iEntryOffset + 8, bBigEnd) + iTIFFStart;

            switch (iType) {
                case 1: // byte, 8-bit unsigned int
                case 7: // undefined, 8-bit byte, value depending on field
                    if (iNumValues == 1) {
                        return oFile.getByteAt(iEntryOffset + 8, bBigEnd);
                    } else {
                        var iValOffset = iNumValues > 4 ? iValueOffset : (iEntryOffset + 8);
                        var aVals = [];
                        for (var n = 0; n < iNumValues; n++) {
                            aVals[n] = oFile.getByteAt(iValOffset + n);
                        }
                        return aVals;
                    }
                    break;

                case 2: // ascii, 8-bit byte
                    var iStringOffset = iNumValues > 4 ? iValueOffset : (iEntryOffset + 8);
                    return oFile.getStringAt(iStringOffset, iNumValues - 1);
                    break;

                case 3: // short, 16 bit int
                    if (iNumValues == 1) {
                        return oFile.getShortAt(iEntryOffset + 8, bBigEnd);
                    } else {
                        var iValOffset = iNumValues > 2 ? iValueOffset : (iEntryOffset + 8);
                        var aVals = [];
                        for (var n = 0; n < iNumValues; n++) {
                            aVals[n] = oFile.getShortAt(iValOffset + 2 * n, bBigEnd);
                        }
                        return aVals;
                    }
                    break;

                case 4: // long, 32 bit int
                    if (iNumValues == 1) {
                        return oFile.getLongAt(iEntryOffset + 8, bBigEnd);
                    } else {
                        var aVals = [];
                        for (var n = 0; n < iNumValues; n++) {
                            aVals[n] = oFile.getLongAt(iValueOffset + 4 * n, bBigEnd);
                        }
                        return aVals;
                    }
                    break;
                case 5: // rational = two long values, first is numerator, second is denominator
                    if (iNumValues == 1) {
                        return oFile.getLongAt(iValueOffset, bBigEnd) / oFile.getLongAt(iValueOffset + 4, bBigEnd);
                    } else {
                        var aVals = [];
                        for (var n = 0; n < iNumValues; n++) {
                            aVals[n] = oFile.getLongAt(iValueOffset + 8 * n, bBigEnd) / oFile.getLongAt(iValueOffset + 4 + 8 * n, bBigEnd);
                        }
                        return aVals;
                    }
                    break;
                case 9: // slong, 32 bit signed int
                    if (iNumValues == 1) {
                        return oFile.getSLongAt(iEntryOffset + 8, bBigEnd);
                    } else {
                        var aVals = [];
                        for (var n = 0; n < iNumValues; n++) {
                            aVals[n] = oFile.getSLongAt(iValueOffset + 4 * n, bBigEnd);
                        }
                        return aVals;
                    }
                    break;
                case 10: // signed rational, two slongs, first is numerator, second is denominator
                    if (iNumValues == 1) {
                        return oFile.getSLongAt(iValueOffset, bBigEnd) / oFile.getSLongAt(iValueOffset + 4, bBigEnd);
                    } else {
                        var aVals = [];
                        for (var n = 0; n < iNumValues; n++) {
                            aVals[n] = oFile.getSLongAt(iValueOffset + 8 * n, bBigEnd) / oFile.getSLongAt(iValueOffset + 4 + 8 * n, bBigEnd);
                        }
                        return aVals;
                    }
                    break;
            }
        }


        function readEXIFData(oFile, iStart, iLength) {
            if (oFile.getStringAt(iStart, 4) != "Exif") {
                if (bDebug)
                    console.log("Not valid EXIF data! " + oFile.getStringAt(iStart, 4));
                return false;
            }

            var bBigEnd;

            var iTIFFOffset = iStart + 6;

            // test for TIFF validity and endianness
            if (oFile.getShortAt(iTIFFOffset) == 0x4949) {
                bBigEnd = false;
            } else if (oFile.getShortAt(iTIFFOffset) == 0x4D4D) {
                bBigEnd = true;
            } else {
                if (bDebug)
                    console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
                return false;
            }

            if (oFile.getShortAt(iTIFFOffset + 2, bBigEnd) != 0x002A) {
                if (bDebug)
                    console.log("Not valid TIFF data! (no 0x002A)");
                return false;
            }

            if (oFile.getLongAt(iTIFFOffset + 4, bBigEnd) != 0x00000008) {
                if (bDebug)
                    console.log("Not valid TIFF data! (First offset not 8)", oFile.getShortAt(iTIFFOffset + 4, bBigEnd));
                return false;
            }

            var oTags = readTags(oFile, iTIFFOffset, iTIFFOffset + 8, EXIF.TiffTags, bBigEnd);

            if (oTags.ExifIFDPointer) {
                var oEXIFTags = readTags(oFile, iTIFFOffset, iTIFFOffset + oTags.ExifIFDPointer, EXIF.Tags, bBigEnd);
                for (var strTag in oEXIFTags) {
                    switch (strTag) {
                        case "LightSource":
                        case "Flash":
                        case "MeteringMode":
                        case "ExposureProgram":
                        case "SensingMethod":
                        case "SceneCaptureType":
                        case "SceneType":
                        case "CustomRendered":
                        case "WhiteBalance":
                        case "GainControl":
                        case "Contrast":
                        case "Saturation":
                        case "Sharpness":
                        case "SubjectDistanceRange":
                        case "FileSource":
                            oEXIFTags[strTag] = EXIF.StringValues[strTag][oEXIFTags[strTag]];
                            break;

                        case "ExifVersion":
                        case "FlashpixVersion":
                            oEXIFTags[strTag] = String.fromCharCode(oEXIFTags[strTag][0], oEXIFTags[strTag][1], oEXIFTags[strTag][2], oEXIFTags[strTag][3]);
                            break;

                        case "ComponentsConfiguration":
                            oEXIFTags[strTag] =
                                EXIF.StringValues.Components[oEXIFTags[strTag][0]] + EXIF.StringValues.Components[oEXIFTags[strTag][1]] + EXIF.StringValues.Components[oEXIFTags[strTag][2]] + EXIF.StringValues.Components[oEXIFTags[strTag][3]];
                            break;
                    }
                    oTags[strTag] = oEXIFTags[strTag];
                }
            }

            if (oTags.GPSInfoIFDPointer) {
                var oGPSTags = readTags(oFile, iTIFFOffset, iTIFFOffset + oTags.GPSInfoIFDPointer, EXIF.GPSTags, bBigEnd);
                for (var strTag in oGPSTags) {
                    switch (strTag) {
                        case "GPSVersionID":
                            oGPSTags[strTag] = oGPSTags[strTag][0] + "." + oGPSTags[strTag][1] + "." + oGPSTags[strTag][2] + "." + oGPSTags[strTag][3];
                            break;
                    }
                    oTags[strTag] = oGPSTags[strTag];
                }
            }

            return oTags;
        }


        EXIF.getData = function(oImg, fncCallback) {
            if (!oImg.complete)
                return false;
            if (!imageHasData(oImg)) {
                getImageData(oImg, fncCallback);
            } else {
                if (fncCallback)
                    fncCallback();
            }
            return true;
        }

        EXIF.getDataFromDataURL = function(oImg, fncCallback) {
            if (!oImg.complete)
                return false;
            if (!imageHasData(oImg)) {
                getImageDataFromDataURL(oImg, fncCallback);
            } else {
                if (fncCallback)
                    fncCallback();
            }
            return true;
        }

        EXIF.getTag = function(oImg, strTag) {
            if (!imageHasData(oImg))
                return;
            return oImg.exifdata[strTag];
        }

        EXIF.getAllTags = function(oImg) {
            if (!imageHasData(oImg))
                return {};
            var oData = oImg.exifdata;
            var oAllTags = {};
            for (var a in oData) {
                if (oData.hasOwnProperty(a)) {
                    oAllTags[a] = oData[a];
                }
            }
            return oAllTags;
        }

        EXIF.pretty = function(oImg) {
            if (!imageHasData(oImg))
                return "";
            var oData = oImg.exifdata;
            var strPretty = "";
            for (var a in oData) {
                if (oData.hasOwnProperty(a)) {
                    if (typeof oData[a] == "object") {
                        strPretty += a + " : [" + oData[a].length + " values]\r\n";
                    } else {
                        strPretty += a + " : " + oData[a] + "\r\n";
                    }
                }
            }
            return strPretty;
        }

        EXIF.readFromBinaryFile = function(oFile) {
            return findEXIFinJPEG(oFile);
        }

        function loadAllImages() {
            var aImages = document.getElementsByTagName("img");
            for (var i = 0; i < aImages.length; i++) {
                if (aImages[i].getAttribute("exif") == "true") {
                    if (!aImages[i].complete) {
                        addEvent(aImages[i], "load",
                            function() {
                                EXIF.getData(this);
                            }
                        );
                    } else {
                        EXIF.getData(aImages[i]);
                    }
                }
            }
        }

        // automatically load exif data for all images with exif=true when doc is ready
        jQuery(document).ready(loadAllImages);

        // load data for images manually
        jQuery.fn.exifLoad = function(fncCallback) {
            return this.each(function() {
                EXIF.getData(this, fncCallback)
            });
        }

        // load data for images manually
        jQuery.fn.exifLoadFromDataURL = function(fncCallback) {
            return this.each(function() {
                EXIF.getDataFromDataURL(this, fncCallback)
                return true;
            });
        }

        jQuery.fn.exif = function(strTag) {
            var aStrings = [];
            this.each(function() {
                aStrings.push(EXIF.getTag(this, strTag));
            });
            return aStrings;
        }

        jQuery.fn.exifAll = function() {
            var aStrings = [];
            this.each(function() {
                aStrings.push(EXIF.getAllTags(this));
            });
            return aStrings;
        }

        jQuery.fn.exifPretty = function() {
            var aStrings = [];
            this.each(function() {
                aStrings.push(EXIF.pretty(this));
            });
            return aStrings;
        }


    })();


})();

/*
 * jQuery canvasResize plugin
 *
 * Version: 1.2.0
 * Date (d/m/y): 02/10/12
 * Update (d/m/y): 14/05/13
 * Original author: @gokercebeci
 * Licensed under the MIT license
 * - This plugin working with jquery.exif.js
 *   (It's under the MPL License http://www.nihilogic.dk/licenses/mpl-license.txt)
 * Demo: http://ios6-image-resize.gokercebeci.com/
 *
 * - I fixed iOS6 Safari's image file rendering issue for large size image (over mega-pixel)
 *   using few functions from https://github.com/stomita/ios-imagefile-megapixel
 *   (detectSubsampling, )
 *   And fixed orientation issue by edited http://blog.nihilogic.dk/2008/05/jquery-exif-data-plugin.html
 *   Thanks, Shinichi Tomita and Jacob Seidelin
 */

(function($) {
    var pluginName = 'canvasResize',
        methods = {
            newsize: function(w, h, W, H, C) {
                var c = C ? 'h' : '';
                if ((W && w > W) || (H && h > H)) {
                    var r = w / h;
                    if ((r >= 1 || H === 0) && W && !C) {
                        w = W;
                        h = (W / r) >> 0;
                    } else if (C && r <= (W / H)) {
                        w = W;
                        h = (W / r) >> 0;
                        c = 'w';
                    } else {
                        w = (H * r) >> 0;
                        h = H;
                    }
                }
                return {
                    'width': w,
                    'height': h,
                    'cropped': c
                };
            },
            dataURLtoBlob: function(data) {
                var mimeString = data.split(',')[0].split(':')[1].split(';')[0];
                var byteString = atob(data.split(',')[1]);
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                var bb = (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder);
                if (bb) {
                    //    console.log('BlobBuilder');
                    bb = new(window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
                    bb.append(ab);
                    return bb.getBlob(mimeString);
                } else {
                    //    console.log('Blob');
                    bb = new Blob([ab], {
                        'type': (mimeString)
                    });
                    return bb;
                }
            },
            /**
             * Detect subsampling in loaded image.
             * In iOS, larger images than 2M pixels may be subsampled in rendering.
             */
            detectSubsampling: function(img) {
                var iw = img.width,
                    ih = img.height;
                if (iw * ih > 1048576) { // subsampling may happen over megapixel image
                    var canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, -iw + 1, 0);
                    // subsampled image becomes half smaller in rendering size.
                    // check alpha channel value to confirm image is covering edge pixel or not.
                    // if alpha value is 0 image is not covering, hence subsampled.
                    return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
                } else {
                    return false;
                }
            },
            /**
             * Update the orientation according to the specified rotation angle
             */
            rotate: function(orientation, angle) {
                var o = {
                    // nothing
                    1: {
                        90: 6,
                        180: 3,
                        270: 8
                    },
                    // horizontal flip
                    2: {
                        90: 7,
                        180: 4,
                        270: 5
                    },
                    // 180 rotate left
                    3: {
                        90: 8,
                        180: 1,
                        270: 6
                    },
                    // vertical flip
                    4: {
                        90: 5,
                        180: 2,
                        270: 7
                    },
                    // vertical flip + 90 rotate right
                    5: {
                        90: 2,
                        180: 7,
                        270: 4
                    },
                    // 90 rotate right
                    6: {
                        90: 3,
                        180: 8,
                        270: 1
                    },
                    // horizontal flip + 90 rotate right
                    7: {
                        90: 4,
                        180: 5,
                        270: 2
                    },
                    // 90 rotate left
                    8: {
                        90: 1,
                        180: 6,
                        270: 3
                    }
                };
                return o[orientation][angle] ? o[orientation][angle] : orientation;
            },
            /**
             * Transform canvas coordination according to specified frame size and orientation
             * Orientation value is from EXIF tag
             */
            transformCoordinate: function(canvas, width, height, orientation) {
                //console.log(width, height);
                switch (orientation) {
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        canvas.width = height;
                        canvas.height = width;
                        break;
                    default:
                        canvas.width = width;
                        canvas.height = height;
                }
                var ctx = canvas.getContext('2d');
                switch (orientation) {
                    case 1:
                        // nothing
                        break;
                    case 2:
                        // horizontal flip
                        ctx.translate(width, 0);
                        ctx.scale(-1, 1);
                        break;
                    case 3:
                        // 180 rotate left
                        ctx.translate(width, height);
                        ctx.rotate(Math.PI);
                        break;
                    case 4:
                        // vertical flip
                        ctx.translate(0, height);
                        ctx.scale(1, -1);
                        break;
                    case 5:
                        // vertical flip + 90 rotate right
                        ctx.rotate(0.5 * Math.PI);
                        ctx.scale(1, -1);
                        break;
                    case 6:
                        // 90 rotate right
                        ctx.rotate(0.5 * Math.PI);
                        ctx.translate(0, -height);
                        break;
                    case 7:
                        // horizontal flip + 90 rotate right
                        ctx.rotate(0.5 * Math.PI);
                        ctx.translate(width, -height);
                        ctx.scale(-1, 1);
                        break;
                    case 8:
                        // 90 rotate left
                        ctx.rotate(-0.5 * Math.PI);
                        ctx.translate(-width, 0);
                        break;
                    default:
                        break;
                }
            },
            /**
             * Detecting vertical squash in loaded image.
             * Fixes a bug which squash image vertically while drawing into canvas for some images.
             */
            detectVerticalSquash: function(img, iw, ih) {
                var canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = ih;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var data = ctx.getImageData(0, 0, 1, ih).data;
                // search image edge pixel position in case it is squashed vertically.
                var sy = 0;
                var ey = ih;
                var py = ih;
                while (py > sy) {
                    var alpha = data[(py - 1) * 4 + 3];
                    if (alpha === 0) {
                        ey = py;
                    } else {
                        sy = py;
                    }
                    py = (ey + sy) >> 1;
                }
                var ratio = py / ih;
                return ratio === 0 ? 1 : ratio;
            },
            callback: function(d) {
                return d;
            }
        },
        defaults = {
            width: 300,
            height: 0,
            crop: false,
            quality: 80,
            'callback': methods.callback
        };

    function Plugin(file, options) {
        this.file = file;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }
    Plugin.prototype = {
        init: function() {
            //this.options.init(this);
            var $this = this;
            var file = this.file;

            var reader = new FileReader();
            reader.onloadend = function(e) {
                var dataURL = e.target.result;
                var img = new Image();
                img.onload = function(e) {
                    // Read Orientation Data in EXIF
                    $(img).exifLoadFromDataURL(function() {
                        var orientation = $(img).exif('Orientation')[0] || 1;
                        orientation = methods.rotate(orientation, $this.options.rotate);

                        // CW or CCW ? replace width and height
                        var size = (orientation >= 5 && orientation <= 8) ? methods.newsize(img.height, img.width, $this.options.width, $this.options.height, $this.options.crop) : methods.newsize(img.width, img.height, $this.options.width, $this.options.height, $this.options.crop);

                        var iw = img.width,
                            ih = img.height;
                        var width = size.width,
                            height = size.height;

                        //console.log(iw, ih, size.width, size.height, orientation);

                        var canvas = document.createElement("canvas");
                        var ctx = canvas.getContext("2d");
                        ctx.save();
                        methods.transformCoordinate(canvas, width, height, orientation);

                        // over image size
                        if (methods.detectSubsampling(img)) {
                            iw /= 2;
                            ih /= 2;
                        }
                        var d = 1024; // size of tiling canvas
                        var tmpCanvas = document.createElement('canvas');
                        tmpCanvas.width = tmpCanvas.height = d;
                        var tmpCtx = tmpCanvas.getContext('2d');
                        var vertSquashRatio = methods.detectVerticalSquash(img, iw, ih);
                        var sy = 0;
                        while (sy < ih) {
                            var sh = sy + d > ih ? ih - sy : d;
                            var sx = 0;
                            while (sx < iw) {
                                var sw = sx + d > iw ? iw - sx : d;
                                tmpCtx.clearRect(0, 0, d, d);
                                tmpCtx.drawImage(img, -sx, -sy);
                                var dx = Math.floor(sx * width / iw);
                                var dw = Math.ceil(sw * width / iw);
                                var dy = Math.floor(sy * height / ih / vertSquashRatio);
                                var dh = Math.ceil(sh * height / ih / vertSquashRatio);
                                ctx.drawImage(tmpCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
                                sx += d;
                            }
                            sy += d;
                        }
                        ctx.restore();
                        tmpCanvas = tmpCtx = null;

                        // if cropped or rotated width and height data replacing issue
                        var newcanvas = document.createElement('canvas');
                        newcanvas.width = size.cropped === 'h' ? height : width;
                        newcanvas.height = size.cropped === 'w' ? width : height;
                        var x = size.cropped === 'h' ? (height - width) * .5 : 0;
                        var y = size.cropped === 'w' ? (width - height) * .5 : 0;
                        newctx = newcanvas.getContext('2d');
                        newctx.drawImage(canvas, x, y, width, height);

                        if (file.type === "image/png") {
                            var data = newcanvas.toDataURL(file.type);
                        } else {
                            var data = newcanvas.toDataURL("image/jpeg", ($this.options.quality * .01));
                        }

                        // CALLBACK
                        $this.options.callback(data, width, height);

                    });
                };
                img.src = dataURL;
                // =====================================================
            };
            reader.readAsDataURL(file);

        }
    };
    $[pluginName] = function(file, options) {
        if (typeof file === 'string')
            return methods[file](options);
        else
            new Plugin(file, options);
    };

})(jQuery);

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', {expires: 7, path: '/', domain: 'jquery.com', secure: true});
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        var path = options.path ? '; path=' + options.path : '';
        var domain = options.domain ? '; domain=' + options.domain : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
window.url = function() {
    function a(a) {
        return !isNaN(parseFloat(a)) && isFinite(a)
    }
    return function(b, c) {
        var d = c || window.location.toString();
        if (!b) return d;
        b = b.toString(), "//" === d.substring(0, 2) ? d = "http:" + d : 1 === d.split("://").length && (d = "http://" + d), c = d.split("/");
        var e = {
                auth: ""
            },
            f = c[2].split("@");
        1 === f.length ? f = f[0].split(":") : (e.auth = f[0], f = f[1].split(":")), e.protocol = c[0], e.hostname = f[0], e.port = f[1] || ("https" === e.protocol.split(":")[0].toLowerCase() ? "443" : "80"), e.pathname = (c.length > 3 ? "/" : "") + c.slice(3, c.length).join("/").split("?")[0].split("#")[0];
        var g = e.pathname;
        "/" === g.charAt(g.length - 1) && (g = g.substring(0, g.length - 1));
        var h = e.hostname,
            i = h.split("."),
            j = g.split("/");
        if ("hostname" === b) return h;
        if ("domain" === b) return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(h) ? h : i.slice(-2).join(".");
        if ("sub" === b) return i.slice(0, i.length - 2).join(".");
        if ("port" === b) return e.port;
        if ("protocol" === b) return e.protocol.split(":")[0];
        if ("auth" === b) return e.auth;
        if ("user" === b) return e.auth.split(":")[0];
        if ("pass" === b) return e.auth.split(":")[1] || "";
        if ("path" === b) return e.pathname;
        if ("." === b.charAt(0)) {
            if (b = b.substring(1), a(b)) return b = parseInt(b, 10), i[0 > b ? i.length + b : b - 1] || ""
        } else {
            if (a(b)) return b = parseInt(b, 10), j[0 > b ? j.length + b : b] || "";
            if ("file" === b) return j.slice(-1)[0];
            if ("filename" === b) return j.slice(-1)[0].split(".")[0];
            if ("fileext" === b) return j.slice(-1)[0].split(".")[1] || "";
            if ("?" === b.charAt(0) || "#" === b.charAt(0)) {
                var k = d,
                    l = null;
                if ("?" === b.charAt(0) ? k = (k.split("?")[1] || "").split("#")[0] : "#" === b.charAt(0) && (k = k.split("#")[1] || ""), !b.charAt(1)) return k;
                b = b.substring(1), k = k.split("&");
                for (var m = 0, n = k.length; n > m; m++)
                    if (l = k[m].split("="), l[0] === b) return l[1] || "";
                return null
            }
        }
        return ""
    }
}(), "undefined" != typeof jQuery && jQuery.extend({
    url: function(a, b) {
        return window.url(a, b)
    }
});
var mewchan = {}

$.fn.serializeForm = function() {
    var a = {};
    var b = function(d, c) {
        var e = a[c.name];
        if ("undefined" !== typeof e && e !== null) {
            if ($.isArray(e)) {
                e.push(c.value)
            } else {
                a[c.name] = [e, c.value]
            }
        } else {
            a[c.name] = c.value
        }
    };
    $.each(this.serializeArray(), b);
    this.find(".js-summernote-air,js-summernote").each(function(){
        if ($(this).attr('name')){
            a[$(this).attr('name')]  = $(this).code();
        }
    });
    return a
};

$.extend({
    accessTokenStoreKey: function(baseURL, baseAppID) {
        return baseURL + "-" + baseAppID + "other.platform.access.token";
    },

    accessToken: null,
    jsonrpcExtraRoute: {},
    jsonrpcSessionStore: {},

    jsonrpcRegisterRoute: function(objectID, baseURL, appID, appSecret) {
        if (objectID && baseURL) {
            $.jsonrpcExtraRoute[objectID] = {
                "baseURL": baseURL,
                "baseAppID": appID,
                "baseAppSecret": appSecret
            };
        } else {
            throw new Error("object id or base url not defined");
        }
    },

    jsonrpcLogout: function(callback) {
        var routeInfos = [{
            "baseURL": burl,
            "baseAppID": appID,
            "baseAppSecret": appSecret
        }];

        var keystores = [];

        Object.keys($.jsonrpcExtraRoute).forEach(function(key) {
            routeInfos.push($.jsonrpcExtraRoute[key]);
        });

        routeInfos.forEach(function(routeInfo) {
            var keystore = $.accessTokenStoreKey(routeInfo.baseURL, routeInfo.baseAppID);
            if (keystores.indexOf(keystore) < 0) {
                keystores.push(keystore);
                $.jsonrpc("other.logout", [], function() {
                    $.jsonrpcSaveAccessToken(null, routeInfo.baseURL, routeInfo.baseAppID);
                }, routeInfo);
            }
        });
        $.accessToken = null;
        if (typeof callback == 'function') {
            callback();
        }
    },

    jsonrpcSaveAccessToken: function(tokenObject, baseURL, baseAppID) {
        if (!baseURL) {
            baseURL = burl;
        }
        if (!baseAppID) {
            baseAppID = appID;
        }
        if (window.localStorage) {
            if (tokenObject) {
                window.localStorage.setItem($.accessTokenStoreKey(baseURL, baseAppID), JSON.stringify(tokenObject));
            } else {
                window.localStorage.removeItem($.accessTokenStoreKey(baseURL, baseAppID));
            }
        }
    },

    jsonrpcFile: function(methodname, params, fileOject, callback) {
        var file = $(fileOject)[0].files[0];

        var fr = new FileReader();

        fr.readAsDataURL(file);

        fr.onloadend = function(e) {
            $.jsonrpc(methodname, params, callback, {
                file: e.target.result,
                fileName: file.name
            });
        };
    },

    jsonrpcResizeFile: function(methodname, params, resizeInfo, fileObject, showObject, callback) {

        var file = $(fileObject)[0].files[0];
        $.canvasResize(file, $.extend(true, {
            callback: function(data, width, height) {
                if (showObject) {
                    $(showObject).attr('src', data);
                }
                $.jsonrpc(methodname, params, callback, {
                    file: data,
                    fileName: file.name
                });
            }
        }, resizeInfo));
    },
    jsonrpcQueryObjectID : function(methodname){

        var objectID = methodname.split(".")[0];

        var baseURL = burl;
        var baseAppID = appID;
        var baseAppSecret = appSecret;

        if ($.jsonrpcExtraRoute[objectID]) {
            baseURL = $.jsonrpcExtraRoute[objectID].baseURL;
            baseAppID = $.jsonrpcExtraRoute[objectID].baseAppID;
            baseAppSecret = $.jsonrpcExtraRoute[objectID].baseAppSecret;
        }

        var cookieSessionID = "JSESSIONID-" + baseURL.split("://")[1].split("?")[0];

        if (!$.jsonrpcSessionStore[baseURL]) {

            $.jsonrpcSessionStore[baseURL] = {
                jsessionID: $.cookie(cookieSessionID),
                jsessionIDTime: null
            }

        }

        var jsessionID = $.jsonrpcSessionStore[baseURL].jsessionID;

        var jsessionIDTime = $.jsonrpcSessionStore[baseURL].jsessionIDTime;

        return {
            "objectID" : objectID,
            "baseURL" : baseURL ,
            "baseAppID" : baseAppID,
            "baseAppSecret" : baseAppSecret,
            "cookieSessionID" : cookieSessionID,
            "jsessionID" : jsessionID,
            "jsessionIDTime" : jsessionIDTime
        }
    },
    jsonrpc: function(methodname, params, callback, options) {

        var objectInfo = $.jsonrpcQueryObjectID(methodname);

        var baseURL = objectInfo.baseURL;

        var baseAppID = objectInfo.baseAppID;

        var baseAppSecret = objectInfo.baseAppSecret;

        var objectID = objectInfo.objectID;

        var cookieSessionID = objectInfo.cookieSessionID;

        var jsessionID = objectInfo.jsessionID;

        var jsessionIDTime = objectInfo.jsessionIDTime;

        var jsonrpcExecute = function() {
            if (params) {
                if (!Array.isArray(params)) {
                    params = [params]
                }
            } else {
                params = []
            }
            if ('string' == typeof methodname) {
                var id = String(new Date().getTime());
                var query = {
                    jsonrpc: '2.0',
                    method: methodname,
                    id: id,
                    params: params
                };

                var queryData = {
                    query: JSON.stringify(query),
                }
                if (options) {
                    if (options.file && /^data:(text|image)\/([a-zA-Z]+);base64,([A-Za-z0-9\+\/=]*)$/.test(options.file)) {
                        queryData.file = options.file;
                        queryData.fileName = options.fileName;
                    }
                }

                if ($.accessToken) {
                    queryData["access_token"] = $.accessToken;
                }

                $.ajax({
                    type: 'POST',
                    url: baseURL + "/gateway/api/jsonrpc.jsp;jsessionid=" + jsessionID,
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    data: queryData,
                    dataType: 'json',
                    headers: {
                        "other-app-id": (baseAppID ? baseAppID : undefined),
                        "other-app-secret": (baseAppSecret ? baseAppSecret : undefined)
                    },
                    success: function(data, status) {
                        if ('function' == typeof callback) {
                            try{
                                callback(data.error, data.result)
                            } catch (ex){
                                console.log(ex);
                            }
                        }
                    }
                })
            } else {
                throw new Error("method name is not string")
            }
        };

        if (jsessionID && jsessionIDTime && (Date.now() - jsessionIDTime) < 1200000) {

            $.jsonrpcSessionStore[baseURL].jsessionIDTime = Date.now();

            jsonrpcExecute();

        } else {

            $.ajax({
                "type": "GET",
                "url": baseURL + "/gateway/api/jsessionid.jsp;jsessionid=" + $.cookie(cookieSessionID),
                "contentType": "application/x-www-form-urlencoded; charset=UTF-8",
                "success": function(text) {

                    jsessionID = text;
                    $.cookie(cookieSessionID, jsessionID, {
                        expires: 7,
                        path: '/'
                    });
                    $.jsonrpcSessionStore[baseURL].jsessionID = jsessionID;
                    $.jsonrpcSessionStore[baseURL].jsessionIDTime = Date.now();
                    jsonrpcExecute();

                }
            });
        }
    }
});

if (window.localStorage) {
    var globalAccessTokenKeyStore = $.accessTokenStoreKey(burl, appID);
    try {
        var oldToken = JSON.parse(window.localStorage.getItem(globalAccessTokenKeyStore));
        if (oldToken) {
            $.accessToken = oldToken.token;
        } else {
            window.localStorage.removeItem(globalAccessTokenKeyStore);
        }
    } catch (ex) {
        window.localStorage.removeItem(globalAccessTokenKeyStore);
    }
}


var jsonizeBridgeInfo = function(object, indent, space) {
    var string = "";
    for (var i = 0; i < space; ++i) {
        string = string + "\t";
    }
    var usage = object["!usage"];
    switch (object["!valueType"]) {
        case "string":
            string = string + "string";
            break;

        case "int":
            string = string + "int";
            break;
        case "float":
            string = string + "float";
            break;
        case "char":
            string = string + "char";
            break;
        case "byte":
            string = string + "byte";
            break;
        case "enum":
            string = string + "enum (";
            object["!enums"].forEach(function(enumValue, idx) {
                if (idx) {
                    string = string + ",";
                }
                string = string + enumValue;
            });
            string = string + ")";
            break;
        case "ref":
            string = string + "=> {" + object["!refClass"] + "}";
            break;
        case "array":

        case "date":
            string = string + "date";
            break;
        case "boolean":
            string = string + "boolean";
            break;
        case "json":
            string = string + "json";
            break;
        case "map":
            string = string + "{";
            string = string + jsonizeBridgeInfo(object["!keyElement"], indent, 0) + " => ";
            string = string + jsonizeBridgeInfo(object["!valueElement"], indent, 0);
            string = string + "}";
            break;
        case "list":
            string = string + "[";
            string = string + jsonizeBridgeInfo(object["!arrayElement"], indent, 0);
            string = string + "]";
            break;
        case "object":
            string = string + "{" + "\t//" + object["!class"] + "\n";
            Object.keys(object).forEach(function(okey) {
                if ("!" !== okey[0]) {
                    var ovalue = object[okey];
                    for (var i = 0; i < (indent + 1); ++i) {
                        string = string + "\t";
                    }
                    string = string + okey + ":";
                    string = string + jsonizeBridgeInfo(object[okey], indent + 1, 1);
                    string = string + "\n";
                }
            });
            for (var i = 0; i < indent; ++i) {
                string = string + "\t";
            }
            string = string + "}"
            break;
    }
    if (usage) {
        string = string + "\t//" + usage;
    }
    return string;
};


$(document).ready(function() {

    if (enableBridge){
        $.jsonrpc("other.getRPCBridge", [], function(error, bridgeInfo) {

            if (bridgeInfo) {
                $.jsonrpc.search = function(keyword) {
                    console.log("searching result for :" + keyword);
                    Object.keys(bridgeInfo.interfaceInfo).forEach(function(ifaceName) {
                        var objectID = ifaceName.split(".")[0];
                        var method = ifaceName.split(".")[1];
                        var ifaceInfo = bridgeInfo.interfaceInfo[ifaceName];
                        var queryString = (ifaceName + ifaceInfo.usage).toLowerCase();
                        var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
                        var rs = "";
                        for (var i = 0; i < keyword.length; i++) {
                            rs = rs + keyword.substr(i, 1).replace(pattern, '');
                        }
                        if (queryString.indexOf(rs.toLowerCase()) >= 0) {
                            $.jsonrpc[objectID][method].toString();
                        }
                    });
                };
                Object.keys(bridgeInfo.interfaceInfo).forEach(function(ifaceName) {
                    var objectID = ifaceName.split(".")[0];
                    var method = ifaceName.split(".")[1];
                    var ifaceInfo = bridgeInfo.interfaceInfo[ifaceName];

                    if (!$.jsonrpc[objectID]) {
                        $.jsonrpc[objectID] = {};
                    }

                    Object.defineProperty($.jsonrpc[objectID], method, {
                        get: function() {

                            var remoteFunction = function() {
                                var replyActions = [];
                                var reply = null;
                                var callArguments = [];
                                for (var i = 0; i < arguments.length; ++i) {
                                    callArguments.push(arguments[i]);
                                }
                                $.jsonrpc(ifaceName, callArguments, function(error, result) {
                                    reply = {
                                        error: error,
                                        result: result
                                    };
                                    replyActions.forEach(function(action) {
                                        action(reply.error, reply.result);
                                    });
                                });
                                var replyStep = {
                                    "then": function(action) {
                                        if ($.isKindOf(action, Function)) {
                                            replyActions.push(action);
                                            if (reply) {
                                                action(reply.error, reply.result);
                                            }
                                        } else {
                                            throw new Error("Action is not function");
                                        }
                                        return replyStep;
                                    }
                                }
                                return replyStep;

                            };

                            remoteFunction.toString = function() {
                                var lines = []
                                lines.push("$.jsonrpc." + ifaceName + " = function (){/*\n");
                                if (ifaceInfo.usage) {
                                    lines.push("\t" + ifaceInfo.usage);
                                } else {
                                    lines.push("\t" + ifaceInfo.name);
                                }
                                lines.push("");
                                if (ifaceInfo.author) {
                                    lines.push("\t@author\t" + ifaceInfo.author);
                                }
                                if (ifaceInfo.email) {
                                    lines.push("\t@email\t" + ifaceInfo.email);
                                }
                                if (ifaceInfo.params.length == 0) {
                                    lines.push("\t@param\t无参数");
                                } else {
                                    ifaceInfo.params.forEach(function(param) {
                                        lines.push("\t@param\t" + jsonizeBridgeInfo(param, 1, 0));
                                    });
                                }
                                if (ifaceInfo.file) {
                                    lines.push("\t@option\t包含上传文件");
                                }
                                lines.push("\t@return\t" + jsonizeBridgeInfo(ifaceInfo.returns, 1, 0));
                                if (ifaceInfo.throws.length) {
                                    for (var i = 0; i < ifaceInfo.throws.length; ++i) {
                                        var throwString = "\t@throws\t" + ifaceInfo.throws[i].alias;
                                        if (ifaceInfo.throws[i].usage) {
                                            throwString = throwString + "\t//" + ifaceInfo.throws[i].usage;
                                        }

                                        if (bridgeInfo.errorCodes[ifaceInfo.throws[i].name]) {
                                            throwString = throwString + "\t{";
                                        }
                                        lines.push(throwString);
                                        if (bridgeInfo.errorCodes[ifaceInfo.throws[i].name]) {
                                            var codes = bridgeInfo.errorCodes[ifaceInfo.throws[i].name];
                                            Object.keys(codes).sort(function(k1, k2) {
                                                return codes[k1] - codes[k2];
                                            }).forEach(function(key) {
                                                lines.push("\t\t" + codes[key] + ":\t" + key);
                                            })
                                        }
                                        if (bridgeInfo.errorCodes[ifaceInfo.throws[i].name]) {
                                            lines.push("\t}");
                                        }
                                    }
                                }
                                lines.push("\n*/}");
                                console.log(lines.join("\n"));
                            }

                            return remoteFunction;
                        }
                    });

                })
            }

        });
    }

});

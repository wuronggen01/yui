var fs = require("fs");
var os = require("os");
var path = require("path");

// Home directory getter
//
var getHomeDir = function(subdir) {

    var baseDir = process.env[(process.platform.toLowerCase() == "win32") ? "USERPROFILE" : "HOME"];

    return (subdir) ? path.resolve(baseDir, subdir) : baseDir;

};

var getTempDir = function() {

    var tempDir = os.tmpdir();
    if (!tempDir) {
        tempDir = process.env.TMPDIR;
    }
    
    if (!tempDir) {
        tempDir = process.env.TMP;
    }

    if (!tempDir) {
        tempDir = process.env.TEMP;
    }

    return tempDir;

};

var makeDirTree = function(basePath, directoryArray, callback) {

    var subDir;
    var callback;

    switch (arguments.length) {

        case 2:
            {

                if (arguments[1] instanceof Function) {
                    callback = arguments[1];
                } else {
                    subDir = arguments[1].toString().split(',');
                }
                break;
            }

        case 3:
        default:
            {
                subDir = arguments[1];
                callback = arguments[2];
            }
    }

    if (!subDir) {
        subDir = [];
    }

    if (!callback) {
        callback = function() {}
    }

    var directoryMakeCallback = function(error) {

        if (error) {
            callback(error);
        } else {
            var directoryToMake = subDir.shift();

            if (directoryToMake) {
                makeDir(path.join(basePath, directoryToMake), directoryMakeCallback);
            } else {
                callback();
            }
        }

    }

    directoryMakeCallback();

}

// Make directory
//
var makeDir = function(dirPath) {

    var mode;
    var callback;

    switch (arguments.length) {

        case 2:
            {

                if (arguments[1] instanceof Function) {
                    callback = arguments[1];
                } else {
                    mode = arguments[1];
                }

                break;
            }

        case 3:
        default:
            {
                mode = arguments[1];
                callback = arguments[2];
                break;
            }

    }

    if (!callback) {
        callback = function() {};
    }

    dirPath = path.resolve(dirPath);

    var components = path.normalize(dirPath).split(path.sep);

    fs.exists(dirPath, function(exists) {

        if (exists) {
            callback(null);
        } else {

            makeDir(components.slice(0, -1).join(path.sep), mode, function(error) {

                if (error && (error.code !== "EEXIST")) {
                    callback(error);
                } else {

                    fs.mkdir(dirPath, mode, function(error) {
                        if (error && (error.code !== "EEXIST")) {
                            callback(error);
                        } else {
                            callback(null);
                        }
                    });

                }

            });

        };

    });

};

var makeDirSync = function(dirPath, mode) {

    dirPath = path.resolve(dirPath);

    var components = path.normalize(dirPath).split(path.sep);

    if (!fs.existsSync(dirPath)) {

        makeDirSync(components.slice(0, -1).join(path.sep), mode);

        fs.mkdirSync(dirPath, mode);

    };

};

var copyFileSync = function(sourcePath, destPath) {

    if (fs.existsSync(sourcePath)) {

        if (fs.statSync(sourcePath).isDirectory()) {

            if (fs.existsSync(destPath)) {

                if (!fs.statSync(destPath).isDirectory()) {
                    deleteFileSync(destPath);
                }

            } else {
                makeDirSync(destPath);
            }

            fs.readdirSync(sourcePath).forEach(function(name) {
                copyFileSync(path.resolve(sourcePath, name), path.resolve(destPath, name));
            });

        } else {

            if (fs.existsSync(destPath)) {
                deleteFileSync(destPath);
            } else {
                makeDirSync(path.dirname(destPath));
            }

            fs.writeFileSync(destPath, fs.readFileSync(sourcePath));

        }

    } else {
        throw new Error("File not found");
    }

};

var copyFile = function(sourcePath, destPath, callback) {

    if (!callback) {
        callback = function(error) {
            if (error) {
                throw error;
            }
        };
    }

    fs.exists(sourcePath, function(exists) {

        if (exists) {

            fs.stat(sourcePath, function(error, stats) {

                if (error) {
                    callback(error);
                } else {

                    if (stats.isDirectory()) {

                        var copy = function() {

                            fs.readdir(sourcePath, function(error, sourceFiles) {

                                var looper = 0;

                                var loop = function() {

                                    if (looper < sourceFiles.length) {

                                        ++looper;

                                        copyFile(path.resolve(sourcePath, sourceFiles[looper - 1]), path.resolve(destPath, sourceFiles[looper - 1]), function(error) {

                                            if (error) {
                                                callback(error);
                                            } else {
                                                loop();
                                            }

                                        });

                                    } else {

                                        callback();

                                    }

                                };

                                loop();

                            });

                        };

                        fs.exists(destPath, function(exists) {

                            if (exists) {

                                fs.stat(destPath, function(error, stats) {

                                    if (stats.isDirectory()) {

                                        copy();

                                    } else {

                                        deleteFile(destPath, function(error) {
                                            if (error) {
                                                callback(error);
                                            } else {
                                                copy();
                                            }
                                        });

                                    }

                                })

                            } else {
                                makeDir(destPath, function(error) {
                                    if (error) {
                                        callback(error);
                                    } else {
                                        copy();
                                    }
                                });
                            }

                        });

                    } else {

                        fs.exists(destPath, function(exists) {

                            var copy = function() {

                                var readStream = fs.createReadStream(sourcePath);

                                var writeStream = fs.createWriteStream(destPath);

                                readStream.pipe(writeStream, {
                                    "end": true
                                });

                                var callbacked = false;

                                readStream.on("error", function(error) {
                                    if (!callbacked) {
                                        callbacked = true;
                                        callback(error);
                                    }
                                });

                                writeStream.on("error", function(error) {
                                    if (!callbacked) {
                                        callbacked = true;
                                        callback(error);
                                    }
                                });

                                writeStream.on("finish", function() {
                                    if (!callbacked) {
                                        callbacked = true;
                                        callback();
                                    }
                                });

                            };

                            if (exists) {
                                deleteFile(destPath, function(error) {

                                    if (error) {
                                        callback(error);
                                    } else {
                                        copy();
                                    }

                                })
                            } else {
                                makeDir(path.dirname(destPath), function(error) {

                                    if (error) {
                                        callback(error);
                                    } else {
                                        copy();
                                    }

                                });
                            }

                        });

                    }

                }

            });

        } else {
            callback(new Error("File not found"));
        }

    });

};

var deleteFile = function(filePath, callback) {

    if (!callback) {
        callback = function(error) {
            if (error) {
                throw error;
            }
        };
    }

    fs.exists(filePath, function(exists) {

        if (exists) {

            fs.stat(filePath, function(error, stats) {

                if (error) {
                    callback(error);
                } else {

                    if (stats.isDirectory()) {

                        fs.readdir(filePath, function(error, fileNames) {

                            if (error) {
                                callback(error);
                            } else {

                                var looper = 0;
                                var loop = function() {

                                    if (looper < fileNames.length) {
                                        ++looper;

                                        deleteFile(path.resolve(filePath, fileNames[looper - 1]), function(error) {
                                            if (error) {
                                                callback(error);
                                            } else {
                                                loop();
                                            }
                                        });

                                    } else {
                                        fs.rmdir(filePath, callback);
                                    }

                                };

                                loop();

                            }

                        });

                    } else {
                        fs.unlink(filePath, callback);
                    }

                }

            });

        } else {
            callback();
        }

    });

};

var deleteFileSync = function(filePath) {

    if (fs.existsSync(filePath)) {

        if (fs.statSync(filePath).isDirectory()) {

            fs.readdirSync(filePath).forEach(function(fileName) {
                deleteFileSync(path.resolve(filePath, fileName));
            });

            fs.rmdirSync(filePath);

        } else {
            fs.unlinkSync(filePath);
        }

    }

};

var scanFile = function(filePath, level, report, callback) {

    if (!report) {
        report = function(record) {
            return true;
        };
    }

    if ((level === undefined) || (level === null)) {
        level = 1;
    }

    var files = [];

    fs.exists(filePath, function(exists) {

        if (exists) {

            fs.stat(filePath, function(error, stats) {

                if (error) {
                    callback(error);
                } else {

                    var createdDate = stats.birthtime;
                    if (!createdDate) {
                        createdDate = new Date(Math.min(stats.ctime.getTime(), stats.atime.getTime()));
                    }

                    var record = {
                        "type": (stats.isFile() ? "file" : (stats.isDirectory() ? "directory" : "unknown")),
                        "path": filePath,
                        "mode": stats.mode,
                        "uid": stats.uid,
                        "gid": stats.gid,
                        "createdDate": createdDate,
                        "lastModifiedDate": stats.mtime,
                        "size": stats.size
                    };

                    var accepted = report(record);

                    if (accepted) {

                        if (stats.isDirectory() && ((level <= -1) || (level > 0))) {

                            fs.readdir(filePath, function(error, filePaths) {

                                if (error) {
                                    callback(error);
                                } else {

                                    var looper = 0;
                                    var loop = function() {

                                        if (looper < filePaths.length) {

                                            var newFilePath = path.resolve(filePath, filePaths[looper]);

                                            ++looper;

                                            scanFile(newFilePath, level - 1, function(record) {

                                                if (report(record)) {

                                                    files.push({
                                                        "type": record.type,
                                                        "path": path.relative(filePath, record.path),
                                                        "mode": record.mode,
                                                        "uid": record.uid,
                                                        "gid": record.gid,
                                                        "createdDate": record.createdDate,
                                                        "lastModifiedDate": record.lastModifiedDate,
                                                        "size": record.size
                                                    });

                                                    return true;

                                                } else {
                                                    return false;
                                                }

                                            }, function(files) {
                                                loop();
                                            });

                                        } else {
                                            callback(files);
                                        }

                                    };

                                    loop();

                                }

                            });

                        } else {
                            if (stats.isFile()) {
                                callback([record]);
                            } else {
                                callback(files);
                            }
                        }

                    } else {
                        callback(files);
                    }

                }

            });

        } else {
            callback(files);
        }

    });

};

var scanFileSync = function(filePath, level, report) {

    if (!report) {
        report = function(record) {
            return true;
        };
    }

    if ((level === undefined) || (level === null)) {
        level = 1;
    }

    var files = [];

    if (fs.existsSync(filePath)) {

        var stats = fs.statSync(filePath);

        var createdDate = stats.birthtime;
        if (!createdDate) {
            createdDate = new Date(Math.min(stats.ctime.getTime(), stats.atime.getTime()));
        }

        var record = {
            "type": (stats.isFile() ? "file" : (stats.isDirectory() ? "directory" : "unknown")),
            "path": filePath,
            "mode": stats.mode,
            "uid": stats.uid,
            "gid": stats.gid,
            "createdDate": createdDate,
            "lastModifiedDate": stats.mtime,
            "size": stats.size
        };

        var accepted = report(record);

        if (accepted) {

            if (stats.isDirectory() && ((level === -1) || (level > 0))) {

                var files = fs.readdirSync(filePath);

                files.forEach(function(file) {

                    var newFilePath = path.resolve(filePath, file);

                    scanFileSync(newFilePath, level - 1, function(record) {

                        files.push({
                            "type": record.type,
                            "path": path.relative(filePath, record.path),
                            "mode": record.mode,
                            "uid": record.uid,
                            "gid": record.gid,
                            "createdDate": record.createdDate,
                            "lastModifiedDate": record.lastModifiedDate,
                            "size": record.size
                        });

                        return report(record);

                    });

                });

            } else if (stats.isFile()) {
                files.push(record);
            }

        }

    }

    return files;

};

var getPathSeparator = function() {
    return /[\\\/]+/g;
};

var ensurePosixPath = function(filePath) {
    return resolvePath(filePath).replace(getPathSeparator(), "/");
};

var standardizePath = function(filePath) {
    return resolvePath(filePath).replace(getPathSeparator(), path.sep);
};

var resolvePath = function() {

    var components = [];

    var looper = 0;
    while (looper < arguments.length) {

        var filePath = arguments[looper];
        var newComponents = filePath.split(getPathSeparator());

        if (isRootPath(filePath)) {
            var regex = /^[a-z]:$/;
            if (regex.test(components[0]) && (!regex.test(newComponents[0]))) {
                components = [components[0]];
                newComponents = newComponents.splice(1);
            } else {
                components = [];
            }
        }

        newComponents.forEach(function(component) {

            switch (component) {

                case "": {
                    if (looper === 0) {
                        components.push(component);
                    }
                    break;
                }

                case ".":
                    {
                        break;
                    }

                case "..":
                    {

                        if ((components.length > 0) && 
                            (components[components.length - 1] !== "..") && 
                            (components[components.length - 1] !== "")) {
                            components.pop();
                        } else {
                            components.push(component);
                        }

                        break;
                    }

                default:
                    {
                        components.push(component);
                    }

            }

        });

        ++looper;
    }

    return components.join(path.sep);
};

var isRootPath = function(filePath) {
    return /^([a-z]:)?[\\\/]/gim.test(filePath);
};

var isJustRootPath = function(filePath) {
    return /^([a-z]:)?[\\\/]$/gim.test(filePath);
};

module.exports = {

    "makeDir": makeDir,
    "makeDirSync": makeDirSync,
    "makeDirTree": makeDirTree,

    "copyFile": copyFile,
    "copyFileSync": copyFileSync,

    "deleteFile": deleteFile,
    "deleteFileSync": deleteFileSync,

    "scanFile": scanFile,
    "scanFileSync": scanFileSync,

    "getHomeDir": getHomeDir,

    "getTempDir": getTempDir,

    "getPathSeparator": getPathSeparator,
    "standardizePath": standardizePath,
    "ensurePosixPath": ensurePosixPath,
    "resolvePath": resolvePath,
    "isRootPath": isRootPath,
    "isJustRootPath": isJustRootPath

};
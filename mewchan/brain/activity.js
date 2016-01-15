

// activity store data
// $.uiKitty.mew.rpc("activity.data.store",{
//    "what" : "fuck"
//})

var activityDataStore = {};
var path = require("path");
var fs   = require("fs");

@heard.rpc("*" , "activity.data.store").then(function(usage, content, callback,mew) {
    if (content && $.is(content,Object)) {
        return $.async(function(){
            var step = this;
            if (activityDataStore[mew.from]){
                activityDataStore[mew.from] = $.merge(activityDataStore[mew.from],content);
                step.next();
            } else {
                fs.readFile(path.join(@mewchan().documentPath, mew.from + ".activity.json"),function(error, result){
                    if (error){
                        activityDataStore[mew.from] = {};
                    } else {
                        try {
                            activityDataStore[mew.from] = JSON.parse(result);
                        } catch (ex){
                            activityDataStore[mew.from] = {};
                        }
                    }
                    activityDataStore[mew.from] = $.merge(activityDataStore[mew.from],content);
                    step.next();
                });
            }
        }).then(function(){
            var dataStorePath = path.join(@mewchan().documentPath, mew.from + ".activity.json");
            @debug("write activity data to " + dataStorePath);
            fs.writeFile(dataStorePath,JSON.stringify(activityDataStore[mew.from]),function(error){
                if (error){
                    callback(error);
                } else {
                    callback(null, content);
                }
            });
        });

    } else {
        callback("Content Format Error");
    }
});

@heard.rpc("*" , "activity.data.load").then(function(usage, content, callback,mew) {
    if (content && ($.is(content,String) || $.is(content,Array) )) {
        var step = this;
        return $.async(function(){
            var step = this;
            if (activityDataStore[mew.from]){
                step.next();
            } else {
                fs.readFile(path.join(@mewchan().documentPath, mew.from + ".activity.json"),function(error, result){
                    if (error){
                        activityDataStore[mew.from] = {};
                    } else {
                        try {
                            activityDataStore[mew.from] = JSON.parse(result);
                        } catch (ex){
                            activityDataStore[mew.from] = {};
                        }
                    }
                    step.next();
                });
            }
        }).then(function(){
            var callbackData = {};
            var callbackFunction = function(query){
                var splitted = query.split(".");
                var looper = activityDataStore[mew.from];
                for (var i = 0 ; i < splitted.length; ++i){
                    if ($.is(looper,Object) && looper[splitted[i]]){
                        looper = looper[splitted[i]];
                        callbackData[query] = looper;
                    } else {
                        callbackData[query] = null;
                        break;
                    }
                }
            };

            if ($.is(content,Array)){
                content.forEach(function(str){
                    if ($.is(str,String)) {
                        callbackFunction(str);
                    }
                });
            } else {
                callbackFunction(content);
            }
            this.next(callbackData);
        }).then(function(found){
            callback(null,found);
        })
    } else {
        callback("Content Format Error");
    }
});


var OTHERClient = require("other_client.js");
var coolctoURL  = "http://clouddev.coolcto.com"
var coolctoAppID = "";
var coolctoAppSecret = "";
var coolctoAppInfo = null;
var coolctoAppInfoFile = "coolcto.json";
var fs = require("fs");
var path = require("path");

if (coolctoURL && coolctoAppID && coolctoAppSecret){

    var coolcto = new OTHERClient(coolctoURL,coolctoAppID,coolctoAppSecret);

    $.async(function(){

        fs.readFile(path.join(@mewchan().documentPath,coolctoAppInfoFile),this.next);

    }).then(function(error,content){

        if (error){
            coolctoAppInfo = null;
        } else {
            try {
                coolctoAppInfo = JSON.parse(content.toString("utf-8"));
            } catch (ex){
                coolctoAppInfo = null;
            }
        }
        this.next();
    }).then(function(){

        var job = $.async.schedule(15000, function () {

            var step  = this;

            $.async(function(){
                coolcto.call("coolcto.getApplicationInfo",[],this.test);

            }).then(function(appInfo){
                @debug(appInfo);

                if (!coolctoAppInfo || coolctoAppInfo.appVersion != appInfo.appVersion || coolctoAppInfo.lastUpdate != appInfo.lastUpdate){

                    @mew.auto("coolcto.appUpdate",appInfo);

                    coolctoAppInfo = appInfo;
                    fs.writeFile(path.join(@mewchan().documentPath,coolctoAppInfoFile),JSON.stringify(coolctoAppInfo),this.next);

                } else {
                    this.next();
                }


            }).then(function(){
                job.schedule();
                this.next();
            }).rejected(function(){
                job.schedule();
            })

        }).act();

        @heard.rpc("mewchan.ui","coolcto.appInfo").then(function(usage, content , callback){

            callback(null, coolctoAppInfo);

        });

        this.next();

    });




}

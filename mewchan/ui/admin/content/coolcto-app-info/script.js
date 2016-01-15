var initPage = function () {

};

var didEnterForestage = function () {
    if (this.appInfo.pushServiceVendor) {
        $$("#push-service-vendor").val(this.appInfo.pushServiceVendor);
    }
};

var leaveForestage = function () {

};

var destroyPage = function () {

};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "appSwitch" : function(pageID){
        $.currentActivity.getMainboard().switchTo(pageID,{
            "appInfo" : this.appInfo
        })
    },
    "saveAppInfo" : function(){
        var serializedForm = $$("#form-app-info").serializeForm();
        var appInfo = this.appInfo;
        Object.keys(appInfo).forEach(function(key){
            if ("YES" == appInfo[key] && !serializedForm[key]){
                serializedForm[key] = "NO";
            }
        });
        var storyboard = this.storyboard;
        $.jsonrpc("coolcto_system_admin.saveApplicationInfo",[appInfo.application.appID,serializedForm],function(error){
            if (error) {
                bootbox.alert("保存应用信息失败");
            } else {
                bootbox.alert("保存应用信息成功");
            }
        });
    }
};

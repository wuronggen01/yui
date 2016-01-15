var initPage = function () {

};

var didEnterForestage = function () {
    var that = this;
    $.jsonrpc("coolcto_system_admin.listAllCoolCTOApplications",[],function(error,apps){
        if (error) {
            bootbox.alert("获取App列表失败");
        } else {
            that.page.update({
                "applist" : apps
            });
        }
    });
};

var leaveForestage = function () {

};

var destroyPage = function () {

};

var hideUploadModal = function(){
    $(this.viewLayer).css('pointer-events','none');
};

var addApp = function () {
    $(this.viewLayer).find('#modal-new-app').modal('show');
    $(this.viewLayer).css('pointer-events','all');
}

// 暴露函数
module.exports = {
    "initPage": initPage,
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "hideUploadModal" : hideUploadModal,
    "addApp" : addApp,
    "switchToAppInfo" : function(){
        window.content.switchTo("coolcto-app-info",{
            "appInfo" : this.item
        });
    },
    "saveCoolCTOApp" : function(){
        var self = this;
        var form = $(this.viewLayer).find("#form-new-app").serializeForm();
        if (form.appName && form.appSecret && form.appID){

            bootbox.confirm("你确定要添加App : " + form.appName,function(valid){
                if (valid) {
                    $.jsonrpc("coolcto_system_admin.newApplication",[form],function(error,app){
                        if (error) {
                            bootbox.alert("保存App失败");
                        } else {
                            var applist = self.applist;
                            applist.push(app);
                            self.page.update({
                                "applist" : applist
                            });
                        }
                    });
                }
            })

        }
    }
};

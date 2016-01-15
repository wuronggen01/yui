var initPage = function () {

};

var didEnterForestage = function () {
    var that = this;
    $.jsonrpc("coolcto_system_admin.listSystemAdmins",[],function(error,apps){
        if (error) {
            bootbox.alert("获取管理员列表失败");
        } else {
            that.page.update({
                "managers" : apps
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
    "saveCoolCTOUser" : function(){
        var self = this;
        var form = $(this.viewLayer).find("#form-new-app").serializeForm();
        if (form.account && form.password){

            bootbox.confirm("你确定要添加管理员 : " + form.account,function(valid){
                if (valid) {
                    $.jsonrpc("coolcto_system_admin.registerSystemAdmin",[form],function(error,app){
                        if (error) {
                            bootbox.alert("添加管理员失败");
                        } else {
                            var applist = self.managers;
                            applist.push(app);
                            self.page.update({
                                "managers" : applist
                            });
                        }
                    });
                }
            });

        }
    }
};

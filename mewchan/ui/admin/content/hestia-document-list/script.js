var initPage = function () {

};

var didEnterForestage = function () {
    var that = this;
    $.jsonrpc("hestia_admin.listDocumentTemplates",[this.appInfo.application.appID],function(error,apps){
        if (error) {
            bootbox.alert("获取模板列表失败");
        } else {
            that.page.update({
                "tmpllist" : apps
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
    "runAction" : function(action){
        var self = this;
        bootbox.confirm("你确定要 : " + $(this.element).text(),function(confirm){
            if (confirm){
                $.jsonrpc("hestia_admin."+action,[self.appInfo.application.appID,self.item.name],function(err,result){
                    if (err){
                        bootbox.alert($(self.element).text() + "失败, 原因: "+ err.msg);
                    } else {
                        bootbox.alert($(self.element).text() + "成功");
                    }
                });
            }
        })
    },
    "saveCoolCTOApp" : function(){

    }
};

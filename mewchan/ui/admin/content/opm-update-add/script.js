var initPage = function () {

};

var didEnterForestage = function () {
	var self = this;
	$.jsonrpc('records.listOpmRecords', [{
        start: 0,
        limit: 10
    }], function(e, r) {

        if (e) {
            page = window.content.currentPage;
        } else {
        	if (r) {
				self.page.update({
					recordList : r.list
				})
			}
        }

    });

};

var save = function() {

    var self = this;
    var form = this.page.$('#form-record-edit').serializeForm();
    form.iid = this.id; 

    $.jsonrpc('records.saveOpmRecord', [form], function(e, r) {
        var page = window.content.currentPage;
        if (e) {
            bootbox.alert(page.lang('保存纪录不成功'));
        } else if (r) {
            bootbox.alert(page.lang('保存纪录成功'));
            self.page.menuSwitch('opm-update-list');
        }
    });
};

var leaveForestage = function () {
    
};

var destroyPage = function () {
    
};

var menuSwitch = function(page,channel){
    window.content.switchTo(page,null,{
        "channel" : channel
    });
}

Date.prototype.format = function(fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


var formatTime = function(date) {
    if (date) {
        return new Date(date).format("yyyy-MM-dd hh:mm");
    } else {
        return ""
    }
}

// 暴露函数
module.exports = {
    "initPage": initPage,
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "formatTime": formatTime,
    "menuSwitch": menuSwitch,
    "save" : save
};

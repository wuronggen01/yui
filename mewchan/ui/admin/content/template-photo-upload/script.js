var initPage = function () {
	var self = this;
    var page = this.page;
    var uploadFileInfo = $.jsonrpcQueryObjectID(self.uploadFileAPI || window.apiExport.uploadFileAPI);
   	this.page.$('#upload-wrapper .dropzone').dropzone({
            "url" : uploadFileInfo.baseURL + "/gateway/api/jsonrpc.jsp;jsessionid=" + uploadFileInfo.jsessionID,
            "sending" : function(file, xhr, formData){
                uploadFileInfo = $.jsonrpcQueryObjectID(self.uploadFileAPI || window.apiExport.uploadFileAPI);
                this.options.url = uploadFileInfo.baseURL + "/gateway/api/jsonrpc.jsp;jsessionid=" + uploadFileInfo.jsessionID
                xhr.setRequestHeader("other-app-id", (uploadFileInfo.baseAppID ? uploadFileInfo.baseAppID : undefined));
                xhr.setRequestHeader("other-app-secret", (uploadFileInfo.baseAppSecret ? uploadFileInfo.baseAppSecret : undefined));
                var imageWidth = parseInt(self.imageWidth == 0 ? 0 : (self.imageWidth < 1 ? self.imageWidth * $(window).width() : self.imageWidth));
                var imageHeight = parseInt(self.imageHeight == 0 ? 0 : (self.imageHeight < 1 ? self.imageHeight * $(window).height() : self.imageHeight));
                var uploadRPCQuery = {
                    "id" : Date.now().toString(),
                    "method" : (self.uploadFileAPI || window.apiExport.uploadFileAPI),
                    "params" : [self.uploadFileParam || {
                        strategy : "NORMAL_FIT",
                        width : imageWidth,
                        height : imageHeight
                    }]
                }
                formData.append("query", JSON.stringify(uploadRPCQuery));
            },
            "success" : function(file,jsonrpcResponse){
                jsonrpcResponse = JSON.parse(jsonrpcResponse);
                if (!jsonrpcResponse.error){
                    $(file.previewElement).click(function(){
                       	self.page.$('#upload-wrapper .dz-preview').removeClass('active');
                        self.page.$('#upload-wrapper .img-link').removeClass('active');
                        $(this).addClass('active');
                        self.page.update({
                        	"selectedPhoto" : jsonrpcResponse.result
                        });

                    });
                    $(file.previewElement).click();
                }
            },
            "acceptedFiles" : "image/*",
            "dictDefaultMessage" : "拖动文件到此上传"
        });
};

var didEnterForestage = function () {
	var self = this;
	$.currentActivity.uiAsync(function(){
        var step = this;
$.jsonrpc(self.uploadFileQueryAPI || window.apiExport.uploadFileQueryAPI,[{
                start : self.galleryStart,
                limit : self.galleryLimit
            }],function(error,result){
                if (result){
                    self.page.update({
                        "galleryStart" : self.galleryStart + self.galleryLimit,
                        "gallery" : result.list
                    }).then(function(){
                        step.next();
                    })
                }
    });
    });

};

var leaveForestage = function () {

};

var destroyPage = function () {

};

// 暴露函数
module.exports = {

    "initPage": initPage,

    "loadData" : function(data,callback) {

    	if ($('body').hasClass('ui-desktop')){
            callback(null,{
                "sidebar" : "backMenu",
                "footer"  : "hideTab",
                "padding" : 0,
                "maxColumn" : 4
            })
        } else {
            callback(null,{
                "sidebar" : "backMenu",
                "footer"  : "hideTab",
                "padding" : 64,
                "maxColumn" : 4
            })
        }
    },
    "onWindowResize": function() {
        this.page.update();
    },
    "onGalleryModalSelection" : function(selection){
    	var self = this;
        self.page.$('#upload-wrapper .dz-preview').removeClass('active');
        self.page.$('#upload-wrapper .img-link').removeClass('active');
        $(this.element).addClass('active');
        self.page.update({
            "selectedPhoto" : selection
        });
    },

    "onBackwardAction" : function(callback){
        callback(null,{
			"selectedPhoto" : this.selectedPhoto
		});
    },

    "didEnterForestage": didEnterForestage,

    "leaveForestage": leaveForestage,

    "destroyPage": destroyPage,

    "switchUploadModalTab" : function(rel){
        this.page.$('#upload-wrapper .nav-tabs li').removeClass('active');
        $(this.element).addClass('active');
        this.page.$('#upload-wrapper .tab-pane').removeClass('active');
        this.page.$('#upload-wrapper #'+rel).addClass('active');
    }
};

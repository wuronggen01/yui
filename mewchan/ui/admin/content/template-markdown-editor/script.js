var initPage = function() {

    var page = this.page;

    if ($('body').hasClass('ui-desktop') || $('body').hasClass('system-android') ) {

        var stylePath = "/assets/js/plugins/mde/simplemde.css";
        $.loadResources([stylePath], function(error, result) {
            var element = page.$('#editor')[0];
            var shadowRoot = page.$('#editor-wrapper')[0].createShadowRoot();
            var cssCode = "<style>" + result[stylePath] + "</style>\n";
            shadowRoot.innerHTML = cssCode;
            shadowRoot.appendChild(element);
            var toolbars = [
                {
                    name: "bold",
                    action: SimpleMDE.toggleBold,
                    className: "fa fa-bold",
                    title: "Bold (Ctrl+B)",
                },
                {
                    name: "italic",
                    action: SimpleMDE.toggleItalic,
                    className: "fa fa-italic",
                    title: "Italic (Ctrl+I)",
                },
                "|",
                {
                    name: "code",
                    action: SimpleMDE.toggleCodeBlock,
                    className: "fa fa-code",
                    title: "Code (Ctrl+Alt+C)",
                },
                {
                    name: "quote",
                    action: SimpleMDE.toggleBlockquote,
                    className: "fa fa-quote-left",
                    title: "Quote (Ctrl+')",
                },
                {
                    name: "unordered-list",
                    action: SimpleMDE.toggleUnorderedList,
                    className: "fa fa-list-ul",
                    title: "Generic List (Ctrl+L)",
                },
                {
                    name: "ordered-list",
                    action: SimpleMDE.toggleOrderedList,
                    className: "fa fa-list-ol",
                    title: "Numbered List (Ctrl+Alt+L)",
                },
                "|",
                {
                    name: "link",
                    action: SimpleMDE.drawLink,
                    className: "fa fa-link",
                    title: "Create Link (Ctrl+K)",
                },
                {
                    name: "image",
                    action: function(editor){
                        // Add your own code
                        page.showUploadModal();

                    },
                    className: "fa fa-picture-o",
                    title: "Insert Image (Ctrl+Alt+I)",
                },
                "|",
                {
                    name: "table",
                    action: SimpleMDE.drawTable,
                    className: "fa fa-table",
                    title: "Insert Table",
                }
            ];
            if ($('body').hasClass('ui-desktop')){
                toolbars.unshift("|");
                toolbars.unshift({
                    name: "fullScreen",
                    action: function(editor){
                        if ($(editor.toolbarElements.fullScreen).hasClass('fa-angle-double-left')){
                            $(editor.toolbarElements.fullScreen).removeClass('fa-angle-double-left');
                            $(editor.toolbarElements.fullScreen).addClass('fa-angle-double-right');
                            jQuery('#page-container').removeClass('sidebar-o');
                        } else {
                            $(editor.toolbarElements.fullScreen).removeClass('fa-angle-double-right');
                            $(editor.toolbarElements.fullScreen).addClass('fa-angle-double-left');
                            jQuery('#page-container').addClass('sidebar-o');
                        }
                    },
                    className: "fa fa-angle-double-left",
                    title: "fullScreen (Ctrl+F)",
                });

            }
            var editor = page.data.editor = new SimpleMDE({
                autosave: {
                    enabled: true,
                    uniqueId: page.uuid,
                    delay: 1000,
                },
                autofocus: true,
                element: element,
                spellChecker: false,
                renderingConfig: {
                    singleLineBreaks: false,
                    codeSyntaxHighlighting: true,
                },
                disableExtraKeys : true,
                //"bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list",
                toolbar: toolbars
            });
            if ($('body').hasClass('ui-desktop')){
                SimpleMDE.toggleSideBySide(editor);
            } else {
                SimpleMDE.toggleFullScreen(editor);
            }
        });
    }


};

var didEnterForestage = function() {

};

var leaveForestage = function() {

};

var destroyPage = function() {
    if (this.editor){
        delete this.editor;
    }
};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "onMenuHide" : function(){
        if (this.editor.toolbarElements.fullScreen){
            $(this.editor.toolbarElements.fullScreen).removeClass('fa-angle-double-left');
            $(this.editor.toolbarElements.fullScreen).addClass('fa-angle-double-right');
        }
    },
    "onWindowResize": function() {
        $(this.viewLayer).find('#modal-upload').modal('hide');
        this.page.hideUploadModal();
        this.page.update();
    },
    "switchUploadModalTab" : function(rel){
        var viewLayer = this.viewLayer;
        $(viewLayer).find('#modal-upload .nav-tabs li').removeClass('active');
        $(this.element).addClass('active');
        $(viewLayer).find('#modal-upload .tab-pane').removeClass('active');
        $(viewLayer).find('#modal-upload #'+rel).addClass('active');
    },
    "doUploadModalUpdate" : function(){
        var self = this;
        var page = this.page;
        var uploadFileInfo = $.jsonrpcQueryObjectID(self.uploadFileAPI || window.apiExport.uploadFileAPI);
        var dzElement = $(self.viewLayer).find('#modal-upload .dropzone');
        var dropzone = dzElement.dropzone({
            "url" : uploadFileInfo.baseURL + "/gateway/api/jsonrpc.jsp;jsessionid=" + uploadFileInfo.jsessionID,
            "sending" : function(file, xhr, formData){
                uploadFileInfo = $.jsonrpcQueryObjectID(self.uploadFileAPI || window.apiExport.uploadFileAPI);
                this.options.url = uploadFileInfo.baseURL + "/gateway/api/jsonrpc.jsp;jsessionid=" + uploadFileInfo.jsessionID
                xhr.setRequestHeader("other-app-id", (uploadFileInfo.baseAppID ? uploadFileInfo.baseAppID : undefined));
                xhr.setRequestHeader("other-app-secret", (uploadFileInfo.baseAppSecret ? uploadFileInfo.baseAppSecret : undefined));
                var previewElement = self.editor.codemirror.getWrapperElement().nextSibling;
                var imageWidth = parseInt(self.imageWidth == 0 ? 0 : (self.imageWidth < 1 ? self.imageWidth * $(previewElement).width() : self.imageWidth));
                var imageHeight = parseInt(self.imageHeight == 0 ? 0 : (self.imageHeight < 1 ? self.imageHeight * $(previewElement).height() : self.imageHeight));
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
                        $(self.viewLayer).find('#modal-upload .dz-preview').removeClass('active');
                        $(self.viewLayer).find('#modal-upload .img-link').removeClass('active');
                        $(this).addClass('active');
                        $(self.viewLayer).find('#modal-upload').data('selectedPhoto',jsonrpcResponse.result);
                    });
                    $(file.previewElement).click();
                }
            },
            "acceptedFiles" : "image/*",
            "dictDefaultMessage" : "拖动文件到此上传"
        });
        console.log(dropzone);
    },
    "didUpdate" : function(){
        $(this.viewLayer).find('#modal-upload').modal('hide');
        this.page.doUploadModalUpdate();
    },
    "initUploadModal" : function(){
        var self = this;
        var page = this.page;
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
        })
    },
    "onUploadModalSelection" : function(photoItem){
        this.editor.drawImage(photoItem.linkURL);
    },
    "onGalleryModalSelection" : function(selectedItem){
        var self = this;
        $(self.viewLayer).find('#modal-upload .dz-preview').removeClass('active');
        $(self.viewLayer).find('#modal-upload .img-link').removeClass('active');
        $(this.element).addClass('active');
        $(self.viewLayer).find('#modal-upload').data('selectedPhoto',selectedItem);
    },
    "confirmUploadModal" : function(){
        var selectedPhoto = $(this.viewLayer).find('#modal-upload').data('selectedPhoto');
        if (selectedPhoto){
            this.page.onUploadModalSelection(selectedPhoto);
        }
        $(this.viewLayer).find('#modal-upload').modal('hide');
        this.page.hideUploadModal();
    },
    "hideUploadModal" : function(){
        $(this.viewLayer).css('pointer-events','none');
    },
    "showUploadModal" : function(){
        var self = this;
        $.currentActivity.uiAsync(function(){
            $(self.viewLayer).find('#modal-upload').modal('show');
            $(self.viewLayer).css('pointer-events','all');
            this.next();
        });
    },
    "loadData": function(data,callback){
        if ($('body').hasClass('ui-desktop')){
            callback(null,{
                "header" : "hideNav",
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
    "onBackwardAction" : function(callback){
        var data = {};
        var name = this.name ? this.name : "content";
        if (this.html){
            data[name] = this.editor.markdown(this.editor.value());
        } else {
            data[name] = this.editor.value();
        }
        callback(null,data);
    }
};



// 暴露函数
module.exports = {
    "backwardAction" : function(){
        return $.async(function(){
            var step = this;
            if ($.currentActivity.getMainboard() && $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports["onBackwardAction"]) {
                var actionStep = function(error, result){
                    if (error){
                        console.error(error);
                    } else {
                        $.currentActivity.getMainboard().goBackward(result);
                    }
                    step.next();
                };
                $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports["onBackwardAction"].apply($.currentActivity.getMainboard().currentPage.data,[actionStep]);
            } else {
                $.currentActivity.getMainboard().goBackward();
                step.next();
            }
        })

    },
    "hideMenu" : function(){
        jQuery('#page-container').removeClass('sidebar-o');
        if ($.currentActivity.getMainboard() && $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports["onMenuHide"]) {
            $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports["onMenuHide"].apply($.currentActivity.getMainboard().currentPage.data,[]);
        }
    },
    "sidebarClose": function(){
        jQuery('#page-container').removeClass('sidebar-o-xs');

    },
    "cancelEdit" : function(){
        $.currentActivity.getMainboard().goBackward();
    }
};

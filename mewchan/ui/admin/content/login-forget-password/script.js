var initPage = function() {
    this.page.$('.js-validation-reminder').validate({
        errorClass: 'help-block text-right animated fadeInDown',
        errorElement: 'div',
        errorPlacement: function(error, e) {
            jQuery(e).parents('.form-group > div').append(error);
        },
        highlight: function(e) {
            jQuery(e).closest('.form-group').removeClass('has-error').addClass('has-error');
            jQuery(e).closest('.help-block').remove();
        },
        success: function(e) {
            jQuery(e).closest('.form-group').removeClass('has-error');
            jQuery(e).closest('.help-block').remove();
        },
        rules: {
            'reminder-email': {
                required: true,
                email: true
            }
        },
        messages: {
            'reminder-email': {
                required: this.page.lang('请输入正确的邮箱地址')
            }
        }
    });

    this.page.$('.form-material.floating > .form-control').each(function() {
        var $input = jQuery(this);
        var $parent = $input.parent('.form-material');

        if ($input.val()) {
            $parent.addClass('open');
        }

        $input.on('change', function() {
            if ($input.val()) {
                $parent.addClass('open');
            } else {
                $parent.removeClass('open');
            }
        });
    });
};

var didEnterForestage = function() {

};

var leaveForestage = function() {

};

var destroyPage = function() {

};


var onForgetBtnClick = function() {
    var remindEmail = this.page.$("#reminder-email").val();
    if (/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(remindEmail)){
        
    }
};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "onForgetBtnClick": onForgetBtnClick
};

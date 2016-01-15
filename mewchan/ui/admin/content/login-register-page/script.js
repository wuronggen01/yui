var initPage = function() {

    this.page.$('.js-validation-register').validate({
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
            'account': {
                required: true,
                minlength: 3
            },
            'mailAddress': {
                required: true,
                email: true
            },
            'password': {
                required: true,
                minlength: 5
            },
            'passwordRpt': {
                required: true,
                equalTo: '#register-password'
            },
            'register-terms': {
                required: true
            }
        },
        messages: {
            'account': {
                required: '请输入用户名',
                minlength: '你的用户名必须包含至少3个字符'
            },
            'mailAddress': '请输入正确的邮箱地址',
            'password': {
                required: '请输入密码',
                minlength: '密码最小长度是6位'
            },
            'passwordRpt': {
                required: '请输入密码',
                minlength: '密码最小长度是6位',
                equalTo: '密码必须相同'
            },
            'register-terms': '你必须同意并接受注册条款'
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


var onRegisterBtnClick = function() {
    var data = this;
    var register = $('#form-register').serializeForm();
    if (this.page.$('.js-validation-register').valid()) {

        $.jsonrpc(window.apiExport ? window.apiExport.registerAPI : "coolcto.register", [register], function(error, result) {

            if (error) {
                $.notify({

                    icon: 'glyphicon glyphicon-warning-sign',

                    title: data.page.lang('注册失败'),

                    message: data.page.lang(', 请重试')

                }, {
                    type: "danger",
                    placement: {
                        from: "top",
                        align: "center"
                    }
                });

            } else {
                $.accessToken = result.token;
                $admin.sessions = result.sessions;
                $admin.token = result.token;
                $admin.account = result.account;
                $.notify({

                    icon: 'glyphicon glyphicon-warning-sign',

                    title: data.page.lang('注册成功'),

                    message: data.page.lang('我们将在2秒后跳转进入首页')

                }, {
                    type: "info",
                    placement: {
                        from: "top",
                        align: "center"
                    },
                    "onClose": function() {
                        window.content.switchTo('main-index-page', {
                            token: result.token
                        }, {
                            "channel": "main"
                        })
                    }
                });
            }
        });
    }
};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "onRegisterBtnClick": onRegisterBtnClick,
    "viewTerm" : function(){
        $(this.viewLayer).find('#modal-terms').modal('show');
        $(this.viewLayer).css('pointer-events','all');
    },
    "hideTerm" : function(){
        $(this.viewLayer).css('pointer-events','none');
    }
};

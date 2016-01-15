var initPage = function() {

    this.page.$('.js-validation-login').validate({
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
                minlength: 6
            },
            'password': {
                required: true,
                minlength: 6
            }
        },
        messages: {
            'account': {
                required: this.page.lang('请输入用户名'),
                minlength: this.page.lang('你的用户名至少要包含6个字符')
            },
            'password': {
                required: this.page.lang('请输入密码'),
                minlength: this.page.lang('你的密码至少要包含6个字符')
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


var onLoginBtnClick = function() {

    var data = this;

    var form = this.page.$('#form-login').serializeForm();

    $.jsonrpc(window.apiExport ? window.apiExport.loginAPI : "other.login", [form], function(error, result) {

        if (error) {
            $.notify({

                icon: 'glyphicon glyphicon-warning-sign',

                title: data.page.lang('登录失败'),

                message: data.page.lang(', 请重试')

            }, {
                type: "danger",
                placement: {
                    from: "top",
                    align: "center"
                }
            });
        } else {
            if (data.page.$('#login-remember-me').is(':checked')) {
                $.jsonrpcSaveAccessToken(result);
            }
            $.accessToken   = result.token;
            $admin.sessions = result.sessions;
            $admin.token    = result.token;
            $admin.account  = result.account;
            $.notify({

                icon: 'glyphicon glyphicon-warning-sign',

                title: data.page.lang('登录成功'),

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
};

function forgetPassword(){
    this.storyboard.switchTo("login-forget-password")
}

function newUser(){
    this.storyboard.switchTo("login-register-page")
}

// 暴露函数
module.exports = {
    "initPage": initPage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "onLoginBtnClick": onLoginBtnClick,
    "forgetPassword" : forgetPassword,
    "newUser" : newUser
};

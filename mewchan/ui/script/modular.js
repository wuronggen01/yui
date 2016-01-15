$.uiReady(function() {

    var options = {
        "defaultRootPath": "/UIModular/",
        "defaultTemplatePath": "${id}/mod.html",
        "defaultStylePath": "${id}/style.css"
    };

    var modStatus = {
        "loadCss": {}
    };

    $.template.external['mod'] = function(template, callback) {

        var data = this;

        $.async(function() {

            // init Mod
            var step = this;
            var mod = {
                "id": $(template).attr('id')
            };
            step.next(mod);

        }).then(function(mod) {

            // init Path
            var step = this;
            mod["template-path"] = $.template(options.defaultRootPath + options.defaultTemplatePath, mod);
            mod["style-path"] = $.template(options.defaultRootPath + options.defaultStylePath, mod);
            step.next(mod);

        }).then(function(mod) {

            var step = this;

            $.async(function() {
                var resourceFetchStep = this;
                $.loadResources([mod["style-path"], mod["template-path"]], function(error, content) {
                    if (error) {
                        throw new Error(mod["style-path"] + " not found");
                    } else {
                        resourceFetchStep.next(content);
                    }
                });
            }).then(function(content) {
                // loadCss
                var resourceFetchStep = this;

                if (!modStatus.loadCss[mod.id]) {
                    modStatus.loadCss[mod.id] = true;
                    mod.css = $("<style>").html(content[mod["style-path"]]).prop("outerHTML");
                };

                resourceFetchStep.next(content);
            }).then(function(content) {
                // loadTemp
                mod.html = content[mod["template-path"]];

                step.next(mod);
            });

        }).then(function(mod) {

            var step = this;

            var templateOptions = {
                "animated": true,
                "defaultAnimationDuration": 1000,
                "defaultAnimation": "left",
                "parser": "text/html",
                "functors": data.functors,
                "prependNamespaces": {
                    "sb": "http://project.spiritate.org/storyboard",
                    "tmpl": "http://project.spiritate.org/template",
                    "storyboard": "http://project.spiritate.org/storyboard",
                    "template": "http://project.spiritate.org/template",
                    "templatex": "http://project.spiritate.org/templatex",
                    "tmplx": "http://project.spiritate.org/templatex",
                    "t": "http://project.spiritate.org/template",
                    "x": "http://project.spiritate.org/templatex"
                }
            };

            $(data.storyboard.dom).prepend(mod.css);

            var modTemplate;
            if (mod.html) {
                modTemplate = $.template(mod.html, data, templateOptions);

                var modDOM = document.createElement('div');

                modTemplate.render(modDOM, function() {
                    callback(null, modDOM);
                });
            } else {
                callback(null, "");
            };


        }).rejected(function(error) {
            throw new error;
        });

    }

});

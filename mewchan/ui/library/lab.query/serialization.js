$(function () {

    $.parse = function (usage, content, options) {

        if ($.parse.parsers[usage]) {
            return $.parse.parsers[usage](usage, content, options);
        } else {
            return $.query();
        }

    };

    $.parse.parsers = {
        "json": function (usage, content, options) {

            var json = JSON.parse(content);

            return $.query([json]);
        }
    };

    $.serialize = function (usage, content, options) {

        if ($.serialize.serializers[usage]) {
            return $.serialize.serializers[usage](usage, content, options);
        } else {
            return $.query();
        }

    };

    $.serialize.serializers = {
        "json": function (usage, content, options) {

            if ($.advancedMerge) {
                options = $.advancedMerge({
                    "!booleanFields": "prettyPrint",
                    "!defaultValue": {},
                    "prettyPrint": {
                        "!valueType": "boolean",
                        "!defaultValue": false
                    }
                }, options);
            } else {
                if (!options) {
                    options = {}
                }
            }

            var json = null;
            if (options.prettyPrint) {
                json = JSON.stringify(content, null, 4);
            } else {
                json = JSON.stringify(content);
            }

            return $.query(json);

        }
    };

});
$(function () {

    $.reinit = function (query) {

        query = $(query);

        Object.keys($.reinit.handlers).forEach(function (key) {

            $.reinit.handlers[key](query);

        });

    };

    $.reinit.handlers = {};

    $.delay(-1, function () {

        $.reinit($(document.body));

    });

});
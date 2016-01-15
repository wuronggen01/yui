

module.exports = {
    "willEnterForestage": function(){

        var page = this.page;

        $admin.adjustUI(this.page);

        page.$('.js-summernote-air').summernote({
            airMode: true
        });

        // Init full text editor
        page.$('.js-summernote').summernote({
            height: 350,
            minHeight: null,
            maxHeight: null
        });
        

    },
    "hasSession" : function (session){
        return $admin.sessions && $admin.sessions.indexOf(session) >= 0
    },
    "timestamp" : function(){
        return Date.now();
    }
};

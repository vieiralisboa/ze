// Requires Frontgate, jQuery Uploader plugin, closure_compiler controller

Remote = window.Remote || Frontgate.location({
    hostname: "docs.medorc.org",
    protocol: "http:"
});

Situs = window.Situs || window.Remote;

//TODO auto create the Situs closure_compiler controller (API)

(function(Minify) {

    Minify.API = Frontgate.location({
        hostname: "situs.no-ip.org",
        port: 8080,
        protocol: "http:"//,pathname: "/closer-compiler"
    });

    Minify.API.auth({
        user: "guest",
        pw: "guest"
    });

    /*/
    console.info("API.href()", API.href());
    console.info("API.hrefAuth()", API.hrefAuth());
    console.info("API.href('closer-compiler')", API.href('closer-compiler'));
    console.info("API.hrefAuth('closer-compiler')", API.hrefAuth('closer-compiler'));//*/

    // Closer Compiler UI (JShrink on Linux)
    Remote.scripts('ace-builds/src-noconflict/ace.js','uploader/min-index_0.0.2.js', function(){
        // Load the template and then load the Minify bar
        Minify.API.template('bar/templates/Minify.template.html', function(template){
            // template
            $('body').append(template);

            // load Bar
            Bar.load('#header', function(bar, data){
                $('#header').bar(Minify.toolbar);

                // add toolbox toggler
                Frontgate.Apps("Minify").toolbox.App.panelToggle = Minify.panelToggle;

                Minify.uploader.API = Minify.API;
                Minify.uploader.url = Minify.API.href('closure_compiler');

                // File Uploader
                $('#file-upload').uploader(Minify.uploader);

                // uploader form
                $('#file-upload form').css('display','inline');

                // uploader input
                $('#file-upload form input').css({
                    color: 'rgba(55,55,55,0.9)',
                    'text-shadow': '0 0 3px rgb(255,255,255)'
                })
                .attr('accept', 'application/x-javascript');//, text/javascript

                //TODO set css/attr in template
                $('#code-output').hide().attr('readonly','readonly');

                window.editor = ace.edit("code-input");
                //editor.setTheme("ace/theme/monokai");
                editor.getSession().setMode("ace/mode/javascript");
                editor.setValue('//JavaScript\n');
                editor.clearSelection();
                editor.moveCursorTo(1, 0);
                editor.focus();

                // initial state for toolbox buttons
                $('#download-file, #minify-view').hide();

                // select code input
                $('#uglify-view').click();
            }, FILE);
        });
    });

    if(window.console && console.info)
        console.info(Minify.name, Minify.version.join("."));
})
({
    name: "Minify",
    version: [0, 5, 0],

    panelToggle: function(toggle){
        if(toggle){
            $('#closer-compiler').fadeIn();
            $('#minify-icon').css('opacity','.9');
        }
        else {
            $('#closer-compiler').fadeOut();
            $('#minify-icon').css('opacity','.4');
        }
    },

    toolbar: {
        items: [{
            el: "img",
            css:{
                "vertical-align": "middle",
                cursor: "pointer",
                margin: "0 5px"
            },
            attr:{
                src: Remote.href('/graphics/icons/Icons/Icons/Document2.png'),
                title: 'JShrink UI',
                id: 'minify-icon'
            },
            click: function(){
                if(!$('#closer-compiler').is(':visible'))
                    location.hash = "#Minify";
                else location.hash = "#Home";

                //prevent hash change
                return false;
            }
        }],

        callback: function(bar){

            // Hash Routes
            //-----------------------------------------------------------------
            // upload js script (click event)
            bar.$bar.find('a[href="#Minify/upload"]').click(function(hash){
                $('#file-upload').find('input').first().click();

                // cancel location hash change
                return false;
            });
            // upload js script (route event)
            Frontgate.router.on('#Minify/upload', function(hash){
                $('#file-upload').find('input').first().click();

                // restore hash
                location.hash = "Minify";
            });
            // download javascript file
            Frontgate.router.on('#Minify/download', function(hash){
                if($('#download-file').attr('href')){
                    window.location.href = $('#download-file').attr('href');
                }
                location.hash = "Minify";
            });
            // switch to JavaScript code
            Frontgate.router.on('#Minify/javascript', function(hash){
                $('#uglify-view').parent().siblings().find("a[data-toggle='code']").removeClass("selected");
                $('#uglify-view').addClass("selected");
                if($('#code-input').is(':visible')) return false;
                else{
                    $('#code-output').hide();
                    $('#code-input').show();
                    editor.moveCursorTo(0,0);
                }
                location.hash = "Minify";
            });
            // switch to minified code
            Frontgate.router.on('#Minify/minified', function(hash){
                $('#minify-view').parent().siblings().find("a[data-toggle='code']").removeClass("selected");
                $('#minify-view').addClass("selected");
                if($('#code-input').is(':visible')){
                    $('#code-input').hide();
                    $('#code-output').show();
                }
                else return false;
                location.hash = "Minify";
            });
            // compile code
            Frontgate.router.on('#Minify/compile', function(hash){
                // Minify controller auth
                $.ajaxSetup({ beforeSend: Minify.API.xhrAuth() });

                // Minify controller (API) call
                $.ajax({
                    url: Minify.API.href('/closure_compiler/compile'),
                    type: "POST",
                    data: editor.getValue(),
                    success: function (res){
                        // json parsing not required with jquery 2.0.0
                        if(parseInt($.fn.jquery) < 2) res = JSON.parse(res);

                        editor.setValue(res.input);

                        $("#code-output").val(res.output);
                        $('#minify-view').show();
                        location.hash = 'Minify/minified';
                        $('#download-file').show();

                        var file = Minify.API.hrefAuth('/download/min-' +  res.file);
                        document.getElementById("download-file")
                            .setAttribute('href', file);
                    }
                });

                // restore user auth
                $.ajaxSetup({ beforeSend: Frontgate.xhrAuth() });

                // restore hash
                location.hash = "Minify";
            });
            // clear code
            Frontgate.router.on('#Minify/clear', function(hash){
                editor.setValue("");
                $('#code-output').val('');
                $('#download-file, #minify-view').hide();
                Frontgate.router.route("#Minify/javascript");
                editor.setValue("//JavaScript\n");
                location.hash = "Minify";
            });

            // closer-compiler Toggle
            Bar.app("Minify").navigator.subscribeEvent('click', function(route){
                Frontgate.Apps("Minify").toolbox.App.panelToggle(route.res.input == '#Minify');
            });

            $('#closer-compiler')
            .css({
                top: $('#header').outerHeight(),
                "background": "rgba(0,0,0,.5)"
            });

            $('#closer-compiler textarea')
            .css({
                width: $('#header .toolbar').outerWidth(),
                //"background": "white"
                opacity: 1,
                //border: "solid rgb(222,222,222) 1px",
                //"border-top": "none",
                "box-shadow":"0 0 7px rgba(0,0,0,.5)"
            });

            $('#minify-icon')
            .parent()
            .css({
                "float":"right",
                "line-height": "32px",
                opacity: .9,
                margin: "0 5px"
            });
        }
    },

    uploader: {
        validate: function(file){
            //console.info('uploader', this);
            //console.info('uploader validate', arguments);

            // Closure Compiler auth
            $.ajaxSetup({ beforeSend: this.API.xhrAuth() });

            var info = function(text, cssClass, t) {
                text = text || '';
                if(!text){
                    $('#closer-compiler-myUI')
                        .attr({
                            title: 'Closer Compiler UI',
                            'class': 'toolbar-item'
                        });
                    return;
                }

                switch(cssClass){
                    case 'alert'://blue
                    case 'error'://red
                    case 'warnning'://orange
                    case 'info'://green
                        break;
                    default:
                        if(typeof cssClass == 'number'){
                            t = cssClass;
                            cssClass = 'info';
                        }
                        else if(typeof cssClass == 'undefined'){
                            t = 0;
                            cssClass = 'info';
                        }
                }

                if(t || 0) setTimeout(function(){ info(); }, t);

                $('#closer-compiler-myUI').attr('title', text).addClass(cssClass);

                return;
            };

            // verify that the file is a JavaScript file
            if(!file.name.match(/.js$/) && file.type != 'application/x-javascript'){
                return info('wrong file type ( '+(file.type || '?')+' )', 'error', 10000);
            }

            // reject large files (> 1MB)
            if(file.size/1024 > 1000){
                return info('file is too big ('+Math.round(file.size/1024, 1)+' KB)', 'error', 10000);
            }

            return true;
        },

        //TODO ?
        //beforeSend: Frontgate.xhrAuth("guest", "guest"),
        //url: Situs.hrefAuth('/closure_compiler'),

        //
        success: function (res){
            // json parsing not required with jquery 2.0.0
            if(parseInt($.fn.jquery) < 2) res = JSON.parse(res);

//TODO Remote -> remote location from html header (to replace Situs)
            // restore user auth
            $.ajaxSetup({ beforeSend: Frontgate.xhrAuth() });

            editor.setValue(res.input);

            $("#code-output").val(res.output);

            location.hash = 'Minify/minified';

            $('#minify-view').show().click();
            $('#download-file').show();

            $("#file-upload form input").val("");

            //console.info('success',this,res);

//TODO Remote -> remote location from html header (to replace Situs)
            var file = Situs.href('/download/min-' + res.file);
            document.getElementById("download-file")
                .setAttribute('href', file);
        }
    }
});

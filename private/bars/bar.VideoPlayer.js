//REQUIRES Frontgate

Remote = window.Remote || Frontgate.location({
    hostname: "docs.medorc.org",
    protocol: "http:"
});

Situs = window.Situs || Frontgate.location({
    hostname: $("html").attr("data-situs_hostname"),
    protocol: $("html").attr("data-situs_protocol")
});

//Remote.stylesheet("bar/css/videoPlayer");
Bar.autoLoad.css("VideoPlayer");
//TODO merge autoLoad with load
//Bar.load.css("videoPlayer");
//Bar.css("videoPlayer");

(function(myTV){

    myTV.remote.hostname = $("html").attr("data-situs_hostname") || myTV.remote.hostname;
    myTV.remote.protocol = $("html").attr("data-situs_protocol") || myTV.remote.protocol;

    // myTV controller
    myTV.API = Frontgate.location(myTV.remote);

    // use user credentials for the (myTV) controller
    myTV.API.auth(Frontgate.basicAuth());

    // ...
    Frontgate.Apps("myTV", myTV);

    /*/1. load templates
    Frontgate.location({
        hostname: "situs.no-ip.org",
        protocol: "http:",
        port: 8080,
        pathname: "/"
    }).template('docs/bar/templates/videoPlayer.ol.html', function(template){
        myTV.templates.ol = template;
    });//*/
    //TODO use private FILE object
    //if(FILE && FILE.templates) myTV.templates = FILE.templates;

    // using Bar controller
    Bar.API.template("VideoPlayer/template/ol", function(template) {
        //ze.sítio.pt/bars/templates/VideoPlayer.ol.html
        myTV.templates.ol = template;
    });

    //------------------
    // 2. Toolbar (Bar)
    //------------------
    Bar.load('#header', function(bar, data) {
        // toolbar items and callback
        $('#header').bar(myTV.toolbar);

        // authenticate and update toolbox
        myTV.auth(function(result, data){
            myTV.updateToolboxItems(data);
        });

        if(console && console.info) {
            console.info(myTV.appName, myTV.version.join("."));
        }

        // File Input Change
        document.querySelector('#video-show-input').addEventListener('change', myTV.playSelectedFile, false);
    }, FILE);

    //--------------------
    // 3. Event listeners
    //--------------------

    // video metadata
    myTV.video.addEventListener('loadedmetadata', myTV.loadedMetadata, false);

    // video end
    myTV.video.addEventListener('ended', myTV.ended, false);

    // window unload
    $(window).bind('unload', function () {
        //TODO save video size, EPG, etc... to restore onload
        myTV.saveCurrentTime(myTV.video);
    });

    // subscribe to video panel 'hide' event
    myTV.videoPanel.subscribeEvent('hide', function() {
        $('#myTV-icon').addClass('disabled');
    });

    // subscribe to video panel 'show' event
    myTV.videoPanel.subscribeEvent('show', function() {
         $('#myTV-icon').removeClass('disabled');
    });

    // before setting video to play
    myTV.videoPanel.subscribeEvent('beforePlay', function(attr) {// <this> is this function
        // save current time before changing video.src
        myTV.saveCurrentTime(myTV.video);
        myTV.unselectShow();
        myTV.video.pause();

        if(attr['data-m4v'] == 'true') {
            myTV.videoPanel.$header.find('li[data-control=HD]')
                .removeClass('hidden');
        }
        else {
            myTV.videoPanel.$header.find('li[data-control=HD]')
                .addClass('hidden');
        }
    });

    //TODO Situs -> Remote
    Frontgate.subscribeEvent('userchange', function(credentials){
        //console.info("user", user);
        myTV.API.auth(credentials);//TODO pass auth string only
        myTV.auth(function(result, auth){
            myTV.updateToolboxItems(auth, credentials);
        });
    });

    //----------
    //4. Routes
    //----------
    // remote video
    Frontgate.router.on(myTV.hash('video/:folder/:video'), function(hash) {
        var href = "a.video-show[href='%href%']".replace("%href%", hash.res[0]).replace("\\","\\\\");

        var el = $(href).get(0);
        myTV.selectShow(el);
    });

    //TEST internet location
    Frontgate.router.on(myTV.hash('http:/:url'), function(hash) {
        myTV.selectShow($("a.video-show[href='" + hash.res[0] + "']").get(0));
    });

    // add myBookLive playlist
    Frontgate.router.on(myTV.hash('myBookLive/:folder'), function(hash) {
        console.info(hash);
        myTV.myBookLiveTV(hash.attr.folder);
    });

    // EPG (playlist) toggle
    Frontgate.router.on(myTV.hash('EPG/:EPG'), function(hash){
        myTV.selectEPG(hash.attr.EPG, myTV.EPG[hash.attr.EPG]);
    });

    /*/
    Frontgate.router.on('#myTV/browse', function(hash){
        //console.log('#myTV/browse', hash);
        console.log('INPUT', $('#video-show-input'));
        $('#video-show-input').click();
    });//*/
})({
    appName: "Video Player",
    version: [0, 7, 2],
    remote: {
        hostname: $("html").attr('data-situs_hostname'),
        protocol: $("html").attr('data-situs_protocol'),
        pathname: "/myTV"
    },
    hash: function(route){
        var hash = '#' + this.appName.replace(" ", "") + "/" + route;
        hash = hash.replace(/[\/]+/g, "/");
        return hash;
    },
    app: function(){
        return Frontgate.Apps('myTV');
    },
    name: function(){
        return this.appName + ' ' + this.version.join(".");
    },

    localStorage: myStorage,
    templates: {},

    //-----------------------------
    // Save current video position
    //-----------------------------
    saveCurrentTime: function(){
        // current playing video link
        var $el = $("a.video-show[data-src='"+$(this.video).attr('data-src')+"']");

        // link not found
        if(!$el.length) return;

        var time = Math.floor(this.video.currentTime),// current video time
            EPG = $(this.video).attr('data-epg'),// Listing name
            name = $(this.video).attr('data-name');// video name (not used?)

        // it's a local file or it's a video from an url
        if(!EPG || !name) return;

        // save current video time on the link
        $el.attr('data-time', time);

        // save current video time in local Storage
        this.listing[EPG][name] = time;
        var items = {};
        items[EPG] = JSON.stringify(this.listing[EPG]);
        items["last"+EPG] = this.video.src;
        items["last"+EPG+"Src"] = this.video.src;
        items["last"+EPG+"Name"] = name;// video name (not used?)
        items["last"+EPG+"Time"] = time;
        this.localStorage.setItems(items);
    },

    fullscreen :function(el){
        // Mozilla
        if(el.mozRequestFullScreen)
            el.mozRequestFullScreen();
        // Webkit for video elements only
        else if(el.webkitRequestFullscreen)
            el.webkitRequestFullscreen();
        else if(el.requestFullscreen)
            el.requestFullScreen();
    },

    //------------
    // Play video
    //------------
    play: function(attr, callback){
        // Publish beforePlay event
        this.videoPanel.publishEvent('beforePlay', attr);

        // set the video attributes
        var videoAttr = new this.VideoData(attr);
        if(videoAttr) $(this.video).attr(videoAttr);
        else return;

        // remove previous subtitle
        $('video .vtt').remove();

        //DEV Subtitles (single track)
        if(attr['data-vtt'] && attr['data-vtt'] != 'false'){
            //alert(attr['data-vtt']);
            $(this.video).append($('<track>')
                    .addClass('vtt').attr({
                src: attr['data-vtt'],
                kind: "subtitles",
                srclang: "pt",
                default: "default",
                label: "Portuguese"
            }));
        }

        //TODO verify video result
        // Callback
        if(callback) {
            callback('result', this);
        }

        // play
        this.videoPanel.publishEvent('play');
        this.video.play();
        this.setNext();

    },

    //------------------------------
    // video attributes Constructor
    //------------------------------
    VideoData: function(data){
        if(data.src.match(/.mp4$/i)
            || data.src.match(/.m4v$/i)
            || data.src.match(/^blob/i) ) this.src = data.src;
        else this.src = data.src + '.mp4' || '';

        this['data-id'] = data['data-id'] || 0;
        this['data-epg'] = data['data-epg'] || '';
        this['data-name'] = data['data-name'] || '';
        this['data-vtt'] = data['data-vtt'] || false;
        this['data-time']  = data['data-time'] || 0;
        this['data-src'] = data['data-src'] || '';
        this['data-hd'] = data['data-m4v'] || false;
    },

    //-----------------------
    // sets video attributes
    //-----------------------
    setup: function(attr){
        $(this.video).attr(new this.VideoData(attr));
    },

    videoEnded: false,

    //------------------------------
    // Stop the video (rewind to 0)
    //------------------------------
    stop: function(video){
        video = video || this.video;

        //location.hash = 'VideoPlayer';
        console.info("stop", video);

        // the video is playing or paused
        if(video.currentTime != 0) {
            var localFile = $(video).attr('data-epg') == 'file' ? true : false;
            this.$a.attr('data-time', 0);

            video.pause();
            video.currentTime = 0;

            //HACK force browsers to stop downloading
            video.autoplay = false;
            video.src = '';//null;

            // a local file is loaded
            if(!localFile) {
                var EPG = this.$a.attr('data-epg');//$(trigger).attr('data-epg');
                var src = this.$a.attr('data-src');
                var stream = $("#epg-panel ul.panel-header li input[type=checkbox]").is(":checked");

                // remove this source from saved videos
                delete this.listing[EPG][src];

                this.localStorage.setItem(EPG, JSON.stringify(this.listing[EPG]));

                // autoload
                //this.localStorage.removeItems(['last'+EPG+'Name', 'last'+EPG+'Src', 'last'+EPG+'Time']);

                this.unselectShow(true);

                location.hash = 'VideoPlayer';

                //TODO get the "transmission" value from config (VideoPlayer.json)
                if(this.videoEnded && typeof this.next != "undefined" && stream) {
                    this.selectShow(this.next);
                    this.videoEnded = false;
                    return;
                }
            }

            if(this.videoPanel.$panel.is(':visible')) this.videoPanel.$panel.toggle();
            $('#myTV-icon').fadeOut();
        }
    },

    //--------------------------------
    // unselects Show (EPG) list item
    //--------------------------------
    unselectShow: function(){
        $('a.video-show.selected').removeClass('selected')
            .siblings('img.wait').removeClass('visible').addClass('hidden');
    },

    getNext: function(){
        var $a = $('a.video-show.selected').parent().next().find("a.video-show");
        if (!$a.length) return;
        return $a[0];
    },

    setNext: function(){
        this.next = this.getNext();
    },

    play$a: function($a){
        this.$a = $a;

        // EPG item is already selected
        if($a.hasClass('selected')){
            var video = this.video;

            if(!this.videoPanel.$panel.is(':visible')) {
                this.videoPanel.toggle(false, function(){
                    video.play();
                });
            }

            return false;
        }

        // get video src from EPG element
        var src = $a.attr('data-src');

        // an internet url
        if(src.match(/^http/i)){
            //
        }
        else if(src.match(/^video/i)){
            src = src.replace("\\","/");
            src = Situs.href("VideoPlayer/") + src;
        }
        else return;

        var data = {
            src: src,
            'data-id':  $a.attr('data-id'),
            'data-epg': $a.attr('data-epg'),
            'data-name':$a.attr('data-name'),
            'data-vtt': $a.attr('data-vtt'),
            'data-time':$a.attr('data-time'),
            'data-src': $a.attr('data-src'),
            'data-m4v': $a.attr('data-m4v')
        };

        //TODO to be called from hashRouter play(el, hrefAuth('myTV/show/video.source.mp4'))
        this.play(data, function(result, myTV){// window is <this>
            // select show trigger el
            $a.addClass('selected').siblings('img.wait').removeClass('hidden').addClass('visible');
        });
    },

    //----------------
    // EPG video show
    //----------------
    selectShow: function(el){
        if(!el) return false;

        this.play$a($(el));
    },

    //-------------
    // Video Width
    //-------------
    videoWidth: function(width, el){
        if(!width) return $(this.video).attr('width');

        // un.select and unset video width
        if($(el).hasClass('selected')){
            $(el).removeClass('selected');
            $(this.video).attr('width', '');
            return;
        }

        // .select element and set video width
        $(el).siblings('.panel-control[data-toggle=width]').removeClass('selected');
        $(el).addClass('selected');
        $(this.video).attr('width', width);
    },

    //-------------------------------
    // Video listing from the server
    //-------------------------------
    getVideoList: function(url, callback){
        // ajax screen
        $('#epg-blocker').css('cursor','wait').fadeIn();

        var self = this;

        //console.info("getVideoList", url);

        $.ajax({
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            url: url,
            crossDomain: true,
            error: function(data){
                $('#epg-blocker').css('cursor','default').hide();
                callback([]);
                self.info("videoList: Ajax error (" + url + ")", 'error', 10000);
            },
            success: function(list){
                callback(list);

                // ajax screen
                $('#epg-blocker').css('cursor','default').fadeOut();
            }
        });
    },

    //-------------------------------------------------
    // fades in EPG panel and/or brings panel to front
    //-------------------------------------------------
    togglePanel: function($panel){
        // if the video Panel is not visible, fade in to top
        if(!$panel.is(':visible')){
            $panel.fadeIn();
        }

        if( $panel.css("z-index") < $.topZIndex()) $panel.topZIndex();
    },

    //-------------------------------
    // Auto Plays saved video source
    //-------------------------------
    autoPlayEPG: function(EPG){
        // a video is already playing
        if(this.video.currentTime != 0) return;

        // there's no video src in storage
        if(!localStorage.getItem('last'+EPG+'Src')) return;

        this.selectShow($('.video-show[data-name="' + this.localStorage.getItem('last'+EPG+'Name') +'"]').get(0));
    },

    //---------------------
    // Select EPG playList
    //---------------------
    selectEPG: function(EPG, href){
        var $panel = $("#epg-panel");

        // show EPG panel
        this.togglePanel($panel);

        var $trigger = $("a[data-epg='"+EPG+"'] ");
        var epg = $trigger.html();

        $panel.find("ul.panel-header li:first").html(epg);

        //console.info("loadEPG:", arguments);

        // toogle playlist or load playlist from server
        if(this.selectEPG[EPG]) this.toggleEPG(EPG);
        else this.loadEPG($trigger, href);//EPG, href);
    },

    toggleEPG: function(EPG, href){
        $('.epg-list').removeClass('selected');
        this.selectEPG[EPG].addClass('selected');
        //this.autoPlayEPG(EPG);
    },

    //--------------------------------
    // loads EPG playList from server
    //--------------------------------
    loadEPG: function($trigger, href) {//EPG, href){
        var self = this;
        var EPG = $trigger.attr("data-epg");

        // get videos list
        this.getVideoList(href, function(list) {
            var shows = [];

            // prepare the videos list
            if(list.length) {
                for(var i in list) {
                    shows.push(new self.Show(list[i]));
                }
            }

            // make EPG
            self.selectEPG[EPG] = self.makeEPG(EPG, shows);
            //console.info(EPG, self.selectEPG[EPG]);
            self.toggleEPG(EPG);
        });
    },

    //-----------------
    // EPG Render List
    //-----------------
    makeEPG: function(EPG, list){
        if(!EPG || !list.length){
            return $('<ol>').addClass('epg-list').html('<i>' + EPG + '</i><br>Not Available').appendTo('#epg-panel');
        }

        this.listing = this.listing || {};

        // get saved videos time positions from local storage (if any)
        this.listing[EPG] = $.parseJSON(this.localStorage.getItem(EPG)) || {};

        // delete shows (from local storage) no longer in the list
        for(var l in this.listing[EPG]) {
            var deleteName = true;
            for(var m in list) {
                if(list[m].name == l) {
                    deleteName = false;
                    break;
                }
            }
            if(deleteName) delete this.listing[EPG][l];
        }

        //var N = 128;
        //if(list.length > N) list = list.slice(0, N);

        for(var n in list){
            if(EPG == "movies/2012" || EPG == "movies/2013" || EPG == "movies/2014"){
                var show = list[n].name.match(/^(.*)\W(20\d\d)\W([0-9]{2,3}0p)(\W(.*))?$/i);//1080,720,480
                if(show) {
                    list[n].show = show[1];
                    list[n].episode = null,
                    list[n].S = show[2];
                    list[n].E = " " + show[3];
                }
                else{
                    list[n].show = list[n].name;
                    list[n].episode = null,
                    list[n].S = null;
                    list[n].E = null;
                }
            }
            else{
                var show = (function(string){
                    var show = string.match(/^(.*)\W(S[0-9]{1,2})(E[0-9]{1,2}(E[0-9]{1,2})?)(\W(.*))?$/i);

                    if(show) return {
                        show: show[1],
                        episode: null,
                        E: show[3],
                        S: show[2]
                    };
                    else return {};
                })(list[n].name);

                list[n].show = show.show || list[n].name;
                list[n].episode = show.episode,
                list[n].S = show.S;
                list[n].E = show.E;
            }
        }

        // ol list from template
        var $list =  $(_.template(this.templates.ol, {
            Listing: this.listing[EPG],
            href: this.hash("/"),
            EPG: EPG,
            wait: Remote.href("/fugue-icons/3.5.6/bonus/animated/icons/ui-progress-bar-indeterminate.gif"),
            items: list
        })).appendTo('#epg-panel');

        $('ol.epg-list li[data-cc=true] span.closed-caption').removeClass('hidden');
        $('ol.epg-list li[data-hd=true] span.high-def').removeClass('hidden');

        var API = this.API;
        var $poster = $("ol.epg-list img.poster");
        //$("ol.epg-list li.epg-title").html(EPG);

        //$("ol.epg-list li[data-poster!='false']")
        $("ol.epg-list li")
            //.removeClass('hidden')
            .hover(function(e){
                if($(this).attr("data-poster") == "false") $(this).find("img.poster").fadeOut();
                else {
                    var $img = $(this).find("img.poster");
                    if(!$img.attr("src")) {
                        $img.attr("src", Situs.href("VideoPlayer/")
                            + $(this).attr("data-poster"));
                    }
                    $poster.hide();
                    $img.show();
                }
            });

        $("ol.epg-list").hover(function(){}, function(){
            $poster.fadeOut();
        });

        return $list;
    },

    // EPG playlist urls
    EPG: {},

    // adds a playlist button to the toolbox
    playList: function(playlist){
        var cssClass = playlist.url.match(/dir/) ? 'private-playlist' : 'public-playlist';

        var data = {
            text: playlist.name,
            css: {},
            attr: {
                'data-epg': playlist.EPG,
                'data-toggle': 'playlist',
                'class': cssClass,
                href: '#VideoPlayer/EPG/' + playlist.EPG,
                title: playlist.title
            },
            click: function(){
                if(!$("#epg-panel").is(":visible") && location.hash == '#VideoPlayer/EPG/'+playlist.EPG)
                    $("#epg-panel").fadeIn();
            }
        };

        if(this.status != "Authorized" && data.attr['class'] == 'private-playlist') {
            data.css.display = "none";
        }

        Frontgate.Apps("VideoPlayer").bar.toolbox.item(data);

        this.EPG[playlist.EPG] = cssClass == 'public-playlist'?
            Remote.href(playlist.url) : this.API.href(playlist.url);
    },

    // EPG list item Constructor
    Show: function(show){
        // Show id
        this.id = show.id || 0;
        // Show src
        this.src = show.mp4 || '';
        // Show name
        this.name = (function(text, length){
            if(!text) return 'N/A';
            length = length || 20;
            if(text.length <= 2*length + 5) return text;
            var prefix = text.substring(0, length);
            var afix = text.substring(text.length-length)
            return prefix + '...' + afix;
        })(show.name, 100) || 'N/A';
        // Show Title
        this.title = show.name || 'N/A';
        // Show Subtitle vtt
        this.vtt = show.vtt || false;
        this.cc = this.vtt ? true : false;
        this.m4v = show.m4v ? true : false;
        this.poster = show.poster || false;
    },

    // EPG Panel
    epgPanel: (function(){
        $('#epg-panel').panel({
            name: {
                text: ''
            },
            hide: true,
            close: function(event){
                $('button[data-toggle=playlist]').removeClass('selected');
                Frontgate.Apps('myTV').epgPanel.toggle();
                event.stopImmediatePropagation();
            },
            cancel:'span'
        })
        .append('<span>').append($('<div id="epg-blocker">').css({
            display: 'block',
            padding: 10,
            position: 'absolute',
            top:0,
            bottom:0,
            left:0,
            right:0,
            //width: '100%',
            height: 'inherit',
            opacity: '.66',
            //CadetBlue   5F 9E A0     95 158 160
            backgroundColor: 'DarkGrey',
            backgroundImage: 'url('+ Remote.href('graphics/loaders/ajax-loader_DarkGrey_Black.gif')+')',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
        })).get(0)

        //TODO use (add) controls in panel
        $('#epg-panel').find("ul.panel-header")
        .append($("<li>").css({"float":"right", "vertical-align":"top", "padding":"4px", "font-size":"80%"})
            .html('<input style="margin:4px" type="checkbox">stream'));

        //return $panel.get(0);
        return $.fn.panel.self.get('#epg-panel');
    })(),

    // Video Panel
    videoPanel: (function(){
        $('#tv-panel').panel({
            hide: true,// Panel will not show at start up
            name: {
                text:'myVideo',
                //html: '<em>my</em><b>TV</b>',
                css:{
                    color: 'rgba(250,200,150,.75)',
                    display: 'none',
                    cssfloat: 'left'
                }
            },
            close:{
                //TODO use router
                click: function(e){
                    Frontgate.Apps('myTV').video.pause();
                },
                css:{
                    border: 'solid rgba(255,255,255,.5) 1px'
                }
            },
            cancel: '#tv-panel-span video',
            controls: [{
                text: 'File',
                click: function(){
                    $('#video-show-input').click();
                }
            },
            {
                //text: 'HD',
                css:{
                    height: 24,
                    width: 32,
                    backgroundImage: 'url("'+ Remote.href('graphics/icons/Pace Icon Set/PNG/HD.png') +'")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '32px',
                    cursor: 'pointer',
                    display: 'none'
                },

                attr: {
                    'data-control':'HD',
                    title: 'High Definition',
                    id: 'hd-icon'
                },

                click: function(){
                    var videoPlayer = Frontgate.Apps('myTV');

                    var data = {
                        'data-id':  $(videoPlayer.video).attr('data-id'),
                        'data-epg': $(videoPlayer.video).attr('data-epg'),
                        'data-name': $(videoPlayer.video).attr('data-name'),
                        'data-vtt': $(videoPlayer.video).attr('data-vtt'),
                        'data-time': videoPlayer.video.currentTime,
                        'data-src': $(videoPlayer.video).attr('data-src'),
                        'data-m4v': $(videoPlayer.video).attr('data-hd')
                    };

                    // EPG Panel and myTV are hidden
                    if($(this).hasClass('selected')){
                        $(this).removeClass('selected');
                        if($(videoPlayer.video).attr('data-hd') == 'true'
                                && videoPlayer.video.src.match(/4v$/i)){
                            data.src = videoPlayer.video.src.replace(/4v$/i, 'p4');
                            videoPlayer.play(data);
                        }
                    }
                    else{
                        $(this).addClass('selected');
                        if($(videoPlayer.video).attr('data-hd') == 'true'
                                && videoPlayer.video.src.match(/p4$/i)){
                            data.src = videoPlayer.video.src.replace(/p4$/i, '4v');
                            videoPlayer.play(data);
                        }
                    }
                }
            },
            {
                text: 'URL',
                click: function(){
                    var videoPlayer = Frontgate.Apps('myTV');
                    var url = prompt('Please enter an URL to a video source:',
                        'http://192.168.1.64:1234/stream.ogv');

                    if(!url.match(/^http:\/\//i)) return;
                    if(url.match(/\/\/www\.youtube\.com\//i)) {//http://www.youtube.com/watch?feature=player_detailpage&v=oOgF7jUaYzY
                        //myTV.log('youtube video');

                        var v = url.match(/v=(.*)$/);
                        var src = 'http://www.youtube.com/embed/'+v[1]+'?html5=1';
                        videoPlayer.newWindow(src, 'TV');
                    };

                    videoPlayer.saveCurrentTime(videoPlayer.video);
                    videoPlayer.setup({
                        'data-epg':'url',
                        'data-name':'',
                        'data-id':''
                    });
                    videoPlayer.video.src = url;
                    videoPlayer.video.play();
                }
            },
            {
                text: 'Fullscreen',
                attr:{
                    id: 'fullscreen'
                },
                click: function(){
                    var el = Frontgate.Apps('myTV').video;
                    Frontgate.Apps('myTV').fullscreen(el);
                }
            },
            {
                text: 'Pop-up',
                click: function(){
                    Frontgate.Apps('myTV').popup();
                }
            },

            {
                text: 'Stop',
                click: function(){
                    Frontgate.Apps('myTV').stop();
                }
            }]
        })
        .hover(function(){
            $(Frontgate.Apps('myTV').video).css('cursor','default');
            $(this).css({
                cursor: 'move'
            });
        },
        function(){
            $(this).css({
                cursor: 'default'
            });
        })
        .css({
            padding: 0
        })
        .append('<span id="tv-panel-span" style="display: block;"></span>')
        .append('<span style="background-color: none;display: block; position: absolute; top:0; left: 0; right:0; height:100px;"></span>');

        //TODO review $.fn.panel
        return $.fn.panel.self.get('#tv-panel');
    })(),

    // Video Screen
    video: $('<video controls>').attr('type', "video/mp4").appendTo("#tv-panel-span").get(0),

    // window popup
    newWindow: function(url, name) {
        // pop-up window|dialog,modal,fullscreen=no,toolbar=no,status=no,menubar=no,scrollbars=no,
        var newWindow = window.open(url, name, 'resizable=no, height=270, width=480');
        if (window.focus) newWindow.focus();
    },

    // Video popup
    popup: function(video) {
        video = video || this.video;
        video.pause();

        if($(video).attr('data-epg') == 'file'){
            // pop-up window|dialog,modal,fullscreen=no,toolbar=no,status=no,menubar=no,scrollbars=no,
            newwindow = window.open(video.src, 'TV', 'resizable=no, height=405, width=720');
            if (window.focus) newwindow.focus();
            this.stop(video);
            return false;
        }
        else {
            var hash = '#';
            hash += video.src.replace(/\w+\:\w+\@/, '');
            hash += '&' + Math.floor(video.currentTime);
            //var url = Situs.href("VideoPlayer/popup") + hash;
            var url = Frontgate.href("VideoPlayer/popup") + hash;
        }

        this.stop();

        // pop-up window|dialog,modal,fullscreen=no,toolbar=no,status=no,menubar=no,scrollbars=no,
        newwindow = window.open( url, 'TV', 'resizable=no, height=270, width=480');
        if (window.focus) newwindow.focus();

        return false;
    },

    // toggle video controls
    controlsToggle: function(video){
        video = video || this.video;
        video.controls = video.controls ? false : true;
    },

    myBookLiveTV: function(folder){
        if (!folder) return false;
        if (!folder.dir || !folder.dir.match(/^.*$/)) return false;

        if(!folder.name) {
            folder.name = folder.dir.replace(/\.S[0-9]+$/i, '');
            folder.name = folder.name.replace(/\.+/g, ' ');
        }

        var season = folder.dir.match(/S([0-9]+)$/i);
        if(season) season = ' Season '+ parseInt(season[1]);
        else season = '';

        //return data;
        this.playList({
            url: '/dir/' + folder.dir,
            name: folder.name,
            title: folder.name + season,
            EPG: folder.dir.replace(/\.+/g, '')
        });
    },

    playSelectedFile: function(event){
        var URL = window.URL || window.webkitURL;
        var file = this.files[0];

        if(typeof file == 'undefined') return;

        var videoPlayer = Frontgate.Apps('myTV');
        var type = file.type;
        var canPlay = videoPlayer.video.canPlayType(type);

        canPlay = (canPlay === '' ? 'no' : canPlay);
        if(canPlay === 'no'){
            videoPlayer.info('Can play type "' +type+'": '+canPlay, 'error', 10000);
            return;
        }

        videoPlayer.saveCurrentTime(videoPlayer.video);

        videoPlayer.setup({
            src: URL.createObjectURL(file),
            'data-epg':'file',
            'data-name':file.name
        });

        videoPlayer.video.play();

        // reset file input field or wont change with the same video
        this.value = '';
        videoPlayer.unselectShow();
    },

    ended: function() {
        var myTV = Frontgate.Apps('myTV');
        myTV.videoEnded = true;

        //if(window.console && window.console.info) console.info("ended", this);

        myTV.stop(this);
        //myTV.info('');
        //myTV.log('Video Show Ended');
    },

    loadedMetadata: function() {
        var videoPlayer = Frontgate.Apps("myTV");

        //console.info("loadedMetadata", this);

        // start the video at...
        this.currentTime = this.src.match(/^blob/i) ? 0 : $(this).attr('data-time');

        /*/ HD icon
        var $hd = $('#tv-panel .panel-control[data-control="HD"]');
        if($(this).attr('data-hd') == 'true') {
            $hd.css('display', 'inline-block');
            // unselect HD toggler
            if(this.videoWidth < 720) $hd.removeClass('selected');
        }
        else $hd.css('display', 'none');
        //*/

        var videoWidth = this.videoWidth;
        var videoHeight = this.videoHeight;

        if(this.videoWidth >= 1280) {
            videoWidth = 854;
            videoHeight = (videoHeight*videoWidth)/this.videoWidth;
        }

        // set video screen width
        $(videoPlayer.video).attr('width', videoWidth+'px');
        $(videoPlayer.video).attr('height', videoHeight +'px');

        //videoPlayer.videoPanel.$panel.height(this.videoHeight);
        var panelHeight = $(videoPlayer.video).height();
        if(panelHeight != window.screen.height) {
            videoPlayer.videoPanel.$panel.height($(videoPlayer.video).height());
        }

        // hide ajax gif from EPG panel
        $('a.video-show.selected').siblings('img.wait').removeClass('visible').addClass('hidden');

        // if the video Panel is not visible, fade in to top
        if(!videoPlayer.videoPanel.$panel.is(':visible')){
            // show video panel
            videoPlayer.videoPanel.toggle(false, function(){
                $('#myTV-icon').fadeIn();
            });

            videoPlayer.videoPanel.$panel.topZIndex();
        }

        //videoPlayer.log('onloadmetadata: playing '+this.src +' at '+videoPlayer.video.currentTime+'s');

        /*/var playing = decodeURIComponent(this.src).split('/');
        playing = 'Playing: '+ playing[playing.length-1];
        videoPlayer.info(playing+"\nDuration: "+Math.round(videoPlayer.video.duration/60) +' minutes');*/
    },

    status: null,

    updateToolboxItems: function(auth, user){
        $playlists = Frontgate.Apps("VideoPlayer").bar.toolbox.$bar.find('a.private-playlist');

        if(!$playlists.length) console.error("failed to get playlists");

        if(this.status == 'Authorized'){
            $playlists.css('display','block');
        }
        else $playlists.css('display','none');
    },

    auth: function(callback){
        var self = this;

        // use Frontgate credentials to myTV auth
        $.ajaxSetup({
            beforeSend: Frontgate.xhrAuth()
        });

        $.ajax({
            type: "GET",
            contentType: "application/json",
            dataType: "text",//"json",//
            url: self.API.href('auth'),
            crossDomain: true,
            error: function(xhr, result, data){
                self.status = data;//unauthorized
                if(callback) callback(result, data);
            },
            success: function(data, result, xhr){
                self.status =  JSON.parse(data);//"authorized"
                if(callback) callback(result, self.status);
            }
        });

    },

    toolbar: {
        items: [{
            el: "img",
            //html: '<img src="' +Remote.href('/graphics/icons/Icons/Icons/Movie.png')+'"  >',
            attr:{
                src: Remote.href('/graphics/icons/Icons/Icons/Movie.png'),
                //title: this.name(),
                id: 'myTV-icon'
            },
            css:{
                margin: "0 5px"
            },
            click: function(e){
                var VideoPlayer = Frontgate.Apps("myTV");
                VideoPlayer.videoPanel.toggle(e, function($panel){
                    if($panel.is(':visible')) VideoPlayer.video.play();
                    else VideoPlayer.video.pause();
                }, e);
            }
        }],

        callback: function(toolbar){
            var VideoPlayer = Frontgate.Apps("myTV");

            $("#video-browse").click(function(e){
               $('#video-show-input').click();
               return false;
            });

            $('#myTV-icon').hide()
            .hover(function(){
                $(this).attr("src", Remote.href('/graphics/icons/Icons/Icons/Movie_yellow.png'));
            },function(){
                $(this).attr("src", Remote.href('/graphics/icons/Icons/Icons/Movie.png'));
            })
            .parent()
            .css({
                "float":"right",
                "line-height": "32px",
                opacity: .9
            });

            // Playlists
            if(false) VideoPlayer.playList({
                url: '/study/Movies/public-tv-AndyGriffithShow.json',
                name: 'The Andy Griffith Show',
                title: "Public Domain Sitcoms",
                EPG: 'PublicAndyGriffithShow'
            });

            // Private playlists (MyBook Live)
            var mbl = JSON.parse(FILE.json).myBookLive;
            for(var i=0; i< mbl.length; i++){
                VideoPlayer.myBookLiveTV(mbl[i]);
            }

            var offset = $('#body div.bar').offset();
            $('#epg-panel, #tv-panel')
            .css("position", "absolute")
            .offset({
                left: offset.left,
                top: offset.top + 5
            });
        }
    }
});

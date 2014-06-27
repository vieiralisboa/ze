//REQUIRES Frontgate

Remote = window.Remote || Frontgate.location({
    hostname: "xn--stio-vpa.pt",
    protocol: "https:"
});

Situs = window.Situs || Frontgate.location({
    hostname: "situs.xn--stio-vpa.pt",
    protocol: "https:"
});

Remote.stylesheet("docs/bar/css/bar.videoPlayer.css");

(function(myTV){

    // myTV controller
    myTV.API = Frontgate.location({
        hostname: "situs.xn--stio-vpa.pt",
        protocol: "https:",
        //port: 8080,
        pathname: "/myTV"
    });

    myTV.API.auth(Frontgate.basicAuth());

    Frontgate.Apps("myTV", myTV);

    //1. load templates
    Remote.template('docs/bar/templates/videoPlayer.ol.html', function(template){
        myTV.templates.ol = template;
    });

    //2. Toolbar (Bar)
    //-------------------------------------------------------------------------
    Bar.load('#header', function(bar, data){
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
        document.querySelector('#video-show-input')
        .addEventListener('change', myTV.playSelectedFile, false);
    });

    //3. Event lsteners
    //-------------------------------------------------------------------------

    // video metadata
    myTV.video.addEventListener('loadedmetadata', myTV.loadedMetadata, false);

    // video end
    myTV.video.addEventListener('ended', function() {
        myTV.stop(this);
        myTV.info('');
        myTV.log('Video Show Ended');
    }, false);

    // window unload
    $(window).bind('unload', function () {
        //TODO save video size, EPG, etc... to restore onload
        myTV.saveCurrentTime(myTV.video);
    });

    // subscribe to video panel 'hide' event
    myTV.videoPanel.subscribeEvent('hide', function(){
        $('#myTV-icon').addClass('disabled');
    });

    // subscribe to video panel 'show' event
    myTV.videoPanel.subscribeEvent('show', function(){
         $('#myTV-icon').removeClass('disabled');
    });

    // before setting video to play
    myTV.videoPanel.subscribeEvent('beforePlay', function(attr){// <this> is this function
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

    //4. Routes
    //-------------------------------------------------------------------------
    // remote video
    Frontgate.router.on(myTV.hash('show/:folder/:video'), function(hash){
        var href = "a.video-show[href='%href%']"
            .replace("%href%", hash.res[0])
            .replace("\\","\\\\");

        var el = $(href).get(0);
        myTV.selectShow(el);
    });
    //TEST internet location
    Frontgate.router.on(myTV.hash('http:/:url'), function(hash){
        myTV.selectShow($("a.video-show[href='" + hash.res[0] + "']").get(0));
    });
    // add myBookLive playlist
    Frontgate.router.on(myTV.hash('myBookLive/:folder'), function(hash){
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
    version: [0, 7, 0],
    appName: "Video Player",
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

    // Save current video position
    //-------------------------------------------------------------------------
    saveCurrentTime: function(){
        // current playing video link
        var $el = $("a.video-show[data-src='"+$(this.video).attr('data-src')+"']");

        // link not found
        if(!$el.length) return;
        
        var time = Math.floor(this.video.currentTime),// current video time
            EPG = $(this.video).attr('data-EPG'),// Listing name
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

    // Play video
    //---------------------------------------------------------------------------
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
                //src:"http://xn--stio-vpa.pt/VideoPlayer/Turbo.2013.720p.BluRay.x264.YIFY.vtt",
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

    },

    // video attributes Constructor
    //-------------------------------------------------------------------------
    VideoData: function(data){
        if(data.src.match(/.mp4$/i)
            || data.src.match(/.m4v$/i)
            || data.src.match(/^blob/i) ) this.src = data.src;
        else this.src = data.src + '.mp4' || '';

        this['data-id'] = data['data-id'] || 0;
        this['data-EPG'] = data['data-EPG'] || '';
        this['data-name'] = data['data-name'] || '';
        this['data-vtt'] = data['data-vtt'] || false;
        this['data-time']  = data['data-time'] || 0;
        this['data-src'] = data['data-src'] || '';
        this['data-hd'] = data['data-m4v'] || false;
    },

    // sets video attributes
    //-------------------------------------------------------------------------
    setup: function(attr){
        $(this.video).attr(new this.VideoData(attr));
    },

    // Stop the video (rewind to 0)
    //-------------------------------------------------------------------------
    stop: function(video){
        video = video || this.video;

        //location.hash = 'VideoPlayer';

        // the video is playing or paused
        if(video.currentTime != 0){
            var localFile = $(video).attr('data-EPG') == 'file' ? true : false;
            // current playing video's trigger element selector 
            var trigger = 'a.video-show[data-id=' + $(video).attr('data-id') +']';
            
            // save current video position in its trigger element
            $(trigger).attr('data-time', 0);
            video.pause();
            video.currentTime = 0;

            //HACK force browsers to stop downloading
            video.autoplay = false;
            video.src = null;
            
            if(this.videoPanel.$panel.is(':visible')) this.videoPanel.$panel.toggle();

            $('#myTV-icon').fadeOut();

            // a local file is loaded
            if(localFile) return;

            var EPG = $(trigger).attr('data-EPG');
            
            // remove this source from saved videos
            delete this.listing[EPG][$(trigger).attr('data-src')];
            this.localStorage.setItem(EPG, JSON.stringify(this.listing[EPG]));
            this.localStorage.removeItems(['last'+EPG+'Name', 'last'+EPG+'Src', 'last'+EPG+'Time']);
            this.unselectShow(true);
        }
    },

    // unselects Show (EPG) list item
    //-------------------------------------------------------------------------
    unselectShow: function(){
        $('a.video-show.selected').removeClass('selected')
            .siblings('img.wait').removeClass('visible').addClass('hidden');
    },
    
    // EPG video show
    //-------------------------------------------------------------------------
    selectShow: function(el){
        if(!el){
            //alert("NOEL");
            return false;
        }

        // EPG element is already selected
        if($(el).hasClass('selected')){
            var video = this.video;
            if(!this.videoPanel.$panel.is(':visible')) 
                this.videoPanel.toggle(false, function(){
                    video.play();
                });
            return false; 
        } 

        // get video src from EPG element
        var src = $(el).attr('data-src');

        // an internet url
        if(src.match(/^http/i)){
            //
        }
        else if(src.match(/^show/i)){
            src = src.replace("\\","/");
            src = this.API.hrefAuth(src);
        } 
        else return;
        
        var data = {
            src: src,
            'data-id':  $(el).attr('data-id'),
            'data-EPG': $(el).attr('data-EPG'),
            'data-name':$(el).attr('data-name'),
            'data-vtt': $(el).attr('data-vtt'),
            'data-time':$(el).attr('data-time'),
            'data-src': $(el).attr('data-src'),
            'data-m4v': $(el).attr('data-m4v')
        };
       
        //TODO to be called from hashRouter play(el, hrefAuth('myTV/show/video.source.mp4'))  
        this.play(data, function(result, myTV){// window is <this>
            // select show trigger el
            $(el).addClass('selected').siblings('img.wait')
                .removeClass('hidden').addClass('visible');
        });
    },

    // Video Width
    //-------------------------------------------------------------------------
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

    // Video listing from the server
    //-------------------------------------------------------------------------
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

    // fades in EPG panel and/or brings panel to front
    //-------------------------------------------------------------------------
    togglePanel: function($panel){
        // if the video Panel is not visible, fade in to top
        if(!$panel.is(':visible')){
            $panel.fadeIn();
        }
        
        if( $panel.css("z-index") < $.topZIndex()) $panel.topZIndex();
    },

    // Auto Plays saved video source
    //-------------------------------------------------------------------------
    autoPlayEPG: function(EPG){
        // a video is already playing
        if(this.video.currentTime != 0) return;

        // there's no video src in storage
        if(!localStorage.getItem('last'+EPG+'Src')) return;
        
        this.selectShow($('.video-show[data-name="'
            + this.localStorage.getItem('last'+EPG+'Name') +'"]').get(0));
    },

    // Select EPG playList
    //-------------------------------------------------------------------------
    selectEPG: function(EPG, href){
        // show EPG panel
        this.togglePanel($("#epg-panel"));

        //console.info("loadEPG:", arguments);
        
        // toogle playlist
        if(this.selectEPG[EPG]) this.toggleEPG(EPG);
        // or load playlist
        else this.loadEPG(EPG, href);
    },

    toggleEPG: function(EPG, href){
        $('.epg-list').removeClass('selected');
        this.selectEPG[EPG].addClass('selected');
        this.autoPlayEPG(EPG);
    },

    // loads EPG playList from sever
    //-------------------------------------------------------------------------
    loadEPG: function(EPG, href){
        var self = this;

        this.getVideoList(href, function(list){
            var shows = [];
            if(list.length) {
                for(var i in list) {
                    shows.push(new self.Show(list[i]));
                }
            }
            self.selectEPG[EPG] = self.makeEPG(EPG, shows);
            self.toggleEPG(EPG);
        });
    },

    // EPG Render List
    //-------------------------------------------------------------------------
    makeEPG: function(EPG, list){
        if(!EPG || !list.length){
            return $('<ol>').addClass('epg-list')
                .html('<i>' + EPG + '</i><br>Not Available')
                .appendTo('#epg-panel');
        }

        this.listing = this.listing || {};

        // get saved (show) time positions
        this.listing[EPG] = $.parseJSON(this.localStorage.getItem(EPG)) || {};
        
        // delete shows no longer in the list
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
        
        var N = 128;
        if(list.length > N) list = list.slice(0, N);
        
        for(var n in list){
            if(EPG == "movies/2013" || EPG == "movies/2014"){
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
            items: list
        })).appendTo('#epg-panel');

        $('ol.epg-list li[data-cc=true] span.closed-caption').removeClass('hidden');
        $('ol.epg-list li[data-hd=true] span.high-def').removeClass('hidden');

        return $list;
    },

    // EPG playlist urls
    EPG: {},

    // adds a playlist button to the toolbox
    playList: function(playlist){
        var cssClass = playlist.url.match(/dir/)? 'private-playlist':
                    'public-playlist';

        var data = {
            text: playlist.name,
            css: {},
            attr: {
                'data-toggle': 'playlist',
                'class': cssClass,
                href: '#VideoPlayer/EPG/' + playlist.EPG,
                title: playlist.title
            },
            click: function(){
                if(!$("#epg-panel").is(":visible")
                        && location.hash == '#VideoPlayer/EPG/' + playlist.EPG)
                    $("#epg-panel").fadeIn();
            }
        };

        if(this.status != "Authorized"
                && data.attr['class'] == 'private-playlist'){
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
                        'data-EPG': $(videoPlayer.video).attr('data-EPG'),
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
                    if(url.match(/\/\/www\.youtube\.com\//i)){//http://www.youtube.com/watch?feature=player_detailpage&v=oOgF7jUaYzY
                        //myTV.log('youtube video');

                        var v = url.match(/v=(.*)$/);
                        var src = 'http://www.youtube.com/embed/'+v[1]+'?html5=1';
                        videoPlayer.newWindow(src, 'TV');
                    };   

                    videoPlayer.saveCurrentTime(videoPlayer.video);
                    videoPlayer.setup({
                        'data-EPG':'url',
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
    newWindow: function(url, name){
        // pop-up window|dialog,modal,fullscreen=no,toolbar=no,status=no,menubar=no,scrollbars=no,
        var newWindow = window.open(url, name, 'resizable=no, height=270, width=480');
        if (window.focus) newWindow.focus();
    },
    
    // Video popup
    popup: function(video){
        video = video || this.video;
        video.pause();

        if($(video).attr('data-EPG') == 'file'){
            // pop-up window|dialog,modal,fullscreen=no,toolbar=no,status=no,menubar=no,scrollbars=no,
            newwindow = window.open(video.src, 'TV', 'resizable=no, height=405, width=720');
            if (window.focus) newwindow.focus();
            this.stop(video);
            return false;
        }
        else {
            //TODO include video name and current time in the hash
            var hash = '#';
            hash += video.src.replace(/\w+\:\w+\@/, '');
            hash += '&' + Math.floor(video.currentTime);
            var url = Remote.href("docs/bar/templates/popup.html") + hash;
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
        if(!folder || !folder.match(/^.*$/)) return false;
        var name = folder.replace(/\.S[0-9]+$/i, '');

        name = name.replace(/\.+/g, ' ');
        
        var season = folder.match(/S([0-9]+)$/i);
        if(season) season = ' Season '+ parseInt(season[1]);
        else season = '';

        //return data;
        this.playList({
            url: '/dir/' + folder,
            name: name,
            title: name + season,
            EPG: folder.replace(/\.+/g, '')
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
            'data-EPG':'file',
            'data-name':file.name
        });
        videoPlayer.video.play();
        // reset file input field or wont change with the same video
        this.value = '';
        videoPlayer.unselectShow();
    },

    loadedMetadata: function() {
        var videoPlayer = Frontgate.Apps("myTV");
        // start the video at...
        this.currentTime = this.src.match(/^blob/i)? 0: // 0 for blobs
            $(this).attr('data-time');

        // HD icon
        var $hd = $('#tv-panel .panel-control[data-control="HD"]');
        if($(this).attr('data-hd') == 'true') {
            $hd.css('display', 'inline-block');
            // unselect HD toggler
            if(this.videoWidth < 720) $hd.removeClass('selected');
        }
        else $hd.css('display', 'none');

        var videoWidth = this.videoWidth;
        var videoHeight = this.videoHeight;
        
        // set video screen width
        if(this.videoWidth >= 1280){
            videoWidth = 854;
            videoHeight = (videoHeight*videoWidth)/this.videoWidth;
        }
        
        $(videoPlayer.video).attr('width', videoWidth+'px');
        $(videoPlayer.video).attr('height', videoHeight +'px');

        //videoPlayer.videoPanel.$panel.height(this.videoHeight);
        videoPlayer.videoPanel.$panel.height($(videoPlayer.video).height());

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
            VideoPlayer.playList({
                url: '/study/Movies/public-tv-AndyGriffithShow.json',
                name: 'The Andy Griffith Show',
                title: "Public Domain Sitcoms",
                EPG: 'PublicAndyGriffithShow'
            });

            // Private playlists
            //VideoPlayer.myBookLiveTV('tv-shows/Adventure.Time.S05');
            VideoPlayer.myBookLiveTV('NEW');
            VideoPlayer.myBookLiveTV('movies/2013');
            VideoPlayer.myBookLiveTV('movies/2014');

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

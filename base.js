OpenLayers.ProxyHost = "/code/proxy.cgi?url="; // キャッシュのときに必要
var map;
var initLayerSetteiList;
var show;
var indi = new jsgt_Indicator('img/pleasewait.gif');

jQuery(function($) { 
    var appCache = window.applicationCache;
    appCache.addEventListener("updateready", function() {
        if (confirm('新しいバージョンがあります。更新しますか？')) {
            appCache.swapCache();
            location.reload();
        }
    });
    if (navigator.onLine) {
        appCache.update();
    }
});


// fix height of content
function fixContentHeight() {
    if ($("div[data-role='dialog']:visible").length == 0) {
        var footer = $("div[data-role='footer']:visible"), 
        header = $("div[data-role='header']:visible"), 
        content = $("div[data-role='content']:visible:visible"), 
        viewHeight = window.innerHeight ? window.innerHeight : $(window)
        .height(), 
        contentHeight = viewHeight - footer.outerHeight() - header.outerHeight();
        if ((content.outerHeight() + footer.outerHeight() + header.outerHeight()) !== viewHeight) {
            contentHeight -= (content.outerHeight() - content.height());
            content.height(contentHeight);
        }
        if (window.map && window.map instanceof OpenLayers.Map) {
            map.updateSize();
        } else {
            init();
        }
    }
}

$(window)
.bind("orientationchange resize pageshow scroll", fixContentHeight);
window.location.replace(window.location.href.split("#")[0] + "#mappage");




function init() {
    var bookmark_no = 0;
    var clickLatLng;
    var cacheWrite;
    var cacheRead;
    var cacheRead2;
    var drawControls;
    var selectControl;
    var selectedFeature;
    var lineCtrl;
    var highlightCtrl;
    var selectCtrl;
    var splitCtrl;
    var firstGeolocation = true;
    var position_layer;
    var marker_layer;
    var track_layer;
    var currPos;
    var marker;
    var track;
    var selectedFeature = null;
    var locatestates = 0;
    var localmap;
    var myimage;
    var dataSet1 = {
        0: null,1: null,2: null,3: null,4: null,
        5: {dataId: "RELIEF"},
        6: {dataId: "RELIEF"},
        7: {dataId: "RELIEF"},
        8: {dataId: "RELIEF"},
        9: {dataId: "BAFD1000K2"},
        10: {dataId: "BAFD1000K2"},
        11: {dataId: "BAFD1000K2"},
        12: {dataId: "BAFD200K2"},
        13: {dataId: "BAFD200K2"},
        14: {dataId: "BAFD200K2"},
        15: {dataId: "DJBMM"},
        16: {dataId: "DJBMM"},
        17: {dataId: "DJBMM"}
    };
    var dataSet2 = {
        0: null,1: null,2: null,3: null,4: null,
        5: {dataId: "JAIS"},
        6: {dataId: "JAIS"},
        7: {dataId: "JAIS"},
        8: {dataId: "JAIS"},
        9: {dataId: "BAFD1000K"},
        10: {dataId: "BAFD1000K"},
        11: {dataId: "BAFD1000K"},
        12: {dataId: "BAFD200K"},
        13: {dataId: "BAFD200K"},
        14: {dataId: "BAFD200K"},
        15: {dataId: "DJBMO"},
        16: {dataId: "DJBMO"},
        17: {dataId: "DJBMO"},
        18: {dataId: "TOHO2"}
    };
    OpenLayers.Renderer.symbol.arrow = [0, 2, 1, 0, 2, 2, 1, 0, 0, 2];
    OpenLayers.Renderer.symbol.position = [3, 0, 0, 8, 3, 6, 6, 8, 3, 0];
    /// for geolocation
    var style = {
        fillColor: '#000',
        fillOpacity: 0.1,
        strokeWidth: 0
    };
    /************マップ＆レイヤ*************************************************************************/
    //////////マップ
    map = new OpenLayers.Map('map', {
        controls: [new OpenLayers.Control.Navigation(), 
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                },defaultDblClick: function() {
                }
            })],
        projection: new OpenLayers.Projection("EPSG:900913"), //明示しないとTMSが表示されない!
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
//	panMethod:OpenLayers.Easing.Expo.easeOut,
//	panDuration:100
    });
    map.restrictedExtent = new OpenLayers.Bounds(13595088, 1878334, 17559692, 5971435);
    //ズームの制限。電子国土の0～4：nullに対応するため。
    map.newMoveTo = map.moveTo;
    map.moveTo = function(lonlat, zoom, options) {
        return (zoom >= 5 && zoom <= 18) ? map.newMoveTo(lonlat, zoom, options) : false;
    };
    ////////電子国土
    cjp_layer = new webtis.Layer.BaseMap("電子国土", {
        dataSet: dataSet1,
        transitionEffect: 'resize'
    });
    cjp_layer.updateAttribution = function() {
        this.attribution = "<img src='img/cjpicon.png'/>"
    };
    map.addLayer(cjp_layer);
    ///////現在地
    position_layer = new OpenLayers.Layer.Vector('arrow', {
        'displayInLayerSwitcher': false
    });
    ///////トラック
    track_layer = new OpenLayers.Layer.Vector('track', {
        'displayInLayerSwitcher': false
    });
    ///////マーカー
    marker_layer = new OpenLayers.Layer.Vector('marker', {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: 'img/red-pin.png',
            graphicWidth: 32,
            graphicHeight: 37,
            graphicXOffset: -9,
            graphicYOffset: -32,
            cursor: 'pointer'
        }),
        'displayInLayerSwitcher': false
    });
    //////入力データ   
    edit_layer = new OpenLayers.Layer.Vector("Editable", {
        'displayInLayerSwitcher': false
    });
    edit_layer.onFeatureInsert = function(feature) {
        localStorage.setItem('inputdata', geojson.write(edit_layer.features));
    };
    
    edit_layer.events.on({
        'featureselected': function(evt) {
            marker = evt.feature;
            selectControl.unselect(marker);
            var feature_id = marker.attributes.id;
            var feature_name = marker.attributes.name;
            var feature_memo = marker.attributes.memo;
            if (feature_id == null)
                feature_id = "";
            if (feature_name == null)
                feature_name = "";
            if (feature_memo == null)
                feature_memo = "";
            $("#feature_id")
            .val(feature_id);
            $("#feature_name")
            .val(feature_name);
            $("#feature_memo")
            .val(feature_memo);
            $('#featurepage').popup();
            $('#featurepage').popup("open");
        
        }
    });
    
    map.addLayer(position_layer);
    map.addLayer(track_layer);
    map.addLayer(marker_layer);
    map.addLayer(edit_layer);

    /********   Layer   ***************************************/
    if (window.navigator.onLine) {
        $.getScript("http://www.google.com/jsapi", function() {
            google.load("maps", "3", {
                "other_params": "sensor=false",
                "callback": "initLayerSetteiList"
            });
        });
    } else {
    /* $(document)
            .ready(function () {
            initLayerSetteiList();
        });*/
    }
    
    initLayerSetteiList = function() {

        ////////電子国土写真
        cjpphoto_layer = new webtis.Layer.BaseMap("電子国土(写真)", {
            dataSet: dataSet2,
            transitionEffect: 'resize'
        });
        cjpphoto_layer.updateAttribution = function() {
            this.attribution = "<img src='img/cjpicon.png'/>"
        }
        map.addLayer(cjpphoto_layer);
        //////google//////////
        map.addLayer(new OpenLayers.Layer.Google("google street"));
        map.addLayer(new OpenLayers.Layer.Google("google satellite", {
            type: google.maps.MapTypeId.SATELLITE,
            numZoomLevels: 20
        }));
        map.addLayer(new OpenLayers.Layer.Google("google terrain", {
            type: google.maps.MapTypeId.TERRAIN
        }));
        //////プレゼン//////////
        prezen_layer = new OpenLayers.Layer.TMS("foss4g", "http://www.ecoris.co.jp/map/data/prezen/slide/", {
            sphericalMercator: true,
            isBaseLayer: false,
            type: "png",
            alpha: true,
            layername: ".",
            serviceVersion: ".",
            opacity: 1.0
        });
        prezen_layer.setVisibility(false);
        map.addLayer(prezen_layer);

        //////シームレス地質図//////////
        var tisitu_layer = new OpenLayers.Layer.XYZ("シームレス地質図", "http://riodb02.ibase.aist.go.jp/db084/basic/glfn/${z}/${y}/${x}.png", {
            opacity: 0.7,
            isBaseLayer: false,
            sphericalMercator: true,
            attribution: "<img src='img/aist_logo_l.png'/>"
        });
        tisitu_layer.setVisibility(false);
        map.addLayer(tisitu_layer);
        
        OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
            defaultHandlerOptions: {
                'single': true,
                'double': false,
                'pixelTolerance': 0,
                'stopSingle': false,
                'stopDouble': false
            },
            initialize: function(options) {
                this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
                OpenLayers.Control.prototype.initialize.apply(
                this, arguments);
                this.handler = new OpenLayers.Handler.Click(
                this, {
                    'click': this.trigger
                }, this.handlerOptions);
            },
            trigger: function(e) {
                if (tisitu_layer.getVisibility() && $("#mappage:visible")
                .length != 0) {
                    clickLatLng = map.getLonLatFromViewPortPx(e.xy);
                    var position = clickLatLng.clone()
                    .transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326")); // show()関数で利用するためにコピー
                    var _ll = position.lat + ',' + position.lon;
                    var _query = 'type=basic&latlng=' + _ll + '&callback=show';
                    var _script = document.createElement('script');
                    _script.setAttribute('src', 'http://riodb02.ibase.aist.go.jp/db084/php/featureinfo.php?' + _query);
                    document.getElementsByTagName('body')[0].appendChild(_script);
                }
            }
        });
        var click = new OpenLayers.Control.Click();
        map.addControl(click);
        click.activate();
        //////植生//////////
        var syokusei_layer = new OpenLayers.Layer.Vector("植生図", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            styleMap: new OpenLayers.StyleMap(),
            protocol: new OpenLayers.Protocol.HTTP({
                url: "data/syokusei.kml",
                format: new OpenLayers.Format.KML({kvpAttributes: true})
            }),
            projection: map.displayProjection,
            attribution: "環境省第6,7回自然環境保全基礎調査"
        });
        syokusei_layer.setVisibility(false);
        syokusei_layer.setOpacity(0.7);
        map.addLayer(syokusei_layer);
        var syokusei_selectControl = new OpenLayers.Control.SelectFeature(syokusei_layer);
        syokusei_layer.events.on({
            'featureselected': function(evt) {
                
                marker = evt.feature;
                //syokusei_selectControl.unselect(marker);
                var feature_id = marker.attributes.HANREI_C;
                var feature_name = marker.attributes.HANREI_N;
                var feature_memo = marker.attributes.DAI_N;
                if (feature_id == null)
                    feature_id = "";
                if (feature_name == null)
                    feature_name = "";
                if (feature_memo == null)
                    feature_memo = "";
                popup = new OpenLayers.Popup.FramedCloud("feature", marker.geometry.bounds.getCenterLonLat(), 
                null, '<div style="font-size:small;width:250px;">No. ' + feature_id + '<br />' + feature_name + '</div>', 
                null, true);
                map.addPopup(popup, true);
            /*
            $("#feature_id")
                .val(feature_id);
            $("#feature_name")
                .val(feature_name);
            $("#feature_memo")
                .val(feature_memo);
            $.mobile.changePage('#featurepage');
*/
            }
        });
        map.addControl(syokusei_selectControl);
        syokusei_selectControl.activate();
        
        var format = new OpenLayers.Format.SLD();
        OpenLayers.Request.GET({
            url: "data/syokusei.sld",
            success: complete
        });
        function complete(req) {
            sld = format.read(req.responseXML || req.responseText);
            syokusei_layer.styleMap.styles["default"] = sld.namedLayers["p594123"].userStyles[0];
            syokusei_layer.redraw();
        }
        //////分布予測//////////
        maxent_layer = new OpenLayers.Layer.TMS("分布予測", "http://www.ecoris.co.jp/map/data/ecoris/maxent_clip_rgb/", {
            sphericalMercator: true,
            isBaseLayer: false,
            type: "png",
            alpha: true,
            layername: ".",
            serviceVersion: ".",
            attribution: "環境省第5回自然環境保全基礎調査,国土地理院（承認番号 平22業使、第133号）",
            opacity: 0.8
        });
        maxent_layer.setVisibility(false);
        map.addLayer(maxent_layer);
        //////生息地//////////
        var seisokuti_layer = new OpenLayers.Layer.Vector("生息地", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: "data/ecoris/kumataka.txt",
                format: new OpenLayers.Format.Text()
            }),
            projection: map.displayProjection,
            attribution: "ecoris"
        });
        seisokuti_layer.setVisibility(false);
        map.addLayer(seisokuti_layer);
        //////歴史的農業環境//////////
        var noukankyou_tokyo_layer = new OpenLayers.Layer.TMS("歴史的農業環境", "http://www.finds.jp/ws/tms/", {
            layername: "Kanto_Rapid-900913",
            type: "png",
            attribution: '<a href="http://www.finds.jp/wsdocs/hawms/index.html.ja">歴史的農業環境WMS配信サービス</a>',
            isBaseLayer: false
        });
        noukankyou_tokyo_layer.setVisibility(false);
        map.addLayer(noukankyou_tokyo_layer);
        //////geohex//////////
        var geohex_layer = new OpenLayers.Layer.XYZ("geohex", "http://www.ecoris.co.jp/map/data/geohex/${z}/${x}/${y}.png", {
            sphericalMercator: true,
            isBaseLayer: false,
            opacity: 1.0,
            attribution: 'GeoHex</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="http://geogames.net" property="cc:attributionName" rel="cc:attributionURL">sa2da</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/2.1/jp/">Creative Commons BY-SA 2.1 Japan License</a>.<a rel="license" href="http://creativecommons.org/licenses/by-sa/2.1/jp/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-sa/2.1/jp/80x15.png" /></a>'
        });
        geohex_layer.setVisibility(false);
        map.addLayer(geohex_layer);
        //////geohex_utf//////////
        var geohex_utfgrid_layer = new OpenLayers.Layer.UTFGrid({
            url: "http://www.ecoris.co.jp/map/data/geohex_utfgrid/${z}/${x}/${y}.json",
            utfgridResolution: 4, // default is 2
            displayInLayerSwitcher: false
        });
        map.addLayer(geohex_utfgrid_layer);
        
        var callback = function(infoLookup, loc, pixel) {
            if (!geohex_layer.getVisibility()) {
                $("#hexcode").html("&nbsp;");
                return;
            }
            var msg = "";
            if (infoLookup) {
                var info;
                for (var idx in infoLookup) {
                    // idx can be used to retrieve layer from map.layers[idx]
                    info = infoLookup[idx];
                    if (info && info.data) {
                        $("#hexcode").html(info.data.hexcode);
                    } else {
                        $("#hexcode").html("&nbsp;");
                    }
                }
            }
        };
	        
        map.addControl(new OpenLayers.Control.UTFGrid({
            callback: callback,
            handlerMode: "move"
        }));

        /////////順番入れ替え////////////////////
        map.setLayerIndex(position_layer, 97);
        map.setLayerIndex(track_layer, 98);
        map.setLayerIndex(marker_layer, 99);
        map.setLayerIndex(edit_layer, 100);
    }

    ////////////////コントロール
    
    
    selectControl = new OpenLayers.Control.SelectFeature(marker_layer);
    marker_layer.events.on({
        'featureselected': function(evt) {
            marker = evt.feature;
            selectControl.unselect(marker);
            $("#marker_id")
            .val(marker.attributes.id);
            $("#marker_name")
            .val(marker.attributes.name);
            $("#marker_memo")
            .val(marker.attributes.memo);
            $('#markerpage').popup();
            $('#markerpage').popup("open");
        }
    });
    map.addControl(selectControl);
    selectControl.activate();
    
    var select = new OpenLayers.Control.SelectFeature(edit_layer);
    var editToolBar = new OpenLayers.Control.EditingToolbar(edit_layer, {
        allowDepress: true
    });
    editToolBar.addControls(select);
    map.addControl(editToolBar);
    editToolBar.controls[0].deactivate();

    //////////////////////////
    /*
    map.addControl(new OpenLayers.Control.MousePosition( {id: "ll_mouse", formatOutput: formatLonlats} ));
    function formatLonlats(lonLat) {
        var lat = lonLat.lat;
        var long = lonLat.lon;
        var ns = OpenLayers.Util.getFormattedLonLat(lat);
        var ew = OpenLayers.Util.getFormattedLonLat(long,'lon');
        return ns + ', ' + ew + ' (' + (Math.round(lat * 10000) / 10000) + ', ' + (Math.round(long * 10000) / 10000) + ')';
    }
    */
    /************************************************************************/
    map.addControl(new OpenLayers.Control.Attribution());
    map.addControl(new OpenLayers.Control.LayerSwitcher({}));
    var _zoom = localStorage.getItem('zoom');
    var _lon = localStorage.getItem('lon');
    var _lat = localStorage.getItem('lat');
    var _center;
    if (_zoom == null)
        _zoom = 7;
    if (_lon == null || _lat == null) {
        _center = new OpenLayers.LonLat(140, 36)
        .transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
    } else {
        _center = new OpenLayers.LonLat(_lon, _lat);
    }
    map.setCenter(_center, _zoom);
    /**************************設定 *************************************/
    /******************* init localstorage *****************************/
    if (localStorage.getItem('track_visible') == null)
        localStorage.setItem('track_visible', 'on');
    if (localStorage.getItem('marker_visible') == null)
        localStorage.setItem('marker_visible', 'on');
    if (localStorage.getItem('localmap_visible') == null)
        localStorage.setItem('localmap_visible', 'on');
    //if(localStorage.getItem('localmap') == null) localStorage.setItem('localmap','');
    //////他の変数も？
    /******************** localmap ********************************/
    if (localStorage.getItem('localmap') != null) {
        var lmv = $("#localmap_visible")
        if (localStorage.getItem('localmap_visible') == "on") {
            localmap.setVisibility(true);
            lmv.val("on");
        } else {
            localmap.setVisibility(false);
            lmv.val("off");
        }
    //表示
    }
    /******************** ローカルストレージ読み出し 入力データ *************************************/
    geojson = new OpenLayers.Format.GeoJSON();
    var geo_data = geojson.read(localStorage.getItem('inputdata'));
    if (geo_data != null)
        edit_layer.addFeatures(geo_data);

    /******************** ローカルストレージ読み出し marker *************************************/
    var mv = $("#marker_visible")
    if (localStorage.getItem('marker_visible') == "on") {
        marker_layer.setVisibility(true);
        mv.val("on");
    } else {
        marker_layer.setVisibility(false);
        mv.val("off");
    }
    var marker_data = geojson.read(localStorage.getItem('marker'));
    if (marker_data != null)
        marker_layer.addFeatures(marker_data);

    /******************** ローカルストレージ読み出し track *************************************/
    var tv = $("#track_visible")
    if (localStorage.getItem('track_visible') == "on") {
        track_layer.setVisibility(true);
        tv.val("on");
    } else {
        track_layer.setVisibility(false);
        tv.val("off");
    }
    
    var track_data = geojson.read(localStorage.getItem('track'));
    if (track_data != null) {
        for (var i = 0; i < track_data.length; i++) {
            track_data[i].style = {
                strokeColor: '#f00',
                strokeWidth: 2,
                strokeOpacity: 0.8,
                strokeDashstyle: "dot"
            };
        }
        track_layer.addFeatures(track_data);
    }
    var _trackpoints = localStorage.getItem('trackpoints');
    if (_trackpoints != null) {
        var _tracktext = "LINESTRING(" + _trackpoints.slice(0, -1) + ")";
        var _trackline = OpenLayers.Geometry.fromWKT(_tracktext);
        var _track = new OpenLayers.Feature.Vector(_trackline, {}, {
            strokeColor: '#000',
            strokeWidth: 2,
            strokeOpacity: 0.8,
            strokeDashstyle: "dot"
        });
        track_layer.addFeatures(_track);
        track = _track;
    }

    /********   Bookmark   ***************************************/
    initBookmarkList();
    
    function initBookmarkList() {
        $('#bookmarkpage').page();
        var objs = JSON.parse(localStorage.getItem('bookmark'));
        if (objs == null)
            objs = [];
        for (var i = 0; i < objs.length; i++) {
            addBookmarkToList(objs[i], i + 1);
        }
        $('#bookmarklist').listview('refresh');
    }
    
    function addBookmarkToList(obj, num) {
        var item = $('<li>')
        .append($('<a />', {
            text: obj.name,
            "id": "bookmark" + num
        })
        .click(function() {
            bookmark_no = num;
            map.setCenter(new OpenLayers.LonLat(obj.lon, obj.lat), obj.zoom);
            $.mobile.changePage('#mappage');
        }))
        .appendTo('#bookmarklist');
        item.append($('<a />', {
            text: num,
            "class": "deleteMe"
        }));
    }

    /************************ Cache ************************************************/
    // try cache before loading from remote resource
    cacheRead = new OpenLayers.Control.CacheRead();
    cacheWrite = new OpenLayers.Control.CacheWrite({
        //	autoActivate: true,
        imageFormat: "image/jpeg",
        eventListeners: {
            cachefull: function() {
                alert("cache full");
                if (seeding) {
                    stopSeeding();
                }
            }
        }
    });
    if (!window.navigator.onLine) map.addControl(cacheRead); //chromeでは、キャッシュデータとfusion tablesを重ねると黒くなるため
    map.addControl(cacheWrite);
    // start seeding the cache
    function startSeeding() {
        OpenLayers.Control.CacheWrite.clearCache(); //最初にキャッシュを消す。
        var layer = cjp_layer, 
        zoom = map.getZoom();
        seeding = {
            zoom: zoom,
            extent: map.getExtent(),
            center: map.getCenter(),
            cacheWriteActive: cacheWrite.active,
            buffer: layer.buffer,
            layer: layer
        };
        // make sure the next setCenter triggers a load
        map.zoomTo(zoom === layer.numZoomLevels - 1 ? zoom - 1 : zoom + 1);
        // turn on cache writing
        cacheWrite.activate();
        // turn off cache reading
        cacheRead.deactivate();
        layer.events.register("loadend", null, seed);
        // start seeding
        map.setCenter(seeding.center, zoom);
    }
    // seed a zoom level based on the extent at the time startSeeding was called
    function seed() {
        stopSeeding(); /////////////表示しているものだけキャッシュするのでここでストップ
    /*
        var layer = seeding.layer;
        var tileWidth = layer.tileSize.w;
        var nextZoom = map.getZoom() + 1;
        var extentWidth = seeding.extent.getWidth() / map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        map.zoomIn();
        if (nextZoom === layer.numZoomLevels - 1) {
            stopSeeding();
        }
	*/
    }
    // stop seeding (when done or when cache is full)
    function stopSeeding() {
        // we're done - restore previous settings
        seeding.layer.events.unregister("loadend", null, seed);
        seeding.layer.buffer = seeding.buffer;
        map.setCenter(seeding.center, seeding.zoom);
        if (!seeding.cacheWriteActive) {
            cacheWrite.deactivate();
        }
        seeding = false;
    }
    /******************** geo location ******************************/
    
    var geolocate = new OpenLayers.Control.Geolocate({
        bind: false,
        geolocationOptions: {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
        }
    });
    map.addControl(geolocate);
    
    geolocate.events.register("locationupdated", geolocate, function(e) {
        currPos = new OpenLayers.LonLat(e.point.x, e.point.y);
        position_layer.removeAllFeatures();
        var circle = new OpenLayers.Feature.Vector(
        OpenLayers.Geometry.Polygon.createRegularPolygon(
        new OpenLayers.Geometry.Point(e.point.x, e.point.y), e.position.coords.accuracy / 2, 40, 0), {}, style);
        var heading = e.position.coords.heading;
        if (heading == null)
            heading = 0;
        position_layer.addFeatures([
            new OpenLayers.Feature.Vector(
            e.point, {}, {
                graphicName: 'position',
                strokeColor: '#f00',
                strokeWidth: 2,
                strokeOpacity: 0.8,
                fillColor: "#f00",
                fillOpacity: 0.8,
                pointRadius: 10,
                rotation: heading
            }), circle]);
        position_layer.redraw(true);
        if (firstGeolocation) {
            //map.zoomToExtent(position_layer.getDataExtent());
            mypanTo(currPos);
            firstGeolocation = false;
        } else if (e.position.coords.accuracy < 100) {
            var _trackpoints = localStorage.getItem('trackpoints');
            if (_trackpoints == null)
                _trackpoints = "";
            _trackpoints = _trackpoints + e.point.x + " " + e.point.y + ","; //wkt(kmlと空白の使い方が逆)
            var _tracktext = "LINESTRING(" + _trackpoints.slice(0, -1) + ")";
            var _trackline = OpenLayers.Geometry.fromWKT(_tracktext);
            var _track = new OpenLayers.Feature.Vector(_trackline, {}, {
                strokeColor: '#000',
                strokeWidth: 2,
                strokeOpacity: 0.8,
                strokeDashstyle: "dot"
            });
            if (track != null)
                track_layer.removeFeatures([track]);
            track_layer.addFeatures([_track]);
            track_layer.redraw(true);
            track = _track;
            localStorage.setItem('trackpoints', _trackpoints);
        }
    });
    
    $("#indidiv").css({
        top: $(window)
        .height() / 2 - 7,
        left: $(window)
        .width() / 2 - 107
    });
    indi.indi_append("indidiv");
    
    function dataExport() {
        $("#fade")
        .css({
            display: "block"
        });
        indi.indi_start();


        /*feature*/
        var geojson_inputdata = JSON.parse(localStorage.getItem('inputdata'));
        var feature_point = "";
        var feature_line = "";
        var feature_polygon = "";
        if (geojson_inputdata != null) {
            var export_inputdata = geojson2export(geojson_inputdata, "inputdata");
            feature_point = export_inputdata[0];
            feature_line = export_inputdata[1];
            feature_polygon = export_inputdata[2];
        }
        /*marker*/
        var geojson_marker = JSON.parse(localStorage.getItem('marker'));
        var _marker = "";
        if (geojson_marker != null) {
            var export_marker = geojson2export(geojson_marker, "marker_track");
            _marker = export_marker[0];
        }
        /*track*/
        var geojson_track = JSON.parse(localStorage.getItem('track'));
        var _track = "";
        if (geojson_track != null) {
            var export_track = geojson2export(geojson_track, "marker_track");
            _track = export_track[1];
        }
        
        var _table = $("#exporttable_name")
        .val();
        var fd = new FormData();
        fd.append("table", _table);
        fd.append("mdata", _marker);
        fd.append("tdata", _track);
        fd.append("pdata", feature_point);
        fd.append("ldata", feature_line);
        fd.append("ydata", feature_polygon);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "export.php", true);
        xhr.send(fd);
        xhr.onload = function(e) {
            alert(e.target.responseText);
            indi.indi_stop();
            $("#fade").css({
                display: "none"
            });
        }
    
    }
    
    function dataImport() {
        $("#fade").css({
            display: "block"
        });
        indi.indi_start();
        var _table = $("#importtable_name")
        .val();
        var fd = new FormData();
        fd.append("table", _table);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "import.php", true);
        xhr.send(fd);
        xhr.onload = function(e) {
            var _tabledata = e.target.responseText.split("\n");
            if (_tabledata.length == 1)
                alert(e.target.responseText);
            for (var i = 1; i < _tabledata.length; i++) {
                var _data = _tabledata[i].split(",");
                _tabledata[i].match(/<coordinates>(.*)<\/coordinates>/);
                var _points = (RegExp.$1)
                .split(" ");
                var _pos = "";
                for (var j = 0; j < _points.length; j++) {
                    var _ll = _points[j].split(",");
                    var _point = new OpenLayers.LonLat(_ll[0], _ll[1])
                    .transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
                    _pos = _pos + _point.lon + " " + _point.lat + ",";
                }
                
                if (_data[0] == 'marker') {
                    addMarker(_pos.slice(0, -1), _data[1], _data[2], _data[3]);
                } else if (_data[0] == 'track') {
                    addTrack(_pos.slice(0, -1), _data[1], _data[2], _data[3]);
                } else if (_data[0] == 'feature_point' || _data[0] == 'feature_line' || _data[0] == 'feature_polygon') {
                    _pos = _pos.slice(0, -1);
                    var _wkt
                    if (_data[0] == 'feature_point') {
                        _wkt = "POINT(" + _pos + ")";
                    } else if (_data[0] == 'feature_line') {
                        _wkt = "LINESTRING(" + _pos + ")";
                    } else if (_data[0] == 'feature_polygon') {
                        _wkt = "POLYGON(" + _pos + ")";
                    }
                    var _geometry = OpenLayers.Geometry.fromWKT(_wkt);
                    _vector = new OpenLayers.Feature.Vector(_geometry);
                    edit_layer.addFeatures([_vector]);
                    _vector.attributes.id = _data[1];
                    _vector.attributes.name = _data[2];
                    _vector.attributes.memo = _data[3];
                }
            }
            localStorage.setItem('inputdata', geojson.write(edit_layer.features));
            indi.indi_stop();
            $("#fade")
            .css({
                display: "none"
            });
        }
    
    }
    
    function geojson2export(_geojson_data, _type) {
        var _feature_point = "";
        var _feature_line = "";
        var _feature_polygon = "";
        if (_geojson_data != null) {
            for (var i = 0; i < _geojson_data.features.length; i++) {
                var obj = _geojson_data.features[i];
                var feature_type = obj.geometry.type;
                var _lls = obj.geometry.coordinates;
                var _pointtext = "";
                if (feature_type == "Point") { //_llsにポイントが入っている。
                    var _point = new OpenLayers.LonLat(_lls[0], _lls[1]).transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
                    _pointtext = _pointtext + _point.lon + "," + _point.lat + " ";
                } else {
                    if (feature_type == "Polygon")
                        _lls = obj.geometry.coordinates[0]; //ドーナツポリゴンは今は扱わない
                    
                    for (var j = 0; j < _lls.length; j++) {
                        var _ll = _lls[j];
                        var _point = new OpenLayers.LonLat(_ll[0], _ll[1])
                        .transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
                        _pointtext = _pointtext + _point.lon + "," + _point.lat + " ";
                    }
                }
                var _id = "";
                var _name = "";
                var _memo = "";
                if (obj.properties.id != null)
                    _id = obj.properties.id;
                if (obj.properties.name != null)
                    _name = obj.properties.name;
                if (obj.properties.memo != null)
                    _memo = obj.properties.memo;
                if (_type == "inputdata") {
                    if (feature_type == "Point")
                        _feature_point = _feature_point + "-" + "feature_point/" + _id + "/" + _name + "/" + _memo + "/" + _pointtext.slice(0, -1);
                    if (feature_type == "LineString")
                        _feature_line = _feature_line + "-" + "feature_line/" + _id + "/" + _name + "/" + _memo + "/" + _pointtext.slice(0, -1);
                    if (feature_type == "Polygon")
                        _feature_polygon = _feature_polygon + "-" + "feature_polygon/" + _id + "/" + _name + "/" + _memo + "/" + _pointtext.slice(0, -1);
                } else if (_type == "marker_track") {
                    if (feature_type == "Point")
                        _feature_point = _feature_point + "-" + "marker/" + _id + "/" + _name + "/" + _memo + "/" + _pointtext.slice(0, -1);
                    if (feature_type == "LineString")
                        _feature_line = _feature_line + "-" + "track/" + _id + "/" + _name + "/" + _memo + "/" + _pointtext.slice(0, -1);
                    if (feature_type == "Polygon")
                        _feature_polygon = ""; //なし
                }
            }
            return [_feature_point.slice(1), _feature_line.slice(1), _feature_polygon.slice(1)];
        }
    }
    
    show = function(_data) { // 凡例情報が取得できたときに呼び出される関数
        popup = new OpenLayers.Popup.FramedCloud("feature", 
        clickLatLng, 
        null, '<div style="font-size:small;width:250px;">No. ' + _data.ID + '<br />' + _data.description + '</div>', 
        null, true);
        map.addPopup(popup, true);
    }
    /************ボタンイベント**********************************************/
    $("#point").hide();
    $("#locate").live('click', function() {
        if (locatestates == 0) {
            if (track != null) {
                if (confirm("保存されていないトラックがあります。保存しますか？")) {
                    var trackpoints = localStorage.getItem('trackpoints');
                    var trackstart = localStorage.getItem('trackstart');
                    track_layer.removeFeatures([track]);
                    addTrack(trackpoints.slice(0, -1), trackstart, "track" + trackstart, "finish:" + getCurrentTime());
                    localStorage.removeItem('trackpoints');
                    track = null;
                } else {
                    localStorage.removeItem('trackpoints');
                    track = null;
                }
            }
            localStorage.setItem('trackstart', getCurrentTime());
            geolocate.deactivate();
            geolocate.watch = true;
            firstGeolocation = true;
            geolocate.activate();
            $("#locate").removeClass("ui-btn-up-c").addClass("ui-btn-up-b");
            locatestates = 1;
            $("#point").show();
            
        
        } else if (locatestates == 1) {
            geolocate.deactivate();
            $("#locate").removeClass("ui-btn-up-b").addClass("ui-btn-up-c");
            position_layer.removeAllFeatures();
            locatestates = 0;
            var trackpoints = localStorage.getItem('trackpoints');
            var trackstart = localStorage.getItem('trackstart');
            if (track != null)
                track_layer.removeFeatures([track]);
            if (trackpoints != null) {
                addTrack(trackpoints.slice(0, -1), trackstart, "track" + trackstart, "finish:" + getCurrentTime());
                localStorage.removeItem('trackpoints');
                track = null;
            }
            $("#point").hide();
        }
    });
    
    $("#point").live('click', function() {
        $('#marker_id') .val(getCurrentTime());
        $('#marker_name').val("");
        $('#marker_memo') .val("");
        $('#markerpage').popup();
        $('#markerpage').popup("open");
    });
    
    function addTrack(_pos, _id, _name, _memo) {
        var _tracktext = "LINESTRING(" + _pos + ")";
        var _trackline = OpenLayers.Geometry.fromWKT(_tracktext);
        _track = new OpenLayers.Feature.Vector(_trackline, {}, {
            strokeColor: '#f00',
            strokeWidth: 2,
            strokeOpacity: 0.8,
            strokeDashstyle: "dot"
        });
        track_layer.addFeatures([_track]);
        _track.attributes.id = _id;
        _track.attributes.name = _name;
        _track.attributes.memo = _memo;
        localStorage.setItem('track', geojson.write(track_layer.features));
        track_layer.redraw(true);
    }
    
    function addMarker(_pos, _id, _name, _memo) {
        var _markertext = "POINT(" + _pos + ")";
        var _markerpoint = OpenLayers.Geometry.fromWKT(_markertext);
        _marker = new OpenLayers.Feature.Vector(_markerpoint);
        marker_layer.addFeatures([_marker]);
        _marker.attributes.id = _id;
        _marker.attributes.name = _name;
        _marker.attributes.memo = _memo;
        localStorage.setItem('marker', geojson.write(marker_layer.features));
        marker_layer.redraw(true);
    }
    
    $("#marker_ok").live('click', function() {
        var _pos;
        if (marker != null) { //更新
            marker.attributes.id = $('#marker_id').val();
            marker.attributes.name = $('#marker_name').val();
            marker.attributes.memo = $('#marker_memo').val();
        
        } else { //新規
            _pos = currPos.lon + " " + currPos.lat;
            addMarker(_pos, $('#marker_id').val(), $('#marker_name').val(), $('#marker_memo').val());
        }
        marker = null;
        $('#markerpage').popup("close");
    });
    $("#marker_delete").live('click', function() {
        if (window.confirm('削除します。よろしいですか？')) {
            
            if (marker != null) {
                var objid = marker.attributes.id;
                marker_layer.removeFeatures(marker);
                var objs = JSON.parse(localStorage.getItem('marker'));
                if (objs != null) {
                    for (var i = 0; i < objs.length; i++) {
                        if (objs[i]['id'] == objid) {
                            objs.splice(i, 1);
                            break;
                        }
                    }
                    localStorage.setItem('marker', JSON.stringify(objs));
                }
            }
            //$(this).parent().remove();
            //$('#bookmarklist').listview('refresh');
            marker_layer.redraw(true);
            position_layer.redraw(true);
            marker = null;
        }
        $('#markerpage').popup("close");
    });
    
    $("#marker_cancel") .live('click', function() {
        marker = null;
        $('#markerpage').popup("close");
    });
    
    $("#feature_ok") .live('click', function() {
        
        if (marker != null) { //更新
            marker.attributes.id = $('#feature_id').val();
            marker.attributes.name = $('#feature_name').val();
            marker.attributes.memo = $('#feature_memo').val();
            localStorage.setItem('inputdata', geojson.write(edit_layer.features));
        }
        marker = null;
        $('#featurepage').popup("close");
    });
    $("#feature_delete") .live('click', function() {
        if (window.confirm('削除します。よろしいですか？')) {
            
            if (marker != null) {
                var objid = marker.attributes.id;
                edit_layer.removeFeatures(marker);
                localStorage.setItem('inputdata', geojson.write(edit_layer.features));
            }
            //feature_layer.redraw(true);
            //position_layer.redraw(true);
            marker = null;
        }
        $('#featurepage').popup("close");
    });
    $("#feature_cancel").live('click', function() {
        marker = null;
        $('#featurepage').popup("close");
    });
    $("#zoomin") .live('click', function() {
        map.zoomIn();
    });
    $("#zoomout").live('click', function() {
        map.zoomOut();
    });
    
    $(".deleteMe").live('click', function() {
    
        if (window.confirm('削除します。よろしいですか？')) {
            var objs = JSON.parse(localStorage.getItem('bookmark'));
            var num = $(this).title;
            objs.splice(num - 1, 1);
            localStorage.setItem('bookmark', JSON.stringify(objs));
            $(this).parent().remove();
            $('#bookmarklist').listview('refresh');
        }
    });
    $("#touroku_ok").live('click', function() {
        var bookmark_name = $('#bookmark_name').val();
        if (bookmark_name != '') {
            var zoom = map.getZoom();
            var center = map.getCenter();
            var objs = JSON.parse(localStorage.getItem('bookmark'));
            if (objs == null)
                objs = [];
            var bookmark_obj = {
                "name": bookmark_name,
                "zoom": zoom,
                "lon": center.lon,
                "lat": center.lat
            };
            objs.push(bookmark_obj);
            localStorage.setItem('bookmark', JSON.stringify(objs));
            localStorage.setItem('zoom', zoom);
            localStorage.setItem('lon', center.lon);
            localStorage.setItem('lat', center.lat);
            addBookmarkToList(bookmark_obj, objs.length);
            $('#bookmarklist').listview('refresh');
            if ($("#cache_checkbox") .is(':checked'))
                startSeeding(); //キャッシュ
        }
        $.mobile.changePage('#mappage');
    });
    $("#marker_visible") .live('change', function() {
        var slider_value = $(this)
        .val();
        if (slider_value == "on") {
            marker_layer.setVisibility(true);
            localStorage.setItem('marker_visible', 'on');
        } else {
            marker_layer.setVisibility(false);
            localStorage.setItem('marker_visible', 'off');
        }
    });
    $("#marker_clear_btn") .live('click', function() {
        $.mobile.changePage('#marker_clear_dialog');
    });
    $("#marker_clear_ok").live('click', function() {
        localStorage.removeItem('marker');
        marker_layer.destroyFeatures();
        $('#marker_clear_dialog') .dialog('close');
    });
    $("#track_visible").live('change', function() {
        var slider_value = $(this).val();
        if (slider_value == "on") {
            track_layer.setVisibility(true);
            localStorage.setItem('track_visible', 'on');
        } else {
            track_layer.setVisibility(false);
            localStorage.setItem('track_visible', 'off');
        }
    });
    $("#track_clear_btn") .live('click', function() {
        $.mobile.changePage('#track_clear_dialog');
    });
    $("#track_clear_ok")  .live('click', function() {
        localStorage.removeItem('track');
        localStorage.removeItem('trackpoints');
        track = null;
        track_layer.destroyFeatures();
        $('#track_clear_dialog').dialog('close');
    });
    $("#inputdata_visible").live('change', function() {
        var slider_value = $(this)
        .val();
        if (slider_value == "on") {
            edit_layer.setVisibility(true);
            localStorage.setItem('inputdata_visible', 'on');
        } else {
            edit_layer.setVisibility(false);
            localStorage.setItem('inputdata_visible', 'off');
        }
    });
    $("#inputdata_clear_btn") .live('click', function() {
        $.mobile.changePage('#inputdata_clear_dialog');
    });
    $("#inputdata_clear_ok") .live('click', function() {
        localStorage.removeItem('inputdata');
        edit_layer.destroyFeatures();
        $('#inputdata_clear_dialog').dialog('close');
    });
    
    $("#cache_clear_btn").live('click', function() {
        $.mobile.changePage('#cache_clear_dialog');
    });
    $("#cache_clear_ok").live('click', function() {
        OpenLayers.Control.CacheWrite.clearCache();
        $('#cache_clear_dialog').dialog('close');
    
    });
    $("#localmap_file") .live("change", function(ele) {
        if (!ele.target.files.length)
            return; // ファイル未選択
        var jpgfile, wldfile;
        for (var i = 0; i < ele.target.files.length; i++) {
            var file = ele.target.files[i];
            if (/(.wld)/.test(file.name)) { //順番が大事 hoge.jpg hoge.wld.jpgを想定 ios6対策
                wldfile = file;
            } else if (/(.jpg)/.test(file.name)) {
                jpgfile = file;
            }
        }
        if (jpgfile == null || wldfile == null)
            return;
        var fr = new FileReader();
        fr.onload = function() {
            var wldfiletext = this.result.split("\n");
            var fr2 = new FileReader();
            fr2.readAsDataURL(jpgfile);
            fr2.onload = function() {
                var _image = new Image();
                _image.onload = function(evt) {
                    var width = this.width;
                    var height = this.height;
                    localmap = new OpenLayers.Layer.Image('LocalMap', _image.src, 
                    new OpenLayers.Bounds(wldfiletext[4] - wldfiletext[0] / 2.0, wldfiletext[5] - wldfiletext[3] / 2.0 + wldfiletext[3] * height, wldfiletext[4] - wldfiletext[0] / 2.0 + width * wldfiletext[0], wldfiletext[5] - wldfiletext[3] / 2.0), 
                    new OpenLayers.Size(width, height), {
                        'isBaseLayer': false,
                        'alwaysInRange': true
                    });
                    //map.setCenter();
                    //localStorage.setItem('localmap',localmap);容量の問題 websqlに
                    map.addLayer(localmap);
                    $.mobile.changePage('#mappage');
                };
                _image.src = this.result;
            }
        }
        fr.readAsText(wldfile); // ファイルをテキストとして読み込む
    });
    $("#localmap_visible").live('change', function() {
        var slider_value = $(this)
        .val();
        if (slider_value == "on") {
            localmap.setVisibility(true);
            localStorage.setItem('localmap_visible', 'on');
        } else {
            localmap.setVisibility(false);
            localStorage.setItem('localmap_visible', 'off');
        }
    });
    $("#localmap_clear_btn").live('click', function() {
        $.mobile.changePage('#localmap_clear_dialog');
    });
    $("#localmap_clear_ok").live('click', function() {
        localStorage.removeItem('localmap');
        if (localmap != null)
            localmap.destroy();
        $("#localmap_file").val("");
        $('#localmap_clear_dialog').dialog('close');
    });
    $("#layer_file").live("change", function(ele) {
        if (!ele.target.files.length)
            return; // ファイル未選択
        var file = ele.target.files[0];
        var fr = new FileReader();
        fr.onload = function() {
            var objs = JSON.parse(this.result);
            localStorage.setItem('layer', JSON.stringify(objs));
            initLayerSetteiList();
            $.mobile.changePage('#mappage');
        }
        fr.readAsText(file); // ファイルをテキストとして読み込む
    });
    $("#layerpage_back_btn").live('click', function() {
        $.mobile.changePage('#mappage');
    });
    $("#layer_clear_btn") .live('click', function() {
        $.mobile.changePage('#layer_clear_dialog');
    });
    $("#layer_clear_ok").live('click', function() {
        localStorage.removeItem('layer');
        initLayerSetteiList();
        //initLayerSwitchList();
        $("#layer_file").val("");
        $('#layer_clear_dialog').dialog('close');
    });
    $("#login_btn").live('click', function() {
        if (window.navigator.onLine) {
            if (window.location.href.search(/(login=true)/) > 0) {
                if (window.confirm('すでにログインしています。ログアウトしますか？')) {
                    location.href = "logout.php";
                }
            } else {
                location.href = "auth.php";
            }
        }
    });
    $("#export_btn") .live('click', function() {
        if (window.navigator.onLine) {
            if (locatestates == 1) { //ナビ中は実行できないように
                alert("GPS機能を終了してから実行してください。")
            } else {
                dataExport();
            }
        }
    });
    $("#import_btn") .live('click', function() {
        if (window.navigator.onLine) {
            if (locatestates == 1) { //ナビ中は実行できないように
                alert("GPS機能を終了してから実行してください。")
            } else {
                dataImport();
                $.mobile.changePage('#mappage');
            }
        }
    });
    
    
    
    function getCurrentTime() {
        var d = new Date();
        var month = d.getMonth() + 1;
        var day = d.getDate();
        var hour = d.getHours();
        var minute = d.getMinutes();
        var second = d.getSeconds();
        // 1桁を2桁に変換する
        if (month < 10) {
            month = "0" + month;
        }
        if (day < 10) {
            day = "0" + day;
        }
        if (hour < 10) {
            hour = "0" + hour;
        }
        if (minute < 10) {
            minute = "0" + minute;
        }
        if (second < 10) {
            second = "0" + second;
        }
        // 整形して返却
        return "" + d.getFullYear() + month + day + hour + minute + second;
    }
    
    function mypanTo(lonlat) {
        var tween = new OpenLayers.Tween(OpenLayers.Easing.Expo.easeOut);
        var center = map.getCachedCenter();
        // center will not change, don't do nothing
        if (lonlat.equals(center)) {
            return;
        }
        var from = map.getPixelFromLonLat(center);
        var to = map.getPixelFromLonLat(lonlat);
        var line_layer = {
            x: to.x - from.x,
            y: to.y - from.y
        };
        var last = {
            x: 0,
            y: 0
        };
        tween.start({
            x: 0,
            y: 0
        }, line_layer, 100, {
            callbacks: {
                eachStep: OpenLayers.Function.bind(function(px) {
                    var x = px.x - last.x, 
                    y = px.y - last.y;
                    map.moveByPx(x, y);
                    last.x = Math.round(px.x);
                    last.y = Math.round(px.y);
                }, this),
                done: OpenLayers.Function.bind(function(px) {
                    map.moveTo(lonlat);
                    map.dragging = false;
                    map.events.triggerEvent("moveend");
                }, this)
            }
        });
    }

    ////プレゼン用 キーコントロール/////////////////////////////////////
    $(window).keydown(function(e) {
        if ($(".in").length != 0)
            return;
        if (e.keyCode == 39 || e.keyCode == 37) {
            if (e.keyCode == 39) {
                bookmark_no = bookmark_no + 1;
                if (bookmark_no > $('#bookmarklist').children().length)
                    bookmark_no = bookmark_no - 1;
            } else if (e.keyCode == 37) {
                bookmark_no = bookmark_no - 1;
                if (bookmark_no <= 0)
                    bookmark_no = 1;
            }
            $('#bookmark' + bookmark_no).trigger("click");
        }
        if (e.keyCode == 65) { //a
            map.setBaseLayer(cjp_layer);
            prezen_layer.setVisibility(true);
            map.setCenter(new OpenLayers.LonLat(139.3548, 37.5236).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 12);
        
        } else if (e.keyCode == 49) { //1
            map.setBaseLayer(cjp_layer);
            prezen_layer.setVisibility(true);
            map.setCenter(new OpenLayers.LonLat(139.2643, 37.5991).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 15);
        
        } else if (e.keyCode == 50) { //2
            map.zoomTo(7);
            map.setBaseLayer(cjp_layer);
            mypanTo(new OpenLayers.LonLat(140.88473975658417, 38.19526186688736).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")))
            var _popup = new OpenLayers.Popup.FramedCloud("feature", 
            new OpenLayers.LonLat(140.88473975658417, 38.19526186688736).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 
            null, '<img src="data/prezen/ecorislogo.png">', 
            null, true);
            _popup.minSize = new OpenLayers.Size(320, 100);
            map.addPopup(_popup, true);
        } else if (e.keyCode == 51) { //3
            map.setBaseLayer(cjp_layer);
            prezen_layer.setVisibility(true);
            map.setCenter(new OpenLayers.LonLat(139.3068, 37.5991).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 15);
        } else if (e.keyCode == 52) { //4
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.3068, 37.5718).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 53) { //5
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.3068, 37.5443).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 54) { //6
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.3524, 37.5443).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 55) { //7
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.3963, 37.5443).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 56) { //8
            map.setBaseLayer(cjp_layer);
			map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.263, 37.5123).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 57) { //9
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.263, 37.4851).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 48) { //0 demo
            map.setBaseLayer(cjp_layer);
            map.zoomTo(7);
		} else if (e.keyCode == 81) { //q
            map.setBaseLayer(cjp_layer);
            prezen_layer.setVisibility(true);
            map.setCenter(new OpenLayers.LonLat(141.489, 39.5581).transform(new OpenLayers.Projection("EPSG:4326"), 						new OpenLayers.Projection("EPSG:900913")), 12);
		} else if (e.keyCode == 87) { //w		
			var _popup2 = new OpenLayers.Popup.FramedCloud("feature2", 
            new OpenLayers.LonLat(141.489, 39.5581).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 
			null, '<img src="http://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Leontopodium_hayachinense_1.JPG/180px-Leontopodium_hayachinense_1.JPG"><br><b>ハヤチネウスユキソウ</b><br>CC BY-SA Qwert1234<br>from Wikimedia Commons', null, true);
            _popup2.minSize = new OpenLayers.Size(320, 100);
            map.addPopup(_popup2, true); 
        } else if (e.keyCode == 90) { //z
            map.setBaseLayer(cjp_layer);
            prezen_layer.setVisibility(true);
            map.setCenter(new OpenLayers.LonLat(139.3077, 37.4859).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 15);
        } else if (e.keyCode == 88) { //x
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.3519, 37.4859).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 67) { //c
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.3968, 37.4859).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 86) { //v
            map.setBaseLayer(cjp_layer);
            map.zoomTo(15);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.4396, 37.4859).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 66) { //b
            map.setBaseLayer(cjp_layer);
            prezen_layer.setVisibility(true);
            map.setCenter(new OpenLayers.LonLat(139.2635, 37.4525).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 15);
	} else if (e.keyCode == 78) { //n
            map.setBaseLayer(cjp_layer);
            map.zoomTo(14);
            prezen_layer.setVisibility(true);
            mypanTo(new OpenLayers.LonLat(139.4153, 37.5883).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")));
        } else if (e.keyCode == 77) { //m
            map.setBaseLayer(cjp_layer);
            prezen_layer.setVisibility(true);
            map.setCenter(new OpenLayers.LonLat(139.441, 37.4525).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 15);
        }


   
    });

}

const COLORS = {
    chart_background: 0x147fd7
};


var BERNIE360 = {
    loadingManager: new THREE.LoadingManager(),
    fonts: {},
    animateCallbacks: []
};


function init() {
    "use strict";
    console.log('navigator.userAgent = %s', navigator.userAgent);

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    // ********************************************************************************************
    // standard THREE.js WebGL/WebVR setup:
    // ********************************************************************************************

    var renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('webgl-canvas') /*,
        antialias: !isMobile() */
    });
    renderer.setClearColor( 0x101010 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    var vrEffect = new THREE.VREffect( renderer );
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.matrixAutoUpdate = true;
    camera.layers.enable( 1 ); // render left view when no stereo available
    var vrControls = new THREE.VRControls( camera );
    vrEffect.setSize( window.innerWidth, window.innerHeight );
    window.addEventListener( 'resize', onWindowResize, false );
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        vrEffect.setSize( window.innerWidth, window.innerHeight );
    }

    var scene = new THREE.Scene();

    // TODO: potential optimization to try later:
    // scene.autoUpdate = false;

    // ********************************************************************************************
    // setup interface for entering/exiting VR presentation:
    // ********************************************************************************************

    if ( WEBVR.isAvailable() === true ) {
        if ( WEBVR.isLatestAvailable() === false ) {
            console.warn( 'deprecated version of the WebVR API is being used' );
        }
        var button = WEBVR.getButton( vrEffect );
        // TODO: reset orientation upon entering VR
        document.body.appendChild( button );
    }

    // ********************************************************************************************
    // stereo 360 video setup:
    // ********************************************************************************************

    var video = document.createElement( 'video' );
    // video.crossOrigin = "anonymous";
    if (isMobile()) {
        // lower res for mobile
        //video.src = '/static/bernie_stereo_1080_web_optimized.mp4';
        //video.src = '/static/bernie_stereo_1024_web_optimized.mp4';
        //video.src = '/static/video/bernie_stereo_1080_web_optimized_b.mp4';
        video.src = '/static/video/wsp_pt1_stereo_1080_web_optimized.mp4';
        //video.src = '/static/video/wsp_pt2_stereo_1080_web_optimized.mp4';
    } else {
        // high res, video can autostart on desktop
        //video.src = '/static/video/bernie_stereo_2160_web_optimized.mp4';
        video.src = '/static/video/bernie_stereo_2160.webm'; // encoded w/ VP8 instead of H.264, works in the WebVR Chrome builds!
    }
    var texture = new THREE.VideoTexture( video );
    texture.minFilter = THREE.NearestFilter;
    texture.maxFilter = THREE.NearestFilter;
    // texture.minFilter = THREE.LinearFilter;
    // texture.maxFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    texture.generateMipmaps = false;
    var videoNeedsFlip = false;
    if (/android/i.test(navigator.userAgent) && navigator.userAgent.indexOf("Chrome/51.0") !== -1) {
        videoNeedsFlip = true;
    }
    var leftVideoSphere;
    ( function () {
        // create video sphere for left eye
        var geometry = new THREE.SphereGeometry( 900, 60 / 2, 40 / 2);
        geometry.scale( -1, 1, 1 );
        var uvs = geometry.faceVertexUvs[ 0 ];
        for ( var i = 0; i < uvs.length; i ++ ) {
            for ( var j = 0; j < 3; j ++ ) {
                uvs[ i ][ j ].y *= 0.5;
                uvs[ i ][ j ].y += 0.5;
                if (videoNeedsFlip) uvs[ i ][ j ].y = 1 - uvs[ i ][ j ].y;
            }
        }
        var bufferGeom = (new THREE.BufferGeometry()).fromGeometry(geometry);
        geometry.dispose();
        var material = new THREE.MeshBasicMaterial( { map: texture } );
        leftVideoSphere = new THREE.Mesh( bufferGeom, material );
        leftVideoSphere.rotation.y = -Math.PI / 2;
        leftVideoSphere.updateMatrix();
        leftVideoSphere.layers.set( 1 ); // display in left eye only
        scene.add( leftVideoSphere );
    } )();
    var rightVideoSphere;
    ( function () {
        // create video sphere for right eye
        var geometry = new THREE.SphereGeometry( 900, 60 / 2, 40 / 2);
        geometry.scale( -1, 1, 1 );
        var uvs = geometry.faceVertexUvs[ 0 ];
        for ( var i = 0; i < uvs.length; i ++ ) {
            for ( var j = 0; j < 3; j ++ ) {
                uvs[ i ][ j ].y *= 0.5;
                //uvs[ i ][ j ].y += 0.5;
                if (videoNeedsFlip) uvs[ i ][ j ].y = 1 - uvs[ i ][ j ].y;
            }
        }
        var bufferGeom = (new THREE.BufferGeometry()).fromGeometry(geometry);
        geometry.dispose();
        var material = new THREE.MeshBasicMaterial( { map: texture } );
        rightVideoSphere = new THREE.Mesh( bufferGeom, material );
        rightVideoSphere.rotation.y = -Math.PI / 2;
        rightVideoSphere.updateMatrix();
        rightVideoSphere.layers.set( 2 ); // display in right eye only
        scene.add( rightVideoSphere );
    } )();

    var isPlaying = false;
    function startVideo() {
        if (!isPlaying) {
            isPlaying = true;
            video.play();
        }
    }

    // ********************************************************************************************
    // set callback for when everything is loaded / async requests have completed:
    // ********************************************************************************************

    BERNIE360.loadingManager.onLoad = function () {
        if (!isMobile()) {
            startVideo();
        } else {
            // TODO: cardboard viewer selection
            // TODO: video cannot autoplay on Android, there has to be some prompt to touch the screen
            //       or similar action to start playing the video
            document.body.addEventListener('click', function () {
                startVideo();
            });
        }
    };

    BERNIE360.loadingManager.onProgress = function (url, nLoaded, nTotal) {
        // TODO: implement some loading progress indicator
    };

    // ********************************************************************************************
    // setup charts / visualizations:
    // ********************************************************************************************

    // this light illuminates the 3D objects:
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(20, 30, 50);
    directionalLight.updateMatrix();
    scene.add(directionalLight);

    var fontLoadingManager = new THREE.LoadingManager( function () {

        // this callback is executed once all fonts are loaded

        // text geometry example:
        var textGeom = new THREE.TextGeometry("BERNIE 360!", {
            font: BERNIE360.fonts.helvetiker_bold,
            size: 0.3,
            //curveSegments: 4,
            height: 0.05
        });
        textGeom.center();
        var material = new THREE.MeshPhongMaterial({color: 0x44ee44, shininess: 75});
        var mesh = new THREE.Mesh(textGeom, material);
        mesh.position.set(0, 1, -3);
        mesh.updateMatrix();

        // add example bar chart:
        var barChart = makeBarChart([0.2, 0.6, 1, 0.8, 0.4], {
            barWidth: 0.25,
            barDepth: 0.25,
            barSeparation: 0.05,
            barMaterial: new THREE.MeshPhongMaterial({color: 0xff3333})
        });
        barChart.rotation.z = -Math.PI / 2;
        barChart.position.set(-4, 4, -3);
        barChart.updateMatrix();
        scene.add(barChart);

        // add example pie chart:
        // TODO

        // add example line area chart:
        var lineAreaChart = makeLineAreaChart(INCOME_INEQUALITY.x, INCOME_INEQUALITY.y, {
            width: 4,
            height: 2,
            depth: 0.2,
            yMin: 0,
            titleImage: '/static/img/inequality_title.png',
            xLabels: [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010].map( (year) => '/static/img/income_inequality/' + year + '.png' ),
            yLabels: ['0', '6.25', '12.5', '18.75', '25'].map( (filename) => '/static/img/income_inequality/' + filename + '.png' ),
            //areaMaterial: new THREE.MeshPhongMaterial({color: COLORS.chart_background, shininess: 60})
            areaMaterial: new THREE.MeshLambertMaterial({color: COLORS.chart_background})
        }, function (chart) {
            chart.position.set(-2, 2.5, -4);
            chart.updateMatrix();
            scene.add(chart);

            BERNIE360.loadingManager.onLoad();
        });

    } );

    var fontLoader = new THREE.FontLoader(fontLoadingManager);

    // load the fonts that are included with three.js:
    ['gentilis_bold', 'helvetiker_bold', 'optimer_bold'].forEach( function (fontName) {
        fontLoader.load('/static/node_modules/three/examples/fonts/' + fontName + '.typeface.js', function (font) {
            BERNIE360.fonts[fontName] = font;
        });
    } );

    // ********************************************************************************************
    // start rendering:
    // ********************************************************************************************

    requestAnimationFrame( animate );

    var lt = 0;
    function animate(t) {
        var dt = (t - lt) * 0.001;
        requestAnimationFrame( animate );
        for (var i = 0, l = BERNIE360.animateCallbacks.length; i < l; i++) {
            BERNIE360.animateCallbacks[i](t, dt);
        }
        vrControls.update();
        vrEffect.render( scene, camera );
        lt = t;
    }

    // uncomment to view mesh wireframes:
    // var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0xeeddaa, wireframe: true});
    // scene.overrideMaterial = wireframeMaterial;

    // uncomment to view mesh normals:
    // var normalMaterial = new THREE.MeshNormalMaterial();
    // scene.overrideMaterial = normalMaterial;

}

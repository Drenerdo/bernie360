var BERNIE360 = {
    fonts: {},
    eventTimes: [],
    eventStarters: [],
    animateEvent: null,
    video: document.createElement('video'),
    scene: new THREE.Scene()
};

const COLORS = {
    blue: 0x147fd7
};


function init() {
    "use strict";
    console.log('navigator.userAgent = %s', navigator.userAgent);

    THREE.Object3D.DefaultMatrixAutoUpdate = false;
    const ORIGIN = new THREE.Vector3(0,0,0);

    // ********************************************************************************************
    // standard THREE.js WebGL/WebVR setup:
    // ********************************************************************************************

    var renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('webgl-canvas'),
        antialias: !isMobile(),
        depth: true
    });
    renderer.sortObjects = false;
    renderer.setClearColor( 0x000000 );
    renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.setPixelRatio( 0.5 );
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

    var scene = BERNIE360.scene;

    // TODO: potential optimization to try later:
    scene.autoUpdate = false;

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

    var video = BERNIE360.video;
    if (isMobile()) {
        // lower res for mobile
        video.src = '/static/video/wsp_0650_1410_1024.mp4';
    } else {
        // high res, video can autostart on desktop
        //video.src = '/static/video/wsp_pt1_stereo_2160.webm';
        //if (!video.canPlayType('video/webm')) {
            video.src = '/static/video/wsp_0650_1410_2160.mp4';
            if (!video.canPlayType('video/mp4')) {
                // TODO: some error (none of the video formats are supported)
                console.error('video format is unsupported');
            }
        //}
    }
    video.autoplay = false;
    video.currentTime = 0; //7*60;

    video.addEventListener('stalled', function () {
        console.warn('stalled fetching media data');
    });
    video.addEventListener('ended', function () {
        console.log('video ended');
    });

    var texture = new THREE.VideoTexture( video );
    texture.minFilter = THREE.NearestFilter;
    texture.maxFilter = THREE.NearestFilter;
    //texture.minFilter = THREE.LinearFilter;
    //texture.maxFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    texture.generateMipmaps = false;

    var videoNeedsFlip = false;
    // if (/android/i.test(navigator.userAgent) && navigator.userAgent.indexOf("Chrome/51.0") !== -1) {
    //     videoNeedsFlip = true;
    // }
    var videoMaterial = new THREE.MeshBasicMaterial( { map: texture, transparent: true, opacity: 0 } );
    // var videoMaterial = new THREE.MeshBasicMaterial( { map: texture } );
    var videoRotation = -0.75 * Math.PI / 2;
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
        // var material = new THREE.MeshBasicMaterial( { map: texture } );
        // leftVideoSphere = new THREE.Mesh( bufferGeom, material );
        leftVideoSphere = new THREE.Mesh( bufferGeom, videoMaterial );
        leftVideoSphere.rotation.y = videoRotation;
        leftVideoSphere.updateMatrix();
        leftVideoSphere.layers.set( 1 ); // display in left eye only
        leftVideoSphere.renderOrder = 0;
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
        // var material = new THREE.MeshBasicMaterial( { map: texture } );
        // rightVideoSphere = new THREE.Mesh( bufferGeom, material );
        rightVideoSphere = new THREE.Mesh( bufferGeom, videoMaterial );
        rightVideoSphere.rotation.y = videoRotation;
        rightVideoSphere.updateMatrix();
        rightVideoSphere.layers.set( 2 ); // display in right eye only
        rightVideoSphere.renderOrder = 0;
        scene.add( rightVideoSphere );
    } )();

    video.addEventListener('canplaythrough', onCanPlayThrough);
    function onCanPlayThrough() {
        console.log('canplaythrough event');
        if (isMobile()) {
            // TODO: video cannot autoplay on Android, there has to be some prompt to touch the screen
            //       or similar action to start playing the video
            function onClick() {
                video.play();
                //vrEffect.setFullScreen(true);
            }
            console.log('touch screen to begin');
            document.body.addEventListener('click', onClick);
            video.addEventListener('playing', function () {
                console.log('video playing, removing click event handler');
                document.body.removeEventListener('click', onClick);
            });
        } else {
            video.play();
        }
    }

    // ********************************************************************************************
    // setup charts / visualizations:
    // ********************************************************************************************

    // this light illuminates the 3D objects:
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(20, 30, 50);
    directionalLight.updateMatrix();
    scene.add(directionalLight);

    var fontURL = URL_PARAMS.fontURL || '/static/node_modules/three/examples/fonts/optimer_regular.typeface.js';
    var fontLoader = new THREE.FontLoader();
    fontLoader.load(fontURL, function (font) {

        var incomeInequalityChart = makeLineAreaChart(INCOME_INEQUALITY.x, INCOME_INEQUALITY.y, {
            width: 4,
            height: 2,
            depth: 0.2,
            yMin: 0,
            titleImage: '/static/img/income_inequality/inequality_title.png',
            xLabelImages: [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010].map( (year) => '/static/img/income_inequality/' + year + '.png' ),
            yLabelImages: ['0', '6.25', '12.5', '18.75', '25'].map( (filename) => '/static/img/income_inequality/' + filename + '.png' ),
            areaMaterial: new THREE.MeshLambertMaterial({color: COLORS.blue, transparent: true})
        }, function (chart, materials) {
            chart.position.x -= 4.75;
            chart.position.y += 3;
            chart.position.z -= 2;
            chart.lookAt(ORIGIN);
            chart.updateMatrix();
            chart.visible = false;
            scene.add(chart);
            scene.updateMatrixWorld();
            materials.forEach( function (material) {
                material.opacity = 0;
            } );
        });

        var taxRatesChart = makeBarChart(TAX_RATES.avgIncomeTaxRate, {
            barMaterial: new THREE.MeshLambertMaterial({color: COLORS.blue, transparent: true}),
            heightScale: 0.05,
            font: font,
            barLabels: TAX_RATES.incomePercentile.map( (percentile) => String(percentile) + '%' ),
            title: 'Average income tax rates in 2012, by income percentile',
            barWidth: 0.3,
            barSeparation: 0.07,
            textMaterial: new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true})
        }, function (chart, materials) {
            chart.position.x += 1;
            chart.position.y += 2;
            chart.position.z -= 2;
            chart.lookAt(ORIGIN);
            chart.updateMatrix();
            chart.visible = false;
            scene.add(chart);
            scene.updateMatrixWorld();
            materials.forEach( function (material) {
                material.opacity = 0;
            } );
        });

        var shareOfWealthChart = makeLineAreaChart(SHARE_OF_WEALTH.year, SHARE_OF_WEALTH.topPercentage, {
            width: 4,
            height: 1.5,
            depth: 0.2,
            yMin: 0,
            areaMaterial: new THREE.MeshLambertMaterial({color: COLORS.blue, transparent: true}),
            font: font,
            textMaterial: new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true}),
            xLabelValues: [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010],
            yLabelValues: [0, 10, 20, 30],
            title: 'Top 1% income share (including capital gains)'
        }, function (chart, materials) {
            chart.position.x -= 2.5;
            chart.position.y += 3;
            chart.position.z -= 3;
            chart.lookAt(ORIGIN);
            chart.updateMatrix();
            chart.visible = false;
            scene.add(chart);
            scene.updateMatrixWorld();
            materials.forEach( function (material) {
                material.opacity = 0;
            } );
        });

        // queue and set times for events:

        var textMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: 0});

        var textMesh = makeText('Bernie Sanders speaks on income inequality at Washington Square Park on April 14, 2016', {
            font: font,
            textMaterial: textMaterial
        });
        textMesh.position.z = -2;
        textMesh.updateMatrix();
        scene.add(textMesh);

        var times = [
            1, 5, // fade-in/out opening caption
            11, // fade-in video
            13, 15, // chart 1
            17, 19, // chart 2
            21, 23, // chart 3
            7*60 // fade-out
        ].map( (time) => time );

        BERNIE360.eventStarters.push(function (t) {
            BERNIE360.animateEvent = function (t, dt) {
                textMesh.material.opacity = Math.min(1, textMesh.material.opacity + dt);
                if (textMesh.material.opacity === 1) BERNIE360.animateEvent = null;
            };
        });
        BERNIE360.eventTimes.push(times.shift());

        BERNIE360.eventStarters.push(function (t) {
            BERNIE360.animateEvent = function (t, dt) {
                textMesh.material.opacity -= dt;
                if (textMesh.material.opacity <= 0) {
                    scene.remove(textMesh);
                    BERNIE360.animateEvent = null;
                }
            };
        });
        BERNIE360.eventTimes.push(times.shift());


        BERNIE360.eventStarters.push(startVideoFadeIn);
        BERNIE360.eventTimes.push(times.shift());


        BERNIE360.eventStarters.push(incomeInequalityChart.startFadeIn);
        BERNIE360.eventTimes.push(times.shift());
        BERNIE360.eventStarters.push(incomeInequalityChart.startFadeOut);
        BERNIE360.eventTimes.push(times.shift());

        BERNIE360.eventStarters.push(shareOfWealthChart.startFadeIn);
        BERNIE360.eventTimes.push(times.shift());
        BERNIE360.eventStarters.push(shareOfWealthChart.startFadeOut);
        BERNIE360.eventTimes.push(times.shift());

        BERNIE360.eventStarters.push(taxRatesChart.startFadeIn);
        BERNIE360.eventTimes.push(times.shift());
        BERNIE360.eventStarters.push(taxRatesChart.startFadeOut);
        BERNIE360.eventTimes.push(times.shift());


        BERNIE360.eventStarters.push(startVideoFadeOut);
        BERNIE360.eventTimes.push(times.shift());

        // start animation loop:
        scene.updateMatrixWorld();
        nextEventTime = BERNIE360.eventTimes.shift();
        requestAnimationFrame(animate);
    });

    function startVideoFadeIn() {
        BERNIE360.animateEvent = function (t, dt) {
            videoMaterial.opacity = Math.min(1, videoMaterial.opacity + 0.5 * dt);
            if (videoMaterial.opacity === 1) BERNIE360.animateEvent = null;
        };
    }

    function startVideoFadeOut() {
        BERNIE360.animateEvent = function (t, dt) {
            videoMaterial.opacity -= 0.5 * dt;
            if (videoMaterial.opacity <= 0) {
                BERNIE360.animateEvent = null;
                if (video.pause) video.pause();
            }
        };
    }

    var nextEventTime;
    var lt = 0;
    function animate(t) {
        var dt = (t - lt) * 0.001;
        requestAnimationFrame(animate);

        if (nextEventTime && video.currentTime >= nextEventTime) {
            nextEventTime = BERNIE360.eventTimes.shift();
            if (BERNIE360.eventStarters.length > 0) {
                (BERNIE360.eventStarters.shift())(t);
                scene.updateMatrixWorld();
            }
        }

        if (BERNIE360.animateEvent) BERNIE360.animateEvent(t, dt);

        vrControls.update();
        vrEffect.render(scene, camera);

        lt = t;
    }

    // if (URL_PARAMS.wireframe) {
    //     var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0xeeddaa, wireframe: true});
    //     scene.overrideMaterial = wireframeMaterial;
    // }

    // uncomment to view mesh normals:
    // var normalMaterial = new THREE.MeshNormalMaterial();
    // scene.overrideMaterial = normalMaterial;

}

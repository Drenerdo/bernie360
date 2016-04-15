const COLORS = {
    chart_background: 0x147fd7
};

function init() {
    "use strict";
    console.log('navigator.userAgent = %s', navigator.userAgent);

    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    var renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('webgl-canvas') /*,
        antialias: !isMobile() */
    });

    renderer.setClearColor( 0x101010 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    var effect = new THREE.VREffect( renderer );

    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.matrixAutoUpdate = true;
    camera.layers.enable( 1 ); // render left view when no stereo available

    var controls = new THREE.VRControls( camera );

    // effect.scale = 0; // video doesn't need eye separation (but 3D charts do, and the video sphere is large enough that it shouldn't matter)

    effect.setSize( window.innerWidth, window.innerHeight );

    if ( WEBVR.isAvailable() === true ) {
        if ( WEBVR.isLatestAvailable() === false ) {
            console.warn( 'deprecated version of the WebVR API is being used' );
        }

        var button = WEBVR.getButton( effect );
        // TODO: reset orientation upon entering VR
        document.body.appendChild( button );
    }

    var video = document.createElement( 'video' );

    // video.crossOrigin = "anonymous";

    if (isMobile()) {
        // lower res for mobile
        //video.src = '/static/bernie_stereo_1080_web_optimized.mp4';
        //video.src = '/static/bernie_stereo_1024_web_optimized.mp4';
        video.src = '/static/video/bernie_stereo_1080_web_optimized_b.mp4';
    } else {
        // high res, video can autostart on desktop
        //video.src = 'http://ec2-52-87-181-40.compute-1.amazonaws.com/videos/BernieStereoHighResBronx.mp4';
        //video.src = '/static/BernieStereoHighResBronx.mp4';
        video.src = '/static/video/bernie_stereo_2160_web_optimized.mp4';
    }

    var texture = new THREE.VideoTexture( video );

    texture.minFilter = THREE.NearestFilter;
    texture.maxFilter = THREE.NearestFilter;
    // texture.minFilter = THREE.LinearFilter;
    // texture.maxFilter = THREE.LinearFilter;

    texture.format = THREE.RGBFormat;
    texture.generateMipmaps = false;

    var scene = new THREE.Scene();
    // TODO: potential optimization to try later:
    // scene.autoUpdate = false;

    // this light illuminates the 3D charts
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(20, 30, 50);
    directionalLight.updateMatrix();
    scene.add(directionalLight);

    var videoNeedsFlip = false;
    if (/android/i.test(navigator.userAgent) && navigator.userAgent.indexOf("Chrome/51.0") !== -1) {
        videoNeedsFlip = true;
    }

    ( function () {
        // create video sphere for left eye
        var geometry = new THREE.SphereGeometry( 500, 60 / 2, 40 / 2);
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
        var mesh = new THREE.Mesh( bufferGeom, material );
        mesh.rotation.y = -Math.PI / 2;
        mesh.updateMatrix();
        mesh.layers.set( 1 ); // display in left eye only
        scene.add( mesh );
    } )();

    ( function () {
        // create video sphere for right eye
        var geometry = new THREE.SphereGeometry( 500, 60 / 2, 40 / 2);
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
        var mesh = new THREE.Mesh( bufferGeom, material );
        mesh.rotation.y = -Math.PI / 2;
        mesh.updateMatrix();
        mesh.layers.set( 2 ); // display in right eye only
        scene.add( mesh );
    } )();

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        effect.setSize( window.innerWidth, window.innerHeight );
    }

    if (!isMobile()) {
        startVideo();
    } else {
        // var mesh = makeTextMesh('Touch to begin!');
        // mesh.position.set(0, 0, -2);
        // mesh.updateMatrix();
        // scene.add(mesh);
        // TODO: cardboard viewer selection
        document.body.addEventListener('click', function () {
            startVideo();
            //scene.remove(mesh);
        });
    }


    var lineAreaChart = makeLineAreaChart(INCOME_INEQUALITY.x, INCOME_INEQUALITY.y, {
        width: 4,
        height: 2,
        depth: 0.2,
        yMin: 0,
        titleImage: '/static/img/inequality_title.png',
        xLabelImage: '/static/img/inequality_xlabels.png',
        yLabelImage: '/static/img/inequality_ylabels.png',
        areaMaterial: new THREE.MeshPhongMaterial({color: COLORS.chart_background, shininess: 60})
    }, function (chart) {
        chart.position.set(-2, 2.5, -4);
        chart.updateMatrix();
        scene.add(chart);
    });

    animate();

    var isPlaying = false;
    function startVideo() {
        if (!isPlaying) {
            isPlaying = true;
            video.play();
            addBoxChart(scene, 10000);
            addPieChart(scene, 20000);
        }
    }

    var lt = 0;
    function animate(t) {
        var dt = (t - lt) * 0.001;
        requestAnimationFrame( animate );
        render();
        lt = t;
    }

    function render() {
        controls.update();
        effect.render( scene, camera );
    }

    // uncomment to view mesh wireframes:
    // var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0xeeddaa, wireframe: true});
    // scene.overrideMaterial = wireframeMaterial;

    // uncomment to view mesh normals:
    // var normalMaterial = new THREE.MeshNormalMaterial();
    // scene.overrideMaterial = normalMaterial;

}

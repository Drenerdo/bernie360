function init() {
    "use strict";

    if ( WEBVR.isLatestAvailable() === false ) {
        console.warn( 'deprecated version of the WebVR API is being used' );
    }

    var renderer = new THREE.WebGLRenderer({canvas: document.getElementById('webgl-canvas')});

    renderer.setClearColor( 0x101010 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    var effect = new THREE.VREffect( renderer );

    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.layers.enable( 1 ); // render left view when no stereo available

    var controls = new THREE.VRControls( camera );

    // effect.scale = 0; // video doesn't need eye separation (but 3D charts do, and the video sphere is large enough that it shouldn't matter)

    effect.setSize( window.innerWidth, window.innerHeight );

    if ( WEBVR.isAvailable() === true ) {
        var button = WEBVR.getButton( effect );
        // button.onclick = function () {
        //     effect.setFullScreen(true);
        //     controls.resetPose();
        // }
        document.body.appendChild( button );
    }

    document.body.addEventListener('click', function () {
        startVideo();
    });

    var video = document.createElement( 'video' );

    // video.crossOrigin = "anonymous";

    if (isMobile()) {
        // lower res for mobile
        video.src = '/static/bernie_stereo_1080_web_optimized.mp4';
    } else {
        // high res, video can autostart on desktop
        // video.src = 'http://ec2-52-87-181-40.compute-1.amazonaws.com/videos/BernieStereoHighResBronx.mp4';
        video.src = '/static/BernieStereoHighResBronx.mp4';
    }

    var texture = new THREE.VideoTexture( video );

    texture.minFilter = THREE.NearestFilter;
    texture.maxFilter = THREE.NearestFilter;
    // texture.minFilter = THREE.LinearFilter;
    // texture.maxFilter = THREE.LinearFilter;

    texture.format = THREE.RGBFormat;
    texture.generateMipmaps = false;

    var scene = new THREE.Scene();

    // this light illuminates the 3D charts
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(50, 30, 20);
    scene.add(directionalLight);

    ( function () {
        // create video sphere for left eye
        var geometry = new THREE.SphereGeometry( 500, 60 / 2, 40 / 2);
        geometry.scale( 1, 1, 1 );
        var uvs = geometry.faceVertexUvs[ 0 ];
        for ( var i = 0; i < uvs.length; i ++ ) {
            for ( var j = 0; j < 3; j ++ ) {
                uvs[ i ][ j ].y *= 0.5;
            }
        }
        var material = new THREE.MeshBasicMaterial( { map: texture, side: THREE.BackSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.y = Math.PI / 2;
        mesh.layers.set( 1 ); // display in left eye only
        scene.add( mesh );
    } )();

    ( function () {
        // create video sphere for right eye
        var geometry = new THREE.SphereGeometry( 500, 60 / 2, 40 / 2);
        geometry.scale( 1, 1, 1 );
        var uvs = geometry.faceVertexUvs[ 0 ];
        for ( var i = 0; i < uvs.length; i ++ ) {
            for ( var j = 0; j < 3; j ++ ) {
                uvs[ i ][ j ].y *= 0.5;
                uvs[ i ][ j ].y += 0.5;
            }
        }
        var material = new THREE.MeshBasicMaterial( { map: texture, side: THREE.BackSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.y = Math.PI / 2;
        mesh.layers.set( 2 ); // display in right eye only
        scene.add( mesh );
    } )();

    addBoxGraph(scene, 10000);
    addPieChart(scene, 20000);

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        effect.setSize( window.innerWidth, window.innerHeight );
    }

    render();

    if (!isMobile()) startVideo();

    var isPlaying = false;

    function startVideo() {
        if (!isPlaying) {
            isPlaying = true;
            video.play();
            animate();
        }
    }

    function animate() {
        requestAnimationFrame( animate );
        render();
    }

    function render() {
        controls.update();
        effect.render( scene, camera );
    }

}

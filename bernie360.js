
//

var camera, scene, renderer;
var video, texture;

var controls, effect;

function init() {

    if ( WEBVR.isLatestAvailable() === false ) {
        // document.body.appendChild( WEBVR.getMessage() );
        console.warn( 'deprecated version of the WebVR API is being used' );
    }

    var isPlaying = false;

    var container = document.getElementById( 'container' );
    container.addEventListener( 'click', function () {
        if (!isPlaying) {
            video.play();
            animate();
            isPlaying = true;
        }
    } );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.layers.enable( 1 ); // render left view when no stereo available

    // video

    video = document.createElement( 'video' );
    //video.loop = true;
    //video.buffered = true;
    video.crossOrigin = "anonymous";
    //video.src = 'bernie_stereo_1024.mp4';
    //video.src = 'BernieStereoHighResBronx.mp4';
    video.src = 'bernie_stereo_1080_web_optimized.mp4';
    //video.src = 'http://ec2-52-87-181-40.compute-1.amazonaws.com/videos/bernie_stereo_1024.mp4';
    //video.src = 'http://ec2-52-87-181-40.compute-1.amazonaws.com/videos/BernieStereoHighResBronx.mp4';

    video.oncanplay = function () {
        if (!isPlaying) {
            video.play();
            animate();            
            isPlaying = true;
        }
    };

    texture = new THREE.VideoTexture( video );

    // texture.minFilter = THREE.NearestFilter;
    // texture.maxFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.maxFilter = THREE.LinearFilter;

    texture.format = THREE.RGBFormat;
    texture.generateMipmaps = false;

    scene = new THREE.Scene();

    // left

    ( function () {
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
        //mesh.rotation.y = - Math.PI / 2;
        mesh.layers.set( 1 ); // display in left eye only
        scene.add( mesh );
    } )();

    // right
    ( function () {
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
        //mesh.rotation.y = - Math.PI / 2;
        mesh.layers.set( 2 ); // display in right eye only
        scene.add( mesh );
    } )();

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0x101010 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    //

    controls = new THREE.VRControls( camera );

    effect = new THREE.VREffect( renderer );
    effect.scale = 0; // video doesn't need eye separation
    effect.setSize( window.innerWidth, window.innerHeight );

    if ( WEBVR.isAvailable() === true ) {

        document.body.appendChild( WEBVR.getButton( effect ) );

    }


    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    effect.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );
    render();

}

function render() {

    controls.update();

    effect.render( scene, camera );

}

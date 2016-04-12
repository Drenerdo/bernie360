function init() {

    if ( WEBVR.isLatestAvailable() === false ) {
        console.warn( 'deprecated version of the WebVR API is being used' );
    }

    var isPlaying = false;

    var container = document.getElementById( 'container' );
    container.addEventListener( 'click', function () {
        startVideo();
    } );

    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0x101010 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.layers.enable( 1 ); // render left view when no stereo available

    // video

    var video = document.createElement( 'video' );

    // video.loop = true;

    // video.crossOrigin = "anonymous";

    if (isMobile()) {
        // lower res for mobile
        video.src = '/static/bernie_stereo_1080_web_optimized.mp4';
    } else {
        // high res, video can autostart on desktop
        // video.src = 'http://ec2-52-87-181-40.compute-1.amazonaws.com/videos/bernie_stereo_1024.mp4';
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

    var controls = new THREE.VRControls( camera );

    var effect = new THREE.VREffect( renderer );
    // effect.scale = 0; // video doesn't need eye separation
    effect.setSize( window.innerWidth, window.innerHeight );

    if ( WEBVR.isAvailable() === true ) {
        var button = WEBVR.getButton( effect );
        // button.onclick = function () {
        //     effect.setFullScreen(true);
        //     controls.resetPose();
        // }
        document.body.appendChild( button );
    }

    //

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        effect.setSize( window.innerWidth, window.innerHeight );
    }

    if (!isMobile()) startVideo();

    function startVideo() {
        if (!isPlaying) {
            isPlaying = true;
            video.play();
            animate();
            setTimeout(addBoxGraph, 5000);
            setTimeout(addPieChart, 12000);
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

    function displayText(text) {
    }


    function addBoxGraph() {
        // bar / box graph

        var colors = [0xff0000, 0xff2200, 0xff4400, 0xff6600, 0xff8800];
        var boxMeshes = [];

        var boxGeom = new THREE.BoxBufferGeometry(0.75, 1, 0.75);
        for (var i = 0; i < colors.length; i++) {
            var boxMaterial = new THREE.MeshLambertMaterial({color: colors[i], transparent: true, opacity: 0});
            var boxMesh = new THREE.Mesh(boxGeom, boxMaterial);
            boxMesh.scale.set(1, 1 + i, 1);
            boxMesh.position.set(-2 + i, 0.75 + 0.5*boxMesh.scale.y, -3);
            scene.add(boxMesh);
            boxMeshes.push(boxMesh);
        }

        var fadeInInterval;
        fadeInInterval = setInterval( function () {
            for (var i = 0; i < boxMeshes.length; i++) {
                var boxMaterial = boxMeshes[i].material;
                boxMaterial.opacity += 0.01 - 0.0001*i;
                boxMaterial.opacity = Math.min(1, boxMaterial.opacity);
            }
            if (boxMeshes[boxMeshes.length-1].material.opacity === 1) {
                clearInterval(fadeInInterval);
            }
        }, 30);

        // function fadeOut() {
        //     for (var i = 0; i < boxMeshes.length; i++) {
        //         var boxMaterial = boxMeshes[i].material;
        //         boxMaterial.opacity -= (0.01 - 0.0001*i);
        //         if (boxMaterial.opacity === 1) {
        //             clearInterval(fadeOutInterval);
        //         }
        //     }
        // }

    }

    function addPieChart() {
        // pie charts

        var colors = [0x008800, 0x00aa44, 0x00bb88];
        var thetaLengths = [2*Math.PI / 2, 2*Math.PI / 4, 2*Math.PI / 4];

        var sliceMeshes = [];

        for (var i = 0; i < colors.length; i++) {
            var sliceGeom = new THREE.CylinderBufferGeometry(0.75, // radius top
                                                             0.75, // radius bottom
                                                             0.15, // height
                                                             12, // radius segments
                                                             1, // height segments
                                                             false, // open-ended
                                                             thetaLengths.slice(0,i).reduce( (p, c) => p + c, 0 ), // start angle
                                                             thetaLengths[i]); // angle swept
            var sliceMaterial = new THREE.MeshLambertMaterial({color: colors[i], transparent: true, opacity: 0});
            var sliceMesh = new THREE.Mesh(sliceGeom, sliceMaterial);
            sliceMesh.rotation.x = 0.8 * Math.PI / 2;
            sliceMesh.position.set(3.5, 1, -3);
            sliceMesh.scale.set(0.85, 0.85, 0.85);
            scene.add(sliceMesh);
            sliceMeshes.push(sliceMesh);
        }

        var fadeInInterval;
        fadeInInterval = setInterval( function () {
            for (var i = 0; i < sliceMeshes.length; i++) {
                var sliceMaterial = sliceMeshes[i].material;
                sliceMaterial.opacity += 0.01 - 0.001 * i;
                sliceMaterial.opacity = Math.min(1, sliceMaterial.opacity);
            }
            if (sliceMeshes[sliceMeshes.length-1].material.opacity === 1) {
                clearInterval(fadeInInterval);
            }                
        }, 30);

    }

}

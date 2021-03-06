/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 *
 * WebVR Spec: http://mozvr.github.io/webvr-spec/webvr.html
 *
 * Firefox: http://mozvr.com/downloads/
 * Chromium: https://drive.google.com/folderview?id=0BzudLt22BqGRbW9WTHMtOWMzNjQ&usp=sharing#list
 *
 */

THREE.VREffect = function ( renderer, onError ) {

	var vrHMD;
	var deprecatedAPI = false;
	var eyeMatrixL = new THREE.Matrix4();
	var eyeMatrixR = new THREE.Matrix4();
	var renderRectL, renderRectR;
	var eyeFOVL, eyeFOVR;

	function gotVRDevices( devices ) {

		for ( var i = 0; i < devices.length; i ++ ) {

			if ( 'VRDisplay' in window && devices[ i ] instanceof VRDisplay ) {

				vrHMD = devices[ i ];
				deprecatedAPI = false;
				break; // We keep the first we encounter

			} else if ( 'HMDVRDevice' in window && devices[ i ] instanceof HMDVRDevice ) {

				vrHMD = devices[ i ];
				deprecatedAPI = true;
				break; // We keep the first we encounter

			}

		}

		if ( vrHMD === undefined ) {

			if ( onError ) onError( 'HMD not available' );

		}

	}

	if ( navigator.getVRDisplays ) {

		navigator.getVRDisplays().then( gotVRDevices );

	} else if ( navigator.getVRDevices ) {

		// Deprecated API.
		navigator.getVRDevices().then( gotVRDevices );

	}

	//

	this.setSize = function ( width, height ) {

		renderer.setSize( width, height );

	};

	// fullscreen

	var isPresenting = false;

	var canvas = renderer.domElement;

	var fullscreenchange = canvas.mozRequestFullScreen ? 'mozfullscreenchange' : 'webkitfullscreenchange';

	document.addEventListener( fullscreenchange, function () {

		if ( vrHMD && deprecatedAPI ) {

			isPresenting = document.mozFullScreenElement || document.webkitFullscreenElement;

		}

	}, false );

	window.addEventListener( 'vrdisplaypresentchange', function () {

		isPresenting = vrHMD && vrHMD.isPresenting;

		if (!isPresenting) {

			var size = renderer.getSize();
			renderer.setViewport( 0, 0, size.width, size.height );

		} else {

			updateProjectionMatrices();
			updateTranslationMatrices();

		}

	}, false );

	this.setFullScreen = function ( boolean ) {

		return new Promise( function ( resolve, reject ) {

			if ( vrHMD === undefined ) {
				reject( new Error( 'No VR hardware found.' ) );
				return;
			}
			if ( isPresenting === boolean ) {
				resolve();
				return;
			}

			if ( !deprecatedAPI ) {

				if ( boolean ) {

					vrHMD.requestPresent( { source: canvas } ).then( function () {

						updateProjectionMatrices();
						updateTranslationMatrices();
						resolve();

					} ).catch( function (error) {

						console.error( 'An error occurred during requestPresent: ' + error );
						reject( new Error( 'An error occurred during requestPresent: ' + error ) );

					} );

				} else {

					resolve( vrHMD.exitPresent() );

				}

			} else {

				updateProjectionMatrices();
				updateTranslationMatrices();

				if ( canvas.mozRequestFullScreen ) {

					canvas.mozRequestFullScreen( { vrDisplay: vrHMD } );
					resolve();

				} else if ( canvas.webkitRequestFullscreen ) {

					canvas.webkitRequestFullscreen( { vrDisplay: vrHMD } );
					resolve();

				} else {

					console.error( 'No compatible requestFullscreen method found.' );
					reject( new Error( 'No compatible requestFullscreen method found.' ) );

				}

			}

		} );

	};

	this.requestPresent = function () {

		return this.setFullScreen( true );

	};

	this.exitPresent = function () {

		return this.setFullScreen( false );

	};

	// render

	var cameraL = new THREE.PerspectiveCamera();
	cameraL.layers.enable( 1 );
	cameraL.matrixAutoUpdate = false;

	var cameraR = new THREE.PerspectiveCamera();
	cameraR.layers.enable( 2 );
	cameraR.matrixAutoUpdate = false;

	var _near = 0.1;
	var _far = 1000;

	function updateProjectionMatrices( near, far ) {

		near = near || _near;
		far  = far  || _far;

		var eyeParamsL = vrHMD.getEyeParameters( 'left' );
		var eyeParamsR = vrHMD.getEyeParameters( 'right' );

		if ( !deprecatedAPI ) {

			eyeFOVL = eyeParamsL.fieldOfView;
			eyeFOVR = eyeParamsR.fieldOfView;

		} else {

			eyeFOVL = eyeParamsL.recommendedFieldOfView;
			eyeFOVR = eyeParamsR.recommendedFieldOfView;

		}

		cameraL.projectionMatrix = fovToProjection( eyeFOVL, true, near, far );
		cameraR.projectionMatrix = fovToProjection( eyeFOVR, true, near, far );

	}

	function updateTranslationMatrices( scale ) {

		scale = scale || 1;

		var eyeParamsL = vrHMD.getEyeParameters( 'left' );
		var eyeParamsR = vrHMD.getEyeParameters( 'right' );

		var eyeTransL;
		var eyeTransR;

		if ( !deprecatedAPI ) {

			eyeTransL = eyeParamsL.offset;
			eyeTransR = eyeParamsR.offset;

			eyeMatrixL.makeTranslation( scale * eyeTransL[0], scale * eyeTransL[1], scale * eyeTransL[2] );
			eyeMatrixR.makeTranslation( scale * eyeTransR[0], scale * eyeTransR[1], scale * eyeTransR[2] );

		} else {

			eyeTransL = eyeParamsL.eyeTranslation;
			eyeTransR = eyeParamsR.eyeTranslation;

			eyeMatrixL.makeTranslation( scale * eyeTransL.x, scale * eyeTransL.y, scale * eyeTransL.z );
			eyeMatrixR.makeTranslation( scale * eyeTransR.x, scale * eyeTransR.y, scale * eyeTransR.z );

		}

	}

	this.render = function ( scene, camera ) {

		if ( vrHMD && isPresenting ) {

			var autoUpdate = scene.autoUpdate;

			if ( autoUpdate ) {

				scene.updateMatrixWorld();
				scene.autoUpdate = false;

			}

			if ( Array.isArray( scene ) ) {

				console.warn( 'THREE.VREffect.render() no longer supports arrays. Use object.layers instead.' );
				scene = scene[ 0 ];

			}

			// When rendering we don't care what the recommended size is, only what the actual size
			// of the backbuffer is.
			var size = renderer.getSize();
			renderRectL = { x: 0, y: 0, width: size.width / 2, height: size.height };
			renderRectR = { x: size.width / 2, y: 0, width: size.width / 2, height: size.height };

			renderer.setScissorTest( true );
			renderer.clear();

			if ( camera.parent === null ) camera.updateMatrixWorld();

			if ( camera.near !== _near || camera.far !== _far ) {

				_near = camera.near;
				_far  = camera.far;
				updateProjectionMatrices( camera.near, camera.far );

			}

			// render left eye
			renderer.setViewport( renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height );
			renderer.setScissor( renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height );
			cameraL.matrixWorld.multiplyMatrices( camera.matrixWorld, eyeMatrixL );
			renderer.render( scene, cameraL );

			// render right eye
			renderer.setViewport( renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height );
			renderer.setScissor( renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height );
			cameraR.matrixWorld.multiplyMatrices( camera.matrixWorld, eyeMatrixR );
			renderer.render( scene, cameraR );

			renderer.setScissorTest( false );

			if ( autoUpdate ) {

				scene.autoUpdate = true;

			}

			if ( !deprecatedAPI ) {

				vrHMD.submitFrame();

			}

			return;

		}

		// Regular render mode if not HMD

		renderer.render( scene, camera );

	};

	//

	function fovToNDCScaleOffset( fov ) {

		var pxscale = 2.0 / ( fov.leftTan + fov.rightTan );
		var pxoffset = ( fov.leftTan - fov.rightTan ) * pxscale * 0.5;
		var pyscale = 2.0 / ( fov.upTan + fov.downTan );
		var pyoffset = ( fov.upTan - fov.downTan ) * pyscale * 0.5;
		return { scale: [ pxscale, pyscale ], offset: [ pxoffset, pyoffset ] };

	}

	function fovPortToProjection( fov, rightHanded, zNear, zFar ) {

		rightHanded = rightHanded === undefined ? true : rightHanded;
		zNear = zNear === undefined ? 0.01 : zNear;
		zFar = zFar === undefined ? 10000.0 : zFar;

		var handednessScale = rightHanded ? - 1.0 : 1.0;

		// start with an identity matrix
		var mobj = new THREE.Matrix4();
		var m = mobj.elements;

		// and with scale/offset info for normalized device coords
		var scaleAndOffset = fovToNDCScaleOffset( fov );

		// X result, map clip edges to [-w,+w]
		m[ 0 * 4 + 0 ] = scaleAndOffset.scale[ 0 ];
		m[ 0 * 4 + 1 ] = 0.0;
		m[ 0 * 4 + 2 ] = scaleAndOffset.offset[ 0 ] * handednessScale;
		m[ 0 * 4 + 3 ] = 0.0;

		// Y result, map clip edges to [-w,+w]
		// Y offset is negated because this proj matrix transforms from world coords with Y=up,
		// but the NDC scaling has Y=down (thanks D3D?)
		m[ 1 * 4 + 0 ] = 0.0;
		m[ 1 * 4 + 1 ] = scaleAndOffset.scale[ 1 ];
		m[ 1 * 4 + 2 ] = - scaleAndOffset.offset[ 1 ] * handednessScale;
		m[ 1 * 4 + 3 ] = 0.0;

		// Z result (up to the app)
		m[ 2 * 4 + 0 ] = 0.0;
		m[ 2 * 4 + 1 ] = 0.0;
		m[ 2 * 4 + 2 ] = zFar / ( zNear - zFar ) * - handednessScale;
		m[ 2 * 4 + 3 ] = ( zFar * zNear ) / ( zNear - zFar );

		// W result (= Z in)
		m[ 3 * 4 + 0 ] = 0.0;
		m[ 3 * 4 + 1 ] = 0.0;
		m[ 3 * 4 + 2 ] = handednessScale;
		m[ 3 * 4 + 3 ] = 0.0;

		mobj.transpose();

		return mobj;

	}

	function fovToProjection( fov, rightHanded, zNear, zFar ) {

		var DEG2RAD = Math.PI / 180.0;

		var fovPort = {
			upTan: Math.tan( fov.upDegrees * DEG2RAD ),
			downTan: Math.tan( fov.downDegrees * DEG2RAD ),
			leftTan: Math.tan( fov.leftDegrees * DEG2RAD ),
			rightTan: Math.tan( fov.rightDegrees * DEG2RAD )
		};

		return fovPortToProjection( fovPort, rightHanded, zNear, zFar );

	}

};

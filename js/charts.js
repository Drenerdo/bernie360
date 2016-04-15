function addBoxChart(scene, fadeInTime, fadeOutTime) {
    "use strict";
    // bar / box graph
    var colors = [0xff0000, 0xff2200, 0xff4400, 0xff6600, 0xff8800];
    var boxMeshes = [];
    var boxGeom = new THREE.BoxBufferGeometry(0.75, 1, 0.75);
    var parent = new THREE.Object3D();
    for (var i = 0; i < colors.length; i++) {
        var boxMaterial = new THREE.MeshLambertMaterial({color: colors[i], transparent: true, opacity: 0});
        var boxMesh = new THREE.Mesh(boxGeom, boxMaterial);
        boxMesh.scale.set(1, 1 + i, 1);
        boxMesh.position.set(-2 + i, 0.75 + 0.5*boxMesh.scale.y, 0);
        boxMesh.updateMatrix();
        parent.add(boxMesh);
        boxMeshes.push(boxMesh);
    }
    parent.rotation.z = -Math.PI / 2;
    parent.position.set(-7, 4, -4);
    parent.scale.set(0.65, 0.65, 0.65);
    parent.updateMatrix();
    scene.add(parent);
    function fadeIn() {
        var fadeInInterval;
        fadeInInterval = setInterval( function () {
            for (var i = 0; i < boxMeshes.length; i++) {
                var boxMaterial = boxMeshes[i].material;
                boxMaterial.opacity += 0.01 - 0.0001*i;
                boxMaterial.opacity = Math.min(1, boxMaterial.opacity);
            }
            if (boxMaterial.opacity === 1) {
                clearInterval(fadeInInterval);
                setTimeout(fadeOut, 10000);
            }
        }, 30);
    }

    setTimeout(fadeIn, fadeInTime);

    function fadeOut() {
        var fadeOutInterval;
        fadeOutInterval = setInterval( function () {
            for (var i = 0; i < boxMeshes.length; i++) {
                var boxMaterial = boxMeshes[i].material;
                boxMaterial.opacity -= (0.01 - 0.0001*i);
                boxMaterial.opacity = Math.max(0, boxMaterial.opacity);
            }
            if (boxMaterial.opacity === 1) {
                clearInterval(fadeOutInterval);
            }
        }, 30);
    }

}


function addPieChart(scene, fadeInTime, fadeOutTime) {
    "use strict";
    var colors = [0x33bb33, 0xbb3333, 0x3333bb, 0x33bbbb];
    var thetaLengths = [2*Math.PI / 2, 2*Math.PI / 4, 2*Math.PI / 7];
    thetaLengths.push(2*Math.PI - thetaLengths.reduce( (p, c) => p + c));

    var sliceMeshes = [];

    for (var i = 0; i < colors.length; i++) {
        var sliceGeom = new THREE.CylinderBufferGeometry(
            0.75, // radius top
            0.75, // radius bottom
            0.15, // height
            10, // radius segments
            1, // height segments
            false, // open-ended
            thetaLengths.slice(0,i).reduce( (p, c) => p + c, 0 ), // start angle
            thetaLengths[i] // angle swept
        );
        var sliceMaterial = new THREE.MeshLambertMaterial({color: colors[i], transparent: true, opacity: 0});
        var sliceMesh = new THREE.Mesh(sliceGeom, sliceMaterial);
        sliceMesh.rotation.x = 1.2 * Math.PI / 2;
        sliceMesh.scale.set(0.85, 0.85, 0.85);
        sliceMesh.position.set(3.5, 1.5, -3);
        sliceMesh.updateMatrix();
        scene.add(sliceMesh);
        sliceMeshes.push(sliceMesh);
    }

    function fadeIn() {
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
        }, 40);
    }

    setTimeout(fadeIn, fadeInTime);
}


var makeLineAreaChart = ( function () {
    "use strict";

    const DEFAULT_OPTIONS = {
        width: 1,
        height: 1,
        depth: 0,
        areaMaterial: new THREE.MeshBasicMaterial({color: 0xffff00}),
        labelSize: 0.004,
    };

    var quadGeom = new THREE.PlaneBufferGeometry(1, 1);

    return function (xValues, yValues, options, onLoad) {
        options = options || {};
        for (var key in DEFAULT_OPTIONS) {
            if (options[key] === undefined) options[key] = DEFAULT_OPTIONS[key];
        }
        options.yMin = options.yMin !== undefined ? options.yMin : Math.min.apply(null, yValues);

        var chart = new THREE.Object3D();

        var nx = xValues.length;
        var points = [];
        for (var i = nx - 1; i >= 0; i--) {
            points.push(new THREE.Vector2(xValues[i], yValues[i]));
        }
        points.push(new THREE.Vector2(xValues[0], options.yMin));
        points.push(new THREE.Vector2(xValues[nx - 1], options.yMin));

        var shape = new THREE.Shape(points);
        var geom;
        if (options.depth > 0) geom = shape.extrude({bevelEnabled: false, amount: options.depth});
        else geom = shape.makeGeometry();
        geom.translate(-xValues[0], -options.yMin, 0);
        var bufferGeom = (new THREE.BufferGeometry()).fromGeometry(geom);
        geom.dispose();

        var mesh = new THREE.Mesh(bufferGeom, options.areaMaterial);
        bufferGeom.computeBoundingBox();
        mesh.scale.set(
            options.width / (bufferGeom.boundingBox.max.x - bufferGeom.boundingBox.min.x),
            options.height / (bufferGeom.boundingBox.max.y - bufferGeom.boundingBox.min.y),
            1
        );
        mesh.updateMatrix();

        chart.add(mesh);

        var loadingManager = new THREE.LoadingManager(onTexturesLoad);
        var textureLoader = new THREE.TextureLoader(loadingManager);

        var titleTexture;
        if (options.titleImage) titleTexture = textureLoader.load(options.titleImage);
        var xLabelTexture;
        if (options.xLabelImage) xLabelTexture = textureLoader.load(options.xLabelImage);
        var yLabelTexture;
        if (options.yLabelImage) yLabelTexture = textureLoader.load(options.yLabelImage);

        // if (options.xLabels) {
        //     options.xLabels.forEach( function (url) {
        //     } );
        // }

        function onTexturesLoad() {
            var material, mesh;
            var labelSize = options.labelSize;
            [titleTexture, xLabelTexture, yLabelTexture].forEach( function (texture) {
                material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
                mesh = new THREE.Mesh(quadGeom, material);
                mesh.scale.x = labelSize * texture.image.width;
                mesh.scale.y = labelSize * texture.image.height;
                if (texture === titleTexture) {
                    mesh.position.x = 0.5 * mesh.scale.x;
                    mesh.position.y = 1.1 * options.height + 0.5 * mesh.scale.y;
                } else if (texture === xLabelTexture) {
                    mesh.position.x = 0.5 * mesh.scale.x;
                    mesh.position.y = -0.5 * mesh.scale.y;
                } else if (texture === yLabelTexture) {
                    mesh.position.x = -mesh.scale.x;
                    mesh.position.y = 0.5 * mesh.scale.y;
                }
                mesh.updateMatrix();
                chart.add(mesh);
            } );

            if (onLoad) onLoad(chart);
        }

        return chart;
    };
} )();


var makeTextLabel = ( function () {
    "use strict";

    const DEFAULT_OPTIONS = {
        font: '48px serif',
        fillStyle:   'rgb(255, 0, 0)',
        strokeStyle: 'rgb(255, 0, 0)'
    };

    return function (text, options) {
        options = options || {};
        for (var kwarg in DEFAULT_OPTIONS) {
            if (options[kwarg] === undefined) options[kwarg] = DEFAULT_OPTIONS[kwarg];
        }

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = options.font;

        canvas.width = 256; //ctx.measureText(text).width;
        canvas.height = 64;

        ctx.fillStyle = options.fillStyle;
        ctx.strokeStyle = options.strokeStyle;
        ctx.fillText(text, 0, 64);
        ctx.strokeText(text, 0, 64);

        var texture = new THREE.Texture(canvas);
        var material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
        material.map.needsUpdate = true;

        var sprite = new THREE.Sprite(material);
        return sprite;
    };

} )();

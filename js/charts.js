function addBoxGraph(scene, fadeInTime, fadeOutTime) {
    "use strict";
    // bar / box graph
    var colors = [0xff0000, 0xff2200, 0xff4400, 0xff6600, 0xff8800];
    var boxMeshes = [];
    var boxGeom = new THREE.BoxBufferGeometry(0.75, 1, 0.75);
    for (var i = 0; i < colors.length; i++) {
        var boxMaterial = new THREE.MeshLambertMaterial({color: colors[i], transparent: true, opacity: 0});
        var boxMesh = new THREE.Mesh(boxGeom, boxMaterial);
        boxMesh.matrixAutoUpdate = false;
        boxMesh.scale.set(1, 1 + i, 1);
        boxMesh.position.set(-2 + i, 0.75 + 0.5*boxMesh.scale.y, -3);
        boxMesh.updateMatrix();
        scene.add(boxMesh);
        boxMeshes.push(boxMesh);
    }

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
        }, 40);
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
        }, 40);
    }

}

function addPieChart(scene, fadeInTime, fadeOutTime) {
    "use strict";
    // pie charts

    var colors = [0x008800, 0x00aa44, 0x00bb88];
    var thetaLengths = [2*Math.PI / 2, 2*Math.PI / 4, 2*Math.PI / 4];

    var sliceMeshes = [];

    for (var i = 0; i < colors.length; i++) {
        var sliceGeom = new THREE.CylinderBufferGeometry(0.75, // radius top
                                                         0.75, // radius bottom
                                                         0.15, // height
                                                         10, // radius segments
                                                         1, // height segments
                                                         false, // open-ended
                                                         thetaLengths.slice(0,i).reduce( (p, c) => p + c, 0 ), // start angle
                                                         thetaLengths[i]); // angle swept
        var sliceMaterial = new THREE.MeshLambertMaterial({color: colors[i], transparent: true, opacity: 0});
        var sliceMesh = new THREE.Mesh(sliceGeom, sliceMaterial);
        sliceMesh.matrixAutoUpdate = false;
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

function makeLineAreaBufferGeometry(x, y, depth) {
    "use strict";
    var nx = x.length;
    var points = [];
    for (var i = nx-1; i >= 0; i--) {
        points.push(new THREE.Vector2(x[i], y[i]));
    }
    points.push(new THREE.Vector2(x[0], 0));
    points.push(new THREE.Vector2(x[nx-1], 0));
    var shape = new THREE.Shape(points);
    var geom = shape.extrude({bevelEnabled: false, amount: depth});
    geom.translate(-x[0], 0, 0);
    var bufferGeom = (new THREE.BufferGeometry()).fromGeometry(geom);
    geom.dispose();
    return bufferGeom;
}


function addLineAreaChart(scene, fadeInTime, fadeOutTime) {
    "use strict";
    var geom = makeLineAreaBufferGeometry(INCOME_INEQUALITY.x, INCOME_INEQUALITY.y, 0.2);
    geom.computeBoundingBox();
    var material = new THREE.MeshLambertMaterial({color: 0x0000ff});
    var mesh = new THREE.Mesh(geom, material);
    mesh.matrixAutoUpdate = false;
    mesh.position.set(0, 3, -6);
    mesh.scale.set(4 / (geom.boundingBox.max.x - geom.boundingBox.min.x), 2 / (geom.boundingBox.max.y - geom.boundingBox.min.y), 1);
    mesh.updateMatrix();
    scene.add(mesh);
}

function makeTextMesh(text) {
    "use strict";
    var quadGeom = new THREE.PlaneBufferGeometry(1, 1);
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.font = "28px serif";
    // var textMetrics = ctx.measureText(text);
    // canvas.width = textMetrics.width / 0.5;
    ctx.fillStyle = 'rgb(255, 200, 150)';
    ctx.fillText(text, 0, 48);
    var texture = new THREE.Texture(canvas, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter);
    var material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
    material.map.needsUpdate = true;
    var mesh = new THREE.Mesh(quadGeom, material);
    mesh.matrixAutoUpdate = false;
    var aspect = canvas.width / canvas.height;
    mesh.scale.set(aspect, 1, 1);
    mesh.updateMatrix();
    return mesh;
}

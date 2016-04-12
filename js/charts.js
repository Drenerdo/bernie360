function addBoxGraph(scene) {
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

function addPieChart(scene) {
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

function displayText(text) {
    // TODO
}
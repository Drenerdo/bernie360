var makeText = ( function () {
    "use strict";

    const DEFAULT_OPTIONS = {
        font: undefined,
        textMaterial: new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true}),
        curveSegments: 8
    };

    return function (text, options) {
        options = options || {};
        for (var kwarg in DEFAULT_OPTIONS) {
            if (options[kwarg] === undefined) options[kwarg] = DEFAULT_OPTIONS[kwarg];
        }

        var textGeomParams = {
            font: options.font,
            height: 0.1 * 0.1,
            size: 0.1,
            curveSegments: options.curveSegments
        };
        var textGeom = new THREE.TextGeometry(text, textGeomParams);
        textGeom.center();
        textGeom.computeBoundingBox();
        var textMesh = new THREE.Mesh((new THREE.BufferGeometry()).fromGeometry(textGeom), options.textMaterial);
        textGeom.dispose();
        textMesh.renderOrder = -2;
        return textMesh;
    };
} )();

var makeBarChart = ( function () {
    "use strict";

    const DEFAULT_OPTIONS = {
        barWidth: 0.25,
        barDepth: 0.25,
        barMaterial: new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true}),
        barSeparation: 0.05,
        heightScale: 1,
        font: undefined,
        textMaterial: new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true}),
        barLabels: undefined,
        title: undefined
    };

    var boxGeom = new THREE.BoxBufferGeometry(1, 1, 1);

    return function (heights, options, onLoad) {
        options = options || {};
        for (var kwarg in DEFAULT_OPTIONS) {
            if (options[kwarg] === undefined) options[kwarg] = DEFAULT_OPTIONS[kwarg];
        }

        var chart = new THREE.Object3D();
        var materials = [options.barMaterial, options.textMaterial];

        for (var i = 0; i < heights.length; i++) {
            var height = heights[i];
            var barMesh = new THREE.Mesh(boxGeom, options.barMaterial);
            barMesh.scale.set(options.barWidth, height * options.heightScale, options.barDepth);
            barMesh.position.x = (i + 0.5) * barMesh.scale.x + i * options.barSeparation;
            barMesh.position.y = 0.5 * barMesh.scale.y;
            barMesh.updateMatrix();
            chart.add(barMesh);

            if (options.font) {
                var textGeomParams = {
                    font: options.font,
                    height: 0.1 * 0.08,
                    size: 0.08,
                    curveSegments: 8
                };
                var textGeom = new THREE.TextGeometry(String(height), textGeomParams);
                textGeom.center();
                textGeom.computeBoundingBox();
                var textMesh = new THREE.Mesh((new THREE.BufferGeometry()).fromGeometry(textGeom), options.textMaterial);
                textMesh.position.x = barMesh.position.x;
                textMesh.position.y = barMesh.scale.y + 1.2 * textGeomParams.size;
                textMesh.position.z = 0.5 * barMesh.scale.z;
                textMesh.updateMatrix();
                textGeom.dispose();
                chart.add(textMesh);

                if (options.barLabels) {
                    textGeom = new THREE.TextGeometry(options.barLabels[i], textGeomParams);
                    textGeom.center();
                    textGeom.computeBoundingBox();
                    textMesh = new THREE.Mesh((new THREE.BufferGeometry()).fromGeometry(textGeom), options.textMaterial);
                    textMesh.position.x = barMesh.position.x;
                    textMesh.position.y = -1.2 * textGeomParams.size;
                    textMesh.position.z = 0.5 * barMesh.scale.z;
                    textMesh.updateMatrix();
                    textGeom.dispose();
                    chart.add(textMesh);
                }
            }
        }

        if (options.font && options.title) {
            textGeomParams.size = 0.1;
            textGeomParams.height = 0.1 * 0.1;
            textGeom = new THREE.TextGeometry(options.title, textGeomParams);
            textGeom.center();
            textGeom.computeBoundingBox();
            textMesh = new THREE.Mesh((new THREE.BufferGeometry()).fromGeometry(textGeom), options.textMaterial);
            var bb = (new THREE.Box3()).setFromObject(chart);
            textMesh.position.x = bb.center().x;
            textMesh.position.y = bb.max.y + 2 * textGeom.boundingBox.size().y * 0.5;
            textMesh.position.z = 0.5 * barMesh.scale.z;
            textMesh.updateMatrix();
            textGeom.dispose();
            chart.add(textMesh);
        }

        if (onLoad) {
            onLoad(chart, materials);
        }

        function animateFadeIn(t, dt) {
            for (var i = 0; i < materials.length; i++) {
                var material = materials[i];
                material.opacity = Math.min(1, material.opacity + dt);
            }
            if (material.opacity === 1) {
                BERNIE360.animateEvent = null;
            }
        }

        function animateFadeOut(t, dt) {
            for (var i = 0; i < materials.length; i++) {
                var material = materials[i];
                material.opacity -= dt;
            }
            if (material.opacity <= 0) {
                BERNIE360.scene.remove(chart);
                // TODO: dispose all resources
                BERNIE360.animateEvent = null;
            }
        }

        function startFadeIn(t) {
            chart.visible = true;
            BERNIE360.animateEvent = animateFadeIn;
        }

        function startFadeOut(t) {
            BERNIE360.animateEvent = animateFadeOut;
        }

        return {chart: chart, startFadeIn: startFadeIn, startFadeOut: startFadeOut};
    };

} )();


var makeLineAreaChart = ( function () {
    "use strict";

    const DEFAULT_OPTIONS = {
        width: 1,
        height: 1,
        depth: 0,
        areaMaterial: new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true}),
        titleImage: undefined,
        xLabelImage: undefined,
        yLabelImage: undefined,
        xLabelImages: undefined,
        yLabelImages: undefined,
        labelSize: 0.005,
        font: undefined,
        textMaterial: new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true}),
        xLabelValues: undefined,
        yLabelValues: undefined,
        title: undefined
    };

    var labelGeom = new THREE.PlaneBufferGeometry(1, 1);

    return function (xValues, yValues, options, onLoad) {
        options = options || {};
        for (var key in DEFAULT_OPTIONS) {
            if (options[key] === undefined) options[key] = DEFAULT_OPTIONS[key];
        }
        options.yMin = options.yMin !== undefined ? options.yMin : Math.min.apply(null, yValues);

        var chart = new THREE.Object3D();
        var materials = [];

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
        geom.translate(-xValues[0], -options.yMin, -options.depth);
        var bufferGeom = (new THREE.BufferGeometry()).fromGeometry(geom);
        geom.dispose();

        var areaMesh = new THREE.Mesh(bufferGeom, options.areaMaterial);
        bufferGeom.computeBoundingBox();
        areaMesh.scale.set(
            options.width / (bufferGeom.boundingBox.max.x - bufferGeom.boundingBox.min.x),
            options.height / (bufferGeom.boundingBox.max.y - bufferGeom.boundingBox.min.y),
            1
        );
        areaMesh.updateMatrix();

        chart.add(areaMesh);
        materials.push(areaMesh.material);

        if (options.font) {
            materials.push(options.textMaterial);
            var textGeomParams = {
                font: options.font,
                height: 0.1 * 0.08,
                size: 0.08,
                curveSegments: 8
            };
            if (options.xLabelValues) {
                options.xLabelValues.forEach( function (x, i) {
                    var textGeom = new THREE.TextGeometry(String(x), textGeomParams);
                    textGeom.center();
                    textGeom.computeBoundingBox();
                    var textMesh = new THREE.Mesh((new THREE.BufferGeometry()).fromGeometry(textGeom), options.textMaterial);
                    textMesh.position.x = areaMesh.scale.x * (x - xValues[0]);
                    textMesh.position.y = options.yMin - 2 * 1.2 * textGeomParams.size;
                    textMesh.position.z = 0.5 * options.depth;
                    textMesh.updateMatrix();
                    textGeom.dispose();
                    chart.add(textMesh);
                } );
            }
            if (options.yLabelValues) {
                options.yLabelValues.forEach( function (y, i) {
                    var textGeom = new THREE.TextGeometry(String(y), textGeomParams);
                    textGeom.center();
                    textGeom.computeBoundingBox();
                    var textMesh = new THREE.Mesh((new THREE.BufferGeometry()).fromGeometry(textGeom), options.textMaterial);
                    textMesh.position.x = -1.2 * textGeom.boundingBox.max.x;
                    textMesh.position.y = areaMesh.scale.y * y;
                    textMesh.position.z = 0.5 * options.depth;
                    textMesh.updateMatrix();
                    textGeom.dispose();
                    chart.add(textMesh);
                } );
            }
            if (options.title) {
                textGeomParams.size = 0.12;
                textGeomParams.height = 0.1 * 0.1;
                var textGeom = new THREE.TextGeometry(options.title, textGeomParams);
                textGeom.center();
                textGeom.computeBoundingBox();
                var textMesh = new THREE.Mesh((new THREE.BufferGeometry()).fromGeometry(textGeom), options.textMaterial);
                var bb = (new THREE.Box3()).setFromObject(chart);
                textMesh.position.x = bb.center().x;
                textMesh.position.y = bb.max.y + 2 * textGeom.boundingBox.size().y * 0.5;
                textMesh.position.z = 0.5 * options.depth;
                textMesh.updateMatrix();
                textGeom.dispose();
                chart.add(textMesh);
            }

        }

        var loadingManager = new THREE.LoadingManager(onTexturesLoad);
        var textureLoader = new THREE.TextureLoader(loadingManager);

        var titleTexture;
        var xLabelTexture;
        var yLabelTexture;
        var xLabelOffsets = [];
        var xLabelTextures = [];
        var yLabelOffsets = [];
        var yLabelTextures = [];
        if (options.titleImage) titleTexture = textureLoader.load(options.titleImage);

        if (options.xLabelImage) xLabelTexture = textureLoader.load(options.xLabelImage);
        else if (options.xLabelImages) {
            options.xLabelImages.forEach( function (url) {
                xLabelTextures.push( textureLoader.load(url) );
                xLabelOffsets.push( parseFloat(url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.png'))) );
            } );
        }

        if (options.yLabelImage) yLabelTexture = textureLoader.load(options.yLabelImage);
        else if (options.yLabelImages) {
            options.yLabelImages.forEach( function (url) {
                yLabelTextures.push( textureLoader.load(url) );
                yLabelOffsets.push( parseFloat(url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.png'))) );
            } );
        }

        if (!(options.titleImage || options.xLabelImage || options.xLabelImages || options.yLabelImage || options.yLabelImages)) {
            onTexturesLoad();
        }

        function onTexturesLoad() {
            var material, mesh;
            var labelSize = options.labelSize;

            xLabelTextures.forEach( function (texture, i) {
                material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
                materials.push(material);
                mesh = new THREE.Mesh(labelGeom, material);
                mesh.scale.x = labelSize * texture.image.width;
                mesh.scale.y = labelSize * texture.image.height;
                mesh.position.x = areaMesh.scale.x * (xLabelOffsets[i] - xValues[0]);
                mesh.position.y = -0.5 * mesh.scale.y;
                mesh.updateMatrix();
                chart.add(mesh);
            } );

            yLabelTextures.forEach( function (texture, i) {
                material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
                materials.push(material);
                mesh = new THREE.Mesh(labelGeom, material);
                mesh.scale.x = labelSize * texture.image.width;
                mesh.scale.y = labelSize * texture.image.height;
                mesh.position.x = -0.5 * mesh.scale.x;
                mesh.position.y = areaMesh.scale.y * (yLabelOffsets[i] - options.yMin);
                mesh.updateMatrix();
                chart.add(mesh);
            } );

            [titleTexture, xLabelTexture, yLabelTexture].forEach( function (texture) {
                if (!texture) return;
                material = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, transparent: true});
                materials.push(material);
                mesh = new THREE.Mesh(labelGeom, material);
                mesh.scale.x = labelSize * texture.image.width;
                mesh.scale.y = labelSize * texture.image.height;
                if (texture === titleTexture) {
                    var bb = (new THREE.Box3()).setFromObject(chart);
                    mesh.position.x = bb.center().x; //0.5 * mesh.scale.x;
                    mesh.position.y = 1.2 * options.height + 0.5 * mesh.scale.y;
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

            if (onLoad) onLoad(chart, materials);
        }

        function animateFadeIn(t, dt) {
            for (var i = 0; i < materials.length; i++) {
                var material = materials[i];
                material.opacity = Math.min(1, material.opacity += dt);
            }
            if (material.opacity === 1) {
                BERNIE360.animateEvent = null;
            }
        }

        function animateFadeOut(t, dt) {
            for (var i = 0; i < materials.length; i++) {
                var material = materials[i];
                material.opacity -= dt;
            }
            if (material.opacity <= 0) {
                BERNIE360.scene.remove(chart);
                // TODO: dispose all resources
                BERNIE360.animateEvent = null;
            }
        }

        function startFadeIn(t) {
            chart.visible = true;
            BERNIE360.animateEvent = animateFadeIn;
        }

        function startFadeOut(t) {
            BERNIE360.animateEvent = animateFadeOut;
        }

        return {chart: chart, startFadeIn: startFadeIn, startFadeOut: startFadeOut};
    };
} )();

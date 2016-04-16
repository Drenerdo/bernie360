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

const snapElement = `<div class="snap-animation__wrapper">
              <div class="snap-animation"></div>
          </div>`;
const getBackElement = `<div class="back-animation__wrapper">
          <div class="back-animation"></div>
      </div>`;
const fileChooser = document.getElementById('file-to-dust');
const random = chance.integer({
    min: 1,
    max: 6
});
const startSnap = new Audio('assets/audio/thanos_snap_sound.mp3');
const startSnapBack = new Audio('assets/audio/thanos_reverse_sound.mp3');
const startDust = new Audio('assets/audio/thanos_dust_' + random + '.mp3');
const thanosLogo = document.getElementById('thanos-idle');
let snapped = false;
var imageDataArray = [];
var canvasCount = 10;

$("#start-btn").click(function () {
    if(!snapped){
        snap();
    } else {
        getBack();
    }
});

function getBack(){
    $('#start-btn').hide();
    $('#start-btn').after(getBackElement);
    startSnapBack.play();
    startSnapBack.onplay = function(){
        $('#victim').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1, border:"1px solid green"}, 3000);
    }
    startSnapBack.onended = function(){
        $('#start-btn').show();
        $('.back-animation__wrapper').remove();
        snapped = false;
    }
}


function snap()
{
    $('#start-btn').hide();
    $('#start-btn').after(snapElement);
    startSnap.play();
    let options = {
        scale: 1
    };
    startSnap.onended = function () {
        html2canvas($(".content")[0], options).then(canvas => {
            //capture all div data as image
            ctx = canvas.getContext("2d");
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var pixelArr = imageData.data;
            createBlankImageData(imageData);
            //put pixel info to imageDataArray (Weighted Distributed)
            for (let i = 0; i < pixelArr.length; i += 4) {
                //find the highest probability canvas the pixel should be in
                let p = Math.floor((i / pixelArr.length) * canvasCount);
                let a = imageDataArray[weightedRandomDistrib(p)];
                a[i] = pixelArr[i];
                a[i + 1] = pixelArr[i + 1];
                a[i + 2] = pixelArr[i + 2];
                a[i + 3] = pixelArr[i + 3];
            }
            //create canvas for each imageData and append to target element
            for (let i = 0; i < canvasCount; i++) {
                let c = newCanvasFromImageData(imageDataArray[i], canvas.width, canvas.height);
                c.classList.add("dust");
                $("body").append(c);
            }
            //clear all children except the canvas
            $(".content").fadeOut(3500);
            //apply animation
            startToDust();
            $('.content').delay(3000).fadeIn();
            $('#victim').css('visibility','hidden');
            $('#start-btn').show();
            $('.snap-animation__wrapper').remove();
            snapped = true;
        });
    }
}

function startToDust() {
    $(".dust").each(function (index) {
        startDust.play();
        animateBlur($(this), 0.8, 800);
        setTimeout(() => {
            animateTransform($(this), 100, -100, chance.integer({
                min: -15,
                max: 15
            }), 800 + (110 * index));
        }, 70 * index);
        //remove the canvas from DOM tree when faded
        $(this).delay(70 * index).fadeOut((110 * index) + 800, "easeInQuint", () => {
            $(this).remove();
        });
    });
}

function weightedRandomDistrib(peak) {
    var prob = [],
        seq = [];
    for (let i = 0; i < canvasCount; i++) {
        prob.push(Math.pow(canvasCount - Math.abs(peak - i), 3));
        seq.push(i);
    }
    return chance.weighted(seq, prob);
}

function animateBlur(elem, radius, duration) {
    var r = 0;
    $({
        rad: 0
    }).animate({
        rad: radius
    }, {
        duration: duration,
        easing: "easeOutQuad",
        step: function (now) {
            elem.css({
                filter: 'blur(' + now + 'px)'
            });
        }
    });
}

function animateTransform(elem, sx, sy, angle, duration) {
    var td = tx = ty = 0;
    $({
        x: 0,
        y: 0,
        deg: 0
    }).animate({
        x: sx,
        y: sy,
        deg: angle
    }, {
        duration: duration,
        easing: "easeInQuad",
        step: function (now, fx) {
            if (fx.prop == "x")
                tx = now;
            else if (fx.prop == "y")
                ty = now;
            else if (fx.prop == "deg")
                td = now;
            elem.css({
                transform: 'rotate(' + td + 'deg)' + 'translate(' + tx + 'px,' + ty + 'px)'
            });
        }
    });
}

function createBlankImageData(imageData) {
    for (let i = 0; i < canvasCount; i++) {
        let arr = new Uint8ClampedArray(imageData.data);
        for (let j = 0; j < arr.length; j++) {
            arr[j] = 0;
        }
        imageDataArray.push(arr);
    }
}

function newCanvasFromImageData(imageDataArray, w, h) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    tempCtx = canvas.getContext("2d");
    tempCtx.putImageData(new ImageData(imageDataArray, w, h), 0, 0);

    return canvas;
}

fileChooser.onchange = function (evt) {
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            document.getElementById('victim').src = fr.result;
        }
        fr.readAsDataURL(files[0]);
    }

    // Not supported
    else {
        // fallback -- perhaps submit the input to an iframe and temporarily store
        // them on the server until the user's session ends.
    }
}
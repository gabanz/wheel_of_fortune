// the game itself
let game;

/*
function httpGet(url, callback) {
    // this function gets the contents of the URL. Once the
    // content is present it runs the callback function.
    let xhr=new XMLHttpRequest();
    xhr.onreadystatechange=function() {
        if (xhr.readyState==4 && xhr.status==200) {
            callback(xhr.responseText);
        }
    }
    xhr.open("GET", url, false );
    xhr.send();    
}

let names = [];

httpGet("names.txt", function(textFile){
    // this calls the httpGet function with the URL of the text
    // file. It then runs a function that turns the file into an
    // array.
    names = textFile.split("\n");
});
*/

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 10)];
    }
    return color;
  }

// i itialize global variables
let names = [];
let slices = [];

let gameOptions = {

    // wheel rotation duration range, in milliseconds
    rotationTimeRange: {
        min: 4500,
        max: 5500
    },

    // wheel rounds before it stops
    wheelRounds: {
        min: 2,
        max: 11
    },

    // degrees the wheel will rotate in the opposite direction before it stops
    backSpin: {
        min: 1,
        max: 4
    },

    // wheel radius, in pixels
    wheelRadius: 240,

    // color of stroke lines
    strokeColor: 0x000,

    // width of stroke lines
    strokeWidth: 2
}

// once the window loads...
window.onload = function() {

    let uploadedFile;
    const fileSelector = document.getElementById('file-selector');
    fileSelector.addEventListener('change', (event) => {
      uploadedFile = event.target.files;
      console.log(typeof uploadedFile);
    });

    // game configuration object
    let gameConfig = {

        // resolution and scale mode
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 600,
            height: 600
        },

       // game background color
       backgroundColor: this.getRandomColor(),

       // scenes used by the game
       scene: [playGame]
    };

    // game constructor
    game = new Phaser.Game(gameConfig);

    // pure javascript to give focus to the page/frame
    window.focus()
}

// PlayGame scene
class playGame extends Phaser.Scene{

    // constructor
    constructor(){
        super("PlayGame");
    }

    // method to be executed when the scene preloads
    preload(){

        // loading pin image, sound effect and default text file
        this.load.image("pin", "pin.png");
        this.load.audio('audio', ['fortune-wheel.mp3']);
        this.load.text('names', ['names.txt']);
        this.load.text("uploadedFile", uploadedFile);

    }

    // method to be executed once the scene has been created
    create(){

        names = this.cache.getText('uploadedFile').split("\n");
        console.log(typeof names);
        console.log(names);

        // if names is empty, load the default file
        if (!Array.isArray(names) || !names.length) {
            names = this.cache.text.get('names').split("\n");
        }

        let degrees = 360/names.length;
   
        for(var i = 0; i < names.length; i++){
            slices[i] =
                {
                    degrees: degrees,
                    startColor: getRandomColor(),
                    endColor: getRandomColor(),
                    gradientRings: 10,
                    text: names[i],
                    sliceText: names[i],
                    sliceTextStyle: {
                        fontFamily: "Arial Black",
                        //fontSize: 36,
                        color: "#fff"
                    },
                }
        }

        // starting degrees
        let startDegrees = -90;

        // making a graphic object without adding it to the game
        let graphics = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        // adding a container to group wheel
        this.wheelContainer = this.add.container(game.config.width / 2, game.config.height / 2);

        // array which will contain all text
        let textArray = [];

        // looping through each slice
        for(let i = 0; i < slices.length; i++){

            // converting colors from 0xRRGGBB format to Color objects
            let startColor = Phaser.Display.Color.ValueToColor(slices[i].startColor);
            let endColor = Phaser.Display.Color.ValueToColor(slices[i].endColor)

            for(let j = slices[i].gradientRings; j > 0; j--){

                // interpolate colors
                let ringColor = Phaser.Display.Color.Interpolate.ColorWithColor(startColor,endColor, slices[i].gradientRings, j);

                // converting the interpolated color to 0xRRGGBB format
                let ringColorString = Phaser.Display.Color.RGBToString(Math.round(ringColor.r), Math.round(ringColor.g), Math.round(ringColor.b), 0, "0x");

                // setting fill style
                graphics.fillStyle(ringColorString, 1);

                // drawing the slice
                graphics.slice(gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius + gameOptions.strokeWidth, j * gameOptions.wheelRadius / slices[i].gradientRings, Phaser.Math.DegToRad(startDegrees), Phaser.Math.DegToRad(startDegrees + slices[i].degrees), false);

                // filling the slice
                graphics.fillPath();
            }

            // setting line style
            graphics.lineStyle(gameOptions.strokeWidth, gameOptions.strokeColor, 1);

            // drawing the biggest slice
            graphics.slice(gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius, Phaser.Math.DegToRad(startDegrees), Phaser.Math.DegToRad(startDegrees + slices[i].degrees), false);

            // stroking the slice
            graphics.strokePath();

            // add slice text, if any
            if(slices[i].sliceText != undefined){

                // the text
                let text = this.add.text(gameOptions.wheelRadius * 0.75 * Math.cos(Phaser.Math.DegToRad(startDegrees + slices[i].degrees / 2)), gameOptions.wheelRadius * 0.75 * Math.sin(Phaser.Math.DegToRad(startDegrees + slices[i].degrees / 2)), slices[i].sliceText, slices[i].sliceTextStyle);

                // set text origin to its center
                text.setOrigin(0.5);

                // set text angle
                text.angle = startDegrees + slices[i].degrees / 2;

                // stroke text, if required
                if(slices[i].sliceTextStroke && slices[i].sliceTextStrokeColor){
                    text.setStroke(slices[i].sliceTextStrokeColor, slices[i].sliceTextStroke);
                }

                // add text to textArray
                textArray.push(text);
            }

            // updating degrees
            startDegrees += slices[i].degrees;

        }

        // generate a texture called "wheel" from graphics data
        graphics.generateTexture("wheel", (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2, (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2);

        // creating a sprite with wheel image as if it was a preloaded image
        let wheel = this.add.sprite(0, 0, "wheel");

        // adding the wheel to the container
        this.wheelContainer.add(wheel);

        // adding all textArray items to the container
        this.wheelContainer.add(textArray);

        // adding the pin in the middle of the canvas
        this.pin = this.add.sprite(game.config.width / 2, game.config.height / 2, "pin");

        // adding the text field
        this.prizeText = this.add.text(game.config.width / 2, game.config.height - 20, "The Wheel of (Mis)Fortunes", {
            font: "32px Arial",
            align: "center",
            color: "white"
        });

        // center the text
        this.prizeText.setOrigin(0.5);

        // the game has just started = we can spin the wheel
        this.canSpin = true;

        // waiting for your input, then calling "spinWheel" function
        this.input.on("pointerdown", this.spinWheel, this);
    }

    // function to spin the wheel
    spinWheel(){

        // can we spin the wheel?
        if(this.canSpin){

            // resetting text field
            this.prizeText.setText("");

            let sound = this.sound.add('audio');
            sound.play();

            // the wheel will spin round for some times. This is just coreography
            let rounds = Phaser.Math.Between(gameOptions.wheelRounds.min, gameOptions.wheelRounds.max);

            // then will rotate by a random number from 0 to 360 degrees. This is the actual spin
            let degrees = Phaser.Math.Between(0, 360);

            // then will rotate back by a random amount of degrees
            let backDegrees = Phaser.Math.Between(gameOptions.backSpin.min, gameOptions.backSpin.max);

            // before the wheel ends spinning, we already know the prize
            let prizeDegree = 0;

            // looping through slices
            for(let i = slices.length - 1; i >= 0; i--){

                // adding current slice angle to prizeDegree
                prizeDegree += slices[i].degrees;

                // if it's greater than the random angle...
                if(prizeDegree > degrees - backDegrees){

                    // we found the prize
                    var prize = i;
                    break;
                }
            }

            // now the wheel cannot spin because it's already spinning
            this.canSpin = false;

            // animation tweeen for the spin: duration 3s, will rotate by (360 * rounds + degrees) degrees
            // the quadratic easing will simulate friction
            this.tweens.add({

                // adding the wheel container to tween targets
                targets: [this.wheelContainer],

                // angle destination
                angle: 360 * rounds + degrees,

                // tween duration
                duration: Phaser.Math.Between(gameOptions.rotationTimeRange.min, gameOptions.rotationTimeRange.max),

                // tween easing
                ease: "Cubic.easeOut",

                // callback scope
                callbackScope: this,

                // function to be executed once the tween has been completed
                onComplete: function(tween){

                    // another tween to rotate a bit in the opposite direction
                    this.tweens.add({
                        targets: [this.wheelContainer],
                        angle: this.wheelContainer.angle - backDegrees,
                        duration: Phaser.Math.Between(gameOptions.rotationTimeRange.min, gameOptions.rotationTimeRange.max) / 2,
                        ease: "Cubic.easeIn",
                        callbackScope: this,
                        onComplete: function(tween){

                            // displaying prize text
                            this.prizeText.setText('Winner: ' + slices[prize].text);

                            // player can spin again
                            this.canSpin = true;
                        }
                    })
                }
            });
        }
    }
}

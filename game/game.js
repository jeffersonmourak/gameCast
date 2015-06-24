(function() {

    "use strict";

    function Game(width, height, canvas) {
        this.canvas = {};
        this.game = {};
        this.canvas.element = canvas;
        this.canvas.context = this.canvas.element.getContext("2d");
        this.canvas.sizes = {};
        this.canvas.sizes.width = width;
        this.canvas.sizes.height = height;

        this.reazon = (this.canvas.sizes.width / this.canvas.sizes.height) / 1.5;

        this.FPS = 60;

        this.velocityMultiplyer = 60 / this.FPS;

        this.game.key = {
            "up": false,
            "down": false,
            "left": false,
            "right": false,
            "space": false
        }

        this.remote = true;

        this.enemies = [];

        if (Game.instance_) {
            return Game.instance_;
        }
        Game.instance_ = this;

        this.init();
    }

    window["Game"] = Game;

    Game.prototype = {
        init: function() {
            this.canvas.element.width = this.canvas.sizes.width;
            this.canvas.element.height = this.canvas.sizes.height;

            this.gameElementX = 50;
            this.gameElementY = 50;

            this.player = new Player(this.canvas.context, this.reazon,this.canvas.sizes.height);
            this.player.canvasWidth = this.canvas.sizes.width;
            this.player.canvasHeight = this.canvas.sizes.height;

            this.HUD = new HUD(this.canvas.context,"Score");
            this.HUDFps = new HUD(this.canvas.context,"FPS ");
            this.HUDFps.x = this.canvas.sizes.width - 80;
            this.HUDFps.value = this.FPS;

            if(!this.remote){
                this.getPressedKey();
            }

            this.time = 0;
            this.waiting = false;

            var self = this;
            setInterval(function() {

            	self.perform();
                self.update();
                self.draw();

            }, 1000 / this.FPS);

        },
        remoteControl: function(status, key){
            if(status == "press"){
                this.game.key[key] = true;
            }
            else if(status == "leave"){
                this.game.key[key] = false;
            }
        },
        update: function() {
            var keyDown = this.game.key;
            this.player.move(0, 0);
            if (keyDown.left) {
                this.player.move(-5 * this.velocityMultiplyer, 0);
            }
            if (keyDown.right) {
                this.player.move(5 * this.velocityMultiplyer, 0);
            }
            if (Math.random() < 0.01) {
                this.enemies.push(new Enemy({
                	reazon: this.reazon,
                    canvas: this.canvas.context,
                    canvasWidth: this.canvas.sizes.width,
                    canvasHeight: this.canvas.sizes.height
                }));
            }

            var playerBullests = this.player.activeBullets();

            var playerEnemies = this.activeEnemies();

            for (var i in playerBullests) {
                var bullet = playerBullests[i];
                bullet.update();
            }

            for (var j in playerEnemies) {
                var enemy = playerEnemies[j];
                enemy.update();
            }

            if (this.time <= 5) {
                if (!this.waiting) {
                    this.player.shoot();
                }
            } else {
                if (this.waiting) {
                    this.waiting = false;
                } else {
                    this.waiting = true;
                }
                this.time = 0;
            }
            this.time++;

            this.collisionDetector();

        },
        draw: function() {
            this.canvas.context.clearRect(0, 0, this.canvas.sizes.width, this.canvas.sizes.height);
            this.canvas.context.fillStyle = "#0f0f0f";
            this.canvas.context.fillRect(0, 0, this.canvas.sizes.width, this.canvas.sizes.height);
            this.player.draw();

            this.HUD.draw();
            this.HUDFps.draw();

            var playerBullests = this.player.activeBullets();
            var playerEnemies = this.activeEnemies();

            for (var i in playerBullests) {
                var bullet = playerBullests[i];
                bullet.draw();
            }

            for (var j in playerEnemies) {
                var enemy = playerEnemies[j];
                enemy.draw();
            }

        },
        perform: function(){
       
            var enemies = this.enemies;
            this.enemies = [];
            for (var i in enemies) {
                var enemy = enemies[i];
                if (enemy.active) {
                	this.enemies.push(enemy);
                }
            }

          
            var bullets = this.player.bullets;
            this.player.bullets = [];
            for (var i in bullets) {
                var bullet = bullets[i];
                if (bullet.active) {
                	this.player.bullets.push(bullet);
                }
            }

       

        },
        getPressedKey: function() {
            var self = this;

            document.addEventListener("keydown", function(e) {
                if (e.keyCode == 38) {
                    self.game.key.up = true;
                }
                if (e.keyCode == 40) {
                    self.game.key.down = true;
                }
                if (e.keyCode == 37) {
                    self.game.key.left = true;
                }
                if (e.keyCode == 39) {
                    self.game.key.right = true;
                }
            }, false);

            document.addEventListener("keyup", function(e) {
                if (e.keyCode == 38) {
                    self.game.key.up = false;
                }
                if (e.keyCode == 40) {
                    self.game.key.down = false;
                }
                if (e.keyCode == 37) {
                    self.game.key.left = false;
                }
                if (e.keyCode == 39) {
                    self.game.key.right = false;
                }
            }, false);
        },
        activeEnemies: function() {
            var activeenemies = [];
            var enemies = this.enemies;
            this.enemies = [];
            for (var i in enemies) {
                var enemy = enemies[i];
                if (enemy.active) {
                	this.enemies.push(enemy);
                    activeenemies.push(enemy);
                }
            }
            return activeenemies;
        },
        collides: function(a, b) {
            return a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y;
        },
        collisionDetector: function() {
            var bullets = this.player.activeBullets();
            var enemies = this.activeEnemies();

            for (var i in bullets) {
                var bullet = bullets[i];

                for (var j in enemies) {
                    var enemy = enemies[j];
                    if (this.collides(enemy, bullet)) {
                        enemy.explode();
                        this.HUD.value += 10;
                        bullet.active = false;
                    }
                }

            }

            for (var k in enemies) {
                var enemy = enemies[k];
                if (this.collides(this.player, enemy)) {
                    this.player.explode();
                }
            }

        }
    }

    function Player(canvas,reazon,canvasHeight) {
        this.color = "#00A";
        this.x = 220;
        this.y = (canvasHeight - 50);
        this.width = 32 * reazon;
        this.height = 32 * reazon;
        this.reazon = reazon;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.canvas = canvas;
        this.bullets = [];
        this.active = true;
        this.sprite = document.querySelector("#player");
    }

    Player.prototype = {
        draw: function() {
            this.fillStyle = this.color;
            this.canvas.drawImage(this.sprite, this.x, this.y, this.width + 10, this.height + 10);
        },
        move: function(x, y) {

            Number.prototype.clamp = function(min, max) {
                if (this <= min) {
                    return min;
                } else if (this >= max) {
                    return max;
                } else {
                    return this;
                }
            };

            if (this.active) {
                this.x += x;
                this.y += y;

                this.x = this.x.clamp(0, this.canvasWidth - this.width);
            }
        },
        shoot: function() {

            if (this.active) {
                var midlePosition = this.midlePoint();
                this.bullets.push(new Bullet({
                    speed: 5 * Game.instance_.velocityMultiplyer,
                    x: this.x + 10,
                    y: midlePosition.y,
                    reazon: this.reazon,
                    canvas: {
                        element: this.canvas,
                        width: this.canvasWidth,
                        height: this.canvasHeight
                    },
                }));
                this.bullets.push(new Bullet({
                    speed: 5 * Game.instance_.velocityMultiplyer,
                    x: this.x + 29,
                    y: midlePosition.y,
                    reazon: this.reazon,
                    canvas: {
                        element: this.canvas,
                        width: this.canvasWidth,
                        height: this.canvasHeight
                    }
                }));
            }

        },
        midlePoint: function() {
            return {
                x: this.x + (this.width / 2),
                y: this.y + (this.height / 2)
            }
        },
        activeBullets: function() {
            var activebullets = [];
            var bullets = this.bullets;
            this.bullets = [];
            for (var i in bullets) {
                var bullet = bullets[i];
                if (bullet.active) {
                    this.bullets.push(bullet);
                    activebullets.push(bullet);
                }
            }
            return activebullets;
        },
        explode: function() {
            //hide
        }
    }

    function Bullet(data) {
        this.active = true;
        this.speed = data.speed || 5;
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.xVelocity = 0;
        this.yVelocity = -this.speed;
        this.width = 3 * data.reazon;
        this.height = 6 * data.reazon;
        this.color = "#ccc";
        this.canvasWidth = data.canvas.width || 200;
        this.canvasHeight = data.canvas.height || 200;
        this.context = data.canvas.element;
    }

    Bullet.prototype = {
        inBounds: function() {
            return this.x >= 0 && this.x <= this.canvasWidth &&
                this.y >= 0 && this.y <= this.canvasHeight;
        },
        draw: function() {
            this.context.fillStyle = this.color;
            this.context.fillRect(this.x, this.y, this.width, this.height);
        },
        update: function() {
            this.x += this.xVelocity;
            this.y += this.yVelocity;

            this.active = this.active && this.inBounds();

        }
    }

    function Enemy(data) {
        this.canvas = data.canvas;
        this.canvasWidth = data.canvasWidth;
        this.canvasHeight = data.canvasHeight;

        this.active = true;
        this.age = Math.floor(Math.random() * 128);
        this.color = "#fafafa";

        this.x = this.canvasWidth / 4 + Math.random() * this.canvasWidth / 2;
        this.y = 2;

        this.xVelocity = 0;
        this.yVelocity = 2;

        this.width = 40 * data.reazon;
        this.height = 40 * data.reazon;

    }

    Enemy.prototype = {
        inBounds: function() {
            return this.x >= 0 && this.x <= this.canvasWidth &&
                this.y >= 0 && this.y <= this.canvasHeight;
        },
        draw: function() {

            this.canvas.save();
            this.canvas.beginPath();
            this.canvas.translate(this.x + this.width / 2, this.y + this.height / 2);
            this.canvas.fillStyle = this.color;
            this.canvas.rotate((this.age * 2) * Math.PI / 180);

            var x = -this.width/2;
            var y = -this.height/2;

            var radius = x * (-1);

            this.canvas.beginPath();
            this.canvas.moveTo(x + radius, y);
            this.canvas.lineTo(x + this.width - radius, y);
            this.canvas.quadraticCurveTo(x + this.width, y, x + this.width, y + radius);
            this.canvas.lineTo(x + this.width, y + this.height - radius);
            this.canvas.quadraticCurveTo(x + this.width, y + this.height, x + this.width - radius, y + this.height);
            this.canvas.lineTo(x + radius, y + this.height);
            this.canvas.quadraticCurveTo(x, y + this.height, x, y + this.height - radius);
            this.canvas.lineTo(x, y + radius);
            this.canvas.quadraticCurveTo(x, y, x + radius, y);
            this.canvas.closePath();

            this.canvas.fill();
            this.canvas.restore();
        },
        update: function() {
            this.x += this.xVelocity;
            this.y += this.yVelocity;

            this.xVelocity = (3 * Game.instance_.velocityMultiplyer) * Math.sin(this.age * Math.PI / 64);

            this.age++;

            this.active = this.active && this.inBounds();
        },
        explode: function() {
            this.active = false;
        }
    }

    function HUD(canvas,text) {
        this.value = 0;
        this.canvas = canvas;
        this.x = 20;
        this.text = text;
    }

    HUD.prototype = {
        draw: function() {
            this.canvas.fillStyle = "#fff";
            this.canvas.font = "20px Arial"
            this.canvas.fillText(this.text + this.value, this.x, 20);
        }
    }

}());

var gameCanvas = document.querySelector("#game");
new Game(1280, 720, gameCanvas);

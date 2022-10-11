window.addEventListener('load', function(){
    
    // Canvas Setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1920;
    canvas.height = 1080;

    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener('keydown', e => {
                if ((   (e.key === 'w') ||
                        (e.key === 's')
                ) && this.game.keys.indexOf(e.key) === -1) {
                    this.game.keys.push(e.key);
                } else if (e.key === ' ') {
                    this.game.player.shootTop();
                } else if (e.key === 'd') {
                    this.game.debug = !this.game.debug;
                }
            });
            window.addEventListener('keyup', e => {
                if(this.game.keys.indexOf(e.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
            });
        }
    }

    class Projectile {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 3;
            this.speed = 15;
            this.markedForDeletion = false;
            this.image = document.getElementById('projectile');
        }
        
        update() {
            this.x += this.speed;
            if(this.x > this.game.width * 0.8) this.markedForDeletion = true;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y)
        }
    }

    class Explosion {
        constructor(game, x, y) {
            this.game = game;
            this.frameX = 0;
            this.spriteWidth = 200;
            this.spriteHeight = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width * 0.5;
            this.y = y - this.height * 0.5;
            this.fps = 50;
            this.timer = 0;
            this.interval = 1000/this.fps;
            this.markedForDeletion = false;
            this.maxFrame = 8;
        }

        update(deltaTime) {
            this.x -= this.game.speed;
            if(this.timer > this.interval) {
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            if(this.frameX > this.maxFrame) this.markedForDeletion = true;
        }

        draw(context) {
            context.drawImage(this.image, this.frameX * this.spriteWidth, 0,
            this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
        }
    }
    class SmokeExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = document.getElementById('smokeExplosion');
        }
    }
    class FireExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = document.getElementById('fireExplosion');
        }
    }

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 104;
            this.height = 142;
            this.x = 50;
            this.y = 500;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 29;
            this.speedY = 0;
            this.maxSpeed = 10;
            this.projectiles = [];
            this.image = document.getElementById('player');
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
        }

        update(deltaTime) {
            if (this.game.keys.includes('w')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('s')) this.speedY = this.maxSpeed;
            else this.speedY = 0;
            this.y += this.speedY;

            // Vertical Boundaries
            if(this.y > this.game.height - this.height * 0.5)
            this.y = this.game.height - this.height * 0.5;
            else if(this.y < -this.height * 0.5) this.y = -this.height * 0.5;

            // Handle Projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

            // Sprite Animation
            if(this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }

            // Power Up
            if(this.powerUp) {
                if(this.powerUpTimer > this.powerUpLimit) {
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.game.ammo += 0.1;
                }
            }
        }

        draw(context) {
            if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, 
                                this.width, this.height, this.x, this.y, this.width, this.height);
        }

        shootTop() {
            if(this.game.ammo > 0) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30));
                this.game.ammo--;
            }
            if(this.powerUp) this.shoot2();
        }

        shoot2() {
            if(this.game.ammo > 0) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 60));
            }
        }

        enterPowerUp() {
            this.powerUpTimer = 0;
            this.powerUp = true;
            if(this.game.ammo < this.game.maxAmmo) this.game.ammo = this.game.maxAmmo;
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -5.5 - 0.5;
            this.markedForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            // this.maxFrame = 19;
        }

        update() {
            this.x += this.speedX - this.game.speed;
            if(this.x + this.width < 0) this.markedForDeletion = true;

            // Sprite Animation
            if(this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }
        }

        draw(context) {
            if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, 
                                this.width, this.height, this.x, this.y, this.width, this.height);
            if(this.game.debug) {
                context.font = '20px Helvetica';
                context.fillText(this.lives, this.x, this.y);
            }
        }
    }
    class Sandalien extends Enemy {
        constructor(game) {
            super(game);
            this.width = 205;
            this.height = 176;
            this.maxFrame = 19;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.image = document.getElementById('sandalien');
            this.lives = 5;
            this.score = this.lives;
        }
    }
    class Bee extends Enemy {
        constructor(game) {
            super(game);
            this.width = 273;
            this.height = 282;
            this.maxFrame = 12;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.image = document.getElementById('bee');
            this.lives = 2;
            this.score = this.lives;
        }
    }
    class Ghost extends Enemy {
        constructor(game) {
            super(game);
            this.width = 396;
            this.height = 582;
            this.maxFrame = 10;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.image = document.getElementById('ghost');
            this.lives = 15;
            this.score = 15;
            this.type = 'lucky';
        }
    }

    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1920;
            this.height = 1080;
            this.x = 0;
            this.y = 0;
        }

        update() {
            if(this.x <= -this.width) this.x = 0;
            this.x -= this.game.speed * this.speedModifier;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y);
            context.drawImage(this.image, this.x + this.width, this.y);
        }
    }

    class Background {
        constructor(game) {
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.image2 = document.getElementById('layer2');
            this.image3 = document.getElementById('layer3');
            this.image4 = document.getElementById('layer4');
            this.image5 = document.getElementById('layer5');
            this.image6 = document.getElementById('layer6');
            this.image7 = document.getElementById('layer7');
            this.image8 = document.getElementById('layer8');
            this.layer1 = new Layer(this.game, this.image1, 2);
            this.layer2 = new Layer(this.game, this.image2, 2.4);
            this.layer3 = new Layer(this.game, this.image3, 2.8);
            this.layer4 = new Layer(this.game, this.image4, 3.2);
            this.layer5 = new Layer(this.game, this.image5, 2.4);
            this.layer6 = new Layer(this.game, this.image6, 2.8);
            this.layer7 = new Layer(this.game, this.image7, 3.2);
            this.layer8 = new Layer(this.game, this.image8, 3.6);
            this.layers = [this.layer1, this.layer2, this.layer3, this.layer4, 
                            this.layer5, this.layer6, this.layer7, this.layer8];
        }

        update() {
            this.layers.forEach(layer => layer.update());
        }

        draw(context) {
            this.layers.forEach(layer => layer.draw(context));
        }
    }

    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 60;
            this.fontFamily = 'Bangers';
            this.color = 'white';
        }

        draw(context) {
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;

            // Score
            context.fillText('Score: ' + this.game.score, 30, 80);

            // Timer
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
            context.fillText('Timer: ' + formattedTime, 30, 185);

            // Game Over Messages
            if(this.game.gameOver) {
                context.textAlign = 'center';
                let message1;
                let message2;
                if(this.game.score > this.game.winningScore) {
                    message1 = 'You Win';
                    message2 = 'Well done';
                } else {
                    message1 = 'You lose';
                    message2 = 'Try again next time!';
                }
                context.font = '200px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5,
                                            this.game.height * 0.5 - 70);
                context.font = '100px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5,
                                            this.game.height * 0.5 + 70);
            }
            
            // Ammo
            if(this.game.player.powerUp) context.fillStyle = 'yellow';
            for(let i = 0; i < this.game.ammo; i++) {
                context.fillRect(30 + 5 * i, 100, 3, 20);
            }
            context.restore();
        }
    }

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.background = new Background(this);
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.explosions = [];
            this.enemyTimer = 0;
            this.enemyInterval = 2000;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 350;
            this.gameOver = false;
            this.score = 0;
            this.winningScore = 150;
            this.gameTime = 0;
            this.timeLimit = 40000;
            this.speed = 1;
            this.debug = true;
        }
        update(deltaTime) {
            if(!this.gameOver) this.gameTime += deltaTime;
            if(this.gameTime > this.timeLimit) this.gameOver = true;
            this.background.update();
            this.player.update(deltaTime);
            if(this.ammoTimer > this.ammoInterval) {
                if(this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }
            this.explosions.forEach(explosion => explosion.update(deltaTime));
            this.explosions = this.explosions.filter(explosion =>
            !explosion.markedForDeletion);
            this.enemies.forEach(enemy => {
                enemy.update();
                if(this.checkCollision(this.player, enemy)) {
                    enemy.markedForDeletion = true;
                    this.addExplosion(enemy);
                    if(enemy.type === 'lucky') this.player.enterPowerUp();
                    else if(!this.gameOver) this.score--;
                }
                this.player.projectiles.forEach(projectile => {
                    if(this.checkCollision(projectile, enemy)) {
                        enemy.lives--;
                        projectile.markedForDeletion = true;
                        if(enemy.lives <= 0) {
                            enemy.markedForDeletion = true;
                            this.addExplosion(enemy);
                            if(!this.gameOver) this.score += enemy.score;
                            if(this.score > this.winningScore) this.gameOver = true;
                        }
                    }
                })
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            if(this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }

        draw(context) {
            this.background.draw(context);
            this.player.draw(context);
            this.ui.draw(context);
            this.enemies.forEach(enemy => {
                enemy.draw(context);
            });
            this.explosions.forEach(explosion => {
                explosion.draw(context);
            });
        }

        addEnemy() {
            const randomize = Math.random();
            if(randomize < 0.3) this.enemies.push(new Sandalien(this));
            else if(randomize < 0.6) this.enemies.push(new Bee(this));
            else this.enemies.push(new Ghost(this));
        }

        addExplosion(enemy) {
            const randomize = Math.random();
            if(randomize < 0.5) {
                this.explosions.push(new
                SmokeExplosion(this, enemy.x + enemy.width * 0.5,
                                    enemy.y + enemy.height * 0.5));
            } else {
                this.explosions.push(new
                FireExplosion(this, enemy.x + enemy.width * 0.5,
                                    enemy.y + enemy.height * 0.5));
            }
        }

        checkCollision(rect1, rect2) {
            return (    rect1.x < rect2.x + rect2.width &&
                        rect1.x + rect1.width > rect2.x &&
                        rect1.y < rect2.y + rect2.height &&
                        rect1.height + rect1.y > rect2.y)
        }
    }

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;

    // Animation Loop
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.draw(ctx);
        game.update(deltaTime);
        requestAnimationFrame(animate);
    }
    animate(0);
});
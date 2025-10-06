/**
 * Potential issues: 
 * 
 * Known Issues: bullets automatically do area damage
 */

window.addEventListener('load', function () {
    // Canvas setup
    const canvas = this.document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    // Size of background images
    canvas.width = 3840;
    canvas.height = 2160;

    // Classes must be in a specific order
    class InputHandler {
        constructor(game) {
            this.game = game;
            this.mouse = {
                x: 0,
                y: 0,
                clicked: false
            };

            // Mouse handling
            window.addEventListener('click', event => {
                const rect = canvas.getBoundingClientRect(); // Gets the canvas position and size in browser
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                // Convert browser to canvas coordinates
                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                this.mouse.x = mouseX;
                this.mouse.y = mouseY;

                this.game.buttons.forEach((button, index) => {
                    if (this.game.checkMouseCollision(mouseX, mouseY, button)) {
                        this.handleButtonClick(button, index);
                    }
                });

            });
            window.addEventListener('mousemove', event => {
                const rect = canvas.getBoundingClientRect(); // Gets the canvas position and size in browser
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                // Convert browser to canvas coordinates
                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                this.mouse.x = mouseX;
                this.mouse.y = mouseY;

                this.game.buttons.forEach(button => {
                    button.isHovered = this.game.checkMouseCollision(mouseX, mouseY, button);
                });
            });

            // Key handling
            // window.addEventListener('keydown', shootEvent => {
            //     if (shootEvent.key === 'q') {
            //         this.game.player.shootTop();
            //     }
            // });
            window.addEventListener('keydown', event => {
                if (event.key === 'q') {
                    this.game.player.shootTop();
                    console.log('pressed q');
                } else if (event.key === 'h') {
                    this.game.debug = !this.game.debug;
                    console.log('Debug mode: ' + this.game.debug);
                } else if (((event.key === 'ArrowUp') ||
                    (event.key === 'ArrowDown') ||
                    (event.key === 'ArrowLeft') ||
                    (event.key === 'ArrowRight') ||
                    (event.key === 'w') ||
                    (event.key === 'a') ||
                    (event.key === 's') ||
                    (event.key === 'd') ||
                    (event.key === ' ')

                ) && this.game.keys.indexOf(event.key) === -1) {
                    this.game.keys.push(event.key);
                }
            });
            window.addEventListener('keyup', event => {
                if (this.game.keys.indexOf(event.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(event.key), 1); // Remove the key from array
                }
            });
        }
        handleButtonClick(button, index){
            const timesUpgraded = 1;
            if (this.game.coins >= this.game.upgradePrices[index]) {
                this.game.coins -= this.game.upgradePrices[index];
                switch(index) {
                    case 0: // Bullet Speed
                        this.game.projectileSpeed += 12;
                        break;
                    case 1: // Damage
                        this.game.damageMultiplier++;
                        break;
                    case 2: // Max ammo + ammo regen
                        this.game.ammoRegenMultiplier++;
                        this.game.maxAmmo += 20;
                        break;
                    case 3: // WE WILL SEE
                        break;
                    default:
                        console.log('Unknown button index:', index);
                }
                this.game.upgradePrices[index] += (10 * timesUpgraded);
            }
        }
    }
    class Projectile {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.markedForDeletion = false;
        }
        update() {
            this.x += this.speed;
            this.speed += this.speedIncrease;
            if (this.x > this.game.width * this.projectileRangePercentage) {
                this.markedForDeletion = true;
            }
        }
        draw(context) {
            context.save();
            context.fillStyle = 'yellow';
            context.fillRect(this.x, this.y, this.width, this.height);
            context.restore();
        }
    }

    class playerProjectile extends Projectile {
        constructor(game, x, y) {
            super(game);
            this.width = 20;
            this.height = 6;
            this.speed = this.game.projectileSpeed;
            this.speedIncrease = 0.3;  
            this.projectileRangePercentage = 0.95; // This is the percent of the screen that it can travel before deleting
        }
        update() {
            this.x += this.speed;
            this.speed += this.speedIncrease;
            if (this.x > this.game.width * this.projectileRangePercentage) {
                this.markedForDeletion = true;
            }    
        }
        draw(context) {
            context.save();
            context.fillStyle = 'yellow';
            context.fillRect(this.x, this.y, this.width, this.height);
            context.restore();
        }
    }

    class enemyArrow extends Projectile {
        constructor(game, x, y) {
            super(game, x, y);
            // this.x = x;
            // this.y = y;
            this.speed = 5; // Or however fast you want it
            
        }
        update() {
            this.x -= this.speed;

            if (this.x <= this.game.width * (1 - this.projectileRangePercentage)) {
                this.markedForDeletion = true;
            }
        }
    }

    class Particle {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('gold');
            this.frameX = 0;
            this.frameY = 0;
            this.spriteSize = 16;
            this.sizeModifier = (Math.random() * 2.5 + 1).toFixed(1); // Random number between 1 and 3.5
            this.size = this.spriteSize * this.sizeModifier;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * -15;
            this.gravity = 0.5;
            this.markedForDeletion = false;
            this.angle = 0;
            this.velocityOfAngle = Math.random() * 0.2 - 0.1; // Between 0.1 and -0.1

            // Bounce system - track which bounces have occurred
            this.bouncesUsed = {
                enemyBottom: false,
                bridge: false,
                screenBottom: false
            };

            // Define bounce boundaries
            this.enemyBottomBoundary = this.game.height * 0.4; // If no enemies
            for (let i = 0; i < this.game.enemies.length; i++) {
                this.enemyBottomBoundary = this.game.enemies[i].y + this.game.enemies.height;
                break;
            }
            this.bridgeBoundary = 200;
            this.screenBottomBoundary = this.game.height - 200; // Leave some margin from actual bottom
            this.bounceReduction = 0.6; // How much speed is reduced on bounce
        }

        update() {
            this.angle += this.velocityOfAngle;
            this.speedY += this.gravity + this.game.speed; // Add scrolling speed
            this.x -= this.speedX;
            this.y += this.speedY;

            // Check for bounces in order from top to bottom
            // Enemy bottom bounce
            if (!this.bouncesUsed.enemyBottom &&
                this.y + this.size > this.enemyBottomBoundary &&
                this.speedY > 0) {
                this.bouncesUsed.enemyBottom = true;
                this.speedY *= -this.bounceReduction;
                this.y = this.enemyBottomBoundary - this.size; // Prevent particle from going through
            }

            // Bridge level bounce (around y=200)
            else if (!this.bouncesUsed.bridge &&
                this.y + this.size > this.game.height - this.bridgeBoundary &&
                this.speedY > 0) {
                this.bouncesUsed.bridge = true;
                this.speedY *= -this.bounceReduction;
                this.y = this.game.height - this.bridgeBoundary - this.size;
            }

            // Screen bottom bounce
            else if (!this.bouncesUsed.screenBottom &&
                this.y + this.size > this.screenBottomBoundary &&
                this.speedY > 0) {
                this.bouncesUsed.screenBottom = true;
                this.speedY *= -this.bounceReduction;
                this.y = this.screenBottomBoundary - this.size;
            }

            // Delete particle if it goes completely off screen or has used all bounces and is falling
            if (this.y > this.game.height + this.size ||
                this.x < 0 - this.size ||
                (this.bouncesUsed.screenBottom && this.y > this.screenBottomBoundary + 100)) {
                this.markedForDeletion = true;
            }
        }
        draw(context) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);

            context.drawImage(this.image, this.frameX * this.spriteSize, this.frameY * this.spriteSize, this.spriteSize, this.spriteSize, this.size * -0.5, this.size * -0.5, this.size, this.size);

            context.restore();
        }
    }

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 960;
            this.height = 660;
            this.x = 128;
            this.y = 88;
            
            this.speedY = 0;
            this.speedX = 0;
            this.maxSpeedY = 8;
            this.maxSpeedX = 8;
            this.projectiles = [];
            this.muzzleLocX = 160;
            this.muzzleLocY = 300;
            this.image = document.getElementById('player');

            // Sprite sheet dimensions
            this.spriteWidth = 128;
            this.spriteHeight = 88;
            
            // Animation
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 7; // 8 Frames total
            this.animationTimer = 0;
            this.animationInterval = 50;
        }
        update(deltaTime) {
            // Vertical movement
            if (this.game.keys.includes('ArrowUp') || this.game.keys.includes('w')) {
                this.speedY = -this.maxSpeedY;
            } else if (this.game.keys.includes('ArrowDown') || this.game.keys.includes('s')) {
                this.speedY = this.maxSpeedY;
            } else {
                this.speedY = 0;
            }
            this.y += this.speedY;


            // Boundary checkings THE 170 MAKES SURE HE STAYS ON THE BRIDGE
            if (this.y < 170) {
                this.y = 170;
            }
            if (this.y > this.game.height - this.height - 170) {
                this.y = this.game.height - this.height - 170;
            }

            // Sprite animation
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationInterval) {
                if (this.frameX < this.maxFrame) {
                    this.frameX++;
                } else {
                    this.frameX = 0;
                }
                this.animationTimer = 0;
            }
            // Horizontal movement
            if (this.game.keys.includes('ArrowRight') || this.game.keys.includes('d')) {
                this.speedX = this.maxSpeedX;
            } else if (this.game.keys.includes('ArrowLeft') || this.game.keys.includes('a')) {
                this.speedX = -this.maxSpeedX
            } else {
                this.speedX = 0;
            }
            this.x += this.speedX

            // Boundary checking
            if (this.x < 0) {
                this.x = 0;
            }
            if (this.x > this.game.width - this.width) {
                this.x = this.game.width - this.width;
            }

            // Handle projectiles
            this.projectiles.forEach(projectiles => {
                projectiles.update();
            });
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
        }
        draw(context) {
            if (this.game.debug) {
                context.strokeRect(this.x, this.y, this.width, this.height);
            }
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
            context.save();
            this.game.applyShadow(context, 'heavy');
            context.drawImage(this.image, this.frameX * this.spriteWidth,
                this.frameY * this.spriteHeight,
                this.spriteWidth, this.spriteHeight, this.x, this.y,
                this.width, this.height);
                
                context.restore();

        }
        shootTop() {
            if (this.game.ammo > 0) {
                this.projectiles.push(new playerProjectile(this.game, this.x + this.muzzleLocX, this.y + this.muzzleLocY));
                this.game.ammo--;
            }
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.markedForDeletion = false;
            this.lives = 5;
            this.score = this.lives;
            this.muzzleLocX = 100;
            this.muzzleLocY = 100;
            this.projectiles = [];

            // Animation
            this.frameX = 0;
            this.frameY = 1;
            this.animationTimer = 0;
            this.isAnimating = true;
            this.isBeingHealed = false;
        }
        update(deltaTime) {
            this.x += this.speedX - this.game.speed;
            // Delete if off screen to the left
            if (this.x + this.width < 0) {
                this.markedForDeletion = true;
                if (!this.game.gameOver) {
                this.game.playerHitpoints--;
                }
            }
        
            // this.game.doAnimation(this, deltaTime);

            // Handle projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

            //Animation
            this.game.doAnimation(this, deltaTime);
        }
        draw(context) {
            if (this.game.debug) {
                context.strokeRect(this.x, this.y, this.width, this.height);
            }
            // Draw the projectiles
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
            context.save();
    
            // Move to the center of the enemy sprite
            context.translate(this.x + this.width / 2, this.y + this.height / 2);
            
            // Flip horizontally by scaling x by -1
            context.scale(-1, 1);
            
            // Draw the image centered at the origin (since we translated to center)
            context.drawImage(
                this.image, 
                this.frameX * this.spriteWidth,
                this.frameY * this.spriteHeight,
                this.spriteWidth, 
                this.spriteHeight, 
                -this.width / 2, // Negative half width to center
                -this.height / 2, // Negative half height to center
                this.width, 
                this.height
            );
            
            // Restore the context state
            context.restore();
            context.font = '40px Fridge';
            context.fillText(this.lives, this.x, this.y);
        }
        shootTop() {
                this.projectiles.push(new enemyArrow(this.game, this.x + this.muzzleLocX, this.y + this.muzzleLocY));
        }
    }

    /**
     * Classes for different enemy types
     * 
     * Spritesheet: 0-idle 1-walk 2-attack1 3-attack2 4-hurt 5-dead
     */
    class Orc extends Enemy {
        constructor(game) {
            super(game); // runs the parent class constructor
            this.width = 900;
            this.height = 900;
            this.spriteHeight = 100;
            this.spriteWidth = 100;
            const middle = this.game.height / 2;  // 1080
            const minY = middle - 600;
            const maxY = middle + 350;
            this.y = Math.random() * (maxY - minY) + minY;
            this.speedX = Math.random() * -6 - 2; // Move from right to left

            this.image = document.getElementById("orc");
            this.frameY = 1;
            this.maxFrame = 7; // 8 Frames total
            this.animationInterval = 100; // Time in milliseconds between each frame
        }
    }

    /**
     * Spritesheet: 0-idle 1-walk 2-attack1 3-attack2 4-attack3 5-block 6-hurt 7-dead
     */
    class OrcRider extends Enemy {
        constructor(game) {
            super(game); // runs the parent class constructor
            this.width = 900;
            this.height = 900;
            this.spriteHeight = 100;
            this.spriteWidth = 100;
            const middle = this.game.height / 2;  // 1080
            const minY = middle - 600;
            const maxY = middle + 350;
            this.y = Math.random() * (maxY - minY) + minY;
            this.speedX = Math.random() * -6 - 2; // Move from right to left

            this.image = document.getElementById("orc-rider");
            this.frameY = 1;
            this.maxFrame = 7; // 8 Frames total for walking
            this.animationInterval = 100; // Time in milliseconds between each frame
        }
    }

    /**
     * Spritesheet: 0-idle 1-walk 2-attack1 3-attack2 4-hurt 5-dead
     */
    class Skeleton extends Enemy {
        constructor(game) {
            super(game); // runs the parent class constructor
            this.width = 900;
            this.height = 900;
            this.spriteHeight = 100;
            this.spriteWidth = 100;
            const middle = this.game.height / 2;  // 1080
            const minY = middle - 600;
            const maxY = middle + 350;
            this.y = Math.random() * (maxY - minY) + minY;
            this.speedX = Math.random() * -2 - 2; // Move from right to left

            this.image = document.getElementById("skeleton");
            this.frameY = 1;
            this.maxFrame = 7; // 8 Frames total for walking
            this.animationInterval = 100; // Time in milliseconds between each frame
        }
    }

    /**
     * Spritesheet: 0-idle 1-walk 2-attack1 3-hurt 4-dead
     */
    class SkeletonArcher extends Enemy {
        constructor(game) {
            super(game); // runs the parent class constructor
            this.width = 900;
            this.height = 900;
            this.spriteHeight = 100;
            this.spriteWidth = 100;
            const middle = this.game.height / 2;  // 1080
            const minY = middle - 600;
            const maxY = middle + 350;
            this.y = Math.random() * (maxY - minY) + minY;
            this.speedX = -1; // Move right to left

            this.image = document.getElementById("skeleton-archer");
            this.frameY = 1;
            this.maxFrame = 7; // 8 Frames total for walking
            this.animationInterval = 100; // Time in milliseconds between each frame
            this.shootTimer = 0;
            this.whenToShoot = 3000; // Shoot after 3 seconds
            this.shootDuration = 2000;
            this.currentState = 'walking';
            this.hasTriggeredShoot = false;
            this.muzzleLocX = 100; // Both test values
            this.muzzleLocY = 450;
        }

        update(deltaTime) {
            if (this.currentState === 'walking') {
                this.x += this.speedX - this.game.speed;
            }

            // Delete if off screen to the left
            if (this.x + this.width < 0) {
                this.markedForDeletion = true;
                if (!this.game.gameOver) {
                this.game.playerHitpoints--;
                }
            }

            this.shootTimer += deltaTime;

            if (this.currentState === 'walking' && this.shootTimer >= this.whenToShoot) {
                this.switchToShoot();
            } else if (this.currentState === 'shooting' && this.shootTimer >= this.shootDuration) {
                this.switchToWalk();
            }

            if (this.currentState === 'shooting' && !this.hasTriggeredShoot) {
                this.hasTriggeredShoot = true;
            }

            this.game.doAnimation(this, deltaTime);

        }
        
        switchToShoot() {
            this.currentState = 'shooting'
            this.shootTimer = 0;
            this.frameY = 2;
            this.maxFrame = 8;
            this.animationInterval = this.shootDuration / (this.maxFrame + 1);
            this.frameX = 0;
            this.hasTriggeredShoot = false;
            
            //SET TO ENEMYPROJECTILE PUSH THEN CHANGE
            super.shootTop();
            // this.game.enemy.shootTop();
            console.log(this.projectiles);
        
        }

        switchToWalk() {
            this.currentState = 'walking';
            this.shootTimer = 0;
            this.frameY = 1;
            this.maxFrame = 7;
            this.animationInterval = 100;
            this.frameX = 0;
        }
    }

    /**
     * Spritesheet: 0-idle 1-walk 2-DONTUSE 3-attack 4-attackProjectile 5-DONTUSE 6-heal 7-healProjectile 8-hurt 9-dead
     */
    class Priestess extends Enemy {
        constructor(game) {
            super(game); // runs the parent class constructor
            this.width = 900;
            this.height = 900;
            this.spriteHeight = 100;
            this.spriteWidth = 100;
            const middle = this.game.height / 2;  // 1080
            const minY = middle - 600;
            const maxY = middle + 350;
            this.y = Math.random() * (maxY - minY) + minY;
            this.speedX = -0.5; // Move from right to left

            this.image = document.getElementById("priestess");
            this.frameY = 1;
            this.maxFrame = 7; // 8 Frames total for walking
            this.animationInterval = 100; // Time in milliseconds between each frame

             // Healing animation timing
            this.healTimer = 0;
            this.healInterval = 6000; // 6 seconds in milliseconds
            this.healDuration = 2000; // How long the heal animation lasts (2 seconds)
            this.currentState = 'walking'; // 'walking' or 'healing'
            this.stateStartTime = 0;
            this.hasTriggeredHeal = false; //FIX???
        }
        update(deltaTime) {
            if (this.currentState === 'walking') {
                this.x += this.speedX - this.game.speed;
            }

            // Delete if off screen to the left
            if (this.x + this.width < 0) {
                this.markedForDeletion = true;
                if (!this.game.gameOver) {
                this.game.playerHitpoints--;
                }
            }


            this.healTimer += deltaTime;

            if (this.currentState === 'walking' && this.healTimer >= this.healInterval) {
                this.switchToHeal();
            } else if (this.currentState === 'healing' && this.healTimer >= this.healDuration) {
                this.switchToWalk();
            }

            if (this.currentState === 'healing' && !this.hasTriggeredHeal) {
                this.game.triggerPriestessHeal(this);
                this.hasTriggeredHeal = true;
            }

            this.game.doAnimation(this, deltaTime);

        }
        switchToHeal() {
            this.currentState = 'healing'
            this.healTimer = 0;
            this.frameY = 6;
            this.maxFrame = 5;
            this.animationInterval = 400;
            this.frameX = 0;
            this.hasTriggeredHeal = false;
        }
        switchToWalk() {
            this.currentState = 'walking';
            this.healTimer = 0;
            this.frameY = 1;
            this.maxFrame = 7;
            this.animationInterval = 100;
            this.frameX = 0;
        }
    }

    /**
     * 
     */
    class Layer {
        constructor(game, image, speedModifier, width = 3840, height = 2160, yOffset = 0) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = width;
            this.height = height;
            this.x = 0;
            this.y = yOffset;
        }
        update() {
            this.x -= this.game.speed * this.speedModifier;
            if (this.x <= -this.width) {
                this.x = 0;
            }
        }
        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
        }
    }

    class Background {
        constructor(game) {
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.image2 = document.getElementById('layer2');
            this.image3 = document.getElementById('layer3');
            this.layer1 = new Layer(this.game, this.image1, 0.2, 3840, 2160, 0);
            this.layer2 = new Layer(this.game, this.image2, 0.6, 3840, 1522, 700);
            this.layer3 = new Layer(this.game, this.image3, 1.2, 3840, 720, 1440);
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        update() {
            this.layers.forEach(layer => layer.update());
        }
        draw(context) {
            this.layers.forEach(layer => layer.draw(context));
        }
    }

    class Explosion {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.frameX = 0;
            this.maxFrame = 8;
            this.spriteHeight = 200;
            this.spriteWidth = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width * 0.5;
            this.y = y - this.height * 0.5;
            this.fps = 30;
            this.timer = 0;
            this.interval = 1000 / this.fps;
            this.markedForDeletion = false;

        }
        update(deltaTime) {
            this.x -= this.game.speed;
            if (this.timer > this.interval) {
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            if (this.frameX > this.maxFrame) {
                this.markedForDeletion = true;
            }
        }
        draw(context) {
            if (this instanceof HealEvent) {
                context.save();
                context.globalAlpha = 0.7
                context.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
                context.restore();
            }
            context.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
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

    class HealEvent extends Explosion {
        constructor(game, x, y, sourceEnemy = null) {
            super(game, x, y);

            this.maxFrame = 3;
            this.spriteHeight = 100;
            this.spriteWidth = 100;
            this.timer = 0;
            this.markedForDeletion = false;
            this.interval = 1000;
            this.image = document.getElementById('healProjectile');
            this.sourceEnemy = sourceEnemy;
            this.healingPower = 1; // How much to heal per animation cycle
            if (this.sourceEnemy) {
                this.sourceEnemy.isBeingHealed = true;
                this.width = sourceEnemy.width;
                this.height = sourceEnemy.height;
                this.x = x - 30 - this.width * 0.5;
                this.y = y - this.height * 0.5;
            }
        }

        update(deltaTime) {
            // Logic for how to move the heal around the enemy based on speed
            if (this.sourceEnemy && !this.sourceEnemy.markedForDeletion) {
                // Check if the enemy has a current state, if not then it only walks no matter what
                if (this.sourceEnemy.currentState) {
                    // Only move the heal if the enemy is walking
                    if (this.sourceEnemy.currentState === 'walking') {
                        this.x += this.sourceEnemy.speedX - this.game.speed;
                    }
                } else {
                    this.x += this.sourceEnemy.speedX - this.game.speed;
                }
            } else {
                this.markedForDeletion = true;
            }

            // Animation
            if (this.timer > this.interval) {
                this.frameX++;
                if (this.sourceEnemy.lives <= this.sourceEnemy.score - 1) {
                    // Heal whichever is lower, the total health, or by healing power
                    this.sourceEnemy.lives = Math.min(this.sourceEnemy.lives + this.healingPower, this.sourceEnemy.score); 
                }
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            if (this.frameX > this.maxFrame) {
                this.markedForDeletion = true;
                if (this.sourceEnemy) {
                    this.sourceEnemy.isBeingHealed = false;
                }
            }
        }
    }

    class Button {
        constructor(x, y, imageName, upgradeType = '') {
            this.imageName = imageName;
            this.image = document.getElementById(this.imageName);
            this.x = x;
            this.y = y;
            this.width = 300;
            this.height = 300;
            this.isHovered = false;
            this.upgradeType = upgradeType;
        }

        update(deltaTime) {
            // Will be needed for button animations later
        }
        draw(context) {
            context.save();
            if (this.image) {
                context.globalAlpha = 0.8
                context.drawImage(this.image, this.x, this.y, this.width, this.height);
            } else {
                context.fillStyle = isHovered ? 'lightgray' : 'gray'; // Fancy operator, if isHovered is true, lightgray, if false, gray
                context.fillRect(this.x, this.y, this.width, this.height);
                context.fillStyle = 'white';
                context.fillText('Missing Image', this.x + 10, this.y + 150);
            }
            context.restore();

            // Upgrade cost
            context.save();
            context.font = '30px Fridge';
            context.fillStyle = 'yellow';
            context.strokeStyle = 'black';
            context.lineWidth = 2;
            context.textAlign = 'center';
            const buttonIndex = this.game?.buttons.indexOf(this) || 0;
            const costText = `${this.game?.upgradePrices[buttonIndex] || 10} coins`;
            context.strokeText(costText, this.x + this.width/2, this.y + this.height + 40);
            context.fillText(costText, this.x + this.width/2, this.y + this.height + 40);
            context.restore();
        }
    }

    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 60;
            this.fontFamily = 'Fridge'
            this.color = 'yellow'
        }
        draw(context) {
            context.save(); // Between save and restore you can change and it wont affect anything else
            context.font = this.fontSize + 'px ' + this.fontFamily;
            context.fillStyle = this.color;
            context.shadowOffsetX = 4;
            context.shadowOffsetY = 4;
            context.shadowColor = 'black';
            context.shadowBlur = 2;
            // score
            context.fillText('Score: ' + this.game.score, 40, 80);
            // coins
            context.fillText('Coins: ' + this.game.coins, 300, 80);
            // lives
            context.fillText ('Lives: ' + this.game.playerHitpoints, 560, 80);
            // ammo
            for (let i = 0; i < this.game.ammo; i++) {
                context.fillRect(40 + 12 * i, 100, 8, 40);
            }
            // timer
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1); // Makes the time only have 1 definite
            context.fillText('Timer: ' + formattedTime, 40, 200);

            //game over messages
            if (this.game.gameOver) {
                context.textAlign = 'center';
                let message1;
                let message2;
                if (this.game.score > this.game.winningScore) {
                    message1 = 'You Win!';
                    message2 = 'Well Done!';
                } else {
                    message1 = 'You lose!';
                    message2 = 'Try again next time';
                    if (this.game.playerDied) {
                        message1 = 'The city has fallen!';
                        message2 = 'Maybe try killing them before they reach the civilians';
                        
                    }
                }
                context.font = '120px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 80);
                context.font = '60px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 80);
            }
            context.restore();
            if (this.game.debug) {
                context.save();
                context.font = '20px Arial';
                context.fillStyle = 'white';
                context.fillText(`Mouse: ${Math.round(this.game.input.mouse.x)}, ${Math.round(this.game.input.mouse.y)}`, 40, 250);
                context.restore();
            }

        }
    }

    // The brain of the logic
    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.background = new Background(this);
            this.player = new Player(this); // Runs all code inside player class automatically. 
            // Uses this because the constructor in Player needs game and we are currently in game
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.buttons = [];
            this.enemyTimer = 0;
            this.enemyInterval = 1000;
            this.ammo = 20;
            this.maxAmmo = 50
            this.ammoTimer = 0;
            this.ammoInterval = 350;
            this.gameOver = false;
            this.playerDied = false;
            this.score = 0;
            this.winningScore = 75; //Test value
            this.gameTime = 0;
            this.timeLimit = 60000; //Test value
            this.speed = 4;
            this.speedModifier = 1; // Test Value
            this.debug = 
            this.coins = 0; // Increases by 1 each time a coin particle is dropped
            this.playerHitpoints = 5;
            
            this.upgradeTypes = ['Fire Rate', 'Damage', 'Max Ammo', 'Idek Bro'];
            this.upgradePrices = [10, 10, 10, 10];
            this.coinsForUpgrade = 10;
            this.buttonSpacing = 20;
            this.buttonMargin = 40;
            this.damageMultiplier = 1;
            this.ammoRegenMultiplier = 1;
            this.projectileSpeed = 12;
        }
        update(deltaTime) {
            if (this.playerHitpoints <= 0) {
                this.playerDied = true;
                this.gameOver = true;
            }
            if (!this.gameOver) {
                this.gameTime += deltaTime;
            }
            if (this.gameTime > this.timeLimit) {
                this.gameOver = true;
            }
            this.background.update();
            this.player.update(deltaTime);
            if (this.ammoTimer > this.ammoInterval) {
                if (this.ammo < this.maxAmmo) {
                    this.ammo += (1 * this.ammoRegenMultiplier);
                }
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }
            this.particles.forEach(particle => {
                particle.update(deltaTime);
            });
            this.particles = this.particles.filter(particle => !particle.markedForDeletion);
            this.explosions.forEach(explosion => {
                explosion.update(deltaTime);
            });
            this.explosions = this.explosions.filter(explosion => !explosion.markedForDeletion);

            this.enemies.forEach(enemy => {
                enemy.update(deltaTime);
                if (this.checkCollisions(this.player, enemy)) {
                    enemy.markedForDeletion = true;
                    this.addExplosion(enemy);
                    for (let i = 0; i < enemy.lives; i++) {
                        this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                        this.coins++;
                    }
                    if (this.score > 0 + enemy.score) {
                        this.score = this.score - enemy.lives;
                    } else if (this.score > 0) {
                        this.score = 0;
                    }
                }
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollisions(projectile, enemy)) {
                        enemy.lives -= (1 * this.damageMultiplier);
                        projectile.markedForDeletion = true;
                        this.addExplosion(enemy);
                        this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                        this.coins++;
                        if (enemy.lives <= 0) {
                            enemy.markedForDeletion = true;
                            // This is if we want the enemies to drop coins on death instead of on hit
                            // for (let i = 0; i < 3; i++) { 
                            //     this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                            // }

                            if (!this.gameOver) {
                                this.score += enemy.score;
                            }
                            if (this.score > this.winningScore) {
                                this.gameOver = true;
                            }
                        }
                    }
                });
            });
            // Enemy projectiles
            this.enemies.forEach(enemy => {
            
                if (enemy.projectiles) {
                    console.log(enemy.projectiles.length);
                    enemy.projectiles.forEach(projectile => {
                        projectile.update();
                        if (this.checkCollisions(projectile, this.player)) {
                            this.playerHitpoints--;
                            projectile.markedForDeletion = true;
                            this.addExplosion(this.player);
                            this.particles.push(new Particle(this, this.player.x + this.player.width * 0.5, this.player.y + this.player.height * 0.5));
                            // ITs already above so likely dont need it here
                            // if (this.playerHitpoints <= 0) {
                            //     this.gameOver = true;
                            //     this.playerDied = true;
                            // }
                        }
                    });
                    enemy.projectiles = enemy.projectiles.filter(p => !p.markedForDeletion);
                }
            });
            // End

            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }

            // Buttons
            const maxButtons = Math.min(this.upgradeTypes.length, 4);
            for (let i = this.buttons.length; i < maxButtons; i++) {
                const buttonX = this.width - this.buttonMargin - (i + 1) * 300 - (i * this.buttonSpacing);
                this.addButton(buttonX, this.buttonMargin, `button${i + 1}`);
            }
            this.buttons.forEach(button => {
                button.update(deltaTime);
            });
            this.buttons = this.buttons.filter(button => !button.markedForDeletion);
        }
        draw(context) {
            this.background.draw(context);
            this.ui.draw(context);
            this.player.draw(context);
            this.particles.forEach(particle => {
                particle.draw(context);
            });
            this.enemies.forEach(enemy => {
                enemy.draw(context);
            });
            this.explosions.forEach(explosion => {
                explosion.draw(context);
            });
            this.buttons.forEach(button => {
                button.draw(context);
            })
            // Draw trees over everything
            this.background.layer3.draw(context);
        }
        addEnemy() {
            //Testing to spawn one enemy type
                    let testEnemiesMode = false; // SET TO FALSE FOR NORMAL
                    if(testEnemiesMode) {
                        this.enemies.push(new SkeletonArcher(this));
                    } else {

            const randomize = Math.random(); // between 0 and 1
            if (randomize < 0.2) {
                this.enemies.push(new Orc(this));
            } else if (randomize >= 0.2 && randomize < 0.4) {
                this.enemies.push(new Skeleton(this));
            } else if (randomize >= 0.4 && randomize < 0.6) {
                this.enemies.push(new OrcRider(this));
            } else if (randomize >= 0.6 && randomize < 0.7) {
                this.enemies.push(new SkeletonArcher(this));
            } else if (randomize >= 0.7) {
                this.enemies.push(new Priestess(this));
            }
            if (this.debug) {
                console.log(this.enemies);
            }

        }
        }
        addExplosion(enemy) {
            const randomize = Math.random();
            //TODO Change this depending on what attack is used by the mage
            if (randomize < 0.5) {
                this.explosions.push(new SmokeExplosion(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
            } else {
                this.explosions.push(new FireExplosion(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
            }
        }
        addButton(x, y, imageName) {
            const button = new Button(x, y, imageName, this.upgradeTypes[this.buttons.length] || 'Unknown');
            button.game = this; // Gives the button a reference to game for displaying cost
            this.buttons.push(button);
        }
        checkCollisions(rect1, rect2) {
            return (rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y
            );
        }

        checkMouseCollision(mouseX, mouseY, rect) {
            return (mouseX >= rect.x &&
                    mouseX <= rect.x + rect.width &&
                    mouseY >= rect.y &&
                    mouseY <= rect.y + rect.height
                );
            }
        /**
         * Make sure to save and restore around calling apply shadow
         */
        applyShadow(context, strength){
            switch(strength) {
                case 'light':
                    context.shadowOffsetX = -3;
                    context.shadowOffsetY = 50;
                    context.shadowColor = 'black';
                    context.shadowBlur = 80;
                    break;
                case 'heavy':
                    context.shadowOffsetX = -4;
                    context.shadowOffsetY = 70;
                    context.shadowColor = 'black';
                    context.shadowBlur = 80;
                    break;
                default:
                    context.shadowOffsetX = -4;
                    context.shadowOffsetY = 70;
                    context.shadowColor = 'black';
                    context.shadowBlur = 80;
            }
        }

        doAnimation(enemy, deltaTime) {
            enemy.animationTimer += deltaTime;
            if (enemy.animationTimer >= enemy.animationInterval) {
                if (enemy.frameX < enemy.maxFrame) {
                    enemy.frameX++;
                } else {
                    enemy.frameX = 0;
                }   
                enemy.animationTimer = 0;
            }
        }

        triggerPriestessHeal(priestess) {
            const injuredEnemies = this.enemies.filter(enemy => 
                enemy !== priestess && enemy.lives < enemy.score && !enemy.isBeingHealed && !enemy.markedForDeletion
            );

            if (injuredEnemies.length === 0) {
                return;
            }

            let healingPower = 1;
            let numToHeal = Math.min(3, injuredEnemies.length);

            if (injuredEnemies.length === 1) {
                healingPower = 3; // Triple power for single target
            } else if (injuredEnemies.length === 2) {
                healingPower = 2; // Double power for two targets
            } else {
                healingPower = 1; // Normal power for 3+ targets
            }

            // Shuffles array to randomize selection
            for (let i = injuredEnemies.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [injuredEnemies[i], injuredEnemies[j]] = [injuredEnemies[j], injuredEnemies[i]];
            }

            for (let i = 0; i < numToHeal; i++) {
                const enemy = injuredEnemies[i];
                const healEvent = new HealEvent(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5, enemy);
                healEvent.healingPower = healingPower;
                this.explosions.push(healEvent);
            }

        }
        // triggerSkeletonArcherShoot(archer) {
        //     const skeletonArcherProjectile = new archerProjectile(this, archer.x + archer.width * 0.5, archer.y + archer.height * 0.5);
        // }
    }

    const game = new Game(canvas.width, canvas.height); //arguments because the game constructor needs them
    let lastTime = 0;
    //animation loop at 60 fps
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime; //difference in miliseconds between the time stamp from this loop and the time stamp from last loop
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.draw(ctx); //passes into the context of game and player
        game.update(deltaTime);

        requestAnimationFrame(animate); // putting animate makes an endless animation loop timeStamp is automatically passed to the parent function animate
    }
    animate(0);
});
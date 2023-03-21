class Player {
    
    static MAX_HP = 10;
    static MAX_VEL = 250; //Pixels per second (I think -Gabe)
    static KB_DUR = 0.1;
    static KB_STR = 300;
    static MAX_KC = 10;

    static SWING_CD = 0.25;
    static THROW_CD = 0.4; // 3
    static BUTTON_CD = 0.1; // 0.5

    static CURR_PLAYER = undefined;

    constructor(_x, _y) {
        // Object.assign(this, {x, y});
        let ob = typeof _x == 'object'
        this.x = ob ? _x.x : _x;
        this.y = ob ? _x.y : _y;

        this.DEBUG = false;
        this.state = 0;     // 0:idle, 1:walking, 2:attacking, 3: taking damage
        this.facing = 1;    
        this.attackHitbox = undefined;
        this.attackHBDim = {width: 15 * SCALE, height: 30 * SCALE};
        this.attackHBOffset = {x: 0, y: -3 * SCALE};

        this.interactHBDim = {width: 7 * SCALE, height: 15 * SCALE};
        this.interacting = false;

        this.animations = [];
        this.setupAnimations();

        this.phys2d = {static: false, velocity: {x: 0, y: 0}};
        this.tag = "player";
        this.updateCollider();
        this.alive = true;
        this.pain = {hurting : false, timer: 0, cooldown: 0.5}; // cooldown in sec
        this.hitstop = {hitting: false, timer: 0, cooldown: 0.125};

        this.setHp(Player.MAX_HP);
        this.kbLeft = 0;
        this.swingCD = 0;

        this.keyCount = 1;

        this.holding = false;
        this.throwing = false;

        // 0 = bomb, 1 = pot
        this.currObjHeld = 0; 
        this.holdObjs = ['bomb', 'pot']

        // si = sprite index, xos = x offset, yos = y offset, spnX = spawn x offset
        this.holdObjInfo = [
            {scl: 1.1, xos:1.5, yos: -9, spnX: 8, spnY: 7}, // bomb
            {scl: 1.12, xos:-1, yos: -9.4, spnX: 4.8, spnY: 8}  // pot
        ];
        this.throwTime = 0; this.buttonCD = 0;
    };

    setupAnimations() {
        // Animation array: [state][facing]
        this.animations = new Array(5)

        // idle animations 
        this.animations[0] = [
            GRAPHICS.get('ANIMA_link_Idle_north'),
            GRAPHICS.get('ANIMA_link_Idle_south'),
            GRAPHICS.get('ANIMA_link_Idle_east'),
            GRAPHICS.get('ANIMA_link_Idle_west'),
        ]
        //walking animations
        this.animations[1] = [
            GRAPHICS.get('ANIMA_link_run_north'),
            GRAPHICS.get('ANIMA_link_run_south'),
            GRAPHICS.get('ANIMA_link_run_east'),
            GRAPHICS.get('ANIMA_link_run_west')
        ]
        // attacking animations
        this.animations[2] = [
            GRAPHICS.get('ANIMA_link_attack_north'),
            GRAPHICS.get('ANIMA_link_attack_south'),
            GRAPHICS.get('ANIMA_link_attack_east'),
            GRAPHICS.get('ANIMA_link_attack_west')
        ]
        // carrying object above head
        this.animations[3] = [
            GRAPHICS.get('ANIMA_link_carry_idle_north'),
            GRAPHICS.get('ANIMA_link_carry_idle_south'),
            GRAPHICS.get('ANIMA_link_carry_idle_east'),
            GRAPHICS.get('ANIMA_link_carry_idle_west'),
        ]
        this.animations[4] = [
            GRAPHICS.get('ANIMA_link_carry_north'),
            GRAPHICS.get('ANIMA_link_carry_south'),
            GRAPHICS.get('ANIMA_link_carry_east'),
            GRAPHICS.get('ANIMA_link_carry_west'),
        ]
        this.animations[5] = [
            GRAPHICS.get('ANIMA_link_throw_north'),
            GRAPHICS.get('ANIMA_link_throw_south'),
            GRAPHICS.get('ANIMA_link_throw_east'),
            GRAPHICS.get('ANIMA_link_throw_west')
        ]

        // other animations / sprites
        this.holdObjSprite = [
            GRAPHICS.getInstance('PRJX_reg_bomb'),
            GRAPHICS.getInstance('SET_pot'),
        ]

        this.attackTime = GRAPHICS.getAnimation('ANIMA_link_attack_west').fTiming.reduce((a, b) => a+b);
        this.endSprites = GRAPHICS.getSpriteSet('SET_end_game');
        
    };

    updateState(moveIn, attackIn) {
        if (attackIn || this.state == 2) {
            if (this.state != 2) {
                ASSET_MANAGER.playAsset("slash.wav");
                this.attackTimeLeft = this.attackTime;
                this.attackHits = [];
            }
            this.state = 2;
        }
        else if(moveIn.x != 0 || moveIn.y != 0) {
            this.state = this.holding? 4 : 1;
        }
        else this.state = this.holding? 3 : 0;;

        if (this.hitstop.hitting) {
            this.hitstop.timer -= gameEngine.clockTick;
            if (this.hitstop.timer <= 0) {
                this.hitstop.hitting = false;
                this.hitstop.timer = 0;
            }
        }

    }

    updateDirection(moveIn) {
        if(moveIn.x > 0) this.facing = 2;
        else if(moveIn.x < 0) this.facing = 3;
        else if(moveIn.y > 0) this.facing = 0;
        else if (moveIn.y < 0) this.facing = 1;
    }

    update() { // this.pain = {hurting : false, timer: 0, cooldown: 20}
        if (!this.alive) return;
        let prevFacing = this.facing;
        this.sidesAffected = undefined;

        if (this.pain.hurting) { // damage animation stuff
            ASSET_MANAGER.playAsset("link_hurt.wav");
            this.pain.timer -= gameEngine.clockTick;
            if (this.pain.timer <= 0) {
                this.pain.hurting = false;
                this.pain.timer = 0;
            }
        }

        let walkStateChange = this.state <= 1 ? 1 : this.state;
        let moveIn = {x: 0, y: 0}
        if (gameEngine.keys["w"])      moveIn.y = 1;//[this.facing, this.state, this.phys2d.velocity.y] = [0, walkStateChange, -Player.MAX_VEL];
        else if (gameEngine.keys["s"]) moveIn.y = -1;//[this.facing, this.state, this.phys2d.velocity.y] = [1, walkStateChange, Player.MAX_VEL];
        
        if (gameEngine.keys["d"])      moveIn.x = 1;//[this.facing, this.state, this.phys2d.velocity.x] = [2, walkStateChange, Player.MAX_VEL];
        else if (gameEngine.keys["a"]) moveIn.x = -1;//[this.facing, this.state, this.phys2d.velocity.x] = [3, walkStateChange, -Player.MAX_VEL];
        
          /***********************************/
         /////// INTERACTIONS ////////////////
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
        this.interHit = false;
        // if (gameEngine.keys["i"] && !this.interacting && !this.holding && this.buttonCD <= 0) { 
        //     this.processInteract();
        //     this.buttonCD = Player.BUTTON_CD;
        // }
        // else if (!gameEngine.keys["i"]) this.interacting = false;

        // if (gameEngine.keys["i"] && this.holding && !this.throwing && this.buttonCD <= 0) {
        //     this.processThrow();
        // }
        if (gameEngine.keys["i"]) {
            if (this.buttonCD <= 0 && !this.throwing) {
                if (!this.interacting && !this.holding) this.processInteract();
                else if (this.holding) this.processThrow();
            } this.buttonCD = Player.BUTTON_CD;
        } else this.interacting = false;

        /////// THROW STUFF EASY ////////////
        if (gameEngine.keys["n"] || gameEngine.keys["h"]) { // <- cheat buttons
            if (gameEngine.keys["n"] && !this.holding) this.currObjHeld = 0; // 0 = bomb 
            if (gameEngine.keys["h"] && !this.holding) this.currObjHeld = 1; // 1 = pot
            if (this.buttonCD <= 0 && !this.throwing) {
                if (!this.holding)       this.holding = true;
                else if (this.holding)   this.processThrow();
            } this.buttonCD = Player.BUTTON_CD;
        } // .........

        if (this.throwing) this.processThrow();
             // slowdown action button with  //  buffer => buttonCD
        if (this.buttonCD > 0)        this.buttonCD -= gameEngine.clockTick;
        else if (this.buttonCD < 0 )  this.buttonCD  = 0; 
          //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
         ////// INTERACTION DONE //////////
        // .............................//

        // console.log("interacxt: " + this.interacting)
        // console.log("buttcd: " + this.buttonCD)

        this.moveIn = normalizeVector(moveIn);
        this.swingCD -= gameEngine.clockTick;
        this.attackIn = gameEngine.keys['j'] && this.swingCD <= 0 && !this.holding;
        this.updateState(this.moveIn, this.attackIn);
        if (this.throwing) this.state = 5


        if (this.state != 2 && this.state != 5) this.updateDirection(this.moveIn);
        else if (this.state == 2) this.processAttack();

        if (this.hitstop.hitting) {
            this.phys2d.velocity = {x: 0, y: 0};
            return;
        }

        if (this.kbLeft > 0){
            this.phys2d.velocity = {x: this.kbVect.x, y: this.kbVect.y};
            this.phys2d.velocity.x *= gameEngine.clockTick;
            this.phys2d.velocity.y *= gameEngine.clockTick;

            this.kbLeft -= gameEngine.clockTick;
        } else {
            let velocityMod = this.state == 2 || this.state == 4 ? 1/2 : 1;
            if (this.state === 5) velocityMod = 0;
            this.phys2d.velocity.x = this.moveIn.x * Player.MAX_VEL * gameEngine.clockTick * velocityMod;
            this.phys2d.velocity.y = this.moveIn.y * -1 * Player.MAX_VEL * gameEngine.clockTick * velocityMod;    
        }

        
        gameEngine.currMap.screenEdgeTransition(this);
    };

    pickUpObj(obj) {
        this.currObjHeld = obj;
        this.holding = true;
    }

    processInteract() {
        this.interacting = true;
        gameEngine.scene.interact_entities.forEach((entity) => {
            if (entity != this &&
                entity.collider &&
                entity.collider.type == "box"
                && (entity.tag == "env_interact" || entity.tag == "env_interact_breakable")
                && boxBoxCol(this.getInteractHB(), entity.collider))
                {
                    entity.interact();
                }
        });
    }

    processThrow() {
        if (this.holding && !this.throwing) {
            this.throwing = true; this.holding = false;

            let prjX = this.x + this.holdObjInfo[this.currObjHeld].spnX * SCALE;
            let prjY = this.y + this.holdObjInfo[this.currObjHeld].spnY * SCALE;
            // n s e w
            let pf =  this.facing
            let facDir = pf == 0 ? 0 : pf == 2 ? 1 : pf == 1 ? 2 : 3
            gameEngine.scene.addInteractable(new Projectile(this.holdObjs[this.currObjHeld], prjX, prjY, facDir, true));
            this.throwTime = Player.THROW_CD;
            this.state = 5;
        }
        else if (this.throwTime <= 0) {
            this.throwing = false;
            this.throwTime = 0;
        }
        else this.throwTime -= gameEngine.clockTick
    }

    processAttack() {
        this.attackTimeLeft -= gameEngine.clockTick;
        if(this.attackTimeLeft - gameEngine.clockTick <= 0) {
            this.state = 0;
            this.resetAnims();
            this.swingCD = Player.SWING_CD;
        }
        else {
            //console.log("Time left for attack: " + this.attackTimeLeft);
            this.setAttackHB();
            //Attack collision det and handling
            this.hitEnemy = false;
            gameEngine.scene.interact_entities.forEach((entity) =>{
                if (entity != this &&
                    entity.collider &&
                    entity.collider.type == "box" &&
                    (entity.tag == "enemy" || entity.tag == "env_interact_breakable") &&
                    !this.attackHits.includes(entity))
                    {
                    let hit = boxBoxCol(this.attackHitbox, entity.collider);
                    // this.hitEnemy = hit || this.hitEnemy;//stored for debugging
                    if (hit) {
                        let kbDir = normalizeVector(distVect(this.collider.corner, entity.collider.corner));
                        let kb = scaleVect(kbDir, Player.KB_STR * SCALE);
                        //console.log(kb);
                        this.dealDamage(entity, kb);
                        this.attackHits.push(entity);
                    }
                }
            });
        }
    }


    dealDamage(entity, kb) {
        entity.takeDamage(1, kb, this.hitstop.cooldown);
        this.hitstop.hitting = true;
        this.hitstop.timer = this.hitstop.cooldown;
    }

    takeDamage(amount, kb, hitStopTime = 0.01) {
        //console.log("GYahaAAaaa: " + amount);
        this.kbVect = {x: kb.x, y: kb.y};
        this.kbLeft = Player.KB_DUR;
        this.setHp(this.hp - amount);
        if(this.hp <= 0){
            //console.log("Game over!!!!!!!!!");
            ASSET_MANAGER.pauseBackgroundMusic();
            ASSET_MANAGER.playAsset("link_die.wav");
            gameEngine.gameOver = true;
            this.alive = false
            this.phys2d = {static: false, velocity: {x: 0, y: 0}};
        }

        this.pain.hurting = true;
        this.pain.timer = this.pain.cooldown;
        this.hitstop.hitting = true;
        this.hitstop.timer = hitStopTime;
    }

    setHp(newHp) {
        this.hp = newHp;
        GAMEDISPLAY.heartCount = this.hp;
    }

    heal(amount) {
        let tempHP = this.hp + amount;
        if (tempHP > Player.MAX_HP) tempHP = Player.MAX_HP;          
        this.setHp(tempHP);
    }

    getKey() {
        this.keyCount = Math.min(Math.max(this.keyCount+1, 0), Player.MAX_KC);
    }

    updateCollider() {
        let xOff = 1.5 * SCALE;
        this.collider = {type: "box", corner: {x: this.x + xOff, y: (this.y + 28)}, width: 14*SCALE, height: 14*SCALE};
    }

    setAttackHB() {
        if (this.facing == 2 || this.facing == 3){
            let hDist = this.attackHBDim.height - this.collider.height;
            let yAdjust = hDist/2;
    
            let xAdjust = this.facing == 3 ? -this.attackHBDim.width : this.collider.width;
    
            let AHBcorner = {x: this.collider.corner.x + xAdjust, y: this.collider.corner.y - yAdjust + this.attackHBOffset.y};
            this.attackHitbox = {type: "box", corner: AHBcorner, width: this.attackHBDim.width, height: this.attackHBDim.height};    
        } else {
            let wDist = this.attackHBDim.height - this.collider.width;
            let xAdjust = wDist/2;

            let yAdjust = this.facing == 1 ? -this.collider.height : this.attackHBDim.width;
            let AHBcorner = {x: this.collider.corner.x - xAdjust /*+ this.attackHBOffset.y*/, y: this.collider.corner.y - yAdjust};
            this.attackHitbox = {type: "box", corner: AHBcorner, width: this.attackHBDim.height, height: this.attackHBDim.width}; 
        }
    }

    getInteractHB(){
        if (this.facing == 2 || this.facing == 3){
            let hDist = this.interactHBDim.height - this.collider.height;
            let yAdjust = hDist/2;
    
            let xAdjust = this.facing == 3 ? -this.interactHBDim.width : this.collider.width;
    
            let AHBcorner = {x: this.collider.corner.x + xAdjust, y: this.collider.corner.y - yAdjust};
            return {type: "box", corner: AHBcorner, width: this.interactHBDim.width, height: this.interactHBDim.height};    
        } else {
            let wDist = this.interactHBDim.height - this.collider.width;
            let xAdjust = wDist/2;

            let yAdjust = this.facing == 1 ? -this.collider.height : this.interactHBDim.width;
            let AHBcorner = {x: this.collider.corner.x - xAdjust, y: this.collider.corner.y - yAdjust};
            return {type: "box", corner: AHBcorner, width: this.interactHBDim.height, height: this.interactHBDim.width}; 
        }
    }

    resetAnims() {
        for(let i = 0; i < this.animations.length; i++){
            for(let j = 0; j < this.animations[i].length; j++){
                this.animations[i][j].reset();
            }
        }
    }

    drawAttack(ctx, scale){
        ctx.strokeStyle = this.hitEnemy ? "red" : "green";
        //console.log(this.hitEnemy);
        ctx.lineWidth = 2;
        //ctx.fillRect(0, 0, 1000, 1000);
        ctx.strokeRect(this.attackHitbox.corner.x, this.attackHitbox.corner.y, this.attackHitbox.width, this.attackHitbox.height);
    }

    draw (ctx, scale) {
        // game has ended
        if (!this.alive) this.endSprites.drawSprite(3, ctx, this.x, this.y, scale);
        else if(gameEngine.victory) this.endSprites.drawSprite(1, ctx, this.x, this.y, scale);
        // Game is still going 
        else this.animations[this.state][this.facing].animate(gameEngine.clockTick, ctx, this.x, this.y, scale, this.pain.hurting, this.hitstop.hitting);
        if (this.holding)
            this.holdObjSprite[this.currObjHeld].drawSprite(
                0, ctx,
                this.x + this.holdObjInfo[this.currObjHeld].xos * scale,
                this.y + this.holdObjInfo[this.currObjHeld].yos * scale,
                scale * this.holdObjInfo[this.currObjHeld].scl
        );
        // GRAPHICS.get('SET_end_game').drawSprite(0, ctx, this.x+100, this.y, scale);
        // GRAPHICS.get('ANIMA_link_dead').animate(gameEngine.clockTick, ctx, this.x +100, this.y, scale);
        // GRAPHICS.get('ANIMA_link_carry_west').animate(gameEngine.clockTick, ctx, this.x +100, this.y, scale);

        

        if(this.DEBUG) {
            //this.drawCollider(ctx);
            if(this.state == 2) this.drawAttack(ctx, scale);
            drawBoxCollider(ctx, this.getInteractHB(), this.interHit);
            /*
            ctx.fillStyle = "#f0f";
            let cW = this.collider.width;
            let cH = this.collider.height;
            let cX = this.collider.corner.x;
            let cY = this.collider.corner.y;
            let nX = cX + (cW/2);
            let nY = cY + (cH/2);
            let dS = 3;
            ctx.fillStyle = "#f00";
            ctx.fillRect(cX, cY, cW, cH);
            ctx.fillStyle = "#00f";
            ctx.fillRect(nX-dS, nY-dS, dS*scale, dS*scale);
            ctx.fillStyle = "#333";
            ctx.fillRect(10, ctx.canvas.height - 40, 100, 30)
            ctx.fillStyle = "#fff";
            ctx.font = "20px monospace";
            ctx.fillText(`(${Math.floor(cX)},${Math.floor(cY)})`, 10, ctx.canvas.height-20);
            */
        }
        
        
    };
}

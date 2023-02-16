class Player {
    static MAX_VEL = 600; //Pixels per second (I think -Gabe)
    constructor(x, y) {
        Object.assign(this, {x, y});

        this.state = 0;     // 0:idle, 1:walking, 2:attacking
        this.facing = 1;    // 0:north, 1:south, 2:east, 3:west
        this.attackHitCollector = [];

        this.animations = [];
        this.setupAnimations();

        this.phys2d = {static: false, velocity: {x: 0, y: 0}};
        this.tag = "player";
    };

    setupAnimations() {
        for (let i = 0; i < 3; i++) {           // states
            this.animations.push([]);          
            for (let j = 0; j < 4; j++) {       // directions
                this.animations[i].push([]);    
            }
        }

        // idle animations
        // facing north
        this.animations[0][0] = ANIMANAGER.getAnimation('ANIMA_link_Idle_north');
        // facing south
        this.animations[0][1] = ANIMANAGER.getAnimation('ANIMA_link_Idle_south');
        // facing east
        this.animations[0][2] = ANIMANAGER.getAnimation('ANIMA_link_Idle_east');
        // facing west
        this.animations[0][3] = ANIMANAGER.getAnimation('ANIMA_link_Idle_west');

        //walking animations
        //facing north
        this.animations[1][0] = ANIMANAGER.getAnimation('ANIMA_link_run_north');
        // facing south
        this.animations[1][1] = ANIMANAGER.getAnimation('ANIMA_link_run_south');
        // facing east
        this.animations[1][2] = ANIMANAGER.getAnimation('ANIMA_link_run_east');
        // facing west
        this.animations[1][3] = ANIMANAGER.getAnimation('ANIMA_link_run_west');

        this.animations[2][0] = ANIMANAGER.getAnimation('ANIMA_link_attack_west');
        this.animations[2][1] = ANIMANAGER.getAnimation('ANIMA_link_attack_east');
        this.animations[2][2] = ANIMANAGER.getAnimation('ANIMA_link_attack_east');
        this.animations[2][3] = ANIMANAGER.getAnimation('ANIMA_link_attack_west');

        this.attackTime = this.animations[2][0].fTiming.reduce((a, b) => a+b);
    };

    /*updateState() {
        if (this.phys2d.velocity.x != 0 || this.phys2d.velocity.y != 0) this.state = 1;
        else this.state = 0;
    }*/
    updateState(moveIn, attackIn){
        if(attackIn || this.state == 2) this.state = 2;
        else if(moveIn.x != 0 || moveIn.y != 0) this.state = 1;
        else this.state = 0;
    }

    update() {
        let prevFacing = this.facing;
        this.sidesAffected = undefined;
        
        let walkStateChange = this.state <= 1 ? 1 : this.state;
        let moveIn = {x: 0, y: 0}
        if (gameEngine.keys["w"])      moveIn.y = 1;//[this.facing, this.state, this.phys2d.velocity.y] = [0, walkStateChange, -Player.MAX_VEL];
        else if (gameEngine.keys["s"]) moveIn.y = -1;//[this.facing, this.state, this.phys2d.velocity.y] = [1, walkStateChange, Player.MAX_VEL];
        
        if (gameEngine.keys["d"])      moveIn.x = 1;//[this.facing, this.state, this.phys2d.velocity.x] = [2, walkStateChange, Player.MAX_VEL];
        else if (gameEngine.keys["a"]) moveIn.x = -1;//[this.facing, this.state, this.phys2d.velocity.x] = [3, walkStateChange, -Player.MAX_VEL];
        
        moveIn = normalizeVector(moveIn);
        attackIn = gameEngine.keys['j'];
        this.updateState(moveIn, attackIn);

        if(this.state == 2) this.processAttack();
        let velocityMod = this.state == 2 ? 1/4 : 1;
        this.phys2d.velocity.x = moveIn.x * Player.MAX_VEL * gameEngine.clockTick * velocityMod;
        this.phys2d.velocity.y = attackIn.y * Player.MAX_VEL * gameEngine.clockTick * velocityMod;

        let prevX = this.x;
        let prevY = this.y;

        this.x += this.phys2d.velocity.x;
        this.y += this.phys2d.velocity.y;
        this.updateCollider();
        this.collisionChecker(prevX, prevY);

        gameEngine.currMap.screenEdgeTransition(this);
    };

    /**
     * Called once per tick after adjusting player position
     * @param {*} prevX x value before velocity was applied
     * @param {*} prevY y value before velocity was applied
     */
    collisionChecker(prevX, prevY) {
        this.colliding = false;//.sort((e1, e2) => -(distance(e1, this) - distance(e2, this)))
        gameEngine.scene.env_entities.forEach(entity => {
            if(entity.collider != undefined && entity.collider.type === "box" && entity != this){
                //Check to see if player is colliding with entity
                let colliding = checkCollision(this, entity);
                this.colliding = colliding || this.colliding;//store for later purposes
                //check to see if the collision entity is solid and the type of entity we are looking for
                if(colliding && entity.phys2d && entity.phys2d.static && entity.tag == "environment"){
                    dynmStaticColHandler(this, entity, prevX, prevY);//Handle collision
                    this.updateCollider();
                    //prevX = this.x;
                    //prevY = this.y;
                }
            }
        });
    }

    processAttack(){
        this.attackTimeLeft -= gameEngine.clockTick;
        if(this.attackTimeLeft - gameEngine.clockTick <= 0) this.state = 0;
        else {
            this.hitbox = {type: "box", corner: {}, }
        }
    }

    updateCollider(){
        this.collider = {type: "box", corner: {x: this.x, y: (this.y + 28)}, width: 56, height: 56};
    }

    drawCollider(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x, this.collider.corner.y);
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.sidesAffected.down ? "green" : "red";
        ctx.lineTo(this.collider.corner.x + this.collider.width, this.collider.corner.y);
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x + this.collider.width, this.collider.corner.y);
        ctx.strokeStyle = this.sidesAffected.left ? "green" : "red";
        ctx.lineTo(this.collider.corner.x + this.collider.width, this.collider.corner.y + this.collider.height);
        ctx.stroke();
        ctx.closePath();

        
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x + this.collider.width, this.collider.corner.y + this.collider.height);
        ctx.strokeStyle = this.sidesAffected.up ? "green" : "red";
        ctx.lineTo(this.collider.corner.x, this.collider.corner.y + this.collider.height);
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.moveTo(this.collider.corner.x, this.collider.corner.y + this.collider.height);
        ctx.strokeStyle = this.sidesAffected.right ? "green" : "red";
        ctx.lineTo(this.collider.corner.x, this.collider.corner.y);
        ctx.stroke();
        ctx.closePath();
    }

    draw(ctx, scale) {
        this.animations[this.state][this.facing].animate(gameEngine.clockTick, ctx, this.x, this.y, scale);
        if(this.colliding && this.sidesAffected) this.drawCollider(ctx);
        //ANIMANAGER.getAnimation('ANIMA_link_attack_west').animate(gameEngine.clockTick, ctx, 200, 200, scale);
    };
}

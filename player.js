class Player {
    static MAX_VEL = 600; //Pixels per second (I think -Gabe)
    constructor(x, y) {
        Object.assign(this, {x, y});

        this.state = 0;     // 0:idle, 1:walking
        this.facing = 1;    // 0:north, 1:south, 2:east, 3:west

        this.animations = [];
        this.setupAnimations();

        this.phys2d = {static: false, velocity: {x: 0, y: 0}};
        this.tag = "player";
    };

    setupAnimations() {
        for (let i = 0; i < 2; i++) {           // states
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
    };

    updateState() {
        if (this.phys2d.velocity.x != 0 || this.phys2d.velocity.y != 0) this.state = 1;
        else this.state = 0;
    }

    update() {
        let prevFacing = this.facing;
        this.sidesAffected = undefined;
        
        if (gameEngine.keys["w"])      [this.facing, this.state, this.phys2d.velocity.y] = [0, 1, -Player.MAX_VEL];
        else if (gameEngine.keys["s"]) [this.facing, this.state, this.phys2d.velocity.y] = [1, 1, Player.MAX_VEL];
        else                            this.phys2d.velocity.y = 0;
        
        if (gameEngine.keys["d"])      [this.facing, this.state, this.phys2d.velocity.x] = [2, 1, Player.MAX_VEL];
        else if (gameEngine.keys["a"]) [this.facing, this.state, this.phys2d.velocity.x] = [3, 1, -Player.MAX_VEL];
        else                            this.phys2d.velocity.x = 0;

        this.phys2d.velocity = normalizeVector(this.phys2d.velocity);
        this.phys2d.velocity.x *= Player.MAX_VEL * gameEngine.clockTick;
        this.phys2d.velocity.y *= Player.MAX_VEL * gameEngine.clockTick;

        this.updateState();

        let prevX = this.x;
        let prevY = this.y;

        this.x += this.phys2d.velocity.x;
        this.y += this.phys2d.velocity.y;
        this.updateCollider();
        this.collisionChecker(prevX, prevY);
    };

    /**
     * Called once per tick after adjusting player position
     * @param {*} prevX x value before velocity was applied
     * @param {*} prevY y value before velocity was applied
     */
    collisionChecker(prevX, prevY) {
        this.colliding = false;//.sort((e1, e2) => -(distance(e1, this) - distance(e2, this)))
        gameEngine.entities.forEach(entity => {
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

    updateCollider(){
        this.collider = {type: "box", corner: {x: this.x, y: (this.y + 28)}, width: 16*SCALE, height: 16*SCALE};
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
    };
}

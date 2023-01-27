class Player {
    static MAX_VEL = 100; //Pixels per second (I think -Gabe)
    constructor(x, y) {
        Object.assign(this, {x, y});
        //this.engine = gameEngine;
        //this.anima = ANIMANAGER;

        this.state = 0;     // 0:idle, 1:walking
        this.facing = 1;    // 0:north, 1:south, 2:east, 3:west

        this.animations = [];
        //this.setupAnimations();

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
        this.animations[0][0] = ANIMANAGER.animations.get('ANIMA_link_idle_north')
        // facing south
        this.animations[0][1] = ANIMANAGER.animations.get('ANIMA_link_idle_south')
        // facing east
        this.animations[0][2] = ANIMANAGER.animations.get('ANIMA_link_idle_east')
        // facing west
        this.animations[0][3] = ANIMANAGER.animations.get('ANIMA_link_idle_west')

        //walking animations
        //facing north
        this.animations[1][0] = ANIMANAGER.animations.get('ANIMA_link_run_north')
        // facing south
        this.animations[1][1] = ANIMANAGER.animations.get('ANIMA_link_run_south')
        // facing east
        this.animations[1][2] = ANIMANAGER.animations.get('ANIMA_link_run_east')
        // facing west
        this.animations[1][3] = ANIMANAGER.animations.get('ANIMA_link_run_west')
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
        this.colliding = false;
        gameEngine.entities.forEach(entity => {
            if(entity.collider != undefined && entity.collider.type === "box" && entity != this){
                //Check to see if player is colliding with entity
                let colliding = checkCollision(this, entity);
                this.colliding = colliding || this.colliding;//store for later purposes
                //check to see if the collision entity is solid and the type of entity we are looking for
                if(colliding && entity.phys2d && entity.phys2d.static && entity.tag == "environment"){
                    dynmStaticColHandler(this, entity, prevX, prevY);//Handle collision
                    this.updateCollider();
                }
            }
        });
    }

    updateCollider(){
        this.collider = {type: "box", corner: {x: this.x, y: (this.y + 32)}, width: 64, height: 64};
    }

    drawCollider(ctx) {
        console.log("Hello there");
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
        // this.animations[this.state][this.facing].drawFrame(this.engine.clockTick, ctx, this.x, this.y, scale);
        ANIMANAGER.animations.get('ANIMA_link_run_south').animate(gameEngine.clockTick, ctx, this.x, this.y, scale);
        if(this.colliding && this.sidesAffected) this.drawCollider(ctx);
    };
}

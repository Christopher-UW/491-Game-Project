class HeartDrop {
    constructor(x, y){
        Object.assign(this, {x, y});
        this.collider = {type: "box", corner: {x: this.x+4, y: this.y+4}, width: 8 * SCALE, height: 8 * SCALE}
        this.DEBUG = true
    }

    update() {
        if(checkCollision(this, Player.CURR_PLAYER)) {
            Player.CURR_PLAYER.heal(1);
            this.removeFromWorld = true;
        }
    }

    draw(ctx) {
        GRAPHICS.get('SET_ow_heart').drawSprite(1, ctx, this.x+4, this.y+4, SCALE)
    }
}

class Triforce {
    constructor(x, y) {
        Object.assign(this, {x,y});
        this.collider = {type: "box", corner: {x: this.x, y: this.y}, width: 79 * (SCALE - 1), height: 79 * (SCALE - 1)};
        this.DEBUG = true;
    }

    update() {
        if(checkCollision(this, Player.CURR_PLAYER)) {
            gameEngine.victory = true;
            this.removeFromWorld = true;
        }
    }

    draw(ctx) {
        GRAPHICS.get('SET_end_game').drawSprite(0, ctx, this.x, this.y, SCALE - 1)
    }
}

class DeathCloud {
    constructor(x, y) {
        Object.assign(this, {x, y});
        this.spawn = null;
        this.cloudDone = false;
        this.cloudAnimation = GRAPHICS.get('ANIMA_enemy_death_cloud').clone().setLooping(false);
        gameEngine.addEntity(new HeartDrop(this.x, this.y))
    }

    update() {
        if (this.cloudDone && this.spawn === null) {
            this.removeFromWorld = true;
        }
    }

    draw(ctx) {
        this.cloudDone = this.cloudAnimation.animate(gameEngine.clockTick, ctx, this.x, this.y, 3);
    }
}

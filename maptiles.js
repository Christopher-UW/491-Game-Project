/*
class ChrisGrass {
    constructor(poop, x, y, isSolid=false) {
        Object.assign(this, {poop, x, y, isSolid});
        this.engine = gameEngine;
        this.anima = ANIMANAGER;

        this.tiles = this.anima.getSpriteSet('TILES_grasses');
        this.x = 0; this.y = 0;
        this.horzTiles = 16; this.vertTiles = 14;
        this.tag = "environment";
    };

    update() {

    };

    draw(ctx, scale) {
        this.tiles.tileSprite(ctx, 1, this.x, this.y, this.horzTiles, this.vertTiles, scale)
    };
}

class GabeWall {
    constructor(engine, x, y){
        Object.assign(this, {engine, x, y});
        this.spritesheet = ASSET_MANAGER.getAsset("./zeldagb_spritesheet_modified.png");
        this.animator = new Animator(this.spritesheet, 18, 137, 16, 16, 1, 1);
        this.phsy2d = {static: true};
        this.collider = {type: "box", corner: {x: x, y: y}, height: 16, width: 16};//size is broken due to no global scale parameter
        this.tag = "environment";
    }

    update() {

    };

    draw(ctx, scale) {
        this.animator.drawFrame(this.engine.clockTick, ctx, this.x, this.y, scale);
    };
}
*/

class Grass {
    constructor(xLoc, yLoc) {
        Object.assign(this, {xLoc, yLoc});

        this.tiles = ANIMANAGER.getSpriteSet('env_grasses');
        this.tag = 'environment';        
    };

    update() {

    };

    draw(ctx, scale) {
        this.tiles.drawSprite(ctx, 0, this.xLoc, this.yLoc, scale);
    };
}

class Stone {
    constructor(xLoc, yLoc) {
        Object.assign(this, {xLoc, yLoc});

        this.tiles = ANIMANAGER.getSpriteSet('env_stones');
        this.phys2d = {static: true};
        this.collider = {type: "box", corner: {x: xLoc, y: yLoc}, height: 4*16, width: 4*16};
        this.tag = 'environment';
    };

    update() {
        
    };

    draw(ctx, scale) {
        this.tiles.drawSprite(ctx, 0, this.xLoc, this.yLoc, scale);
    }
}

class Sand {
    constructor(xLoc, yLoc) {
        Object.assign(this, {xLoc, yLoc});

        this.tiles = ANIMANAGER.getSpriteSet('env_sands');
        this.tag = 'environment';
    };

    update() {
        
    };

    draw(ctx, scale) {
        this.tiles.drawSprite(ctx, 0, this.xLoc, this.yLoc, scale);
    };
}
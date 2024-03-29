import { Sprite } from "pixi.js";

import { RenderLayers } from "consts";
import { AssetManager } from "managers";

import { WallData } from "types/AssetTypes";
import Game from "Game";
import { ELEVATION_HEIGHT } from "./ElevationGrid";
import SpriteSheet from "SpriteSheet";
import Vector from "vector";
import { toObservablePoint } from "helpers/vectorHelper";

export enum WallSpriteIndex {
    Horizontal = 0,
    Vertical = 1,
    DoorHorizontal = 2,
    DoorVertical = 3,
    HillEast = 4,
    HillWest = 5,
    HillNorth = 6,
    HillSouth = 7,
}

export enum Orientation {
    Vertical = 0,
    Horizontal = 1,
}

export default class Wall {
    public static wallToWorldPos(wallPos: Vector, orientation: Orientation): Vector {
        if (orientation === Orientation.Horizontal) {
            return new Vector(wallPos.x / 2, wallPos.y);
        } else {
            return new Vector(wallPos.x / 2, wallPos.y + 0.5);
        }
    }

    // Class //
    public data: WallData | undefined;
    public spriteSheet: SpriteSheet;
    public sprite: Sprite;

    public exists: boolean;
    public indestructable: boolean;
    public isDoor: boolean;
    private currentSpriteIndex: WallSpriteIndex;
    private currentElevation: number;

    public constructor(
        public orientation: Orientation,
        public position: Vector,
        public gridPos: Vector,
        public assetPath?: string,
    ) {
        if (assetPath) {
            this.exists = true;
            const data = AssetManager.getJSON(assetPath) as WallData;

            this.data = data;
            this.spriteSheet = AssetManager.getSpriteSheet(this.data.spriteSheet);
            this.exists = true;

            this.updateSprite();
        } else {
            // Empty wall pos
            this.exists = false;
        }
    }

    public update(): void {
        if (!this.exists) return;
        this.sprite.tint = 0xffffff;
    }

    /**
     * Must be called in post update
     */
    public overrideColourForFrame(colour: number) {
        if (!this.exists) return;
        this.sprite.tint = colour;
    }

    public remove(): void {
        if (this.exists) {
            Game.removeFromStage(this.sprite, RenderLayers.ENTITIES);
        }
        this.data = undefined;
        this.spriteSheet = undefined;
        this.exists = false;
    }

    public updateSprite(): void {
        if (!this.exists) return;

        const [spriteIndex, elevation] = this.getSpriteIndex();
        if (this.currentSpriteIndex === spriteIndex && this.currentElevation === elevation) return;

        if (this.sprite) {
            // Remove old sprite
            Game.removeFromStage(this.sprite, RenderLayers.ENTITIES);
        }

        // Add new sprite
        this.currentSpriteIndex = spriteIndex;
        this.currentElevation = elevation;
        const texture = this.spriteSheet.getTextureByIndex(spriteIndex);
        this.sprite = new Sprite(texture);
        Game.addToStage(this.sprite, RenderLayers.ENTITIES);
        this.sprite.anchor.set(0.5, 1 + elevation * 0.5);

        // Update position
        const { x, y } = this.gridPos;
        let wallPos;
        if (this.orientation === Orientation.Vertical) {
            wallPos = new Vector(x / 2, y + 1);
        } else {
            wallPos = new Vector(x / 2, y);
        }
        this.sprite.position = toObservablePoint(wallPos.multiply(Game.opts.worldScale));
    }

    /**
     * Sets the wall to or from a door
     * @param isDoor State to set the wall to
     */
    public setDoor(isDoor: boolean): void {
        if (this.isDoor === isDoor) return;

        this.isDoor = isDoor;

        this.updateSprite();
    }

    public isSloped(): boolean {
        if (this.orientation === Orientation.Horizontal) {
            const left = !!Game.world.elevationGrid.getElevationAtPoint(
                new Vector(this.position.x - 0.5, this.position.y),
            );
            const right = !!Game.world.elevationGrid.getElevationAtPoint(
                new Vector(this.position.x + 0.5, this.position.y),
            );

            return left !== right;
        } else {
            const up = !!Game.world.elevationGrid.getElevationAtPoint(
                new Vector(this.position.x, this.position.y - 0.5),
            );
            const down = !!Game.world.elevationGrid.getElevationAtPoint(
                new Vector(this.position.x, this.position.y + 0.5),
            );

            return up !== down;
        }
    }

    public getCorners(): Vector[] {
        const tile = this.position.floor();
        return this.orientation === Orientation.Horizontal
            ? [tile, tile.add(new Vector(1, 0))]
            : [tile, tile.add(new Vector(0, 1))];
    }

    public getSpriteIndex(isDoor = this.isDoor): [index: WallSpriteIndex, elevation: number] {
        if (this.orientation === Orientation.Horizontal) {
            const left = Game.world.elevationGrid.getElevationAtPoint(
                new Vector(this.position.x - 0.5, this.position.y),
            );
            const right = Game.world.elevationGrid.getElevationAtPoint(
                new Vector(this.position.x + 0.5, this.position.y),
            );
            const elevation = Math.min(left, right);

            if (left === right)
                return [isDoor ? WallSpriteIndex.DoorHorizontal : WallSpriteIndex.Horizontal, elevation];
            if (left > right) return [isDoor ? WallSpriteIndex.DoorHorizontal : WallSpriteIndex.HillWest, elevation];
            if (left < right) return [isDoor ? WallSpriteIndex.DoorHorizontal : WallSpriteIndex.HillEast, elevation];
        } else {
            const up = Game.world.elevationGrid.getElevationAtPoint(new Vector(this.position.x, this.position.y - 0.5));
            const down = Game.world.elevationGrid.getElevationAtPoint(
                new Vector(this.position.x, this.position.y + 0.5),
            );
            const elevation = Math.min(up, down);

            if (up === down) return [isDoor ? WallSpriteIndex.DoorVertical : WallSpriteIndex.Vertical, elevation];
            if (up > down) return [isDoor ? WallSpriteIndex.DoorVertical : WallSpriteIndex.HillNorth, elevation];
            if (up < down)
                return [
                    isDoor ? WallSpriteIndex.DoorVertical : WallSpriteIndex.HillSouth,
                    elevation + ELEVATION_HEIGHT,
                ];
        }
    }
}

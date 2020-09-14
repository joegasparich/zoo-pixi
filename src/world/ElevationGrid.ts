import { Config } from "consts";
import { Graphics, Vector } from "engine";
import { Side } from "engine/consts";
import { pointInCircle } from "engine/helpers/math";

import ZooGame from "ZooGame";
import Wall from "./Wall";

export const ELEVATION_HEIGHT = 0.5;

export enum Elevation {
    Water = -1,
    Flat = 0,
    Hill = 1,
}

export enum SlopeVariant {
    Flat,
    S, E, W, N,
    NW, NE, SW, SE,
    INW, INE, ISW, ISE,
    I1, I2
}

export default class ElevationGrid {
    private grid: Elevation[][];
    private width: number;
    private height: number;

    public setup(): void {
        this.width = ZooGame.map.cols + 1;
        this.height = ZooGame.map.rows + 1;

        // Initialise grid to flat
        this.grid = [];
        for (let i = 0; i < this.width; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.height; j++) {
                this.grid[i][j] = Elevation.Flat;
            }
        }
    }

    public setElevationInCircle(centre: Vector, radius: number, elevation: Elevation): void {
        if (!ZooGame.map.isPositionInMap(centre)) return;

        for(let i = centre.x - radius; i <= centre.x + radius; i++) {
            for(let j = centre.y - radius; j <= centre.y + radius; j++) {
                const gridPos = new Vector(i, j).floor();
                if (!this.isPositionInGrid(gridPos)) continue;

                if (pointInCircle(centre, radius, gridPos)) {
                    this.setElevation(gridPos, elevation);
                }
            }
        }

        ZooGame.world.biomeGrid.redrawChunksInRadius(centre.multiply(2), radius + 3);
        ZooGame.world.wallGrid.getWallsInRadius(centre, radius + 1).forEach(wall => wall.updateSprite());
    }

    public setElevation(gridPos: Vector, elevation: Elevation): void {
        // TODO: Allow elevation if all required points are being elevated
        if (this.canElevate(gridPos, elevation)) {
            // Flatten surrounding terrain
            if (elevation !== Elevation.Flat) {
                this.getAdjacentGridPositions(gridPos, true)
                    .filter(gridPos => this.getElevationAtGridPoint(gridPos) === -elevation)
                    .forEach(gridPos => {
                        this.setElevation(gridPos, Elevation.Flat);
                        ZooGame.world.biomeGrid.redrawChunksInRadius(gridPos.multiply(2), 2);
                    });
            }

            this.grid[gridPos.x][gridPos.y] = elevation;

            this.getAdjacentGridPositions(gridPos, true).forEach(gridPos => {
                if (this.getBaseElevation(gridPos) < 0) {
                    ZooGame.world.waterGrid.setTileWater(gridPos);
                } else {
                    ZooGame.world.waterGrid.setTileLand(gridPos);
                }
            });
        }
    }

    public canElevate(gridPos: Vector, elevation: Elevation): boolean {
        // Check 4 surrounding tiles for tileObjects that can't be on slopes
        for (const tile of this.getSurroundingTiles(gridPos)) {
            const object = ZooGame.world.getTileObjectAtPos(tile);
            if (object && !object.data.canPlaceOnSlopes) return false;
        }

        // Check 4 surrounding wall slots for gates
        for (const wall of this.getSurroundingWalls(gridPos)) {
            if (wall?.exists && wall?.isDoor) return false;
        }

        if (elevation === Elevation.Water) {
            // Check 4 surrounding tiles for tileObjects that can't be on slopes
            for (const tile of this.getSurroundingTiles(gridPos)) {
                const object = ZooGame.world.getTileObjectAtPos(tile);
                if (object && !object.data.canPlaceInWater) return false;
            }

            // Check 4 surrounding wall slots for walls
            for (const wall of this.getSurroundingWalls(gridPos)) {
                if (wall?.exists) return false;
            }
        }

        return true;
    }

    public getGridCopy(): Elevation[][] {
        return this.grid.map(o => [...o]);
    }

    public setGrid(grid: Elevation[][]): void {
        this.grid = grid;
    }

    public getElevationAtPoint(pos: Vector): number {
        if (!this.isPositionInGrid(pos)) {
            return 0;
        }

        const relX = pos.x % 1;
        const relY = pos.y % 1;
        const baseElevation = this.getBaseElevation(pos.floor());
        const slopeVariant = this.getSlopeVariant(pos.floor());

        // Tried to come up with a formula instead of using enums but I'm too dumb
        switch (slopeVariant) {
            case SlopeVariant.Flat: return baseElevation;
            case SlopeVariant.N: return baseElevation + ELEVATION_HEIGHT * relY;
            case SlopeVariant.S: return baseElevation + ELEVATION_HEIGHT * (1 - relY);
            case SlopeVariant.W: return baseElevation + ELEVATION_HEIGHT * relX;
            case SlopeVariant.E: return baseElevation + ELEVATION_HEIGHT * (1 - relX);
            case SlopeVariant.SE: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - relX - relY), 0);
            case SlopeVariant.SW: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - (1 - relX) - relY), 0);
            case SlopeVariant.NE: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - relX - (1 - relY)), 0);
            case SlopeVariant.NW: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - (1 - relX) - (1 - relY)), 0);
            case SlopeVariant.ISE: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - relX), (1 - relY));
            case SlopeVariant.ISW: return baseElevation + ELEVATION_HEIGHT * Math.max(relX, (1 - relY));
            case SlopeVariant.INE: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - relX), relY);
            case SlopeVariant.INW: return baseElevation + ELEVATION_HEIGHT * Math.max(relX, relY);
            case SlopeVariant.I1: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - relX - relY), (1 - (1 - relX) - (1 - relY)));
            case SlopeVariant.I2: return baseElevation + ELEVATION_HEIGHT * Math.max((1 - (1 - relX) - relY), (1 - relX - (1 - relY)));
            default:
                console.error("You shouldn't be here");
                return 0;
        }
    }

    public getSlopeVariant(tile: Vector): SlopeVariant {
        const {x, y} = tile;
        const nw = this.getElevationAtGridPoint(new Vector(x, y));         // Top Left
        const ne = this.getElevationAtGridPoint(new Vector(x + 1, y));     // Top Right
        const sw = this.getElevationAtGridPoint(new Vector(x, y + 1));     // Bottom Left
        const se = this.getElevationAtGridPoint(new Vector(x + 1, y + 1)); // Bottom Right

        if (nw === ne && nw === sw && nw === se) return SlopeVariant.Flat;
        if (nw === ne && sw === se && nw < sw) return SlopeVariant.N;
        if (nw === sw && ne === se && nw > ne) return SlopeVariant.E;
        if (nw === ne && sw === se && nw > sw) return SlopeVariant.S;
        if (nw === sw && ne === se && nw < ne) return SlopeVariant.W;
        if (se === sw && se === ne && nw > se) return SlopeVariant.SE;
        if (sw === nw && sw === se && ne > sw) return SlopeVariant.SW;
        if (ne === nw && ne === se && sw > ne) return SlopeVariant.NE;
        if (nw === sw && nw === ne && se > nw) return SlopeVariant.NW;
        if (se === sw && se === ne && nw < se) return SlopeVariant.INW;
        if (sw === nw && sw === se && ne < sw) return SlopeVariant.INE;
        if (ne === nw && ne === se && sw < ne) return SlopeVariant.ISW;
        if (nw === sw && nw === ne && se < nw) return SlopeVariant.ISE;
        if (nw === se && sw === ne && nw > ne) return SlopeVariant.I1;
        if (nw === se && sw === ne && nw < ne) return SlopeVariant.I2;

        console.error("How did you get here?");
        return SlopeVariant.Flat;
    }

    public isPositionSloped(position: Vector): boolean {
        return this.getSlopeVariant(position.floor()) === SlopeVariant.Flat;
    }

    private isPositionInGrid(pos: Vector): boolean {
        return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
    }

    public getBaseElevation(tile: Vector): number {
        return Math.min(
            this.getElevationAtGridPoint(tile),
            this.getElevationAtGridPoint(tile.add(new Vector(0, 1))),
            this.getElevationAtGridPoint(tile.add(new Vector(1, 0))),
            this.getElevationAtGridPoint(tile.add(new Vector(1, 1))),
        ) * ELEVATION_HEIGHT;
    }

    private getElevationAtGridPoint(gridPos: Vector): number {
        return this.grid[gridPos.x] && this.grid[gridPos.x][gridPos.y] ? this.grid[gridPos.x][gridPos.y] : 0;
    }

    private getSurroundingTiles(gridPos: Vector): Vector[] {
        const tiles: Vector[] = [];
        for (let i = -1; i < 1; i++) {
            for (let j = -1; j < 1; j++) {
                tiles.push(gridPos.add(new Vector(i, j)));
            }
        }

        return tiles;
    }

    private getSurroundingWalls(gridPos: Vector): Wall[] {
        return [
            ZooGame.world.wallGrid.getWallAtTile(gridPos, Side.North),
            ZooGame.world.wallGrid.getWallAtTile(gridPos, Side.West),
            ZooGame.world.wallGrid.getWallAtTile(gridPos.subtract(new Vector(1)), Side.South),
            ZooGame.world.wallGrid.getWallAtTile(gridPos.subtract(new Vector(1)), Side.East),
        ];
    }

    private getAdjacentGridPositions(gridPos: Vector, diagonals?: boolean): Vector[] {
        let elevations = [
            gridPos.add(new Vector(1, 0)),
            gridPos.add(new Vector(-1, 0)),
            gridPos.add(new Vector(0, 1)),
            gridPos.add(new Vector(0, -1)),
        ];
        if (diagonals) {
            elevations = elevations.concat([
                gridPos.add(new Vector(1, -1)),
                gridPos.add(new Vector(1, 1)),
                gridPos.add(new Vector(-1, 1)),
                gridPos.add(new Vector(-1, -1)),
            ]);
        }

        return elevations;
    }

    /**
     * Draws green & red Xs to show which nodes are pathable
     */
    public drawDebug(): void {
        const cellSize = Config.WORLD_SCALE;

        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[i].length; j++) {
                Graphics.setLineStyle(1, 0xFF0000);
                if (i < this.grid.length - 1) {
                    Graphics.drawLine(
                        i * cellSize,
                        (j - this.grid[i][j] * ELEVATION_HEIGHT) * cellSize,
                        (i + 1) * cellSize,
                        (j - this.grid[i + 1][j] * ELEVATION_HEIGHT) * cellSize,
                    );
                }
                if (j < this.grid[i].length - 1) {
                    Graphics.drawLine(
                        i * cellSize,
                        (j - this.grid[i][j] * ELEVATION_HEIGHT) * cellSize,
                        i * cellSize,
                        (j - this.grid[i][j + 1] * ELEVATION_HEIGHT + 1) * cellSize,
                    );
                }
            }
        }
    }
}
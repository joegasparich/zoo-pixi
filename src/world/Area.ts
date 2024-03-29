import { Config } from "consts";
import Graphics from "Graphics";
import { randomInt, rgbToHex } from "helpers/math";
import { removeItem } from "helpers/util";
import Vector from "vector";
import { MapCell } from "./MapGrid";

import Wall from "./Wall";

export default class Area {
    public colour: number;
    public connectedAreas: Map<Area, Wall[]>;
    public highlighted: boolean;

    public constructor(public id: string, private cells?: MapCell[]) {
        this.colour = rgbToHex(Math.random() * 255, Math.random() * 255, Math.random() * 255);

        this.connectedAreas = new Map();
    }

    public addCell(cell: MapCell): void {
        if (!this.cells) this.cells = [];
        this.cells.push(cell);
    }

    public setCells(cells: MapCell[]): void {
        this.cells = cells;
    }

    public getCells(): MapCell[] {
        return this.cells;
    }

    public addAreaConnection(area: Area, door: Wall): void {
        if (!door.isDoor) return; // Wall isn't a door
        if (this.connectedAreas.get(area)?.includes(door)) return; // Duplicate door
        if (area === this) return; // Don't add connection to itself

        if (this.connectedAreas.has(area)) {
            this.connectedAreas.get(area).push(door);
        } else {
            this.connectedAreas.set(area, [door]);
        }
    }

    public removeAreaConnection(area: Area, door?: Wall): void {
        if (!this.connectedAreas.has(area)) return; // Area not a connection
        if (door && !this.connectedAreas.get(area).includes(door)) return; // Door not a connection

        if (door) {
            removeItem(this.connectedAreas.get(area), door);

            if (this.connectedAreas.get(area).length < 1) {
                this.connectedAreas.delete(area);
            }
        } else {
            this.connectedAreas.delete(area);
        }
    }

    public getRandomPos(): Vector {
        return this.cells[randomInt(0, this.cells.length)].position;
    }

    public postUpdate(): void {
        if (this.highlighted) this.highlight();
    }

    private highlight(): void {
        this.getCells().forEach(cell => {
            const worldCellPos = cell.position.multiply(Config.WORLD_SCALE);
            Graphics.setLineStyle(0);
            Graphics.drawRect(worldCellPos.x, worldCellPos.y, Config.WORLD_SCALE, Config.WORLD_SCALE, this.colour, 0.5);
        });
    }

    public delete(): void {
        this.cells = [];
        this.connectedAreas = new Map();
    }
}

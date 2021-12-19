import Game from "Game";
import World from "world/World";
import UIManager from "ui/UIManager";
import { Scene } from "./Scene";
import { MapCell } from "world/MapGrid";
import Vector from "vector";

const MAP_SIZE = 20;

export default class ZooScene extends Scene {
    public name = "Zoo Scene";

    public constructor() {
        super();
    }

    public start(): void {
        this.generateMap();
    }

    public stop(): void {
        Game.clearEntities();
        Game.world.reset();
        Game.map.clearMap();
        UIManager.reset();
    }

    private async generateMap(): Promise<void> {
        const cells: MapCell[][] = [];

        // Place Grass
        for (let i = 0; i < MAP_SIZE; i++) {
            cells[i] = [];
            for (let j = 0; j < MAP_SIZE; j++) {
                cells[i][j] = {
                    position: new Vector(i, j),
                    isSolid: false,
                };
            }
        }

        // Load Map
        Game.map.setupGrid(cells);

        Game.world = new World();
        await Game.world.setup();
    }
}

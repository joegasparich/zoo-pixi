import { Config } from "consts";
import { js as Pathfinder, Direction } from "easystarjs";

import { Side } from "consts";
import Graphics from "Graphics";
import Vector from "vector";

const allDirections: Direction[] = [
    "BOTTOM",
    "BOTTOM_LEFT",
    "BOTTOM_RIGHT",
    "LEFT",
    "RIGHT",
    "TOP",
    "TOP_LEFT",
    "TOP_RIGHT",
];
export enum NodeType {
    CLOSED = 0,
    OPEN = 1,
    PATH = 2,
}

export type AllowedNodes = {
    type: NodeType;
    cost: number;
}[];

export default class PathfindingGrid {
    private pathFinder: Pathfinder;

    private grid: number[][];

    public constructor(rows: number, cols: number) {
        this.grid = this.generateGrid(rows, cols);

        this.pathFinder = new Pathfinder();
        this.pathFinder.enableDiagonals();
        this.pathFinder.disableCornerCutting();
        this.pathFinder.setGrid(this.grid);
    }

    /**
     * Generates an empty pathfinding grid
     * @param rows The number of rows in the grid
     * @param cols The number of columns in the grid
     */
    private generateGrid(rows: number, cols: number): number[][] {
        const grid: number[][] = [];
        for (let i = 0; i < cols; i++) {
            grid[i] = [];
            for (let j = 0; j < rows; j++) {
                grid[i][j] = NodeType.OPEN;
            }
        }
        return grid;
    }

    /**
     * Disables entry to a node from the specified sides
     * @param x The x co ordinate of the node
     * @param y The y co ordinate of the node
     * @param sides The sides of the node to disable
     */
    public disableEdges(x: number, y: number, sides: Side[]): void {
        let allowedDirections: Direction[] = [...allDirections];

        // Note that since the easystar grid is stored as [y][x] that the top for us is LEFT for easystar
        if (sides.includes(Side.North)) allowedDirections = allowedDirections.filter(dir => !dir.includes("LEFT"));
        if (sides.includes(Side.South)) allowedDirections = allowedDirections.filter(dir => !dir.includes("RIGHT"));
        if (sides.includes(Side.West)) allowedDirections = allowedDirections.filter(dir => !dir.includes("TOP"));
        if (sides.includes(Side.East)) allowedDirections = allowedDirections.filter(dir => !dir.includes("BOTTOM"));

        this.pathFinder.setDirectionalCondition(y, x, allowedDirections);
    }

    /**
     * Disables a node in the pathfinding grid
     * @param x The x co ordinate of the node
     * @param y The y co ordinate of the node
     */
    public setNode(x: number, y: number, type: NodeType): void {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            console.error("Tile position must be integers");
            return;
        }

        this.grid[x][y] = type;
        this.pathFinder.setGrid(this.grid);
    }

    /**
     * Calculates and returns a path from the start node to the end node
     * @param start The start co ordinate
     * @param end The end co ordinate
     */
    public getPath(start: Vector, end: Vector, allowedNodes: AllowedNodes): Promise<Vector[] | void> {
        if (!this.isPositionInGrid(start.x, start.y) || !this.isPositionInGrid(end.x, end.y)) return Promise.resolve();
        if (!allowedNodes.find(node => node.type === this.grid[start.x][start.y])) return Promise.resolve(); // TODO: start from next nearest tile?
        if (!allowedNodes.find(node => node.type === this.grid[end.x][end.y])) return Promise.resolve(); // TODO: potentially pick adjacent tile?
        if (start.equals(end)) return Promise.resolve();

        this.pathFinder.setAcceptableTiles([...allowedNodes.map(node => node.type)]);
        allowedNodes.forEach(node => {
            this.pathFinder.setTileCost(node.type, node.cost);
        });

        console.log("Getting path from " + start + " to " + end);
        return new Promise(resolve => {
            // ! Note that the pathfinder expects the grid to be the inverse of what we have it here.
            // ! I have set it up so that the grid is in the format [x][y] for readability
            // ! But we need to swap it here for the pathfinder
            this.pathFinder.findPath(start.y, start.x, end.y, end.x, path => {
                if (path === null) {
                    resolve();
                } else {
                    resolve(path.map(point => new Vector(point.y, point.x)));
                }
            });
            this.pathFinder.calculate();
        });
    }

    /**
     * Steps through the path and removes redundant edges by checking if the edge is blocked by an object using a ray cast
     * @param path The path to optimise
     * @param isLineWalkable a function to determine whether the line between two nodes is walkable
     */
    public optimisePath(path: Vector[], isLineWalkable: (nodeA: Vector, nodeB: Vector) => boolean): Vector[] {
        if (path.length < 3) return path;

        let currentNode = path.shift();
        const newPath: Vector[] = [currentNode];
        let checkNode = path.shift();
        let nextNode: Vector;
        while (path.length) {
            nextNode = path.shift();
            if (!isLineWalkable(currentNode.add(new Vector(0.5, 0.5)), nextNode.add(new Vector(0.5, 0.5)))) {
                // We can't skip this node
                newPath.push(checkNode);
                currentNode = checkNode;
            } else {
                // We can skip this node
            }
            checkNode = nextNode;
        }
        newPath.push(nextNode); // Add last node
        return newPath;
    }

    /**
     * Returns whether the node at the co ordinates is disabled
     * @param x The x co ordinates of the node
     * @param y The y co ordinates of the node
     */
    public isNodeDisabled(x: number, y: number): boolean {
        if (!this.isPositionInGrid(x, y)) return false;
        return !this.grid[x][y];
    }

    /**
     * Returns whether the specified co ordinates are within the bounds of the grid
     * @param x The x co ordinates to check
     * @param y The y co ordinates to check
     */
    public isPositionInGrid(x: number, y: number): boolean {
        return x >= 0 && x < this.grid.length && y >= 0 && y < this.grid[0].length;
    }

    public reset(): void {
        this.grid = [];
        this.pathFinder.setGrid([]);
    }

    /**
     * Draws green & red Xs to show which nodes are pathable
     */
    public drawDebug(): void {
        const xOffset = Config.WORLD_SCALE / 2;
        const yOffset = Config.WORLD_SCALE / 2;

        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[i].length; j++) {
                let colour;
                if (this.grid[i][j] === NodeType.PATH) colour = 0x0000ff;
                if (this.grid[i][j] === NodeType.OPEN) colour = 0x00ff00;
                if (this.grid[i][j] === NodeType.CLOSED) colour = 0xff0000;

                Graphics.setLineStyle(0.5, colour);
                Graphics.drawX(new Vector(i * Config.WORLD_SCALE + xOffset, j * Config.WORLD_SCALE + yOffset), 2);
            }
        }
    }
}

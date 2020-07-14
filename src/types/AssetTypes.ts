import { Collider } from "engine/managers";

export interface TileObjectData {
    name: string;
    solid: boolean;
    collider: Collider;
    width: number;
    height: number;
    sprite: string;
}

export interface GroundTileData {
    name: string;
    tileset: string;
    variants: number[];
    solid: boolean;
}

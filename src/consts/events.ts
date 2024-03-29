export enum GameEvent {
    LOAD_START = "LOAD_START",
    LOAD_COMPLETE = "LOAD_COMPLETE",
    SETUP_COMPLETE = "SETUP_COMPLETE",
    PRE_UPDATE = "PRE_UPDATE",
    UPDATE = "UPDATE",
    POST_UPDATE = "POST_UPDATE",
}

export enum MapEvent {
    REQUEST_MAP_LOAD = "REQUEST_MAP_LOAD",
    MAP_LOAD_START = "MAP_LOAD_START",
    MAP_LOAD_COMPLETE = "MAP_LOAD_COMPLETE",
}

export enum UIEvent {
    FOCUS = "FOCUS",
    UNFOCUS = "UNFOCUS",
}

export enum WorldEvent {
    AREAS_UPDATED = "AREAS_UPDATED",
    EXHIBITS_UPDATED = "EXHIBITS_UPDATED",
    BIOMES_UPDATED = "BIOMES_UPDATED",
    ELEVATION_UPDATED = "ELEVATION_UPDATED",
    PLACE_SOLID = "PLACE_SOLID",
    PLACE_TILE_OBJECT = "PLACE_TILE_OBJECT",
    DELETE_TILE_OBJECT = "DELETE_TILE_OBJECT",
}

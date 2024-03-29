import { Application, Container, SCALE_MODES, settings, Ticker } from "pixi.js";
import { Group, Layer, Stage } from "@pixi/layers";

import { AssetManager, InputManager, SceneManager } from "./managers";
import Mediator from "./Mediator";
import { registerPixiInspector } from "./helpers/util";
import { Canvas } from "ui/components";
import Camera from "Camera";
import { Entity } from "entities";
import Vector from "vector";
import Graphics from "Graphics";
import { Config, GameEvent, Inputs, RenderLayers } from "consts";
import ZooScene from "scenes/ZooScene";
import UIManager from "ui/UIManager";
import MapGrid from "world/MapGrid";
import World from "world/World";
import Zoo from "Zoo";

type DebugSettings = {
    showEntities: boolean;
    showMapGrid: boolean;
    showPathfinding: boolean;
    showWallGrid: boolean;
    showElevation: boolean;
    showWater: boolean;
    showPath: boolean;
};

const defaultSettings: DebugSettings = {
    showEntities: false,
    showMapGrid: false,
    showPathfinding: false,
    showWallGrid: false,
    showElevation: false,
    showWater: false,
    showPath: false,
};

type GameOpts = {
    windowWidth?: number;
    windowHeight?: number;
    enableDebug?: boolean;
    worldScale?: number;
    gameSpeed?: number;
};

const defaultOpts: GameOpts = {
    windowWidth: 800,
    windowHeight: 600,
    enableDebug: false,
    worldScale: 16,
    gameSpeed: 1,
};

class Game {
    private app: Application;
    private stage: Stage;
    private ticker: Ticker;
    private layers: Container[];
    private groups: Group[];

    public opts: GameOpts;

    public canvas: Canvas;
    public camera: Camera;

    // Declared here for easy global access but controlled from the scene
    // Because fuck (Game.sceneManager.getCurrentScene() as ZooScene).map
    // And also fuck passing these refs through every god damn class
    public map: MapGrid;
    public world: World;
    public zoo: Zoo;

    private entities: Map<string, Entity>;
    private entitiesToAdd: Entity[];
    private entitiesToDelete: string[];

    // Managers
    public input: InputManager;
    public sceneManager: SceneManager;

    public debugSettings: DebugSettings;

    public constructor(opts: GameOpts) {
        this.opts = Object.assign(defaultOpts, opts);
        this.debugSettings = defaultSettings;

        // Set PIXI settings
        settings.SCALE_MODE = SCALE_MODES.NEAREST;

        // Instantiate app
        this.app = new Application({
            width: opts.windowWidth,
            height: opts.windowHeight,
            backgroundColor: 0x000000,
        });

        // Start ticker
        this.ticker = new Ticker();
        this.ticker.start();

        registerPixiInspector();

        // Set up variables
        this.entities = new Map();
        this.entitiesToAdd = [];
        this.entitiesToDelete = [];

        // create view in DOM
        document.body.appendChild(this.app.view);

        // create ui canvas
        this.canvas = new Canvas();
    }

    public async load(onProgress?: (progress: number) => void): Promise<void> {
        // Load Assets, all preloaded assets should be added to the manager at this point
        Mediator.fire(GameEvent.LOAD_START);
        await AssetManager.doPreLoad(onProgress);
        Mediator.fire(GameEvent.LOAD_COMPLETE);

        // Now that assets have been loaded we can set up the game
        await this.setup();
    }

    protected setup(): void {
        this.input = new InputManager();

        this.setupStage();

        this.canvas.load();

        this.camera = new Camera(new Vector(4, 4), 1, this.stage);
        this.camera.scale = Config.CAMERA_SCALE;

        this.sceneManager = new SceneManager();
        this.sceneManager.loadScene(new ZooScene(), (progress: number) => {
            console.log(`Map Load Progress: ${progress}%`);
        });

        Graphics.init();

        // Register inputs
        Object.values(Inputs).forEach(input => {
            this.input.registerInput(input);
        });

        UIManager.setup();

        Mediator.fire(GameEvent.SETUP_COMPLETE);

        // start up the game loop
        this.ticker.add(this.loop.bind(this));
    }

    private setupStage(): void {
        this.stage = new Stage();
        this.app.stage = this.stage;

        this.layers = [];
        this.groups = [];
        for (const l in Object.values(RenderLayers)) {
            const group = new Group(+l, true);
            group.on("sort", sprite => {
                sprite.zOrder = sprite.y;
            });

            const layerContainer = new Container();
            this.layers.push(layerContainer);
            this.groups.push(group);

            this.stage.addChild(new Layer(group), layerContainer);
        }
    }

    /**
     * The main game loop.
     * @param delta ms since the last update
     */
    private loop(delta: number): void {
        delta *= this.opts.gameSpeed;

        this.preUpdate(delta);
        Mediator.fire(GameEvent.PRE_UPDATE, { delta, game: this });

        this.update(delta);
        Mediator.fire(GameEvent.UPDATE, { delta, game: this });

        this.postUpdate(delta);
        Mediator.fire(GameEvent.POST_UPDATE, { delta, game: this });

        // Reset tings
        this.input.clearKeys();
        this.pushCachedEntities();
        this.removeDeletedEntities();
    }

    protected preUpdate(delta: number): void {
        // Setup actions
        const scene = this.sceneManager.getCurrentScene();
        scene && scene.preUpdate(delta);
        Graphics.preUpdate();

        this.entities.forEach(entity => {
            entity.preUpdate(delta);
        });
    }

    protected update(delta: number): void {
        // Game actions
        const scene = this.sceneManager.getCurrentScene();
        scene && scene.update(delta);
        UIManager.update(delta);

        this.entities.forEach(entity => {
            entity.update(delta);
        });
    }

    protected postUpdate(delta: number): void {
        // Rendering actions
        const scene = this.sceneManager.getCurrentScene();
        scene && scene.postUpdate(delta);

        UIManager.postUpdate(delta);

        this.entities.forEach(entity => {
            entity.postUpdate(delta);
        });

        // ! Camera should be last to avoid stuttering
        this.camera.update();
    }

    public addToStage(container: Container, layer = RenderLayers.ENTITIES): void {
        container.parentGroup = this.groups[+layer];
        this.layers[+layer].addChild(container);
    }

    public removeFromStage(container: Container, layer = RenderLayers.ENTITIES): void {
        this.layers[+layer].removeChild(container);
    }

    public getEntities(): Entity[] {
        // TODO: Find out if its cheaper to also store an array of entities instead of converting it each time
        return Array.from(this.entities.values());
    }

    public getEntityById(id: string): Entity {
        return this.entities.get(id);
    }

    public registerEntity(entity: Entity): Entity {
        this.entitiesToAdd.push(entity);
        return entity;
    }

    public unregisterEntity(id: string): void {
        this.entitiesToDelete.push(id);
    }

    public clearEntities(): void {
        this.entities.forEach(entity => {
            entity.remove();
        });
        this.entitiesToAdd.forEach(entity => {
            entity.remove();
        });
        this.entities = new Map();
        this.entitiesToAdd = [];
        this.entitiesToDelete = [];
    }

    private pushCachedEntities(): void {
        this.entitiesToAdd.forEach(entity => {
            this.entities.set(entity.id, entity);
            entity.start();
        });
        this.entitiesToAdd = [];
    }

    private removeDeletedEntities(): void {
        this.entitiesToDelete.forEach(entityId => {
            this.entities.delete(entityId);
        });
        this.entitiesToDelete = [];
    }
}

export default new Game({
    windowWidth: Config.WINDOW_WIDTH,
    windowHeight: Config.WINDOW_HEIGHT,
    enableDebug: Config.ENABLE_DEBUG,
    worldScale: 16,
});

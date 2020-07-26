import * as React from "react";

import { Game, Vector } from "engine";
import Player from "entities/Player";
import TileObject from "entities/TileObject";

import { TileObjectData } from "types/AssetTypes";
import World from "world/World";
import { Config, Inputs } from "consts";
import { Toolbar } from "ui/components";
import { AssetManager } from "engine/managers";

export default class ZooGame extends Game {
    public world: World;
    public player: Player;

    private toolbarRef: React.RefObject<Toolbar>;

    protected async setup(): Promise<void> {
        super.setup();

        // Load Map
        this.world = new World(this);
        await this.world.setup();

        // Register inputs
        Object.values(Inputs).forEach(input => {
            this.input.registerInput(input);
        });

        this.camera.scale = Config.CAMERA_SCALE;

        // Create Player
        this.player = this.registerEntity(new Player(
            this,
            new Vector(4, 4),
        )) as Player;
        this.player.render.scale = 0.5;

        this.createUI();
    }

    private createUI(): void {
        this.toolbarRef = React.createRef<Toolbar>();
        this.canvas.addChild(<Toolbar key="toolbar" ref={this.toolbarRef} />);
        this.toolbarRef.current.start(this);
    }

    protected update(delta: number): void {
        super.update(delta);

        this.pollInput();

        this.toolbarRef?.current?.update();
        this.world.postUpdate(delta);
    }

    protected postUpdate(delta: number): void {
        this.toolbarRef?.current?.postUpdate();

        super.postUpdate(delta);
    }

    private pollInput(): void {
        if (this.toolbarRef?.current?.hasFocus()) return;

        if (this.input.isInputPressed(Inputs.RightMouse)) {
            const mousePos: Vector = this.camera.screenToWorldPosition(this.input.getMousePos());

            this.player.pather.pathTo(mousePos.floor());
        }
    }

    public placeTileObject(object: (TileObjectData | string), position: Vector): void {
        if (!this.world.isTileFree(position)) return;

        if (typeof object === "string") {
            object = AssetManager.getJSON(object) as TileObjectData;
        }

        this.world.registerTileObject(new TileObject(
            this,
            position,
            object,
            true,
        ));
    }
}

import { Graphics, Vector } from "engine";

import { Assets, Config, Inputs } from "consts";
import { Tool, ToolType } from ".";
import PlacementGhost from "ui/PlacementGhost";
import ZooGame from "ZooGame";

export default class DeleteTool extends Tool {
    public type = ToolType.Delete;

    private startPos: Vector;

    public set(ghost: PlacementGhost): void {
        ghost.reset();

        ghost.setSprite(Assets.UI.BIN_ICON);
        ghost.setPivot(new Vector(0.5, 0.5));
        ghost.changeColour = false;
        ghost.setAlpha(1);
        ghost.setScale(0.5);
        ghost.drawFunction = (pos: Vector): void => {
            if (ZooGame.input.isInputHeld(Inputs.LeftMouse)) return;

            const worldCellPos = pos.floor().multiply(Config.WORLD_SCALE);
            Graphics.setLineStyle(1, 0xFF0000);
            Graphics.drawRect(worldCellPos.x, worldCellPos.y, Config.WORLD_SCALE, Config.WORLD_SCALE, 0xFF0000, 0.5);
        };
    }

    public update(): void {
        const mouseWorldPos = ZooGame.camera.screenToWorldPosition(ZooGame.input.getMousePos());

        if (ZooGame.input.isInputPressed(Inputs.LeftMouse)) {
            this.startPos = mouseWorldPos;
        }
        if (ZooGame.input.isInputHeld(Inputs.LeftMouse)) {
            if (this.startPos) {
                const xSign = Math.sign(mouseWorldPos.x - this.startPos.x) || 1; // Ensure never 0 so that we get at least one square
                const ySign = Math.sign(mouseWorldPos.y - this.startPos.y) || 1;
                for (let i = this.startPos.floor().x; i !== mouseWorldPos.floor().x + xSign; i += xSign) {
                    for (let j = this.startPos.floor().y; j !== mouseWorldPos.floor().y + ySign; j += ySign) {
                        Graphics.setLineStyle(1, 0xFF0000);
                        Graphics.drawRect(i * Config.WORLD_SCALE, j * Config.WORLD_SCALE, Config.WORLD_SCALE, Config.WORLD_SCALE, 0xFF0000, 0.5);
                    }
                }
            }
        }
        if (ZooGame.input.isInputReleased(Inputs.LeftMouse)) {
            if (this.startPos) {
                const xSign = Math.sign(mouseWorldPos.x - this.startPos.x) || 1; // Ensure never 0 so that we get at least one square
                const ySign = Math.sign(mouseWorldPos.y - this.startPos.y) || 1;
                let pos;

                for (let i = this.startPos.floor().x; i !== mouseWorldPos.floor().x + xSign; i += xSign) {
                    for (let j = this.startPos.floor().y; j !== mouseWorldPos.floor().y + ySign; j += ySign) {
                        pos = new Vector(i, j);
                        // Delete walls
                        for (let side = 0; side < 4; side++) {
                            ZooGame.world.wallGrid.deleteWallAtTile(pos, side);
                        }
                        // Delete tile objects
                        ZooGame.world.getTileObjectAtPos(pos)?.remove();
                    }
                }

                this.startPos = undefined;
            }
        }
    }

    public postUpdate(): void {}
}

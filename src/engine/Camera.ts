import { Game, Vector } from ".";
import { WORLD_SCALE } from "./constants";

export default class Camera {
    game: Game;
    position: Vector;
    screenPosition: Vector;
    target: Vector;

    constructor(game: Game, pos: Vector) {
        this.game = game;
        this.position = pos;
        this.screenPosition = pos.multiply(WORLD_SCALE);
    }

    goToPosition(position: Vector): void {
        this.target = position;
    }

    update(): void {
        if (this.target) {
            this.position = Vector.Lerp(this.position, this.target, 0.1 * this.game.gameSpeed);
            this.screenPosition = this.position.multiply(WORLD_SCALE);
        }
    }
}

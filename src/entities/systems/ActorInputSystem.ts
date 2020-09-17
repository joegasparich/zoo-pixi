import { InputSystem, PathFollowSystem, SYSTEM, WallAvoidanceSystem } from "engine/entities/systems";

import { ZOO_SYSTEM } from ".";
import { Entity } from "engine/entities";
import ZooGame from "ZooGame";
import { Vector } from "engine";
import { Inputs } from "consts";

export default class ActorInputSystem extends InputSystem {
    public id = ZOO_SYSTEM.ACTOR_INPUT_SYSTEM;
    public type = SYSTEM.INPUT_SYSTEM;

    private pathfinder: PathFollowSystem;
    private wallAvoid: WallAvoidanceSystem;

    public start(entity: Entity): void {
        super.start(entity);

        this.pathfinder = entity.getSystem(SYSTEM.PATH_FOLLOW_SYSTEM) as PathFollowSystem;
        if (!this.pathfinder) {
            console.error("ActorInputSystem requires PathFollowSystem");
        }
        this.wallAvoid = entity.getSystem(SYSTEM.WALL_AVOIDANCE_SYSTEM) as WallAvoidanceSystem;
    }

    public update(delta: number): void {
        super.update(delta);

        this.inputVector = this.pathfinder.currentTarget?.subtract(this.entity.position).normalize() ?? Vector.Zero();

        if (this.wallAvoid) {
            if (this.pathfinder.hasPath()) {
                this.pathfinder.followPath(50);
                this.wallAvoid.shouldAvoid = true;
            } else {
                this.wallAvoid.shouldAvoid = false;
            }
        }

        // ! Temp
        if (ZooGame.input.isInputPressed(Inputs.RightMouse)) {
            const mousePos: Vector = ZooGame.camera.screenToWorldPosition(ZooGame.input.getMousePos());

            this.pathfinder.pathTo(mousePos.floor());
        }
    }

    public postUpdate(delta: number): void {
        super.postUpdate(delta);

        // TODO: Move to a new component
        // if (this.inputVector.x > 0) {
        //     this.renderer.flipX = false;
        //     // this.animator.setAnimation("run");
        // } else if (this.inputVector.x < 0) {
        //     this.renderer.flipX = true;
        // }
    }
}
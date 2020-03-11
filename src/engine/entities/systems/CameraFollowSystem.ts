import { Entity } from "engine/entities";
import { System } from ".";
import { Camera, Vector } from "engine";

export default class CameraFollowSystem extends System {
    id = "CAMERA_FOLLOW_SYSTEM";

    camera: Camera;

    start(entity: Entity) {
        super.start(entity);

        this.camera = entity.game.camera;
    }

    postUpdate(delta: number) {
        super.postUpdate(delta);

        const centredPos = this.entity.position.subtract(new Vector(
            this.entity.game.app.view.width/2,
            this.entity.game.app.view.height/2,
        ));
        this.camera.goToPosition(centredPos);
    }
}
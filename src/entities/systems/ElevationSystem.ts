import { Entity } from "engine/entities";
import { RenderSystem, SYSTEM, System } from "engine/entities/systems";
import ZooGame from "ZooGame";

/**
 * Note: this should be added after any movement components
 */
export default class ElevationSystem extends System {
    public id = "ELEVATION_SYSTEM";
    public type = "ELEVATION_SYSTEM";

    private renderer: RenderSystem;

    public start(entity: Entity): void {
        super.start(entity);

        this.renderer = entity.getSystem(SYSTEM.RENDER_SYSTEM) as RenderSystem;
        if (!this.renderer) {
            console.error("ElevationSystem requires RenderSystem");
        }
    }

    public update(delta: number): void {
        super.update(delta);

        this.renderer.offset.y = -ZooGame.world.elevationGrid.getElevationAtPoint(this.entity.position);
    }
}

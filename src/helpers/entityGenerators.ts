import { Assets, TAG } from "consts";
import { Entity } from "entities";
import { InputToPhysicsComponent, PathBlockComponent, PhysicsComponent, RenderComponent, COMPONENT, WallAvoidanceComponent } from "entities/components";
import { AssetManager, ColliderType } from "managers";
import { ActorInputComponent, AreaPathFollowComponent, ElevationComponent, TileObjectComponent } from "entities/components";
import { TileObjectData } from "types/AssetTypes";
import Game from "Game";
import SpriteSheet from "SpriteSheet";
import Vector from "vector";

export function createDude(): Entity {
    const spritesheet = new SpriteSheet({
        imageUrl: Assets.SPRITESHEETS.DUDE_RUN,
        cellHeight: 24,
        cellWidth: 24,
    });

    const dude = this.createActor(new Vector(4));

    dude.addComponent(new AreaPathFollowComponent());
    dude.addComponent(new ActorInputComponent());

    const renderer = dude.getComponent(COMPONENT.RENDER_COMPONENT) as RenderComponent;
    renderer.setSpriteSheet(spritesheet, 0);
    renderer.scale = 0.5;

    return dude;
}

export function createActor(position: Vector): Entity {
    const actor = new Entity(
        position,
    );
    actor.addComponent(new RenderComponent());
    actor.addComponent(new PhysicsComponent({ type: ColliderType.Circle, radius: 0.15 }, true, 20));
    actor.addComponent(new ElevationComponent());
    actor.addComponent(new WallAvoidanceComponent());
    actor.addComponent(new InputToPhysicsComponent());

    return actor;
}

// This is how we do
export function createTileObject(assetPath: string, position: Vector): Entity {
    if (!Game.map.isTileFree(position)) return;

    const data = AssetManager.getJSON(assetPath) as TileObjectData;

    const tileObject = new Entity(position.floor().add(new Vector(0.5)));
    tileObject.addComponent(new RenderComponent(data.sprite, undefined, data.pivot));
    tileObject.addComponent(new ElevationComponent());
    if (data.solid) {
        tileObject.addComponent(new PhysicsComponent(data.collider, false, 1, TAG.Solid, data.pivot));
        tileObject.addComponent(new PathBlockComponent());
    }
    tileObject.addComponent(new TileObjectComponent()).setAsset(assetPath);

    return tileObject;
}

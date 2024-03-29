import { Assets } from "consts";
import { Entity } from "entities";
import {
    InputToPhysicsComponent,
    SolidComponent,
    RenderComponent,
    SimplePhysicsComponent,
    NeedsComponent,
    PathFollowComponent,
    DebuggableComponent,
    ConsumableComponent,
    InteractableComponent,
    GuestComponent,
} from "entities/components";
import { AssetManager } from "managers";
import {
    ActorInputComponent,
    AreaPathFollowComponent,
    ElevationComponent,
    TileObjectComponent,
} from "entities/components";
import { AnimalData, NeedType, TileObjectData, TileObjectType } from "types/AssetTypes";
import Game from "Game";
import SpriteSheet from "SpriteSheet";
import Vector from "vector";
import { Need } from "entities/components/NeedsComponent";
import AnimalBehaviourComponent from "entities/components/AnimalBehaviourComponent";

export function createActor(position: Vector): Entity {
    const actor = new Entity(position);

    actor.addComponent(new RenderComponent());
    actor.addComponent(new SimplePhysicsComponent());
    actor.addComponent(new ElevationComponent());
    actor.addComponent(new InteractableComponent());
    actor.addComponent(new DebuggableComponent());

    return actor;
}

export function createDude(): Entity {
    const spritesheet = new SpriteSheet({
        imageUrl: Assets.SPRITESHEETS.DUDE_RUN,
        cellHeight: 24,
        cellWidth: 24,
    });

    const dude = this.createActor(new Vector(4));

    dude.addComponent(new AreaPathFollowComponent());
    dude.addComponent(new ActorInputComponent());
    dude.addComponent(new InputToPhysicsComponent());

    const renderer = dude.getComponent("RENDER_COMPONENT");
    renderer.setSpriteSheet(spritesheet, 0);
    renderer.scale = 0.5;

    return dude;
}

export function createAnimal(assetPath: string, position: Vector): Entity {
    const data = AssetManager.getJSON(assetPath) as AnimalData;

    const animal = createActor(position);

    animal.addComponent(new PathFollowComponent(true));
    animal.addComponent(
        new NeedsComponent([
            new Need(NeedType.Hunger, 0.004, 1, true), // TODO: per animal & genes
            new Need(NeedType.Thirst, 0.005, 1, true),
            new Need(NeedType.Energy, 0.0025, 0.5, true),
        ]),
    );
    animal.addComponent(new AnimalBehaviourComponent()).setAsset(assetPath);
    animal.addComponent(new InputToPhysicsComponent());

    const renderer = animal.getComponent("RENDER_COMPONENT");
    renderer.setSprite(data.sprite);
    renderer.scale = 0.5;

    return animal;
}

export function createGuest(position: Vector): Entity {
    const guest = createActor(position);

    guest.addComponent(new PathFollowComponent());
    guest.addComponent(new NeedsComponent([new Need(NeedType.Energy, 0.005, 0.5, true)]));
    guest.addComponent(new GuestComponent());
    guest.addComponent(new InputToPhysicsComponent());

    const renderer = guest.getComponent("RENDER_COMPONENT");
    renderer.setSprite(Assets.SPRITES.GUEST);
    renderer.scale = 0.5;

    return guest;
}

export function createTileObject(assetPath: string, position: Vector, size = new Vector(1, 1)): Entity {
    if (!Game.map.isTileFree(position)) return;

    const data = AssetManager.getJSON(assetPath) as TileObjectData;

    const tileObject = new Entity(position.floor().add(new Vector(0.5)));
    const renderer = tileObject.addComponent(new RenderComponent());

    if (data.spriteSheet) {
        const spritesheet = new SpriteSheet({
            imageUrl: data.spriteSheet,
            cellHeight: data.cellHeight,
            cellWidth: data.cellWidth,
        });
        renderer.setSpriteSheet(spritesheet, 0);
    } else {
        renderer.setSprite(data.sprite);
    }
    renderer.pivot = new Vector((1 / size.x) * data.pivot.x, (1 / size.y) * data.pivot.y);
    renderer.scale = data.scale || 1;
    tileObject.addComponent(new ElevationComponent());
    if (data.solid) {
        tileObject.addComponent(new SolidComponent(size));
    }

    let tileObjComponent: TileObjectComponent;
    switch (data.type) {
        case TileObjectType.Consumable:
            tileObjComponent = tileObject.addComponent(new ConsumableComponent());
            break;
        default:
            tileObjComponent = tileObject.addComponent(new TileObjectComponent());
            break;
    }
    tileObjComponent.setAsset(assetPath);
    tileObject.addComponent(new InteractableComponent());
    tileObject.addComponent(new DebuggableComponent());

    return tileObject;
}

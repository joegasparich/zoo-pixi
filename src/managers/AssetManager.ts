import { LoaderResource, Loader, Texture } from "pixi.js";

import TileSet, { TileSetData } from "TileSet";

class AssetManager {
    private loader: Loader;
    private preloadedAssets: string[];
    private tilesets: Map<string, TileSet>;

    public constructor() {
        this.loader = new Loader();
        this.tilesets = new Map();
    }

    public preLoadAssets(assets: string[]): void {
        if (!this.preloadedAssets) {
            this.preloadedAssets = [];
        }

        this.preloadedAssets.push(...assets);
    }

    public async doPreLoad(onProgress?: (progress: number) => void): Promise<LoaderResource[]> {
        return this.loadResources(this.preloadedAssets, onProgress);
    }

    public async loadResource(asset: string, onProgress?: (progress: number) => void): Promise<LoaderResource> {
        if (!asset) {
            return null;
        }

        const resources = await this.loadResources([asset], onProgress);

        return resources[0];
    }

    public loadResources(assets: string[], onProgress?: (progress: number) => void): Promise<LoaderResource[]> {
        if (!assets || !assets.length) {
            return null;
        }
        const existingAssets = assets.filter(asset => this.loader.resources[asset]);
        assets = assets.filter(asset => !this.loader.resources[asset]);

        this.loader.add(assets);
        const progressListener: (loader: Loader) => void = loader => onProgress && onProgress(loader.progress);
        const progressListenerRef = this.loader.onProgress.add(progressListener);

        return new Promise(resolve => {
            this.loader.load((loader, resources) => {
                this.loader.onProgress.detach(progressListenerRef);
                const res = assets.map(asset => resources[asset]).concat(existingAssets.map(asset => resources[asset]));
                resolve(res);
            });
        });
    }

    public getJSON(key: string): Object {
        if (!this.hasResource(key)) {
            console.error(`Tried to get unloaded JSON: ${key}`);
            return undefined;
        }
        return this.loader.resources[key].data;
    }

    public getTexture(key: string): Texture {
        if (!this.hasResource(key)) {
            console.error(`Tried to get unloaded texture: ${key}`);
            return undefined;
        }
        return this.loader.resources[key].texture;
    }

    public hasResource(key: string): boolean {
        return !!this.loader.resources[key];
    }

    public getTexturesByType(type: object): Texture[] {
        return Object.values(type).map(asset => this.loader.resources[asset].texture);
    }

    public createTileset(data: TileSetData): TileSet {
        if (this.tilesets.has(data.path)) return this.tilesets.get(data.path);

        const tileset = new TileSet(data);
        this.tilesets.set(data.path, tileset);
        return tileset;
    }

    public getTileset(key: string): TileSet {
        if (!this.tilesets.has(key)) {
            console.error(`Tried to get unregistered tileset: ${key}`);
            return undefined;
        }

        return this.tilesets.get(key);
    }
}

export default new AssetManager();

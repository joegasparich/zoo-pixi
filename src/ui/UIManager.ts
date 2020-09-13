import { Game, Vector } from "engine";
import * as React from "react";

import ZooGame from "ZooGame";
import AreaList from "./components/AreaList";
import Windows from "./components/Windows";
import ToolManager from "./ToolManager";

class UIManager {
    private tools: ToolManager;

    private windowsRef: React.RefObject<Windows>;
    private areasRef: React.RefObject<AreaList>;

    public setup(): void {
        this.windowsRef = React.createRef();
        this.areasRef = React.createRef();

        this.tools = new ToolManager();

        ZooGame.canvas.addChild(React.createElement(Windows, {
            key: "windows",
            ref: this.windowsRef,
        }));
    }

    public update(delta: number): void {
        this.tools.update();
    }

    public postUpdate(delta: number): void {
        const mouseScreenPos = ZooGame.input.getMousePos();

        this.tools.postUpdate();
    }

    public hasFocus(): boolean {
        return this.tools.hasFocus();
    }

    public openWindow(id: string, title: string, position: Vector, content: JSX.Element): void {
        this.windowsRef.current.openWindow(id, title, position, content);
    }
}

export default new UIManager();

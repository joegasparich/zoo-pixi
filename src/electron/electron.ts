import { app, BrowserWindow } from "electron";
import installExtension from "electron-devtools-installer";

app.on("ready", async () => {
    await installExtension("aamddddknhcagpehecnhphigffljadon");
    await installExtension("fmkadmapgofadopljbjfkapdkoienihi");

    // once electron has started up, create a window.
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    // hide the default menu bar that comes with the browser window
    window.setMenuBarVisibility(null);

    // TODO: If dev {
    // Open the DevTools.
    window.webContents.openDevTools();
    // load a website to display
    window.loadURL("http://localhost:4200");
});

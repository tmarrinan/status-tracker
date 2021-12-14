// Built-in Node.js packages
const path = require('path');

// Third-party Node.js packages
const {app, BrowserWindow} = require('electron');


// Create the application window
function createWindow() {
    let options = {
        //width: 250,
        width: 800, // dev
        height: 500,
        show: false
    };
    let main_window = new BrowserWindow(options);
    main_window.once('ready-to-show', () => {
        main_window.show();
        // dev
        main_window.webContents.openDevTools()
    });
    main_window.loadFile(path.join(__dirname, 'index.html'));
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS - (stay active 
// until the user quits explicitly with Cmd + Q)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

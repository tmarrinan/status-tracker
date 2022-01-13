// Built-in Node.js packages
const fs = require('fs');
const path = require('path');
const os = require('os');

// Third-party Node.js packages
const {app, BrowserWindow, ipcMain} = require('electron');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');


// Command line options
const cmd_option_defs = [
    {name: 'help', alias: 'h', type: Boolean},
    {name: 'debug-mode', alias: 'd', type: Boolean}
];
let cmd_options = {};
try {
    cmd_options = commandLineArgs(cmd_option_defs);
}
catch (err) {
    console.log('Warning: unknown option entered');
}
if (!cmd_options.hasOwnProperty('help')) cmd_options['help'] = false;
if (!cmd_options.hasOwnProperty('debug-mode')) cmd_options['debug-mode'] = false;

if (cmd_options['help'] === true) {
    printHelp();
    process.exit(0);
}


// Check if configuration file already exists
const status_tracker_data_directory = path.join(os.homedir(), '.status-tracker');
if (!fs.existsSync(status_tracker_data_directory)) {
    fs.mkdirSync(status_tracker_data_directory);
}
const config_file_path = path.join(status_tracker_data_directory, 'commandcenter-cfg.json');
let config = null;
if (fs.existsSync(config_file_path)) {
    config = JSON.parse(fs.readFileSync(config_file_path, 'utf8'));
}


// Create the application window
let main_window = null;
let win_size = {width: cmd_options['debug-mode'] ? 1280 : 800, height: 650};

function createWindow() {
    let options = {
        width: win_size.width,
        height: win_size.height,
        show: false,
        webPreferences: {
            nodeIntegration: true,   // needed for IPC
            contextIsolation: false  // needed for IPC
        }
    };
    main_window = new BrowserWindow(options);
    
    main_window.on('will-move', (event) => {
        let size = main_window.getSize();
        win_size.width = size[0];
        win_size.height = size[1];
    });
    main_window.on('moved', (event) => {
        main_window.setSize(win_size.width, win_size.height);
    });
    
    main_window.once('ready-to-show', () => {
        main_window.show();
        if (cmd_options['debug-mode']) {
            main_window.webContents.openDevTools();
        }
    });

    let query = {};
    if (config !== null) {
        query.query = config;
        if (Array.isArray(query.query.seats)) {
            query.query.seats = encodeURIComponent(JSON.stringify(query.query.seats));
        }
    }
    main_window.loadFile(path.join(__dirname, 'command-center.html'), query);
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


// Listen for notification from app window when toggling between config panel
// and main status-tracker view: resize window accordingly
ipcMain.on('change-mode', (event, arg) => {
    if (arg.mode === 'command-center') {
        fs.writeFile(config_file_path, JSON.stringify(arg.options, null, 4), 'utf8', (err) => {
            if (err) {
                console.log('Error: could not write config file');
            }
        });
    }
});


// Print help (show command line options)
function printHelp() {
    const sections = [
        {
            header: 'Status Tracker',
            content: 'Collaborative app to track the status of users (done, busy, stuck)'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'help',
                    description: 'Print this usage guide.',
                    alias: 'h',
                    type: Boolean
                },
                {
                    name: 'debug-mode',
                    description: 'Run in debug mode (i.e. show Developer Console).',
                    alias: 'd',
                    type: Boolean
                }
            ]
        }
    ];
    const usage = commandLineUsage(sections);
    console.log(usage);
}

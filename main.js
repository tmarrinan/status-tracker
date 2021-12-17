// Built-in Node.js packages
const fs = require('fs');
const path = require('path');
const os = require('os');

// Third-party Node.js packages
const {app, BrowserWindow} = require('electron');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');


// Command line options
const cmd_option_defs = [
    {name: 'help', alias: 'h', type: Boolean},
    {name: 'config-file', alias: 'f', type: String},
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
if (!cmd_options.hasOwnProperty('config-file')) cmd_options['config-file'] = path.join('config', 'sample-cfg.json');
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
const config_file_path = path.join(status_tracker_data_directory, 'status-cfg.json');
let config = null;
if (fs.existsSync(config_file_path)) {
    config = fs.readFileSync(config_file_path, 'utf8');
}


// Create the application window
function createWindow() {
    let win_width = cmd_options['debug-mode'] ? 800 : 250;
    let options = {
        width: win_width,
        height: 500,
        show: false
    };
    let main_window = new BrowserWindow(options);
    main_window.once('ready-to-show', () => {
        main_window.show();
        if (cmd_options['debug-mode']) {
            main_window.webContents.openDevTools();
        }
    });

    let query = {};
    if (config !== null) {
        query.query = config;
    }
    main_window.loadFile(path.join(__dirname, 'index.html'), query);
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
                    name: 'config-file',
                    description: 'The configuration file for your group.',
                    alias: 'f',
                    typeLabel: '{underline file}'
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

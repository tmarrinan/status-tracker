const {ipcRenderer} = require('electron');

let wsio;
let room;
let component;

function init() {
    let query_str = decodeURIComponent(window.location.search);
    let params = new URLSearchParams(query_str);
    let ws_host = params.get('ws');
    let is_secure = params.get('secure');
    let user = params.get('user');
    let room = params.get('room');
    let computer_id = params.get('computer_id');
    
    // Create Vue.js model
    const app = {
        data() {
            return {
                user: '',
                ws_host: '',
                is_secure: true,
                room: '',
                computer_id: '',
                mode: 'config',
                status: 'done'
            }
        },
        computed: {
            ws_url() {
                return this.is_secure ? 'wss://' + this.ws_host : 'ws://' + this.ws_host;
            }
        },
        methods: {
            updateConfig(event) {
                let valid_inputs = true;
                let valid_hostname_pattern = /^(([a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])(\:([0-9]+))?$/;
                if (!valid_hostname_pattern.test(this.ws_host)) {
                    console.log('"' + this.ws_host + '" is not a valid hostname');
                    valid_inputs = false;
                }
                if (this.user === '') {
                    console.log('no user name entered');
                    valid_inputs = false;
                }
                if (this.room === '') {
                    console.log('no room name entered');
                    valid_inputs = false;
                }
                if (this.computer_id === '') {
                    console.log('no computer id entered');
                    valid_inputs = false;
                }
                if (valid_inputs) {
                    initStatusTracker(this.user, this.ws_url, this.room, this.computer_id);
                    let options = {
                        user: this.user,
                        ws: this.ws_host,
                        secure: this.is_secure,
                        room: this.room,
                        computer_id: this.computer_id
                    };
                    ipcRenderer.send('change-mode', {mode: component.mode, options: options});
                }
            },
            changeStatus(event) {
                if (event.target.id === 'status_done') {
                    this.status = 'done';
                }
                else if (event.target.id === 'status_busy') {
                    this.status = 'busy';
                }
                else if (event.target.id === 'status_stuck') {
                    this.status = 'stuck';
                }
                wsio.emit('statusChange', {status: this.status});
            }
        }
    };
    
    component = Vue.createApp(app).mount('#app');
    
    // Init app in config panel on first launch
    if (ws_host === null || is_secure === null || room === null || computer_id === null) {
        initConfigPanel();
    }
    // Init app on status tracker panel if already configured
    else {
        component.ws_host = ws_host;
        component.is_secure = (is_secure === 'true');
        
        initStatusTracker(user, component.ws_url, room, computer_id);
    }
}

function initConfigPanel() {
    console.log('init control panel');
    ipcRenderer.send('change-mode', {mode: component.mode});
}

function initStatusTracker(user, ws_url, room, computer_id) {
    console.log('init status tracker: ' + ws_url + '(' + user + ')');
    
    component.user = user;
    component.room = room;
    component.computer_id = computer_id;
    component.mode = 'status-tracker';
    wsio = new WebSocketIO(ws_url);
    wsio.open(wsOpen);
    wsio.on('close', wsClose);
}

function connect() {
    initStatusTracker(component.user, component.ws_url);
    ipcRenderer.send('change-mode', {mode: component.mode});
}

function wsOpen() {
    console.log('Now connected to WebSocketIO server!');

    wsio.emit('joinRoom', {room: component.room, client_type: 'normal'});
}

function wsClose() {
    console.log('WebSocket connection closed');
    
    // TODO: some sort of 'connection' indicator
    //         - yellow on `initStatusTracker`
    //         - green on `wsOpen`
    //         - red on `wsClose`
}


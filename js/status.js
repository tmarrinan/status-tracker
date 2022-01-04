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
    
    // Create Vue.js model
    const app = {
        data() {
            return {
                user: '',
                ws_host: '',
                is_secure: true,
                room: '',
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
                initStatusTracker(this.user, this.ws_url, this.room);
                let options = {
                    user: this.user,
                    ws: this.ws_host,
                    secure: this.is_secure,
                    room: this.room
                };
                ipcRenderer.send('change-mode', {mode: component.mode, options: options});
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
    if (ws_host === null || is_secure === null || room === null) {
        initConfigPanel();
    }
    // Init app on status tracker panel if already configured
    else {
        component.ws_host = ws_host;
        component.is_secure = (is_secure === 'true');
        
        initStatusTracker(user, component.ws_url, room);
    }
}

function initConfigPanel() {
    console.log('init control panel');
    ipcRenderer.send('change-mode', {mode: component.mode});
}

function initStatusTracker(user, ws_url, room) {
    console.log('init status tracker: ' + ws_url + '(' + user + ')');
    
    component.user = user;
    component.room = room;
    component.mode = 'status-tracker';
    wsio = new WebSocketIO(ws_url);
    wsio.open(wsOpen);
}

function connect() {
    initStatusTracker(component.user, component.ws_url);
    ipcRenderer.send('change-mode', {mode: component.mode});
}

function wsOpen() {
    console.log('Now connected to WebSocketIO server!');
    //wsio.on('initialStatus', wsInitialStatus);
    //wsio.on('newClient', wsNewClient);
    //wsio.on('clientStatusChange', wsClientStatusChange);
    
    wsio.emit('joinRoom', {room: component.room, client_type: 'normal'});
}

//function wsInitialStatus(data) {
//    console.log(data);
//}
//
//function wsNewClient(data) {
//    console.log(data);
//}
//
//function wsClientStatusChange(data) {
//    console.log(data);
//}

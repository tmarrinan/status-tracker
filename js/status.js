let wsio;
let room;
let component;

function init() {
    let query_str = decodeURIComponent(window.location.search);
    let params = new URLSearchParams(query_str);
    let ws_host = params.get('ws');
    let is_secure = params.get('secure');
    let user = params.get('user');
    room = params.get('room');
    
    // Create Vue.js model
    const app = {
        data() {
            return {
                user: '',
                mode: 'config',
                status: 'done'
            }
        },
        methods: {
            updateConfig(event) {
                // TODO: call initStatusTracker()
                //       send config options back to Electron app to save
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
        is_secure = (is_secure === 'true');
        let protocol = is_secure ? 'wss://' : 'ws://';
        
        initStatusTracker(user, protocol + ws_host);
    }
}

function initConfigPanel() {
    console.log('init control panel');
}

function initStatusTracker(user, ws_url) {
    console.log('init status tracker: ' + ws_url + '(' + user + ')');
    
    component.user = user;
    component.mode = 'status-tracker';
    wsio = new WebSocketIO(ws_url);
    wsio.open(wsOpen);
}

function wsOpen() {
    console.log('Now connected to WebSocketIO server!');
    //wsio.on('initialStatus', wsInitialStatus);
    //wsio.on('newClient', wsNewClient);
    //wsio.on('clientStatusChange', wsClientStatusChange);
    
    wsio.emit('joinRoom', {room: room, client_type: 'normal'});
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

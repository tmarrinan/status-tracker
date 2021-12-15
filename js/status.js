let wsio;
let client_type;

function init() {
    let query_str = decodeURIComponent(window.location.search);
    let params = new URLSearchParams(query_str);
    let ws_host = params.get('ws');
    let is_secure = (params.get('secure') === 'true');
    let protocol = is_secure ? 'wss://' : 'ws://';
    client_type = params.get('type') || 'normal';
    
    console.log(client_type);
    
    wsio = new WebSocketIO(protocol + ws_host);
    wsio.open(wsOpen);
    
    const app = {
        data() {
            return {
                mode: 'done'
            }
        },
        methods: {
            changeStatus(event) {
                if (event.target.id === 'status_done') {
                    this.mode = 'done';
                }
                else if (event.target.id === 'status_busy') {
                    this.mode = 'busy';
                }
                else if (event.target.id === 'status_stuck') {
                    this.mode = 'stuck';
                }
            }
        }
    };
    
    Vue.createApp(app).mount('#app');
}

function wsOpen() {
    console.log('Now connected to WebSocketIO server!');
    wsio.on('initialStatus', wsInitialStatus);
    wsio.on('newClient', wsNewClient);
    wsio.on('clientStatusChange', wsClientStatusChange);
    
    wsio.emit('setClientType', {client_type: client_type});
}

function wsInitialStatus(data) {
    console.log(data);
}

function wsNewClient(data) {
    console.log(data);
}

function wsClientStatusChange(data) {
    console.log(data);
}

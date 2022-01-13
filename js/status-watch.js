const {ipcRenderer} = require('electron');

let wsio;
let room;
let component;

function init() {
    let query_str = decodeURIComponent(window.location.search);
    let params = new URLSearchParams(query_str);
    let ws_host = params.get('ws');
    let is_secure = params.get('secure');
    let room = params.get('room');
    let seats = params.get('seats');
    
    // Create Vue.js model
    const app = {
        data() {
            return {
                ws_host: '',
                is_secure: true,
                room: '',
                mode: 'config',
                num_rows: 0,
                num_cols: 0,
                seats: [],
                clients: {},
                error_msg: '',
                connection_status: 'disconnected'
            }
        },
        computed: {
            ws_url() {
                return this.is_secure ? 'wss://' + this.ws_host : 'ws://' + this.ws_host;
            }
        },
        methods: {
            updateSeatSize(event) {
                let i;
                let resize_len = Math.min(this.seats.length, this.num_rows);
                for (i = 0; i < resize_len; i++) {
                    resizeSeatArray(this.seats[i], this.num_cols, i * this.num_cols + this.seats[i].length + 1);
                }
                let extra_rows = this.num_rows - this.seats.length;
                if (extra_rows >= 0) {
                    for (i = 0; i < extra_rows; i++) {
                        let next_row = [];
                        resizeSeatArray(next_row, this.num_cols, this.seats.length * this.num_cols + 1);
                        this.seats.push(next_row);
                    }
                }
                else {
                    while (extra_rows < 0) {
                        this.seats.pop();
                        extra_rows++;
                    }
                }
            },
            updateConfig(event) {
                let valid_inputs = true;
                this.error_msg = '';
                let valid_hostname_pattern = /^(([a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])(\:([0-9]+))?$/;
                if (!valid_hostname_pattern.test(this.ws_host)) {
                    valid_inputs = false;
                    this.error_msg += '<p class="err">Invalid server URL</p>'
                }
                if (this.room === '') {
                    valid_inputs = false;
                    this.error_msg += '<p class="err">Room name is missing</p>'
                }
                if (valid_inputs) {
                    initCommandCenter(this.ws_url, this.room);
                    let options = {
                        ws: this.ws_host,
                        secure: this.is_secure,
                        room: this.room,
                        seats: JSON.parse(JSON.stringify(this.seats))
                    };
                    ipcRenderer.send('change-mode', {mode: this.mode, options: options});
                }
            },
            getComputerStatus(computer_id) {
                let status_image = 'images/icon_computer.png';
                if (this.clients.hasOwnProperty(computer_id)) {
                    status_image = 'images/icon_computer_' + this.clients[computer_id].status + '.png';
                }
                return status_image;
            },
            test() {
                this.clients['11'] = {status: 'busy', name: 'Anon'};
                this.$forceUpdate();
            },
            openConfigPanel(event) {
                wsio.close();
                this.mode = 'config';
                initConfigPanel();
            }
        }
    };
    
    component = Vue.createApp(app).mount('#app');
    
    // Init app in config panel on first launch
    if (ws_host === null || is_secure === null || room === null || seats === null) {
        initConfigPanel();
    }
    // Init app on status tracker panel if already configured
    else {
        component.ws_host = ws_host;
        component.is_secure = (is_secure === 'true');
        component.seats = JSON.parse(decodeURIComponent(seats));
        initCommandCenter(component.ws_url, room);
    }
}

function initConfigPanel() {
    console.log('init control panel');
    ipcRenderer.send('change-mode', {mode: component.mode});
}

function initCommandCenter(ws_url, room) {
    console.log('init command center: ' + ws_url);
    
    component.room = room;
    component.mode = 'command-center';
    component.connection_status = 'connecting';
    
    wsio = new WebSocketIO(ws_url);
    wsio.open(wsOpen, wsError);
    wsio.on('close', wsClose);
}

function wsOpen() {
    console.log('Now connected to WebSocketIO server!');
    
    component.connection_status = 'connected';
    
    wsio.on('initialStatus', wsInitialStatus);
    wsio.on('newClient', wsNewClient);
    wsio.on('removeClient', wsRemoveClient);
    wsio.on('clientStatusChange', wsClientStatusChange);

    wsio.emit('joinRoom', {room: component.room, client_type: 'command-center', user: 'Command Center', computer_id: 'CC'});
}

function wsError(evt) {
    console.log('WebSocketIO Error', evt);
    
    component.connection_status = 'disconnected';
}

function wsClose() {
    console.log('WebSocket connection closed');
    
    component.connection_status = 'disconnected';
}

function wsInitialStatus(data) {
    let key;
    for (key in data) {
        if (data.hasOwnProperty(key))  {
            if (data[key].hasOwnProperty('user') && data[key].hasOwnProperty('computer_id') && data[key].hasOwnProperty('client_status')) {
                component.clients[data[key].computer_id] = {id: key, status: data[key].client_status, name: data[key].user};
            }
        }
    }
    component.$forceUpdate();
}

function wsNewClient(data) {
    if (data.hasOwnProperty('id') && data.hasOwnProperty('data')) {
        if (data.data.hasOwnProperty('user') && data.data.hasOwnProperty('computer_id') && data.data.hasOwnProperty('client_status')) {
            component.clients[data.data.computer_id] = {id: data.id, status: data.data.client_status, name: data.data.user};
            component.$forceUpdate();
        }
    }
}

function wsRemoveClient(data) {
    if (data.hasOwnProperty('id')) {
        let key;
        let client_key = null;
        for (key in component.clients) {
            if (component.clients.hasOwnProperty(key)) {
                if (component.clients[key].id === data.id) {
                    client_key = key;
                    break;
                }
            }
        }
        if (client_key !== null) {
            delete component.clients[client_key];
            component.$forceUpdate();
        }
    }
}

function wsClientStatusChange(data) {
    if (data.hasOwnProperty('id') && data.hasOwnProperty('status')) {
        let key;
        let client_key = null;
        for (key in component.clients) {
            if (component.clients.hasOwnProperty(key)) {
                if (component.clients[key].id === data.id) {
                    client_key = key;
                    break;
                }
            }
        }
        if (client_key !== null) {
            component.clients[key].status = data.status;
            component.$forceUpdate();
        }
    }
}

function resizeSeatArray(array, size, start_value) {
    let delta = array.length - size;

    while (delta > 0) {
        array.pop();
        delta--;
    }
    while (delta < 0) {
        array.push(start_value.toString());
        start_value++;
        delta++;
    }
}

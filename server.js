const WebSocketIO = require('websocketio');

let wsio_server = new WebSocketIO.Server({port: 8000});


let wsio_clients = {};
wsio_server.onconnection((wsio) => {
    console.log('Client connected: ' + wsio.id);
    wsio_clients[wsio.id] = wsio;
    
    wsio.onclose(closeWebSocketClient);
    wsio.on('setClientType', wsSetClientType);
    wsio.on('statusChange', wsStatusChange);
});

function closeWebSocketClient(wsio) {
    console.log('Client disconnected: ' + wsio.id);
    delete wsio_clients[wsio.id];
}

function wsSetClientType(wsio, data) {
    wsio.custom_client_type = data.client_type;
    wsio.custom_client_status = 'done';
    if (wsio.custom_client_type === 'main') {
        let initial_status = {};
        for (let key in wsio_clients) {
            if (wsio_clients.hasOwnProperty(key) && wsio_clients[key].custom_client_type !== 'main') {
                initial_status[wsio_clients[key].id] = wsio_clients[key].custom_client_status;
            }
        }
        wsio.emit('initialStatus', initial_status);
    }
    else {
        for (let key in wsio_clients) {
            if (wsio_clients.hasOwnProperty(key) && wsio_clients[key].custom_client_type === 'main') {
                wsio_clients[key].emit('newClient', {id: wsio.id, status: wsio.custom_client_status});
            }
        }
    }
}

function wsStatusChange(wsio, data) {
    wsio.custom_client_status = data.status;
    for (let key in wsio_clients) {
        if (wsio_clients.hasOwnProperty(key) && wsio_clients[key].custom_client_type === 'main') {
            wsio_clients[key].emit('clientStatusChange', {id: wsio.id, status: wsio.custom_client_status});
        }
    }
}

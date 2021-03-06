const WebSocketIO = require('websocketio');

let wsio_server = new WebSocketIO.Server({port: 8000});


let rooms = {};

wsio_server.onconnection((wsio) => {
    wsio.onclose(closeWebSocketClient);
    wsio.on('joinRoom', wsJoinRoom);
    wsio.on('statusChange', wsStatusChange);
    wsio.on('resetClientStatus', wsResetClientStatus);
});

function closeWebSocketClient(wsio) {
    if (!wsio.hasOwnProperty('custom_data') || !wsio.custom_data.hasOwnProperty('room') || !rooms.hasOwnProperty(wsio.custom_data.room)) {
        return;
    }
    
    console.log('Client disconnected: ' + wsio.id);
    
    // Object containing all clients in room
    let wsio_clients = rooms[wsio.custom_data.room];
    
    // If client is normal app, inform command-center clients it has disconnected
    if (wsio.custom_data.client_type === 'normal') {
        for (let key in wsio_clients) {
            if (wsio_clients.hasOwnProperty(key) && wsio_clients[key].custom_data.client_type === 'command-center') {
                wsio_clients[key].emit('removeClient', {id: wsio.id});
            }
        }
    }
    
    // Delete client from room
    delete rooms[wsio.custom_data.room][wsio.id];
    
    // Delete room if no more clients remain
    if (Object.keys(rooms[wsio.custom_data.room]).length === 0) {
        delete rooms[wsio.custom_data.room];
    }
}

function wsJoinRoom(wsio, data) {
    if (!data.hasOwnProperty('room') || !data.hasOwnProperty('client_type') || !data.hasOwnProperty('user') || !data.hasOwnProperty('computer_id')) {
        return;
    }
    
    console.log('Client joined room "' + data.room + '": ' + wsio.id + '(' + data.user + ')');
    
    // Create room if it doesn't already exist
    if (!rooms.hasOwnProperty(data.room)) {
        rooms[data.room] = {};
    }
    
    // Add custom data to WebSocketIO client
    wsio.custom_data = {
        room: data.room,
        client_type: data.client_type,
        user: data.user,
        computer_id: data.computer_id,
        client_status: 'done'
    };
    
    // Add WebSocketIO client to room
    rooms[data.room][wsio.id] = wsio;
    
    // Object containing all clients in room
    let wsio_clients = rooms[wsio.custom_data.room];

    // If client is command-center app, broadcast status of currently connected clients
    if (wsio.custom_data.client_type === 'command-center') {
        let initial_status = {};
        for (let key in wsio_clients) {
            if (wsio_clients.hasOwnProperty(key) && wsio_clients[key].custom_data.client_type === 'normal') {
                initial_status[wsio_clients[key].id] = wsio_clients[key].custom_data;
            }
        }
        wsio.emit('initialStatus', initial_status);
    }
    // If client is a normal app, inform command-center clients it is connected
    else {
        for (let key in wsio_clients) {
            if (wsio_clients.hasOwnProperty(key) && wsio_clients[key].custom_data.client_type === 'command-center') {
                wsio_clients[key].emit('newClient', {id: wsio.id, data: wsio.custom_data});
            }
        }
    }
}

function wsStatusChange(wsio, data) {
    if (!wsio.hasOwnProperty('custom_data')) {
        return;
    }
    
    console.log('status change: ' + data.status);
    
    // Update WebSocketIO client status
    wsio.custom_data.client_status = data.status;
    
    // Forward status change to command-center clients
    let wsio_clients = rooms[wsio.custom_data.room];
    for (let key in wsio_clients) {
        if (wsio_clients.hasOwnProperty(key) && wsio_clients[key].custom_data.client_type === 'command-center') {
            wsio_clients[key].emit('clientStatusChange', {id: wsio.id, status: wsio.custom_data.client_status});
        }
    }
}

function wsResetClientStatus(wsio, data) {
    if (!wsio.hasOwnProperty('custom_data')) {
        return;
    }
    
    console.log('reset client status: room ' + wsio.custom_data.room);
    
    // Forward status reset notification to all clients
    let wsio_clients = rooms[wsio.custom_data.room];
    for (let key in wsio_clients) {
        if (wsio_clients.hasOwnProperty(key)) {
            if (wsio_clients[key].custom_data.client_type === 'normal') {
                wsio_clients[key].custom_data.client_status = 'busy';
            }
            wsio_clients[key].emit('clientStatusReset', {});
        }
    }
}

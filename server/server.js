const io = require('socket.io')();
const { initGame, checkIsWinner, moveRollDice,endTurn} = require('./game');
const { makeid } = require('./utils');
const {NR_OF_PLAYERS} = require("./constants");


const state = {}; //siia iga roomi loodud state, access state[roomName]
const clientRooms = {}; // client-id:roomname, saab teada kus toas mis klient
// const NR_OF_PLAYERS  = 2; //kuidagi tootab selle game creationisse


io.on('connection', client => {

  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);
  client.on('diceClick',handleRollDice);
  // client.on('endTurn',handleEndTurn);
  

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];
    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    }
    numClients += 1; //selle kes m2ngu alustas 
    
    client.emit('waitingForPlayers',numClients); //et 2sja liitunud klient n2eb playerite arvu
    console.log(roomName,"-",numClients);
    
     if(numClients > 1 && numClients < NR_OF_PLAYERS){ //midagi lobby sarnast 
      //k6ik selles roomis saavad  selle
      console.log("Lobby started");
      io.sockets.in(roomName)
      .emit('waitingForPlayers', numClients);
    } 
    else if(numClients > NR_OF_PLAYERS){
      client.emit('tooManyPlayers');
      return;
    }
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);// saadab m2ngu koodi
    client.emit('init', numClients); //numClients saab frontendis kliendi playerNumber 
    client.join(roomName);
    if(numClients==NR_OF_PLAYERS){ 

      console.log("Game Initialized..");
      state[roomName] = initGame(NR_OF_PLAYERS,roomName);
      client.number = numClients;
    }
    

    
    gameInterval(roomName); //hakkab gamestate saatma
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);
    client.emit('waitingForPlayers',1); //n2itab, et 1 m2ngija liitund
    client.join(roomName);
    client.number = 1;
    client.emit('init', 1); // esimene m2ngjia joinib
  }
  
/************************LISTEN FOR MOVES************* */
  function handleRollDice() {
    let roomName = clientRooms[client.id];
   if (!state[roomName]) {
     console.log("This gamestate doesnt exist");
     return;
   }
   console.log("DICE ROLLED");
   moveRollDice(state[roomName]);
   console.log("state b4",state[roomName]);
   endTurn(state[roomName]);
   gameInterval(roomName);
  }
  return;
});


function gameInterval(roomName) {
  /*Funktsioon, mis kontrollib, kas keegi v6itis, kui ei ss saadab k6igile gamestate
  *kui jh siis saadab gameover*/
 
    const winner = checkIsWinner(state[roomName]);
    if(!winner) { // kui pole winner, ss saada gamestate
      emitGameState(roomName, state[roomName])
    }else{
      console.log("Someone won");
    emitGameOver(roomName, winner);
    state[roomName] = null; //kustutab selle m2ngu seisu 2ra
    }
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  // console.log("gamestate sent",gameState);
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}


io.listen(process.env.PORT || 3000);

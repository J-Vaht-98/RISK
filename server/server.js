const io = require('socket.io')();
const { initGame, checkIsWinner, moveRollDice,
  endTurn,movePlaceSoldier,moveSoldiers,startAttack, 
  evaluateAttack,clearAttack,checkBoardForZeroSoldiers} = require('./game');
const { makeid } = require('./utils');
const {NR_OF_PLAYERS} = require("./constants");


const state = {}; //siia iga roomi loodud state, access state[roomName]
const clientRooms = {}; // client-id:roomname, saab teada kus toas mis klient
 //kuidagi tootab selle game creationisse

io.on('connection', client => {

  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame); 
  client.on('disConnect',(data)=>{
    console.log("player",data.player,"disconnected");
    if(!data.player){return};
    
    if(data.player == 1){
      state[returnRoomName()].winner = 2;
      client.emit('errorMsg',"Player 2 won because Player 1 quit")
      emitGameOver(returnRoomName(),2);
      state[returnRoomName()] = null;
    }
    if(data.player == 2){
      state[returnRoomName()].winner = 1
      client.emit('errorMsg',"Player 1 won because Player 2 quit")
      emitGameOver(returnRoomName(),1);
      state[returnRoomName()] = null;
    }
    
  });
  client.on('diceRoll',(data)=>{
    console.log("got a diceroll from",data.player);
    moveRollDice(state[returnRoomName()],data.player);
    winner = evaluateAttack(state[returnRoomName()]);
    if(winner >0){
      client.emit('errorMsg',"Attack over, you can claim area if you won")
      gameInterval(returnRoomName());
      endTurn(state[returnRoomName()])
      // clearAttack(state[returnRoomName()]);
      
      gameInterval(returnRoomName());
      return;
    }
    if(winner == -1){
      client.emit('errorMsg',"Not enough rolls");
      gameInterval(returnRoomName());
    }
    
    
    gameInterval(returnRoomName());
  });
  client.on('endAttack',()=>{
    clearAttack(state[returnRoomName()]);
    gameInterval(returnRoomName());
    
  });
  client.on('resetGameState',()=>{
    gameInterval(returnRoomName());
  });
  client.on('endTurn',handleEndTurn);
  client.on('placeSoldier',(data)=>{
    console.log(data);
    m = movePlaceSoldier(state[returnRoomName()],data.owner,data.country,data.nrOfSoldiers);
    if(m>0){
      gameInterval(returnRoomName());
      endTurn(state[returnRoomName()]);
      gameInterval(returnRoomName());
      
    }
    else{
      gameInterval(returnRoomName());
      if(m == -1){client.emit("errorMsg","Country already owned by someone")}
      if(m == -2){client.emit("errorMsg","You dont have enough soldiers left")}
      if(m == -3){client.emit("errorMsg","Cant place 0 soldiers")};
    }
  });
  client.on('startAttack',(data) =>{
    console.log(data);
    a = startAttack(state[returnRoomName()],data.attackingCountry,data.defendingCountry,data.nrOfDice);
    if(a == -1){client.emit("errorMsg","Cant attack yourself")}
    if(a == -2){client.emit("errorMsg","Something went wrong")}
    if(a == -3){client.emit("errorMsg","Need min 2 dice/armies to attack")}
    gameInterval(returnRoomName());
    return;
  })
  
  client.on('moveArmies',(data) =>{
    console.log("\n\n\n",data);
    move = moveSoldiers(state[returnRoomName()],data.moveFrom,data.moveTo,data.nrOfSoldiers,data.mover);
    if(move == -1){
      client.emit("errorMsg","Trying to move too many soldiers!");
      gameInterval(returnRoomName());
      return
    }
    if(move == -2){
      client.emit("errorMsg","Country error");
      gameInterval(returnRoomName());
      return;
    }
    if(move == -3){
      client.emit("errorMsg","Not a neighboring state");
      gameInterval(returnRoomName())
      return;
    }
    if(move==-4){
      client.emit("errorMsg","Cant move to the same state");
      gameInterval(returnRoomName());
      return;
    }
    //kui k6ik ok
    endTurn(state[returnRoomName()]);
    gameInterval(returnRoomName());
    return;
  })
  client.on('chatMsg',(data)=>{ 
    io.sockets.in(returnRoomName())
    .emit('recievedChatMsg',data.msg);
  });


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
  function returnRoomName(){
    /*Kontrollib, kas s6numi saatnud klient on roomis, ja ss tagastab vastava roomName
    *v6i mitte midagi, kui pole
    */
    let roomName = clientRooms[client.id];
  if (!state[roomName]) {
    console.log("This gamestate doesnt exist");
    return;
  }
  return roomName;
  }  
/************************LISTEN FOR MOVES************* */
  function handleEndTurn(){
    let roomName = returnRoomName();
   endTurn(state[roomName]);
   gameInterval(roomName); //kontrollib kas winner ja saadab k6igile gamestate
   
  }

  function handleAttack(attacker,defender){
    evaluateAttack(state[returnRoomName()],attacker,defender);
    // client.emit("attackInProgress",{attacker:attacker,defender:defender})
  }
  

  
  
  
  function gameInterval(roomName) {
    /*Funktsioon, mis kontrollib, kas keegi v6itis, kui ei ss saadab k6igile gamestate
    *kui jh siis saadab gameover*/
      var winner = checkIsWinner(state[roomName]);
      console.log("\nwinner",winner)
      if(winner<=0) { // kui pole winner, ss saada gamestate
        console.log("sent gamestate");
        checkBoardForZeroSoldiers(state[roomName])
        emitGameState(roomName, state[roomName])
      }else if(winner == 1){
        console.log("Someone won");
        client.emit('errorMsg',"PLAYER 1 WINS")
        // emitGameState(roomName,state[roomName]);
        emitGameOver(roomName, winner);
        state[roomName] = null; //kustutab selle m2ngu seisu 2ra
      }
      else if(winner ==2){
        state[roomName].winner = true;
        client.emit('errorMsg',"PLAYER 2 WINS")
        // emitGameState(roomName,state[roomName]);
        emitGameOver(roomName, winner);
        state[roomName] = null; //kustutab selle m2ngu seisu 2ra
      }
  }
  return; //client on connection return
});


function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  // console.log("gamestate sent",gameState.attack);
  // console.log("\n\n\ndice",gameState)
  // console.log("\n\n\ndice",gameState.attack)
  // console.log("\ndice",gameState.attack.dice[1])
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}


  
  io.listen(process.env.PORT || 3000);

const socket = io('http://localhost:3000');

socket.on('init',handleInit);
socket.on('gameState',handleGameState);
socket.on('gameOver',handleGameOver);
socket.on('gameCode',handleGameCode);
socket.on('unknownCode',handleUnknownCode);
socket.on('tooManyPlayers',handleTooManyPlayers);
socket.on('waitingForPlayers',handleWaitingForPlayers);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const waitingScreen = document.getElementById("waitingScreen");

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function newGame() {
    socket.emit('newGame');
    init();
  }
  
  function joinGame() {
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    init();
  }

let gameActive = false;
let playerNumber;

function init() {
  initialScreen.style.display = "none";
  waitingScreen.style.display = "block";
  gameActive = true;
}

function renderGame(state){
    /*See funktsioon vastutab laua renderdamise eest.
    *Argument on serverilt saadetud m2nguseis
    *TODO: staatilised asjad nagu nt player name jne ei peaks iga kord creatima
    ********essa render peaks need tegema ja ss sinna j2tma, sest piisavalt asju renderdada == aeglane
    ********ideaalis updateid ainult neid asju mis vaja (nt playerscore, t2ring jne)
    *TODO: selle asemel, et peale m2ngu algust peab iga m2ngija koodi panema v6iks olla link vms
    *TODO: stiil ilusamaks jne
    */
   console.log("render called");
    if(!state){
        console.log("State not recieved\n" + state);
        return;
    }
    var n = state.numPlayers;
    // gameScreen.style.display = "block"
    gameScreen.textContent = null; // gamescreen tyhjaks, muidu hakkab n2itama igat eelmist ka 
    gameScreen.style.display = "block";
    
    var turnDisplay = document.getElementById("turn-nr");
    turnDisplay.textContent = "Turn number: " + state.turn;
    var playOrderDisplay = document.getElementById("playOrder-display");
    playOrderDisplay.textContent = "Playorder: " + state.playOrder;
    turnDisplay.innerText = state.turn;
    waitingScreen.style.display = "none";
    
    const displayRoll = document.getElementById("player-roll");
    let playerWhoRolled;
    if(state.turn > 0){
        for(j=0;j<state.numPlayers;j++){
            if(state.playOrder[j] == state.currentPlayer){
              playerWhoRolled =  j;
            }
          }
        displayRoll.textContent = "Player " + (playerWhoRolled + 1)+ " rolled a " + state.dice;
    }
    
    
    /**Player scores,names etc */
    console.log("activePlayer = " + playerNumber + " for this client");
    console.log("Recieved: ",state);
    
    for(i=1;i<n+1;i++){ 
        var container = document.createElement("div");
        let score = document.createElement("div");
        let name = document.createElement("div");
        
        container.classList.add("name-score-container");

        name.classList.add("player-name");
        score.classList.add("player-score");
        
        score.id = "player-score-" + i;
        name.id = "player-name-" + i;
        container.id = "name-score-container-" + i;
        name.innerText = "Player " + (i);
        
        score.innerText = state.scores[i-1] + "points"; //lisab punktid m2ngijale
        
        
        if(i === playerNumber){
            container.classList.add("active-player");
            name.innerText = "You";
            }
        
        container.append(name);
        container.append(score);
        
        gameScreen.append(container)
        if(i === state.currentPlayer){
            name.innerText += " making a move"
        }
    }
    if(state.currentPlayer === playerNumber){
        let name = document.getElementById("player-name-" + playerNumber)
        name.innerText="Your turn!";
        container.classList.remove("active-player");
        name.classList.toggle("your-turn");
        
        const dice = document.createElement("button");//t2ring ilmub aint ss kui selle kliendi kord
        dice.textContent = "DICE";
        dice.id = "dice-0";
        dice.classList.add("dice")
        gameScreen.append(dice);
        
        dice.addEventListener("click", () =>{
            socket.emit("diceClick");
        });

    }

    // attachListeners();
    
}
function attachListeners(){
    document.addEventListener("click", (e) =>{
    if(e.target.id == "dice-0"){
        socket.emit("diceClick");
    }
        
    });
}

function handleInit(number){
    playerNumber = number;
    document.title += "(Plr " + playerNumber + ")";
}
function handleGameCode(gameCode){
    gameCodeDisplay.innerText = gameCode;
}
function handleGameState(gameState){
    if(!gameActive){
        return;
    }
    gameState = JSON.parse(gameState);
    renderGame(gameState);
}
function handleDiceClick(){
    socket.emit("diceClick");
}

function handleGameOver(data){
    if(!gameActive){
        return;
    }
    data = JSON.parse(data);
    
    gameActive = false;
    
    if(data.winner  === playerNumber){
        alert("you win");
    } else {
        alert("you lose");
    }
}
function handleWaitingForPlayers(nrOfJoined){
    let span = document.getElementById("joined-players-nr");
    span.innerText = nrOfJoined;
}

function handleUnknownCode(){
    reset();
    alert("unknown game code")
}
function handleTooManyPlayers(){
    reset();
    alert("This game is already in progress")
}
function reset() {  //Resettib UI, vaja kui pannakse nt vale kood m2ngule mis pole olemas vms
    playerNumber = null;
    gameCodeInput.value = '';
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
  }
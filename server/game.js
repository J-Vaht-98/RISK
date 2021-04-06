module.exports = {
    initGame,
    checkIsWinner,
    moveRollDice,
    endTurn,
}
const { shuffle } = require('./utils');


function initGame(numPlayers,room){
    const state = createGameState(numPlayers,room); 
    return state;
}
function createGameState(numPlayers,room,nicknames){
    //Asjad, mis s6ltuvad m2ngijate arvust
    // console.log("game state created");
    let scores = [];
    let pOrder = [2,3,1];
    
    /***TODO: GENERATE RANDOM PLAY ORDER */
    /**TODO: ADD NICKNAMES U CAN PUT IN AT INITIALIZATION */
    /***TODO: GIVE GAME STARTER A HOW MANY PLRS OPTION (MAX TULEB PAIKA PANNA) */
    /***TODO: winner handling */

    console.log("AAAAAAAAAAAAAAA", pOrder);
    return{
        room:room,
        scores:Array(numPlayers).fill(0),
        playOrder:pOrder,
        dice:[0],
        currentPlayer: pOrder[0],
        numPlayers:numPlayers,
        turn:0,
        winner:false,
        active:true,
    }
}

function checkIsWinner(state){
    if(!state){ //kui state tyhi 2ra tee midagi
        console.log("state on tyhi");
        return;
    }
    if(state.scores[state.currentPlayer] >= 60){
        state.winner = true;
        return state.currentPlayer;
    }
    
}
/********************MOVES**************/

function moveRollDice(state){
  let dice = Math.floor(Math.random() * 7 + 1) //1-6
  state.scores[state.currentPlayer -1] += dice; //lisa vastavasse skooride arraysse saadud punktid
  console.log("Added" + dice  + "to" + (state.currentPlayer-1))
  state.dice[0] = dice;
}

function endTurn(state){
  /*Vahetab currenplayer j2rgmise m2ngija playOrderis vastu*/
  let playerIndexInOrder = getElementIndex(state);
    if(state.currentPlayer == state.playOrder[state.numPlayers-1]){ //kui playorderis viimane,ss j2rgmine on esimene
         state.currentPlayer = state.playOrder[0];
  }else
  {
    state.currentPlayer = state.playOrder[playerIndexInOrder + 1]; //breakpoint.
  }
  state.turn += 1;
  
  /**Siia peaks panema mingi state reset funktsioon, et asjad, nt dice iga k2igu l6pus nulli lyya */
  // state.turn  = state.turn +  1;
}
function getElementIndex(state){
  for(i=0;i<state.numPlayers;i++){
    if(state.playOrder[i] == state.currentPlayer){
      return i;
    }
  }
  console.log("getElementIndex function didnt work");
  return;
}

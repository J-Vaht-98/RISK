module.exports = {
    makeid,
    shuffle,
    bubbleSortAscending
  }
  
  function makeid(length) {
     var result           = '';
     var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     var charactersLength = characters.length;
     for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
  }
   
   function shuffle(array) { // http://stackoverflow.com/questions/962802#962890
   var tmp, current, top = array.len;
   if(top) while(--top) {
      current = Math.floor(Math.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
   }
   return array;
   }
   function bubbleSortAscending(array){
      for(i=0;i<array.length;i++){
        for(j=0;j<array.length-i;j++){
          if(array[i] < array[i+1]){
            temp = array[i];
            array[i] = array[i+1];
            array[i+1] = temp;
          }
        }
      }
      return array;
    }
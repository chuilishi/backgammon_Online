let saveAdvanceColor=0
let divElement
//存放白棋ID数组
let saveWhiteID=[]
//存放黑棋ID数组
let saveBlackID=[]
//对相同棋子的计数 方便判断是否5个
let allCount=0
let player=undefined
var websocket=undefined

//创建棋盘
function createBox() {
  divElement = document.getElementsByClassName('canvas')[0]
  for (let i =0;i<169;i++){
    let element=document.createElement('div')
    element.className="box"
    element.id=i+1
    element.style.border="1px black solid"
    divElement.appendChild(element)
  }
}

//选择先行棋子
function selctAdvanceColor(controlMath) {
  //controlMath 0-白色 1-黑色
  divElement=document.getElementById('checkColor')
  divElement.innerText=controlMath?"黑棋先行":"白棋先行"
  document.getElementsByClassName("blackPut")[0].style.pointerEvents="none"
  document.getElementsByClassName("whitePut")[0].style.pointerEvents="none"
  saveAdvanceColor=controlMath?1:0
}
 
//得到点击DIV周围的DIV数
function satisfyDivArr(id) {
  //左边界
  if (id%13===1)
    return [id-13,id-12,id+1,id+13,id+14]
  //右边距
  if (id%13===0)
    return [id-14,id-13,id-1,id+12,id+13]
  //右边界
  if (id%13!==1&&id%13!==0)
    return [id-14,id-13,id-12,id-1,id+1,id+12,id+13,id+14]
}
 
//对得到的DIV进行过滤过滤
function divArrFilter(id) {
  let divIdArr=satisfyDivArr(id)
  divIdArr=divIdArr.filter(item=>{
    return item>=1&&item<=169
  })
  return divIdArr
}
 
//白色查询
function searchWhite(nextId,controlMath) {
  if (saveWhiteID.includes(nextId)){
    allCount++
    ergodicDirection(nextId,controlMath)
  }
}
//黑色查询
function searchBlack(nextId,controlMath) {
  if (saveBlackID.includes(nextId)){
    allCount++
    ergodicDirection(nextId,controlMath)
  }
}
 
//根据差值选择遍历方向
function ergodicDirection(nextId,controlMath) {
  console.log("NextID:"+nextId)
  nextId=nextId-controlMath
  switch (controlMath) {
    //斜上左
    case 14:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
    //正上方
    case 13:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
    //斜上右
    case 12:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
    //左边
    case 1:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
    //右边
    case -1:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
    //斜向左
    case -12:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
    //正下
    case -13:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
    //斜向右
    default:
      if (saveAdvanceColor){
        searchBlack(nextId,controlMath)
      }else {
        searchWhite(nextId,controlMath)
      }
      break
  }
}
 
//对过滤后的DIV进行遍历判断是否继续判断
function findSameColorID(id) {
  let controlMath
  let divIdArr=divArrFilter(id)
  for (let i of divIdArr){
    if (!saveAdvanceColor){
      //白色
      console.log("白")
      if (saveWhiteID.includes(i)){
        controlMath=id-i
        allCount++
        ergodicDirection(i,controlMath)
        if (allCount+1===5){
          setTimeout(()=>{
            alert("白棋获胜!")
            location.reload()
          },100)
        }
        allCount=0
      }
    }else{
      //黑色
      console.log("黑")
      if (saveBlackID.includes(i)){
        controlMath=id-i
        allCount++
        ergodicDirection(i,controlMath)
        if (allCount+1===5){
          setTimeout(()=>{
            alert("黑棋获胜！")
            location.reload()
          },100)
        }
        allCount=0
      }
    }
  }
}
//悔棋按钮
function repentChess() {
  if(saveAdvanceColor){
    saveAdvanceColor--
    divElement=document.getElementById(saveWhiteID[saveWhiteID.length-1])
    divElement.style.pointerEvents="auto"
    divElement.children[0].remove()
    saveWhiteID.pop()
  }else{
    saveAdvanceColor++
    divElement=document.getElementById(saveBlackID[saveBlackID.length-1])
    divElement.style.pointerEvents="auto"
    divElement.children[0].remove()
    saveBlackID.pop()
  }
}

//重开
function repent() {
  location.reload()
}

//点击改变DIV事件
function checkGrid(id) {
  if (saveAdvanceColor===undefined){
    alert("抱歉，您还未选择先行棋子")
  }else{
    divElement=document.getElementById(id)
    divElement.innerText=""
    findSameColorID(Number(id))
    if (saveAdvanceColor){
      saveAdvanceColor--
      divElement.style.pointerEvents="none"
      divElement.innerHTML="<div class='blackPut'/>"
      saveBlackID.push(Number(id))
    }else{
      saveAdvanceColor++
      divElement.style.pointerEvents="none"
      divElement.innerHTML="<div class='whitePut'/>"
      saveWhiteID.push(Number(id))
    }
  }
}
function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}
function initGame(){
    const params = new URLSearchParams(window.location.search);
    let event = { 
      "type": "init",
      "player": saveAdvanceColor
    };
    if (params.has("join")) {
      // Second player joins an existing game.
      event.join = params.get("join");
    } else if (params.has("watch")) {
      // Spectator watches an existing game.
      event.watch = params.get("watch");
    } else {
      // First player starts a new game.
    }
    websocket.send(JSON.stringify(event));
  };

function sendMoves(websocket,player){
  websocket.addEventListener("click",({target})=>{
    if(target.dataset.id===undefined)return;
    data = {
      "type":"play",
      "player": player,
      "id": target.dataset.id
    }
    websocket.send(JSON.stringify(data))
  })
}

function receiveMoves(websocket){
  websocket.addEventListener("message",({data})=>{
    const event = JSON.parse(data)
    switch (event.type) {
      case "init":
        // Create links for inviting the second player and spectators.
        saveAdvanceColor = "player1"
        document.querySelector(".join").href = "?join=" + event.join;
        document.querySelector(".watch").href = "?watch=" + event.watch;
        break;
      case "play":
        checkGrid(event["id"]);
        selctAdvanceColor(event["player"])
        break;
      case "win":
        showMessage(`Player ${event.player} wins!`);
        // No further messages are expected; close the WebSocket connection.
        websocket.close(1000);
        break;
      case "error":
        showMessage(event.message);
        break;
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  })
}
var t = 0
var textInterval = setInterval(() => {
    if(t==5)t=0
    var points = ".".repeat(t)
    document.getElementById("connectInfo").innerText = "连接服务器中"+points;
    t++
}, 600);
var wsInterval = setInterval(()=>{
  websocket = new WebSocket("ws://localhost:8001");
  websocket.addEventListener("open",()=>{
    clearInterval(textInterval)
    initGame();
    receiveMoves(websocket);
    sendMoves(websocket);
    document.getElementById("connectInfo").innerText = "连接成功,请将下方的链接复制给你的好友进行对局"
    window.setTimeout(() => document.getElementById("connectInfo").innerText = "", 500);
    clearInterval(wsInterval)
  })
},500)
// receiveMoves(websocket);//监听message
// sendMoves(websocket);//监听click,发送
createBox()
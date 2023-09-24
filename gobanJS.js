let saveAdvanceColor = 0
let divElement
//存放白棋ID数组
let saveWhiteID = []
//存放黑棋ID数组
let saveBlackID = []
//对相同棋子的计数 方便判断是否5个
let allCount = 0
let websocket = undefined
let player = undefined
let roomId = ""
let gameStart = false
let ready = false
let Turn = 0

function getRoomId(){
    let params = new URLSearchParams(window.location.search)
    if(params.has("roomId")){
        roomId = params.get("roomId")
    }
}
//创建棋盘
function createBox() {
    divElement = document.getElementsByClassName('canvas')[0]
    for (let i = 0; i < 169; i++) {
        let element = document.createElement('div')
        element.className = "box"
        element.id = i + 1
        element.style.border = "1px black solid"
        element.addEventListener("click",()=>{
            if(gameStart&&Turn==player){
                Turn = 1-Turn
                let event = {
                    "type":"play",
                    "player":player,
                    "id":element.id
                }
                websocket.send(JSON.stringify(event))
            }
        })
        divElement.appendChild(element)
    }
}
//选择先行棋子
function selectAdvanceColor(controlMath) {
    //controlMath 0-白色 1-黑色
    console.log("color="+controlMath)
    divElement = document.getElementById('checkColor')
    divElement.innerText = controlMath ? "执白" : "执黑"
    document.getElementsByClassName("blackPut")[0].style.pointerEvents = "none"
    document.getElementsByClassName("whitePut")[0].style.pointerEvents = "none"
    saveAdvanceColor = controlMath
}

function chooseSide(controlMath) {
    //controlMath 0-白色 1-黑色
    if (websocket !== undefined) {
        let event = {
            "type": "chooseSide",
            "side": controlMath
        }
        websocket.send(JSON.stringify(event))
    }
    else {
        selectAdvanceColor(controlMath)
    }
}
//得到点击DIV周围的DIV数
function satisfyDivArr(id) {
    //左边界
    if (id % 13 === 1)
        return [id - 13, id - 12, id + 1, id + 13, id + 14]
    //右边距
    if (id % 13 === 0)
        return [id - 14, id - 13, id - 1, id + 12, id + 13]
    //右边界
    if (id % 13 !== 1 && id % 13 !== 0)
        return [id - 14, id - 13, id - 12, id - 1, id + 1, id + 12, id + 13, id + 14]
}

//对得到的DIV进行过滤过滤
function divArrFilter(id) {
    let divIdArr = satisfyDivArr(id)
    divIdArr = divIdArr.filter(item => {
        return item >= 1 && item <= 169
    })
    return divIdArr
}

//白色查询
function searchWhite(nextId, controlMath) {
    if (saveWhiteID.includes(nextId)) {
        allCount++
        ergodicDirection(nextId, controlMath)
    }
}

//黑色查询
function searchBlack(nextId, controlMath) {
    if (saveBlackID.includes(nextId)) {
        allCount++
        ergodicDirection(nextId, controlMath)
    }
}

//根据差值选择遍历方向
function ergodicDirection(nextId, controlMath) {
    console.log("NextID:" + nextId)
    nextId = nextId - controlMath
    switch (controlMath) {
        //斜上左
        case 14:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
        //正上方
        case 13:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
        //斜上右
        case 12:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
        //左边
        case 1:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
        //右边
        case -1:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
        //斜向左
        case -12:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
        //正下
        case -13:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
        //斜向右
        default:
            if (saveAdvanceColor) {
                searchBlack(nextId, controlMath)
            } else {
                searchWhite(nextId, controlMath)
            }
            break
    }
}

//对过滤后的DIV进行遍历判断是否继续判断
function findSameColorID(id) {
    let controlMath
    let divIdArr = divArrFilter(id)
    for (let i of divIdArr) {
        if (!saveAdvanceColor) {
            //白色
            console.log("白")
            if (saveWhiteID.includes(i)) {
                controlMath = id - i
                allCount++
                ergodicDirection(i, controlMath)
                if (allCount + 1 === 5) {
                    setTimeout(() => {
                        alert("白棋获胜!")
                        location.reload()
                    }, 100)
                }
                allCount = 0
            }
        } else {
            //黑色
            console.log("黑")
            if (saveBlackID.includes(i)) {
                controlMath = id - i
                allCount++
                ergodicDirection(i, controlMath)
                if (allCount + 1 === 5) {
                    setTimeout(() => {
                        alert("黑棋获胜！")
                        location.reload()
                    }, 100)
                }
                allCount = 0
            }
        }
    }
}

// //悔棋按钮
// function repentChess() {
//     if (saveAdvanceColor) {
//         saveAdvanceColor--
//         divElement = document.getElementById(saveWhiteID[saveWhiteID.length - 1])
//         divElement.style.pointerEvents = "auto"
//         divElement.children[0].remove()
//         saveWhiteID.pop()
//     } else {
//         saveAdvanceColor++
//         divElement = document.getElementById(saveBlackID[saveBlackID.length - 1])
//         divElement.style.pointerEvents = "auto"
//         divElement.children[0].remove()
//         saveBlackID.pop()
//     }
// }
//
// //重开
// function repent() {
//     location.reload()
// }

//点击改变DIV事件
function checkGrid(id,turn) {
    if (turn === undefined) {
        alert("抱歉，您还未选择先行棋子")
    } else {
        turn = parseInt(turn)
        divElement = document.getElementById(id)
        divElement.innerText = ""
        findSameColorID(Number(id))
        if (turn) {
            divElement.style.pointerEvents = "none"
            divElement.innerHTML = "<div class='blackPut'/>"
            saveBlackID.push(Number(id))
        } else {
            divElement.style.pointerEvents = "none"
            divElement.innerHTML = "<div class='whitePut'/>"
            saveWhiteID.push(Number(id))
        }
    }
}

function showMessage(message) {
    window.setTimeout(() => window.alert(message), 50);
}
function sendMoves(websocket, player) {
    websocket.addEventListener("click", ({ target }) => {
        if (target.dataset.id === undefined) return;
        data = {
            "type": "play",
            "player": player,
            "id": target.dataset.id
        }
        websocket.send(JSON.stringify(data))
    })
}
function messageHandler(websocket) {
    websocket.addEventListener("message", ({ data }) => {
        let event = JSON.parse(data)
        console.log(event)
        switch (event["type"]) {
            case "init":
                console.log(event.player)
                if(player===undefined){
                    console.log(event["player"])
                    player = event["player"]
                    if(player=="1"){
                        document.getElementById("state").innerText = "对方未准备"
                    }
                    document.querySelector(".join").href = "?roomId=" + event["roomId"]
                    roomId = event["roomId"]
                    selectAdvanceColor(parseInt(event["player"]))
                }
                else{
                    document.getElementById("state").innerText = "对方未准备"
                }
                break
            case "start":
                if(event["player"]!=player){
                    if(ready){
                        document.getElementById("connectInfo").innerText = "游戏开始"
                        setTimeout(()=>{
                            document.getElementById("connectInfo").display = "none"
                        },2000)
                        document.getElementById("state").innerText = "正在游戏中"
                        gameStart = true
                        break
                    }
                    else{
                        ready = true
                        document.getElementById("state").innerText = "对方已准备"
                    }
                }
                break
            case "play":
                checkGrid(event["id"],parseInt(event["player"]));
                break;
            case "win":
                selectAdvanceColor()
                showMessage(`Player ${event.player} wins!`);
                document.getElementById("state").innerText = "对方未准备"
                websocket.close(1000);
                break;
            case "error":
                showMessage(event.message);
                break
            case "test":
                console.log("test")
                break
            case "chooseSide":
                if(event["player"]!=player&&event["side"]!=saveAdvanceColor)break
                if(event["player"]==player&&event["side"]==saveAdvanceColor)break
                let isAgree = prompt("对方请求换边,同意点击确认,不同意点击取消")
                if (isAgree === true) {
                    selectAdvanceColor(1-parseInt(saveAdvanceColor))
                    let event = {
                        "type": "chooseSide",
                        "player": player,
                        "side": saveAdvanceColor
                    }
                    websocket.send(event)
                }
                break
            default:
                throw new Error(`Unsupported event type: ${event.type}.`);
        }
    })
}

function closeHandler(websocket){
    addEventListener("close",(data)=>{
        alert('Onclose called' + JSON.stringify(data));
    })
}
function connect(textInterval){
    if(websocket!==undefined&&websocket.readyState === 1){
        return
    }
    websocket = new WebSocket("ws://localhost:8001");
        websocket.addEventListener("error",()=>{
        setTimeout(connect(textInterval),2000)
    })
    websocket.addEventListener("open", () => {
        clearInterval(textInterval)
        init(websocket)
        messageHandler(websocket);//监听message
        sendMoves(websocket);//监听moves
        closeHandler(websocket);
        document.getElementById("connectInfo").innerText = "连接成功,请将房间链接复制给好友进行对局"
    });
}
function init(websocket) {
    let event = {
        "type": "init",
        "roomId": roomId
    }
    websocket.send(JSON.stringify(event))
}
function start(){
    if(gameStart)return
    if(ready){
        document.getElementById("connectInfo").innerText = "游戏开始"
        setTimeout(()=>{
            document.getElementById("connectInfo").display = "none"
        },2000)
        document.getElementById("state").innerText = "正在游戏中"
        gameStart = true
    }
    else{
        ready = true
    }
    let event = {
        "type":"start",
        "player":player
    }
    websocket.send(JSON.stringify(event))
}
getRoomId()
createBox()
let t = 0
let textInterval = setInterval(() => {
    if (t == 5) t = 0
    let points = ".".repeat(t)
    document.getElementById("connectInfo").innerText = "连接服务器中" + points;
    t++
}, 600);
connect(textInterval)
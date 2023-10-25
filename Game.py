'''

type ""
player 0/1

init

ready

replay
reconnected
'''

import json
import secrets
from enum import Enum
from typing import List
from typing import Dict

from websockets.legacy.client import WebSocketClientProtocol as Client
from websockets.legacy.protocol import broadcast
from websockets.sync.server import serve
from websockets.server import ServerConnection
# import websockets
# 游戏流程
from Player import Player

def message(_type, _player:int = None, data: tuple[str, str] =None):
    _event = {
        "type": _type,
    }
    if _player is not None:
        _event["player"] = _player
    if data is not None:
        with _event:
            try:
                _event[data[0]] = data[1]
            except:
                print("不合法数据")
    return json.dumps(_event)


class Game:
    def __init__(self,websocket:ServerConnection):
        self.moves:List[(int,int)] = []
        self.connected :List = [websocket]
        self.gridSize = 13
        self.grid:List = [[0 for i in range(self.gridSize)] for j in range(self.gridSize)]
        self.roomId = ""
        self.curPlayer = 0
        self._player1Enter = False
        self._player2Enter = False
        self._player1Ready = False
        self._player2Ready = False

    def checkLength(self,x,y,_length,direction:tuple[int,int]):
        if x != -direction[0] or y != -direction[1]:
            return _length
        if x<0 or y<0 or x>self.gridSize or y>self.gridSize:
            return _length
        if self.grid[x][y] is 0:
            return _length
        ans = _length
        if _length == 0:
            ans = max(self.checkLength(x + 1, y, _length+1, (1,0)), ans)
            ans = max(self.checkLength(x + 1, y + 1, _length+1, (1,1)), ans)
            ans = max(self.checkLength(x + 1, y - 1, _length+1, (1,-1)), ans)
            ans = max(self.checkLength(x, y + 1, _length+1, (0,1)), ans)
            ans = max(self.checkLength(x, y - 1, _length+1, (0,-1)), ans)
            ans = max(self.checkLength(x - 1, y + 1, _length+1, (-1,1)), ans)
            ans = max(self.checkLength(x - 1, y, _length+1, (-1,0)), ans)
            ans = max(self.checkLength(x - 1, y - 1, _length+1, (-1,-1)), ans)
        else :
            return self.checkLength(x+direction[0],y+direction[1],_length+1,direction)
        return ans
    def play(self, player:int, _id:int):
        self.moves.append((player,_id))
        x = _id//14
        y = _id%14
        self.grid[x][y] = 1
        self.curPlayer = player
        if self.checkLength(x,y,1,(0,0)) is 5:
            self.OnGameOver(player)
    def OnInit(self,player):
        if player == 0:
            broadcast(self.connected,message("init",player,("roomId",secrets.token_urlsafe(12))))
        elif player == 1:
            broadcast(self.connected, message("init", player, ("roomId", )))
    def OnReady(self,player:int):
        if self._player1Ready and self._player2Ready:
            self.OnGameStarted()
        else:
            broadcast(self.connected, message("ready", player))
    def OnGameStarted(self):
        broadcast(self.connected,message("start"))
    def OnChooseSide(self, player:int,side:int):
        broadcast(self.connected,message("changeSide",player,("side",str(side))))
    def OnPlay(self, player:int, _id:int):
        if player != self.curPlayer:
            return
        self.play(player,_id)
        broadcast(self.connected,message("play",player,("id",str(_id))))
    def OnReconnected(self, player:int):
        broadcast(self.connected,message("reConnected",player))
    def OnGameOver(self,player:int):
        self._player1Ready = False
        self._player2Ready = False
        self.moves.clear()
        broadcast(self.connected,message("win",player))

    def replay(self,websocket:Client):
        websocket.send("replay")
        for player, _id in self.moves.copy():
            websocket.send(message("play",player,data=("id",_id)))

# 每个玩家的长连接server
    async def server(self,websocket):
        player = len(self.connected)
        if player>=2:
            self.replay(websocket)
        self.connected.append(websocket)
        async for _rawMessage in websocket:
            _message = json.loads(_rawMessage)
            if _message.get("type") is "changeSide":
                self.OnChooseSide(player,_message.get("side"))
            elif _message.get("type") is "reconnected":
                self.OnReconnected(player)
            elif _message.get("type") is "win":
                self.OnGameOver(player)
            elif _message.get("type") is "ready":
                self.OnReady(player)
            elif _message.get("type") is "play":
                self.OnPlay(player, _message.get("id"))
            elif _message.get("type") is "init":
                self.OnInit(player)

games:Dict[str,Game] = {}
# 接收连接,对两个websocket分别建立两个长连接,根据
async def main():
    serve(Handler,"localhost",8888)

async def Handler(websocket:ServerConnection):
    _rawMessage = await websocket.recv()
    _message = json.loads(_rawMessage)
    if _message.get("type") is "init":
        if _message.get("id") is not None:
            await games[_message.get("id")].server(websocket)
        else:
            games[secrets.token_urlsafe(12)] = Game(websocket)
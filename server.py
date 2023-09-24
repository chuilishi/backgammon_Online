#!/usr/bin/env python

import asyncio
import json
import secrets
import time

import websockets
from Game import Game
from Game import GameState
from typing import Dict
games :Dict[str,Game] = {}

def printConnect(websocket):
    print(f"State: {websocket.state}")
    print(f"Is open?: {websocket.open}")
    print(f"Is closed?: {websocket.closed}")
    print(f"Close code: {websocket.close_code}")
    print(f"Close reason: {websocket.close_reason}")


async def error(websocket, message):
    event = {
        "type": "error",
        "message": message,
    }
    await websocket.send(json.dumps(event))
async def replay(websocket, game):
    for player, id in game.moves.copy():
        event = {
            "type": "play",
            "player": player,
            "id":id
        }
        await websocket.send(json.dumps(event))
async def win(roomId:str,player):
    game = games[roomId]
    event = {
        "type":"win",
        "player":player
    }
    websockets.broadcast(set(game.connected),json.dumps(event))
    game.state = GameState.WaitForBegin
    game.clear()

async def play(websocket, roomId, player):
    game = games[roomId]
    event = {
        "type": "init",
        "roomId":roomId,
        "player": player
    }
    websockets.broadcast(game.connected,json.dumps(event))
    async for message in websocket:
        event = json.loads(message)
        if event.get("type")=="play":
            if event.get("win") is not None:
                await win(roomId,event.get("win"))
                return
            print(event)
            _id = event.get("id")
            event = {
                "type":"play",
                "player":player,
                "id": _id
            }
            websockets.broadcast(set(game.connected),json.dumps(event))
            try:
                game.play(player, _id)
            except RuntimeError as exc:
                await error(websocket, str(exc))
                continue

            event = {
                "type": "play",
                "player": player,
                "id": _id
            }
            websockets.broadcast(set(game.connected), json.dumps(event))
        elif event.get("type")== "chooseSide":
            websockets.broadcast(set(game.connected), json.dumps(event))
        elif event.get("type")== "start":
            if game.ready is True:
                websockets.broadcast(set(game.connected), json.dumps(event))
                game.ready = False
            else:
                game.ready = True
                event = {
                    "type":"start",
                    "player":player
                }
                websockets.broadcast(set(game.connected), json.dumps(event))

async def watch(websocket,game:Game):
    await replay(websocket, game)

async def handler(websocket):
    print("连接")
    try:
        message = await websocket.recv()
        event = json.loads(message)
        print(event)
        if event.get("roomId") != "":
            game = games[event.get("roomId")]
            game.connected.append(websocket)
            if game.state == GameState.WaitForPlayer:
                game.state = GameState.WaitForBegin
                await play(websocket, game.roomId, 1)
        else:
            print("玩家1")
            game = Game()
            game.roomId = secrets.token_urlsafe(12)
            game.connected = [websocket]
            games[game.roomId] = game
            await play(websocket, game.roomId, 0)
    except websockets.ConnectionClosedOK as e:
        print(str(e))
    except Exception as e:
        print(str(e))
        await error(websocket,str(e))

async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python

import asyncio
import json
import secrets
import websockets

player1 = None
player2 = None

JOIN = {}
WATCH = {}

class Board:
    def __init__(self):
        self.saveWhiteID = []
        self.saveBlackID = []
        self.moves = []
        self.player = 0
    def play(self,player,id):
        if(self.player!=player):
            raise RuntimeError("不是你的回合")
        self.moves.append((player,id))
        self.player = 0 if self.player==1 else 1

    def clear(self):
        self.moves.clear()

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


async def play(websocket, game, player, connected):
    async for message in websocket:
        event = json.loads(message)
        assert event["type"] == "play"
        id = event["id"]
        try:
            game.play(player, id)
        except RuntimeError as exc:
            await error(websocket, str(exc))
            continue

        # Send a "play" event to update the UI.
        event = {
            "type": "play",
            "player": player,
            "id": id
        }
        websockets.broadcast(connected, json.dumps(event))
        # If move is winning, send a "win" event.
        if game.winner is not None:
            event = {
                "type": "win",
                "player": game.winner,
            }
            websockets.broadcast(connected, json.dumps(event))


async def start(websocket,player):
    print("start")
    global player1
    global player2
    game = Board()
    connected = {websocket}

    join_key = secrets.token_urlsafe(12)
    JOIN[join_key] = game, connected

    watch_key = secrets.token_urlsafe(12)
    WATCH[watch_key] = game, connected

    player1 = player
    player2 = 0 if player1==1 else 1

    try:
        event = {
            "type": "init",
            "join": join_key,
            "watch": watch_key,
        }
        await websocket.send(json.dumps(event))
        await play(websocket, game, player1, connected)
    finally:
        del JOIN[join_key]
        del WATCH[watch_key]

async def join(websocket, join_key):
    print("join")
    try:
        game, connected = JOIN[join_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        # Send the first move, in case the first player already played it.
        await replay(websocket, game)
        # Receive and process moves from the second player.
        await play(websocket, game, player2, connected)
    finally:
        connected.remove(websocket)


async def watch(websocket, watch_key):
    """
    Handle a connection from a spectator: watch an existing game.

    """
    # Find the Connect Four game.
    try:
        game, connected = WATCH[watch_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        # Send previous moves, in case the game already started.
        await replay(websocket, game)
        # Keep the connection open, but don't receive any messages.
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)


async def handler(websocket):
    print("连接")
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init"
    if "join" in event:
        # Second player joins an existing game.
        await join(websocket, event["join"])
    elif "watch" in event:
        # Spectator watches an existing game.
        await watch(websocket, event["watch"])
    else:
        # First player starts a new game.
        await start(websocket,event["player"])


async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
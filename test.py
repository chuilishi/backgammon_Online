import websockets
import asyncio
async def test(websocket):
    async for message in websocket:
        print(message)

async def main():
    async with websockets.serve(test, "",9000):
        await asyncio.Future()
asyncio.run(main())
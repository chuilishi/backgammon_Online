from enum import Enum
from typing import List
class GameState(Enum):
    WaitForPlayer = 0
    WaitForBegin = 1
    HasBegin = 2

class Game:
    def __init__(self):
        self.moves = []
        self.connected :List = []
        self.roomId = ""
        self.curSide = 0
        self.state = GameState.WaitForPlayer
        self.ready = False
    def play(self, player, _id):
        self.moves.append((player, _id))
    def clear(self):
        self.moves.clear()
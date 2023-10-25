class Player:
    def __init__(self,websocket,side:int):
        self.websocket = websocket
        self.ready = False
        self.side = side
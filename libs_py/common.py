import time
import math
import random

WHITE   = 0xffffff
BLACK   = 0x000000
RED     = 0xff0000
GREEN   = 0x00ff00
BLUE    = 0x0000ff
GRAY    = 0x454545
YELLOW  = 0xFFFF00
# YELLOW  = (255, 255,   0)
# MAGENTA = (255,   0, 255)
# CYAN    = (  0, 255, 255)

def is_list(obj):
    return hasattr(obj,'data')
def randf(min,max):
    return random.uniform(min,max)
def randi(min,max):
    return random.randrange(math.floor(min),math.floor(max))
def pick(seq):
    if is_list(seq):
        return random.choice(seq.data)
    return random.choice(seq)
def lerp(t,min,max):
    return ((max-min)*t) + min
def remap(val, min,max, MIN, MAX):
    t = (val - min) / (max - min)
    return ((MAX - MIN)*t) + MIN



class Obj:
    def __init__(self):
        pass

def remap(val, min, max, MIN, MAX):
    t = (val - min) / (max - min)
    return ((MAX - MIN) * t) + MIN


def sine1(v):
    return remap(math.sin(v), -1, 1, 0,1)

def floor(v):
    return math.floor(v)

class System:
    time = 0
    startTime = 0
    currentTime = 0
    def __init__(self):
        self.time = 0
        self.startTime = time.monotonic()
        self.currentTime = time.monotonic
    def update(self):
        self.currentTime = time.monotonic()
        self.time = self.currentTime - self.startTime


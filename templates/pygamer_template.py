import time
import board
import displayio
from digitalio import DigitalInOut, Pull
from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE
from lists import equals
from pygamer import Canvas, DPadWrapper
import terminalio
from adafruit_display_text import label
from pygamer import PygamerDevice
from lists import add

# pygamer already has variables for joystick_x, joystick_y, and buttons
# pygamer already has a pixels variable

device = PygamerDevice(board)

${BOARD_IMPORTS}

tm = TaskMaster()
system = System()

${USER_VARIABLES}
${USER_FUNCTIONS}

tm.start()
while True:
    system.update()
    device.update()
    tm.cycle(0.01)

print("pygamer end everything")

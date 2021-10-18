import time
import board
import neopixel
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.mouse import Mouse
import usb_hid
import touchio

from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE
from trinkey import TrinkeyDevice

${BOARD_IMPORTS}

tm = TaskMaster()
system = System()
device = TrinkeyDevice(board)

${USER_VARIABLES}
${USER_FUNCTIONS}

tm.start()
while True:
    system.update()
    device.update()
    tm.cycle(0.01)

print("end everything")

import time
import board
import neopixel
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.mouse import Mouse
import usb_hid
import adafruit_trellism4
from adafruit_hid.consumer_control_code import ConsumerControlCode

from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE, YELLOW
from lists import equals, _and, add, subtract, lessthan, greaterthan, listrange, is_true
from trellis import TrellisDevice

${BOARD_IMPORTS}

tm = TaskMaster()
system = System()
trellis = adafruit_trellism4.TrellisM4Express(rotation=0)
device = TrellisDevice(trellis)

${USER_VARIABLES}
${USER_FUNCTIONS}

tm.start()
while True:
    system.update()
    device.update()
    tm.cycle(0.01)

print("end everything")

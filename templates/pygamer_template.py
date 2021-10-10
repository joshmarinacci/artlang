import time
import board
import neopixel
import displayio
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.mouse import Mouse
import usb_hid
from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE
from pygamer import Canvas


print(board)
# pygamer already has

${BOARD_IMPORTS}

tm = TaskMaster()

screen = Canvas(0,0,160,128)
system = System()
g = displayio.Group()
g.append(screen)

${USER_VARIABLES}
${USER_FUNCTIONS}

board.DISPLAY.show(g)
# board.DISPLAY.auto_refresh = True

# up_key = repeat.KeyRepeat(lambda: joystick.up, rate=0.2)
# down_key = repeat.KeyRepeat(lambda: joystick.down, rate=0.2)
# left_key = repeat.KeyRepeat(lambda: joystick.left, rate=0.2)
# right_key = repeat.KeyRepeat(lambda: joystick.right, rate=0.2)
# buttons = gamepadshift.GamePadShift(digitalio.DigitalInOut(board.BUTTON_CLOCK),

# BUTTON_SEL = const(8)
# BUTTON_START = const(4)
# BUTTON_A = const(2)
# BUTTON_B = const(1)

#joystick = analogjoy.AnalogJoystick()

tm.start()
while True:
    system.update()
    tm.cycle(0.01)

print("pygamer end everything")

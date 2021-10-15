import time
import board
import neopixel
import displayio
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
import analogio
from adafruit_hid.mouse import Mouse
import usb_hid
import keypad
from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE
from lists import equals
from pygamer import Canvas, DPadWrapper
import terminalio
from adafruit_display_text import label



# pygamer already has variables for joystick_x, joystick_y, and buttons
# pygamer already has a pixels variable
joystick_x = analogio.AnalogIn(board.JOYSTICK_X)
joystick_y = analogio.AnalogIn(board.JOYSTICK_Y)

dpad = DPadWrapper(joystick_x, joystick_y)

pixels = neopixel.NeoPixel(board.NEOPIXEL, 5, auto_write=False)
display = board.DISPLAY

buttons = keypad.ShiftRegisterKeys(
    clock = board.BUTTON_CLOCK,
    data  = board.BUTTON_OUT,
    latch = board.BUTTON_LATCH,
    key_count = 4,
    value_when_pressed = True,
    )

# get width with board.DISPLAY.width
# get height with board.DISPLAY.height
print("width is",board.DISPLAY.width)
print("width is",board.DISPLAY.height)

# get joystick_x
print(joystick_x.value)
print(joystick_y.value)

# get next event by looking at pad.events.get()
#    event = pad.events.get()
#    if event:
#        print("event happened", event.key_number, event.pressed, event.released)

${BOARD_IMPORTS}

tm = TaskMaster()

screen = Canvas(0,0,160,128)
system = System()
g = displayio.Group()
g.append(screen)

${USER_VARIABLES}
${USER_FUNCTIONS}

board.DISPLAY.show(g)

tm.start()
while True:
    system.update()
    dpad.update()
    board.DISPLAY.show(g)
    tm.cycle(0.01)

print("pygamer end everything")

import usb_hid
import neopixel
import usb_hid
import touchio

from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_hid.mouse import Mouse

class TrinkeyDevice():
    def __init__(self, board):
        self.mouse = Mouse(usb_hid.devices)
        self.keyboard = Keyboard(usb_hid.devices)
        self.led = neopixel.NeoPixel(board.NEOPIXEL,1)
        self.pin = DigitalInOut(board.SWITCH)
        self.pin.pull = Pull.DOWN
        self.button = Debouncer(self.pin)
        print("setup trinkey")

    def update(self):
        self.button.update()

import math
import time
import displayio
import neopixel
import analogio
import bitmaptools
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
import adafruit_fancyled.adafruit_fancyled as fancy
from adafruit_hid.mouse import Mouse
import usb_hid
import keypad

from common import BLACK, WHITE, RED, BLUE, GREEN, GRAY
from lists import List

class Canvas(displayio.TileGrid):
    w = 10
    h = 10
    def __init__(self,x,y,w,h):
        #print("making a canvas",x,y,w,h)
        self.w = w
        self.h = h
        self.pal = [0,
        WHITE,
        0xffff00,
        0xff6500,
        RED,
        0xff0097,
        0x360097,
        0x0000ca,
        #0x0097ff,
        BLUE,
        #0x00a800,
        GREEN,
        0x006500,
        0x976536,
        0xb9b9b9,
        0x868686,
        #0x454545,
        GRAY,
        BLACK]

        colors = len(self.pal)
        self._palette = displayio.Palette(colors)
        self._palette.make_transparent(0)

        for n, color in enumerate(self.pal):
            self._palette[n] = color

        self._bitmap = displayio.Bitmap(w, h, colors)
        self.fill(BLACK)
        super().__init__(self._bitmap, pixel_shader=self._palette, x=x, y=y)

    def get_width(self):
        return self._bitmap.width
    width = property(get_width)
    def get_height(self):
        return self._bitmap.height
    height = property(get_height)
    def get_size(self):
        return List(self.width,self.height)
    size = property(get_size)

    def fill(self, col):
        c = self.pal.index(col)
        bitmaptools.fill_region(self._bitmap, 0, 0, self.w,self.h, c)

    def setPixel(self, xy, col):
        c = self.pal.index(col)
        x = math.floor(xy.get1(0))
        y = math.floor(xy.get1(1))
        self._bitmap[x,y] = c

    def fillRect(self,rect,col):
        c = self.pal.index(col)
        x1 = math.floor(rect.x1)
        x2 = math.floor(rect.x2)
        y1 = math.floor(rect.y1)
        y2 = math.floor(rect.y2)
        bitmaptools.fill_region(self._bitmap, x1, x2, y2,y2, c)



class DPadWrapper:
    x = 0
    y = 0
    xv = 0
    yv = 0
    def __init__(self,x,y):
        self.x = x
        self.y = y
        self.xv = 0
    def update(self):
        self.xv = round(((self.x.value * 10 / 65536) - 5)/5)
        self.yv = round(((self.y.value * 10 / 65536) - 5)/5)



class ButtonsWrapper():
    current_press = set()
    pressed = set()
    pressed_list = List()

    def __init__(self, board):
        self.buttons = keypad.ShiftRegisterKeys(
            clock = board.BUTTON_CLOCK,
            data  = board.BUTTON_OUT,
            latch = board.BUTTON_LATCH,
            key_count = 4,
            value_when_pressed = True,
            )

    def update(self):
        self.pressed_list = List()
        event = self.buttons.events.get()
        if event and event.pressed:
            self.pressed_list.append(event.key_number)
        #                 event = self.buttons.events.get()
        #                 if event:
        #                     print("event happened", event.key_number, event.pressed, event.released)
#         for item in just_pressed:
#             self.pressed_list.append(List(item[0],item[1]))

class PygamerDevice():
    def __init__(self, board):
        self.board = board
        joystick_x = analogio.AnalogIn(board.JOYSTICK_X)
        joystick_y = analogio.AnalogIn(board.JOYSTICK_Y)
        self.dpad = DPadWrapper(joystick_x, joystick_y)
        self.pixels = neopixel.NeoPixel(board.NEOPIXEL, 5, auto_write=False)
        self.display = board.DISPLAY
        self.mouse = Mouse(usb_hid.devices)
        self.keyboard = Keyboard(usb_hid.devices)
        self.g = displayio.Group()
        self.screen = Canvas(0,0,160,128)
        self.g.append(self.screen)
        self.buttons = ButtonsWrapper(board)
        self.display.show(self.g)

    def update(self):
        self.buttons.update()
        self.dpad.update()

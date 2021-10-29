from lists import List
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_hid.mouse import Mouse
from adafruit_hid.consumer_control import ConsumerControl
from adafruit_hid.consumer_control_code import ConsumerControlCode
import adafruit_fancyled.adafruit_fancyled as fancy

def KeyColor(r=0.0, g=0.0, b=0.0, hue=0.0, sat=0.0, lit=0.0):
    print("using",r,g,b)
    if r>0 or b>0 or g>0:
        return fancy.CRGB(float(r), float(g), float(b)).pack()
    if hue>0 or sat>0 or lit>0:
        return fancy.CHSV(hue, sat,lit).pack()
    print("didn't specify correct values")
    return 0xFF8800

class LEDsWrapper():
    trellis = 0
    def __init__(self, trellis):
        self.trellis = trellis

    def fill(self, color):
        self.trellis.pixels.fill(color)
    def set(self, coords, color):
        if type(coords) == tuple:
            self.trellis.pixels[coords] = color
        else:
            x = coords.get1(0)
            y = coords.get1(1)
            self.trellis.pixels[(x,y)] = color


class ButtonsWrapper():
    current_press = set()
    pressed = set()
    pressed_list = List()

    def __init__(self, trellis):
        self.trellis = trellis

    def update(self):
        self.current_press = self.pressed
        self.pressed = set(self.trellis.pressed_keys)
        just_pressed = self.pressed - self.current_press
        #just_released = current_press - pressed
        self.pressed_list = List()
        for item in just_pressed:
            self.pressed_list.append(List(item[0],item[1]))


class TrellisDevice():
    def __init__(self, trellis):
        self.leds = LEDsWrapper(trellis)
        self.buttons = ButtonsWrapper(trellis)
        self.mouse = Mouse(usb_hid.devices)
        self.keyboard = Keyboard(usb_hid.devices)
        self.cc = ConsumerControl(usb_hid.devices)
    def update(self):
        self.buttons.update()

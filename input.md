The APIs for input should be both flexible to handle different hardware, and 
also consistent so you don't have to learn lots of different things.

Sometimes you want an event form where your function is called when an event happens
other times you want to just loop over the inputs and check if they have had changes.

You should never need to manage state. you shouldn't have to track that a button was 
pressed down and then released and do the debouncing. that should be handled for you.
You should never need to allocate buttons. They are built into the system so they should
already exist for you to use.

# inputs:

* single buttons (trinkey, pygamer, matrix)
* dpad and apad (pygamer)
* set of buttons (trellis)

for single buttons you can add an event handler in the setup like this:

```javascript
function setup() {
premade_button.on("click",() => {
    print("the only button was clicked")
})
}
```

or else

```javascript
@event(premade_button,'click',my_handler)
function my_handler() {
    print("the only button was clicked")
}
```

or else

```javascript
@loop(myloop)
function myloop() {
    if(premade_button.clicked) {
        
    }
}
```


the event handler works for single buttons, but doesn't scale as well to multiple buttons or grids
and dpads.  For now let's use the third form (loop checking the state) for all cases. Make the syntax
easy to use, though.


button.clicked, .pressed, .fell


the prefab objects should have common names. if there is only one button it should be called button.

These should all be on an object called device.


## trinkey
device.button
device.led
device.mouse
device.keyboard

## pygamer
device.
    dpad_joystick
    select_button
    start_button
    a_button
    b_button
    screen
device.mouse
device.keyboard

## matrix
device
    .button1
    .button2
    .button3
    .screen
device.mouse
device.keyboard

## trellis
device
    .leds
    .buttons
    


So the macro keypad example on the neo-trellis could be:

```
fun loop() {
    device.buttons.pressed_list.each(@(pos) => {
        if(pos[0] == 0) {
            if pos[1] == 0 toggle_mode("mouse")
            if pos[1] == 1 toggle_mode("ekey")
            if pos[1] == 2 toggle_mode("skey")
        }
    })
}
fun reset_leds() {
    device.leds.set([0,0],RED)
    device.leds.set([0,1],GREEN)
    device.leds.set([0,2],BLUE)
}
```

And the trinkey would be

```
@board("trinkey")
var go = false

@type("start",setup)
fun setup() {
    device.led.fill(BLUE)
}

@type("loop",loop2)
fun loop2() {
    if (device.button.clicked) {
        go = not go
    }
    if go device.led.fill(GREEN)
    if not go device.led.fill(BLUE)
}

@type("loop",loop)
fun loop() {
    if(go) {
        device.mouse.press(Mouse.LEFT_BUTTON)
        device.led.fill(RED)
        wait(2)
        device.mouse.release_all()
        device.led.fill(GREEN)
        wait(2)
    }
}
```


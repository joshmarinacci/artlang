# ART lang docs
So this is a language made for making art.
It will compile the art lang into javscript then run it in the browser.
It can also compile it to curcuit puthon for a nwo trelis rgb matrics trinkey or even a pygamer
It's still in the works it is just basics right now but it is compleatly open source so you can dablle in what ever you want.
# AutoKey language features

It should be possible to write code without using the shift key or caps lock
you should be able to write with just a text editor, not an IDE.

* start with a simple version that can be translated directly to javascript.
* liberal use of lambdas. ignore types, ignore most of the syntax sugar
* convert boolean ops like - and * into functions that can handle lists correctly
* builtins for
    * Rect
    * Vector
    * Point
    * Screen
* common functions
    * range
    * every
    * map
    * wrap
    * clamp
    * ?i randi
    * ?f randf
* primitives:
  integer
  float
  boolean
  string using single quotes ''
* no syntax for lists or objects yet. do it manually through function calls
* make lots of unit tests
  * pass if parsing works
  * pass if evaluates to the right answer

* add sugar for pipeline operator. implement it by rewriting the AST
* add sugar for - and + by rewriting the AST. start with the actual function names
* add a pretty printer which uses glyphs for things like theta and random
* all functions can have keyword arguments



# ============ the basics =============== #

// make a color
```javascript
test('Color(0,0,0)', [0,0,0])
```

```javascript
// add four and five
test('add(4,5)',9)
// loop ten times
test(`range(10).forEach(()=>{ print("hello") })`,"")
//
```

```javascript
let prelude = `
black = [0,0,0]
red = [1,0,0]
...
palette = [black, red,green,blue,cyan,yellow,purple,white]
function MakeDot() {
let dot = MakeObject()
dot.xy = Point(randi(0,screen.width), randi(0,1))
dot.v =  Vector(randf(-0.1,0.1), randf(0.5,1.5))
dot.color = chooseIndex(palette)
}
dots = range(20).map(()=>MakeDot())
dots[0].xy = Point(1,2)
dots[0].v = Vector(1,2)
`
test(prelude,'dots.length == 20',true)
test(prelude,'palette.get(2)`,[0,1,0])
test(prelude,'dots.get(0).xy`,[1,2])
test(prelude,'add(dots.get(0).xy,dots.get(0).v)',[2,4])
```


# Types

you can define custom objects or 'classes'

```
type Rect {
    x:0
    y:0
    xy <= [self.x, self.y]
    w:0
    h:0
    size <= [self.w, self.h]
    wc <= (self.x + self.w)/2  # Width Center
    hc <= (self.y + self.h)/2  # Height Center
    left: _.x
    right: <= (_.x + _.w)
    top: _.y
    bottom: <= (_.y + _.h)
    center <= [_.wcenter, _.hcenter]
    split: @(sw,sh) {
        # the code to do the actual splitting
        # returns four new rects
    }
}
```
* The art lang can make rects cirle's , colors and hues. Hear is a example

```javascript
@board('canvas')

let rects
let WIDTH = 800
let LENGTH = 800
let WIDTH2 = 300
screen = new KCanvas(0,0,WIDTH,LENGTH)

@type("start",setup)
fun setup() {
    rects = range(screen.top,screen.bottom,30).map((i)=> {
        let r = Rect(y:i, w:randf(200,700), h:20)
        let v = screen.width - r.w
        r.x = v/2
        r.hue = randf(0,0.2)
        r
    })
}

@type("loop",loop)
fun loop() {
    rects.every((rect) => {
        rect.hue = wrap(rect.hue + 0.004,0,1)
        rect.color = KeyColor(hue:rect.hue, sat:0.6, lit:0.5)
        screen.fillRect(rect,rect.color)
    })
}
```
This will make rects of diferent width and change the color's.


# Rect Line code
```javascript
@board('canvas')
let line
line = [[10,100], [100,100]] 
var rects
@type("start",setup)

fun setup() {
screen = new KCanvas(0,0,500,500)
screen.drawPolyLine(line,BLACK)
screen.strokeRect(rect,BLACK)
}

```
* This code will make a canavas and make a streight line on it is just a example to build on.
# Neo trelis
This code is for the trellis rgb button for the colors
 ```javascript
 @board("trellis")

 print("yo")
 //var rand = makeRandom()
 @type("start",setup)
 fun setup() {
     print("in the setup")
     //setup standard trellis canvas and button grid
     //clear to black
     canvas.fill(BLUE)
     wait(1)
     canvas.fill(RED)
     wait(1)
     canvas.fill(BLACK)
 }
 ```
 This is some code for the neo trelis that will fill all the pixels on the neo trellis with diferent colors.

# Pygammer Basics
# Pygammer buttons
* There are some build in functions like that the buttons,dpad, neo pixels and screen are allredy set up so you dont have yo do much setup.
* This is simple code for the pygammer that will let you use the buttons on the device.
* Sence there are 4 buttons you can just do simple code like this
# EX
```javascript
@type("event",buttons,check)
fun check(event) {
    if (event.key_number == 0) {
        screen.fill(BLUE)
        pixels.fill(BLUE)
        pixels.show()
    }
```
It is nice because you dont have to do much to just do something simple.
* It makes it so when you click the 0 button on the pygammer it will turn blue and the neopixels will got with it.
```javascript
@board('pygamer')
@type("start",setup)
fun setup() {
    print("Seting up")
}
@type("event",buttons,check)
fun check(event) {
    if (event.key_number == 0) {
        screen.fill(BLUE)
        pixels.fill(BLUE)
        pixels.show()
    }
    if (event.key_number == 1) {
        screen.fill(GREEN)
        pixels.fill(GREEN)
        pixels.show()
    }
```


# Pygamer neo pixels

The packages for the neo pixels are all alredy install you just have to use them here is some simple code that will turn on the neo pixels it is just simple but you can get a lot more compliated if you want to.

```javascript
@board('pygammer')
pixels.fill(RED)
pixels.show
```


# Neo trelis 
For the neo trelis you can use the buttons and the neo pixels. 
The packages for the neo pixels are alredy installed for you so you dont have to import anything.
For the Neo pixels you can just use very simple code like this.

# Neo trelis Pixel code
This is some example code for the neo trelis buttons.


..
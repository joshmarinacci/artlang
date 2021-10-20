# graphics support


artlang is designed around building interactive graphics and art, so clearly needs to have a good
graphics api. This is challenging, however, due to hardware constraints. On the web we can
do pretty much anything we want. We have the memory and CPU speed to imlement immediate mode graphics
with curves (HTML Canvas) as well as retained mode (SVG), 3D (WebGL), and generate PNG, PDF, and
other formats on the fly.  The CircuitPython devices, on the other hand, are extremely resource
constrained. Even devices with low resolution screens like the Portal Matrix and  PyGamer still
struggle with memory usage and speed of drawing to the screen. This is made worse by the use
of an interpreted language, Python, on a low speed CPU.  So we must have ways to deal with it.


Adafruit provides the DisplayIO library as documented [here](https://circuitpython.readthedocs.io/en/latest/shared-bindings/displayio/index.html)

One of the core primitives is a bitmap. I *think* it wraps native C-based memory
that can be drawn to the screen quickly, but the jump between python and C is slow, so they
recommend you create these objects once and reuse them for drawing each frame without
changing the contents. Ex:

> Stores values of a certain size in a 2D array
> Bitmaps can be treated as read-only buffers. If the number of bits in a pixel is 8, 16, or 32; and the number of bytes per row is a multiple of 4, then the resulting memoryview will correspond directly with the bitmap’s contents. Otherwise, the bitmap data is packed into the memoryview with unspecified padding.
> A Bitmap can be treated as a buffer, allowing its content to be viewed and modified using e.g., with ulab.numpy.frombuffer, but the displayio.Bitmap.dirty method must be used to inform displayio when a bitmap was modified through the buffer interface.
> bitmaptools.arrayblit can also be useful to move data efficiently into a Bitmap.
> Create a Bitmap object with the given fixed size. Each pixel stores a value that is used to index into a corresponding palette. This enables differently colored sprites to share the underlying Bitmap. value_count is used to minimize the memory used to store the Bitmap.

The bitmaps also use palette color instead of true color, which greatly reduces memory usage.

The challenge is I use immediate mode in most of my examples and the Bitmap interface is essentially
a limited form of a retained mode scene graph. In my experiments I created a 'canvas' like
drawing surface. Filling the surface with a single color is slow enough that you can actually
see it repaint. This is odd, though, because it's done as a single call with a loop in it
before the screen is told to refresh. So how is it so slow? 

Possiblities
* something detect each change to the underlying array and automatically syncs to the screen. Meaning we are essentially doing thousands of setPixel calls.
* the bitmap update is fast, but when the screen is refreshed the copying to the real screen is so slow it's visible.
* I'm doing something wrong on the python side and should do it in C instead.

Looking at the other geometric primitvies shows that they tend to set their internal buffers once at creation
time and never modify it again except when changing colors.



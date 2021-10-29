from math import floor
def add(a,b):
    return binop(a,b, lambda a,b:a+b)
def subtract(a,b):
    return binop(a,b, lambda a,b:a-b)
def multiply(a,b):
    return binop(a,b, lambda a,b:a*b)
def divide(a,b):
    return binop(a,b, lambda a,b:a/b)
def equals(a,b):
    return binop(a,b, lambda a,b:a==b)
def greaterthanorequals(a,b):
    return binop(a,b, lambda a,b:a>=b)
def greaterthan(a,b):
    return binop(a,b, lambda a,b:a>b)
def lessthan(a,b):
    return binop(a,b, lambda a,b:a<b)
def equals(a,b):
    return binop(a,b, lambda a,b:a==b)
def _and(a,b):
    return binop(a,b, lambda a,b:(a and b))
def _mod(a,b):
    return binop(a,b, lambda a,b:(a % b))

WILDCARD = "WILDCARD"

def binop(a,b,op):
    if isinstance(a,List) and isinstance(b,List):
        out = List()
        for aa,bb in zip(a.data,b.data):
            out.append(op(aa,bb))
        return out
    if not isinstance(a,List) and isinstance(b,List):
        out = List()
        for bb in b.data:
            out.append(op(a,bb))
        return out
    if isinstance(a,List) and not isinstance(b,List):
        out = List()
        for aa in a.data:
            out.append(op(aa,b))
        return out
    return op(a,b)


class List:
    def __init__(self, *args):
        self.data = []
        for val in args:
            self.data.append(val)
    def append(self,val):
        self.data.append(val)

    def get_length(self):
        return len(self.data)

    length = property(get_length)

    def get1(self, n):
        return self.data[n]
    def set1(self, n, v):
        self.data[n] = v
    def push_end(self, v):
        self.data.append(v)
    def pop_start(self):
        return self.data.pop(0)

    def map(self, lam):
        data = List()
        for val in self.data:
            data.append(lam(val))
        return data

    def each(self, lam):
        for val in self.data:
            lam(val)
    def __iter__(self):
        return ListLooper(self)
    def dump(self):
        print("List is",self.data)
    def toString(self):
        return ','.join(str(e) for e in self.data)

def is_true(arg):
    if arg.data:
        for val in arg.data:
            if val == False:
                return False
        return True
    return False

class ListLooper():
    def __init__(self,array):
        self.array = array
        self.count = 0
        self.max = array.length
    def __next__(self):
        if self.count >= self.max:
            raise StopIteration
        v = self.array.data[self.count]
        self.count = self.count + 1
        return (v,self.count)

def is_mdarray(arr):
    return isinstance(arr, MDArray)
def is_mdlist(arr):
    return isinstance(arr, List)

class MDArray:
    def __init__(self, shape):
        self.type = "MDArray"
        self.shape = shape
        self.rank = shape.length
        w = shape.get1(0)
        h = shape.get1(1)
        self.length = w * h
        #print("making MD array of shape",w,h, self.length)
        self.data = []#bytearray()
        for n in range(self.length):
            self.data.append(0)
    def fill(self, val):
        for n in range(self.length):
            self.data[n] = val
    def index(self, x,y):
        return x + y*self.shape.get1(0)
    def fromIndex(self, n):
        return (n%self.shape.get1(0), floor(n/self.shape.get1(0)))
    def get1(self, i):
        if is_mdarray(i):
            if i.rank == 1:
                return self.get2(i.data[0],i.data[1])
        if is_mdlist(i):
            return self.get2(i.data[0],i.data[1])

        return self.data[i]
    def set1(self, i, v):
        if is_mdarray(i):
            if i.rank == 1:
                self.set2(i.data[0],i.data[1],v)
                return 0
        if is_mdlist(i):
            self.set2(i.data[0],i.data[1],v)
            return 0
        self.data[i] = v
        return 0

    def get2(self, x,y):
        if(x == WILDCARD or y == WILDCARD):
            return self.slice([x,y])
        return self.data[self.index(x,y)]
    def set2(self, x,y,v):
        if(x == WILDCARD or y == WILDCARD):
            return this.slice([x,y])
        self.data[self.index(x,y)] = v
    def every(self, lam):
        for n in range(self.length):
            (x,y) = self.fromIndex(n)
            v = self.data[n]
            lam(v,x,y)
    def slice(self, shape):
        return MDView(self, shape)
    def toString(self):
        converted_list = [str(element) for element in self.data]
        return ','.join(converted_list)
    def __iter__(self):
        return MDArrayLooper(self)
class MDArrayLooper():
    def __init__(self,array):
        self.array = array
        self.count = 0
        self.max = array.length
    def __next__(self):
        if self.count >= self.max:
            raise StopIteration
        (x,y) = self.array.fromIndex(self.count)
        v = self.array.data[self.count]
        self.count = self.count + 1
        return (v,x,y)

class MDView():
    def __init__(self, array, shape):
        if isinstance(shape,List):
            shape = shape.data
        self.array = array
        self.sliceshape = shape
        self.shape = []
        c = 0
        for d in shape:
            if d != WILDCARD:
                self.shape.append(self.array.shape.get1(c))
            c += 1
        self.rank = len(shape)
    def fill(self, val):
        if self.sliceshape[0] != WILDCARD and self.sliceshape[1] == WILDCARD:
            i = self.sliceshape[0]
            for j in range(self.array.shape.get1(1)):
                self.array.set2(i,j,val)
        if self.sliceshape[0] == WILDCARD and self.sliceshape[1] != WILDCARD:
            j = self.sliceshape[1]
            for i in range(self.array.shape.get1(0)):
                self.array.set2(i,j,val)

    def get1(self, n):
        if self.sliceshape[0] != WILDCARD and self.sliceshape[1] == WILDCARD:
            i = self.sliceshape[0]
            j = n
            return self.array.get2(i,j)
        if self.sliceshape[0] == WILDCARD and self.sliceshape[1] != WILDCARD:
            j = self.sliceshape[1]
            i = n
            return self.array.get2(i,j)

    def set1(self, n, val):
        if self.sliceshape[0] != WILDCARD and self.sliceshape[1] == WILDCARD:
            i = self.sliceshape[0]
            j = n
            self.array.set2(i,j,val)
        if self.sliceshape[0] == WILDCARD and self.sliceshape[1] != WILDCARD:
            j = self.sliceshape[1]
            i = n
            self.array.set2(i,j,val)

    def toString(self):
        out = []
        if self.sliceshape[0] != WILDCARD and self.sliceshape[1] == WILDCARD:
            i = self.sliceshape[0]
            for j in range(self.array.shape.get1(1)):
                out.append(str(self.array.get2(i,j)))
        return ','.join(out)



def listrange(min, max=None, step=1):
    if max == None:
        return listrange(0,min)
    data  = List()
    val = min
    while True:
        data.append(val)
        val = val + step
        if val >= max:
            break
    return data


class Rect:
    def __init__(self, x=0, y=0, w=10, h=10):
        self.x = floor(x)
        self.y = floor(y)
        self.w = floor(w)
        self.h = floor(h)
    def get_x1(self):
        return self.x
    x1 = property(get_x1)
    def get_y1(self):
        return self.y
    y1 = property(get_y1)
    def get_x2(self):
        return self.x + self.w
    x2 = property(get_x2)
    def get_y2(self):
        return self.y + self.h
    y2 = property(get_y2)


def wrapop(val,min,max):
    if val < min:
        return val + (max-min)
    if val > max:
        return val - (max-min)
    return val

def wrap(val,min,max):
    if isinstance(val,List):
        out = List()
        for aa,bb,cc in zip(val.data,min.data,max.data):
            out.append(wrapop(aa,bb,cc))
        return out
    return wrapop(val,min,max)

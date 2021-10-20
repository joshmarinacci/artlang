# Arrays

Arrays in ArtLang can be of any dimension. 
There are some functions which work only on
lists, but most functions work on any kind of
array. 

The dimension and size of an array is
called it's *shape*, which is itself a list.
For example the shape of a five element
list is `[5]` and the shape of a 2x2 matrix
is `[2,2]`.

Array elements can be accessed with bracket
syntax like `array[0]` or `array[2,3]`. 
Negative indexes mean using the other end of the list
or array like `array[-1]` and `array[-2,-3]`.

You can access a slice of an array with the
wildcard operator `?`. The left column of a 2x2 array is
`array[0,?]`.

You can create arrays with `Array(shape)` then set values in it.
Alternatively you can create a 1D array (list) with the list literal
syntax:  `foo := [a,b,c]`. You can create 2D arrays by reshaping a list.
`foo := [a,b,c,d].reshape([2,2])`


# Syntax Cheet Sheet

* new list (2x1 array): `[a,b]`
* new 2x2 array : `[a,b,c,d].reshape([2,2])`
* first element of a 1D array: `array[0]`
* last element of a 1D array: `array[-1]`
  
* first element of a 1D array: `array.start()`
* push element to start: `array.push_start(value)`
* pop element from start: `array.pop_start(value)`

* last element of a 1D array: `array.end()`
* push element to end: `array.push_end(value)`
* pop element from end: `array.pop_end(value)`

* first column of a 2D array with `array[0,?]`
* last column of a 2D array `array[-1,?]`
* 3rd column 2nd row of a 2D array: `array[4,3]`
* last element of a 2D array `array[-1,-1]`

* loop over every element of array: `array.each(@(v) => { print(v) })`
* loop over every element of array with indexes: `array.each(@(v,i,j) => { print(v) })`
* loop over every element of array (slim syntax): `array.each(@v => print(v))`
* map over every element of array: `arr2 := arr1.map(@v => v*v)`
* choose one element randomly: `array.choose()`
* only elements that pass a predicate: evens: `arr2 := arr1.filter(@x => x%2==0)` 

# Functions for All Arrays

All functions which take lambdas provide it with the value and a variable number of index values. 
For example, running each on a list (1D array) will provide the lambda with `(v,i)` whereas 
running `each` on a 3D array will provide it with `(v,i,j,k)`

* *fill(value):void* fill every element with the value provided
* *shape():List* returns list of dimension sizes.
```
[0,1,2].shape() == [3]
new Array([3,5]).shape() == [3,5]
```
* *reshape(new_shape):Array* returns new array with same data but in a new shape. Often used to covert a 1d array (a list) to a 2d array.
```javascript
[0,1,1,0,
 1,0,0,1,
 0,1,1,1].reshape([4,3])
```
* *each(@(v,i,j)):void* apply function to every element
```javascript
[1,2,3].each((v,i) => print(v, 'at', i))
array2D.each((v,i,j) => print(v, 'at', i,j))
array3D.each((v,i,j,k) => print(v, 'at', i,j,k))
```
* *map(@(v,i,j,k))* apply function to every element, return new array of same shape
```javascript
newarray1D := [1,2,3].map((v,i) => v*2)
newarray2D := array2D.map((v,i,j) => v*2)
newarray3D := array3D.map((v,i,j,k) => v*2)
```
* *reduce(acc,@(v,i,j,k))* apply accumulator and lambda to every element
* *find(@(v,i,j,k))*: search until predicate returns true. Returns element
```javascript
value := [1,2,3].find((v,i) => (v%2==0))   //finds the first even value
//value == 2
```
* *findIndex(@(v,i,j,k))*: search until predicate returns true, returns index
```javascript
index := [1,2,3].find((v,i) => (v%2==0))   //finds the first even value
//index == 1
```

*every(@(v,i,j))* returns true if every element passes the predicate
```javascript
[1,2,3].every(2)  == false
```


* *choose(N)* returns N values from array as a list, using randomly picked indexes
```javascript

range(10).choose() // random int between 0 and 9
range(10).choose(1) // random int between 0 and 9
range(10).choose(3) // three random ints between 0 and 9. Could be duplicates
```
* *max(@(a,b))* returns max value in the array, using the predicate to compare values if provided.
* *min(@(a,b))* returns min value in array, using the predicate to compare values if provided
* *empty()* returns true if array is empty, meaning shape==[0] or [0,0], etc.



# R1 only
These functions work only on R1 arrays (lists). They throw and error for higher dimension arrays
* *len()* returns length of R1 arrays (lists)

```javascript
[0,1,2].len() == 3
```

* *filter(@)* return new array of elements that pass the predicate
```javascript
range(5).filter((v) => (v%2)==0) == [0,2,4]
```
* *take(min, max)* return new array of elements that fit in the range
```javascript
range(5).take(2) == [0,1]
range(5).take(2,4) == [1,2]
```
* *drop(min, max)* return new array of elements that are not in the range
* stack:  push, pop
    - *front()*, *push_front()*, *pop_front()*
    - *back()*, *push_back()*, *pop_back()*
* *rotate(n)*
```javascript
['H','e','l','l','o'].rotate(-1) == ['e','l','l','o','H']
```
* *sort(?@)* returns a new list  sorted. Uses optional comparator
* *reverse()* returns a new list in the reverse direction
* *sum()* returns sum of every element. Uses optional accessor.

# advanced
* *pairwise(Array)*: apply function on adjacent elements of R1, returns new list slightly smaller.
* *zip(Array1, Array2)*: apply function on two arrays of equal shape, returning new array


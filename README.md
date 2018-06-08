# svg3d

# About this library
The purpose of this library is to implement simple graphics(include vertex shader) using <svg> and <polygon> by javascript. This library does not implement rasterization, fragment shader, anti aliasing, texture mapping, etc. With this library, you are not able to access pixel data since this library make graphics by polygon which does not provide interface for accessing pixel data. So every functions that requires pixel data are not implemented. Also, this library generate huge number of polygon with <polygon>. Therefore, this library does not guarantee performance.

# Library dependency
This libray includes gl-matrix(https://github.com/toji/gl-matrix) to perform matrix calculation. So you have to include gl-matrix.min.js before including the main script.

# Browser Compatibility
This library will available on browser that supports <svg> tag. Tested on IE11, Chrome67, Edge41

# Quick quide

### 1. Include script files and make placefor the canvas
``` HTML
<script src="gl-matrix.min.js">
</script>
<script src="svg3d.js">
</script>

<div id="viewportContainer">
	<svg></svg>
</div>
```
### 2. Set Up the Context
``` javascript
var viewPortWidth = 1000;
var viewPortHeight = 600;
var clearColor = "#000000";

var context = svg3djsInit("viewportContainer", viewPortWidth, viewPortHeight, clearColor);
```
### 3. Create an Object
``` javascript
// bunny_vertices is defined in example/object.js file. The model is generated based on
// "Low Poly Stanford Bunny" by johnny6, licensed under the
// Creative Commons - Attribution - Non-Commercial license.
// (https://creativecommons.org/licenses/by-nc/3.0/)
var position = [0,0,0];
var rotation = [0,0,180];
var scale = [1,1,1];

var bunny = context.createObject(bunny_vertices, position, rotation, scale);
```
### 4. Create a Camera
``` javascript
var camPosition = [0,0,5];
var camRotation = [0,0,0];
var near = 0.1;
var far = 10000;
var fovy = 35 * Math.PI / 180;

var mainCamera = context.createCamera(camPosition, camRotation, near, far, viewPortWidth / viewPortHeight, fovy);
```
### 5. Create a Point Light
``` javascript
var pLight = context.createPointLight([2,-2,0], 0xFF0000, 5.0);
```
### 6. Render the Scene
``` javascript
context.draw3d();
```

# Vertex Parsing
createObject method receive vertex as list(of triangles) of list(of 3 vertices) of list(of coordinate and color). This method basically receive 3 vertices together (Because the base geometry is a triangle).
``` javascript
var vertices = [[[x0,y0,z0,c0], [x1,y1,z1,c1], [x2,y2,z2,c2]], ... ]
```
Vertex also includes color information.

I made simple(crude implementation) Python converter(utils/convert.py) that convert .obj/.mtl (generate by Blender) to our format(Maybe this code can process normal wavefront .obj files as well). You can use it by
```
python convert.py target_file > result.txt
```
with target_file.obj and target_file.mtl(optional).


# License
Please refer to License file.
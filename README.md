# svg3d

# About This Library
The purpose of this library is to implement simple graphics(include vertex shader) using &lt;svg&gt; and &lt;polygon&gt; by javascript. This library does not implement rasterization, fragment shader, anti aliasing, texture mapping, etc. With this library, you are not able to access pixel data since this library make graphics by polygon which does not provide interface for accessing pixel data. So every functions that requires pixel data are not implemented. Also, this library generate huge number of polygon with &lt;polygon&gt;. Therefore, this library does not guarantee performance.

# Library Dependency
This libray includes gl-matrix(https://github.com/toji/gl-matrix) to perform matrix calculation. So you have to include gl-matrix.min.js before including the main script.

# Browser Compatibility
This library will available on browser that supports <svg> tag. Tested on IE11, Chrome67, Edge41

# Quick Guide

### 1. Include script files and make placefor the canvas
``` HTML
<script src="gl-matrix.min.js">
</script>
<script src="svg3d.js">
</script>

<div id="viewportContainer">
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
var fovy = 70;

var mainCamera = context.createCamera(camPosition, camRotation, near, far, viewPortWidth / viewPortHeight, fovy);

// Or you can make a camera using orthographic projection 
//var mainCamera = context.createOrthoCamera([0,0,0], [0,0,0], 10, 6, 0.1, 10000);
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

# Programmable Vertex Shader
You can add your own shader to each objects. Our shader receive 5 parameters; lightList, worldPosition, normal, baseColor, and finalColor. lightList contains every light objects. worldPosition represents world coordinate of the vertex. normal is a world space noraml. baseColor is a diffuse color of the vertex. finalColor is a list of colors(r,g,b) to be returned.
For example, if you want to assign a random color to each vertex, you can write shader like below.
``` javascript
function randomColorShader(lightList, worldPosition, normal, baseColor, finalColor){
	finalColor[0] = Math.random() * 255 | 0 + 1;
	finalColor[1] = Math.random() * 255 | 0 + 1;
	finalColor[2] = Math.random() * 255 | 0 + 1;
}
```
and attach this to your object
``` javascript
yourObject.setVertexShader(randomColorShader);
```

This is our default shader: (Only point light is implemented)
``` javascript
for(k = 0; k < lightList.length; ++k)
{
	var light = lightList[k];
	if(light.type == 0)
	{
		// Point light
		var d = Math.max(0.1, Math.sqrt(Math.pow(light.pos[0] - worldPosition[0], 2) + Math.pow(light.pos[1] - worldPosition[1], 2) + Math.pow(light.pos[2] - worldPosition[2], 2)));

		var worldPos = vec3.create();
		vec3.normalize(worldPos, worldPosition);
		vec3.scale(worldPos, worldPos, -1);
		var dot = vec3.dot(normal, worldPos);

		if(dot > 0)
		{
			finalColor[0] += ((light.color & 0xFF0000) / 0x010000) / d * light.intensity * dot * 10;
			finalColor[1] += ((light.color & 0xFF00) / 0x0100) / d * light.intensity * dot * 10;
			finalColor[2] += (light.color & 0xFF) / d * light.intensity * dot * 10;
		}
	}
}

// Ambient Light
finalColor[0] += baseColor[0] * 0.2;
finalColor[1] += baseColor[1] * 0.2;
finalColor[2] += baseColor[2] * 0.2;
```
If you just want to use ambient color, you can write shader like this:
``` javascript
finalColor[0] = baseColor[0];
finalColor[1] = baseColor[1];
finalColor[2] = baseColor[2];
```
or you can :
``` javascript
// Ambient color with basic shadows with a point light
for(k = 0; k < lightList.length; ++k)
{
	var light = lightList[k];
	if(light.type == 0)
	{
		// Point light
		var d = Math.max(0.1, Math.sqrt(Math.pow(light.pos[0] - worldPosition[0], 2) + Math.pow(light.pos[1] - worldPosition[1], 2) + Math.pow(light.pos[2] - worldPosition[2], 2)));

		var worldPos = vec3.create();
		vec3.normalize(worldPos, worldPosition);
		vec3.scale(worldPos, worldPos, -1);
		var dot = vec3.dot(normal, worldPos);

		if(dot > 0)
		{
			finalColor[0] += baseColor[0] / d * light.intensity * dot;
			finalColor[1] += baseColor[1] / d * light.intensity * dot;
			finalColor[2] += baseColor[2] / d * light.intensity * dot;
		}
	}
}
```

You can access default shader by context.defaultVertexShader:
``` javascript
// This code will set your object to use the default shader
yourObject.setVertexShader(yourContextVariable.defaultVertexShader);
```
# License
Please refer to License file.

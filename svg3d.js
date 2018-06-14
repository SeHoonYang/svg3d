/*
	svg3d.js 0.2
	This file is licensed under the Apache License 2.0
	Copyright 2018 SeHoonYang

	Author : SehoonYang
	email : yangsehoon@kaist.ac.kr
*/

function svg3dContext(v){

// Wrapper
function _mat4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
	var r = mat4.create();
	mat4.set(r, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
	return r;
}
function _vec4(x, y, z, w) {
	var r = vec4.create();
	vec4.set(r, x, y, z, w);
	return r;
}
function _vec3(x, y, z) {
	var r = vec3.create();
	vec3.set(r, x, y, z);
	return r;
}

function decimalToHexString(number){
	var temp = number.toString(16).toUpperCase();
	if(temp.length > 6)
		return "#FFFFFF";
	while(temp.length < 6)
		temp = "0" + temp;

	return "#" + temp;
}

this.objAdded = true;
this.objectList = [];
this.camList = [];
this.lightList = [];
this.ViewPort = v;
this.width = 0;
this.height = 0;
this.defaultVertexShader = function(lightList, worldPosition, normal, baseColor, finalColor){
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
}

this.Object3d = function (vertices, pos, rot, scale, defaultVertexShader) {
	this.vertex = vertices;
	this.normal = [];
	this.pos = pos;
	this.scale = scale; // Scale in [x,y,z] form
	this.vertexShader = defaultVertexShader;

	this.triangles = [];
	for(i = 0; i < vertices.length; ++i){
		var vert0 = vertices[i][0];
		var vert1 = vertices[i][1];
		var vert2 = vertices[i][2];
		var color = vertices[i][3];

		this.triangles.push([vert0, vert1, vert2, color]);

		// Calculate normal
		var vec0 = _vec3(vert0[0] - vert1[0], vert0[1] - vert1[1], vert0[2] - vert1[2]);
		var vec1 = _vec3(vert0[0] - vert2[0], vert0[1] - vert2[1], vert0[2] - vert2[2]);
		var norm = vec3.create();
		vec3.cross(norm, vec0, vec1);
		vec3.normalize(norm, norm);

		this.normal.push([norm[0],norm[1],norm[2],0]);
	}
	var rot_m = mat4.create();
	var rot_q = quat.create();
	quat.fromEuler(rot_q, rot[0], rot[1], rot[2]);
	mat4.fromQuat(rot_m, rot_q);
	this.rot = rot_m;

	this.getRotationMatrix = function() {
		var rot_q = quat.create();
		var rot_m = mat4.create();
		quat.fromEuler(rot_q, this.objectList[j].rot[0], this.objectList[j].rot[1], this.objectList[j].rot[2]);
		mat4.fromQuat(rot_m, rot_q);
		return rot_m;
	}
	this.rotateTo = function(m) {
		this.rot = m;
	}
	this.rotate = function(m) {
		mat4.multiply(this.rot, m, this.rot);
	}
	this.getRotMat = function() {
		return this.rot;
	}
	this.setVertexShader = function(f) {
		this.vertexShader = f;
	}
}

this.createObject = function(vertices, pos, rot, scale) {
	var Obj = new this.Object3d(vertices, pos, rot, scale, this.defaultVertexShader);
	this.objectList.push(Obj);
	this.objAdded = true;
	return Obj;
}

this.updateCamera = function(cam, pos, rot, n, f, aspect, fov) {
	// Camera transformation
	var Camera = mat4.create();
	var rot_q = quat.create();
	quat.fromEuler(rot_q, -rot[0], -rot[1], -rot[2]);
	mat4.fromQuat(Camera, rot_q);
	mat4.subtract(Camera, Camera, _mat4(0,0,0,0,0,0,0,0,0,0,0,0,pos[0],pos[1],pos[2],0));

	// Define Frustum
	var Projection = _mat4(1 / aspect / Math.tan(fov * Math.PI / 360),0,0,0,0,1 / Math.tan(fov * Math.PI / 360),0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0);

	// Calculate View * Projection
	cam.VP = mat4.create();
	mat4.multiply(cam.VP, Projection, Camera);
}

this.updateOrthoCamera = function(cam, pos, rot, w, h, n, f) {
	// Camera transformation
	var Camera = mat4.create();
	var rot_q = quat.create();
	quat.fromEuler(rot_q, -rot[0], -rot[1], -rot[2]);
	mat4.fromQuat(Camera, rot_q);
	mat4.subtract(Camera, Camera, _mat4(0,0,0,0,0,0,0,0,0,0,0,0,pos[0],pos[1],pos[2],0));

	// Define Frustum
	var Projection = _mat4(1 / w,0,0,0,0,1 / h,0,0,0,0,2/(n-f),0,0,0,(f+n)/(n-f),1);

	// Calculate View * Projection
	cam.VP = mat4.create();
	mat4.multiply(cam.VP, Projection, Camera);
}

this.createCamera = function(pos, rot, n, f, aspect, fov) {
	var camObj = new this.Object3d([], pos, rot, [1,1,1]);
	var cam = new Object({obj:camObj, VP:undefined});

	this.updateCamera(cam, pos, rot, n, f, aspect, fov);
	this.camList.push(cam);
	return cam;
}
this.createOrthoCamera = function(pos, rot, w, h, n, f) {
	var camObj = new this.Object3d([], pos, rot, [1,1,1]);
	var cam = new Object({obj:camObj, VP:undefined});

	this.updateOrthoCamera(cam, pos, rot, w, h, n, f);
	this.camList.push(cam);
	return cam;

}
this.createPointLight = function(pos, color, intensity) {
	var pLight = new Object({pos:pos,rot:mat4.create(),color:color,intensity:intensity,type:0});
	this.lightList.push(pLight);

	return pLight;
}

this.draw3d = function(){
	var HTMLTags = "";

	var results = [];
	for(j = 0; j < this.objectList.length; ++j) {
		// Calculate Model matrix
		Obj = mat4.create();
		mat4.scale(Obj, Obj, _vec3(this.objectList[j].scale[0], this.objectList[j].scale[1], this.objectList[j].scale[2]));

		// Apply transformation
		mat4.multiply(Obj, this.objectList[j].rot, Obj);
		mat4.add(Obj, Obj, _mat4(0,0,0,0,0,0,0,0,0,0,0,0,this.objectList[j].pos[0],this.objectList[j].pos[1],this.objectList[j].pos[2],0));

		// Calculate normal
		ObjNorm = mat4.create();
		mat4.scale(ObjNorm, ObjNorm, _vec3(1/this.objectList[j].scale[0], 1/this.objectList[j].scale[1], 1/this.objectList[j].scale[2]));
		mat4.multiply(ObjNorm, this.objectList[j].rot, ObjNorm);

		var triangles = this.objectList[j].triangles;
		for(i = 0; i < triangles.length; ++i) {
			var PointClipMatrix = mat4.create();
			mat4.set(PointClipMatrix, triangles[i][0][0], triangles[i][0][1], triangles[i][0][2], 1,triangles[i][1][0], triangles[i][1][1], triangles[i][1][2], 1,triangles[i][2][0], triangles[i][2][1], triangles[i][2][2], 1,0,0,0,0);

			// position, normal : world coordinate
			var position = mat4.create();
			mat4.multiply(position, Obj, PointClipMatrix);
			mat4.multiply(PointClipMatrix, this.camList[0].VP, position);

			var normal = vec4.create();
			mat4.multiply(normal, ObjNorm, this.objectList[j].normal[i]);
			vec4.normalize(normal, normal);
			normal = _vec3(normal[0], normal[1], normal[2]);

			var WorldPoint = [_vec3(position[0], position[1], position[2]), _vec3(position[4], position[5], position[6]), _vec3(position[8], position[9], position[10])];

			var finalColor = [[0,0,0],[0,0,0],[0,0,0]];

			for(p = 0; p < 3; ++p)
			{
				var baseColor = [(triangles[i][p][3] & 0xFF0000) / 0x010000, (triangles[i][p][3] & 0xFF00) / 0x0100, triangles[i][p][3] & 0xFF];
				this.objectList[j].vertexShader(this.lightList, WorldPoint[p], normal, baseColor, finalColor[p]);
			}

			var NormalizedPointClip0 = [PointClipMatrix[0] / PointClipMatrix[3], PointClipMatrix[1] / PointClipMatrix[3], PointClipMatrix[2] / PointClipMatrix[3]];
			var NormalizedPointClip1 = [PointClipMatrix[4] / PointClipMatrix[7], PointClipMatrix[5] / PointClipMatrix[7], PointClipMatrix[6] / PointClipMatrix[7]];
			var NormalizedPointClip2 = [PointClipMatrix[8] / PointClipMatrix[11], PointClipMatrix[9] / PointClipMatrix[11], PointClipMatrix[10] / PointClipMatrix[11]];

			var ScreenPoint0 = [(NormalizedPointClip0[0] * 0.5 + 0.5) * this.width, (NormalizedPointClip0[1] * 0.5 + 0.5) * this.height];
			var ScreenPoint1 = [(NormalizedPointClip1[0] * 0.5 + 0.5) * this.width, (NormalizedPointClip1[1] * 0.5 + 0.5) * this.height];
			var ScreenPoint2 = [(NormalizedPointClip2[0] * 0.5 + 0.5) * this.width, (NormalizedPointClip2[1] * 0.5 + 0.5) * this.height];

			// Clipping function
			function bounded(k, min, max){
				return min <= k && max >= k;
			}

			var z = 0.5 + NormalizedPointClip0[2] * 0.5;
			if(z >= 0.0 && z <= 1.0 && ((bounded(ScreenPoint0[0], 0, this.width) && bounded(ScreenPoint0[1], 0, this.height)) || (bounded(ScreenPoint1[0], 0, this.width) && bounded(ScreenPoint1[1], 0, this.height)) || (bounded(ScreenPoint2[0], 0, this.width) && bounded(ScreenPoint2[1], 0, this.height))))
			{
				function addLight(x,y,z){
					var r = Math.floor((x[0] + y[0] + z[0])/3);
					var g = Math.floor((x[1] + y[1] + z[1])/3);
					var b = Math.floor((x[2] + y[2] + z[2])/3);

					var max = Math.max(r,g,b);
					if(max > 0xFF)
					{
						r = Math.floor(r * 0xFF / max);
						g = Math.floor(g * 0xFF / max);
						b = Math.floor(b * 0xFF / max);
					}

					return r * 0x010000 + g * 0x0100 + b;
	
				}
				var color = addLight(finalColor[0], finalColor[1], finalColor[2]);

				var resultPoint = [ScreenPoint0, ScreenPoint1, ScreenPoint2, NormalizedPointClip0[2] + NormalizedPointClip1[2] + NormalizedPointClip2[2], color];
				results.push(resultPoint);
			}
		}
	}
	// Z-index ordering
	results.sort(function(l,r){return r[3] - l[3]});
	for(i = 0; i < results.length; ++i) {
		var PointString = results[i][0][0] + ',' + results[i][0][1] + ' ' + results[i][1][0] + ',' + results[i][1][1] + ' ' + results[i][2][0] + ',' + results[i][2][1];
		var color = decimalToHexString(results[i][4]);
		if(this.objAdded)
			HTMLTags = HTMLTags + '<polygon points="' + PointString + '" style="fill:' + color + '" stroke="' + color + '" id="tris_'+ i +'" onClick="console.log('+i+')"></polygon>';
		else
		{
			var tris = document.getElementById("tris_" + i);
			tris.style['fill'] = color;
			tris.setAttribute("points", PointString);
			tris.setAttribute("stroke", color);
		}
	}

	if(this.objAdded)
	{
		this.objAdded = false;
		this.__initial_drawing(this.ViewPort, "<svg width='"+this.width+"' height='"+this.height+"' overflow='hidden'>" + HTMLTags + "</svg>");
	}
}

this.__initial_drawing = function(v, s){
	v.innerHTML = s;
}

}
function svg3djsInit(id, w, h, color) {
	var ViewPort = document.getElementById(id);
	ViewPort.style['display'] = "inline-flex";
	ViewPort.style['background'] = color;
	var context = new svg3dContext(ViewPort);
	context.height = h;
	context.width = w;
	context.clearColor = color;

	return context;
}

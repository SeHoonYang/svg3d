# This code is in the public domain

import sys

def remove_slash(x):
	return x[:x.find("/")]
def get_color(lst, name):
	for c in lst:
		if c[0] == name :
			return c[1]
	return 0xC0C0C0

# obj file
f = open(sys.argv[1] + '.obj', 'r')
lines = f.readlines()
f.close()

# mtl file
lines2 = ""
try:
	f2 = open(sys.argv[1] + '.mtl', 'r')
	lines2 = f2.readlines()
	f2.close()
except Exception:
	pass

current_color = ""

# Parse mtl
colors = []
for line in lines2:
	if len(line) < 2:
		continue
	type = line.split()[0]

	line = line[line.index(" ") + 1:]
	if line[-1] == '\n':
		line = line[:-1]

	if type == 'newmtl':
		current_color = line
	elif type == 'Kd':
		color_int = int(float(line.split()[0]) * 255) * 0x010000 + int(float(line.split()[1]) * 255) * 0x0100 + int(float(line.split()[2]) * 255)
		colors.append([current_color, color_int])

# Parse obj
vert = []
face = []
for line in lines:
	if len(line) < 2:
		continue

	type = line.split()[0]

	line = line[line.index(" ") + 1:]
	if line[-1] == '\n':
		line = line[:-1]

	if type == 'v':
		vert.append(list(map(lambda x: float(x), line.split())))
	elif type == 'f':
		face_with_color = list(map(lambda x: int(remove_slash(x)), line.split()))
		face_with_color.append(get_color(colors, current_color))
		face.append(face_with_color)
	elif type == 'usemtl':
		current_color = line

vertices = []
for f in face:
	if len(f) == 4 + 1:
		vertices.append([vert[f[0] -1] + [f[-1]], vert[f[1] -1] + [f[-1]], vert[f[2] -1] + [f[-1]]])
		vertices.append([vert[f[0] -1] + [f[-1]], vert[f[2] -1] + [f[-1]], vert[f[3] -1] + [f[-1]]])
	elif len(f) == 3 + 1:
		vertices.append([vert[f[0] -1] + [f[-1]], vert[f[1] -1] + [f[-1]], vert[f[2] -1] + [f[-1]]])

print(vertices)
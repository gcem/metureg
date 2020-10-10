#!/usr/bin/python3
import cv2
import numpy
import sys

THRESHOLD = 220
MINSIZE = 8

IMDIR = '../../saved/' if len(sys.argv) == 1 else str.join(' ', sys.argv[1:])
if IMDIR[-1] != '/':
    IMDIR += '/'

img = cv2.imread(IMDIR + 'code.png')

avg = [[255, 255] + [sum(px) / len(px) for px in row[2:-2]] + [255, 255] for row in img]
ar = numpy.array(avg)
ar[[0, 1, -1, -2]] = [255] * len(avg[0])

boolar = ar > THRESHOLD

thresholdImage = numpy.array([[255 if px else 0 for px in row] for row in boolar])
cv2.imwrite(IMDIR + 'threshold.png', thresholdImage)

visited = numpy.array([[False] * len(boolar[0])] * len(boolar))
counts = numpy.array([[0] * len(boolar[0])] * len(boolar))
final = numpy.array([[255] * len(boolar[0])] * len(boolar))

def visit(x, y):
    if visited[x][y]:
        return []
    visited[x][y] = True
    if boolar[x][y]:
        return []
    return [[x, y]] + visit(x, y-1) + visit(x, y+1) + visit(x-1, y) + visit(x+1, y)

for x in range(2, len(boolar) - 2):
    for y in range(2, len(boolar[0]) - 2):
        ls = visit(x, y)
        size = len(ls)
        #print("at coordinates ", x, ", ", y, ":")
        #print("size is ", size)

        if len(ls) >= MINSIZE:
            for coords in ls:
                final[coords[0]][coords[1]] = 0
                
cv2.imwrite(IMDIR + 'filtered.png', final)
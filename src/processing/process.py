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

# set the 2-px-wide border around the picture to white
avg = [[255, 255] + [sum(px) / len(px) for px in row[2:-2]] + [255, 255] for row in img]
ar = numpy.array(avg)
ar[[0, 1, -1, -2]] = [255] * len(avg[0])

# true: white, false: black
boolar = ar > THRESHOLD
def boolToImg(ba):
    return numpy.array([[255 if px else 0 for px in row] for row in ba])

thresholdImage = boolToImg(boolar)
cv2.imwrite(IMDIR + 'threshold.png', thresholdImage)

visited = numpy.array([[False] * len(boolar[0])] * len(boolar))
boolresult = numpy.array([[True] * len(boolar[0])] * len(boolar))

def visit(x, y):
    if visited[x][y]:
        return []
    visited[x][y] = True
    if boolar[x][y]:
        return []
    return [[x, y]] + visit(x, y-1) + visit(x, y+1) + visit(x-1, y) + visit(x+1, y)

def removeIsolated():
    for x in range(2, len(boolar) - 2):
        for y in range(2, len(boolar[0]) - 2):
            ls = visit(x, y)
            size = len(ls)

            if len(ls) >= MINSIZE:
                for coords in ls:
                    boolresult[coords[0]][coords[1]] = 0

removeIsolated()
boolar = boolresult

zeroone = numpy.ones(boolar.shape)
zeroone[boolar] = 0

def fillCoveredPixels():
    for x in range(2, len(boolar) - 2):
        for y in range(2, len(boolar[0]) - 2):
            count = zeroone[x, y-1] + zeroone[x, y+1] + zeroone[x-1, y] + zeroone[x+1, y]
            if count >= 3:
                boolresult[x, y] = False
                zeroone[x, y] = 1

fillCoveredPixels()
fillCoveredPixels()
fillCoveredPixels()
boolar = boolresult
                
result = boolToImg(boolresult)
cv2.imwrite(IMDIR + 'filtered.png', result)

def horizontal():
    for x in range(2, len(boolar) - 2):
        for y in range(2, len(boolar[0]) - 2):
            if not boolresult[x, y] and boolresult[x,y-1] and boolresult[x,y+1]:
                boolresult[x, y] = True

def vertical():
    for x in range(2, len(boolar) - 2):
        for y in range(2, len(boolar[0]) - 2):
            if not boolresult[x, y] and boolresult[x-1,y] and boolresult[x+1,y]:
                boolresult[x, y] = True

horizontal()
vertical()
horizontal()
vertical()

result = boolToImg(boolresult)
cv2.imwrite(IMDIR + 'cleaned.png', result)
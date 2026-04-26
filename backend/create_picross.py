import cv2 as cv
import sys
import os
import json

import numpy as np

def picrossed_image(image, col, row):
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    _, gray = cv.threshold(gray, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
    pixelated = cv.resize(gray, (col, row), interpolation=cv.INTER_NEAREST)
    return pixelated

def png_to_json(image, col, row):
    pixelised = picrossed_image(image, col, row)

    json_data = {}
    json_data['columns'] = col
    json_data['rows'] = row
    json_data['row_clues'] = []
    json_data['column_clues'] = []
    json_data['grid'] = []


    for i in range(row):
        current_row = []
        for j in range(col):
            current_row.append(int(pixelised[i][j]) == 0)
        json_data['grid'].append(current_row)

    for i in range(row):
        clues = []
        count = 0
        for j in range(col):
            if json_data['grid'][i][j]:
                count += 1
            else:
                if count > 0:
                    clues.append(count)
                count = 0
        if count > 0:
            clues.append(count)
        json_data['row_clues'].append(clues)

    for j in range(col):
        clues = []
        count = 0
        for i in range(row):
            if json_data['grid'][i][j]:
                count += 1
            else:
                if count > 0:
                    clues.append(count)
                count = 0
        if count > 0:
            clues.append(count)
        json_data['column_clues'].append(clues)

    return json_data

def pixelised_to_picross(img, picross_width, picross_height):

    pixelised = picrossed_image(img, picross_width, picross_height)
    output = cv.resize(pixelised , (img.shape[1],img.shape[0]) , interpolation = cv.INTER_NEAREST)
    return output

def byte_to_img(content: bytes):
    nparr = np.frombuffer(content, np.uint8)
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)
    return img
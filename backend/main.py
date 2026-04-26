import io
import json

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from create_picross import png_to_json, pixelised_to_picross, byte_to_img
import base64
import cv2 as cv
import zipfile

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API is running"}

# Upload image + réponse fake
@app.post("/generate")
async def generate(file: UploadFile = File(...),
                   width: int = Form(...),
                   height: int = Form(...)):
    content = await file.read()
    width = int(width)
    height = int(height)
    img  = byte_to_img(content)
    json_data = png_to_json(img, width, height)
    picross_img = pixelised_to_picross(img, width, height)

    _, buffer = cv.imencode('.png', picross_img)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('picross.json', json.dumps(json_data))
        zf.writestr('picross.png', buffer.tobytes())
    zip_buffer.seek(0)



    return StreamingResponse(zip_buffer, media_type='application/zip', headers={
        'Content-Disposition': 'attachment; filename=picross.zip'
    })
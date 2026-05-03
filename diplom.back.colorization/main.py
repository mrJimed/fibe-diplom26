import cv2
import numpy as np
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from modelscope.outputs import OutputKeys
from modelscope.pipelines import pipeline
from modelscope.utils.constant import Tasks
import io

app = FastAPI(title="Colorization Service", port=8001)

# Загружаем модель один раз
_colorizer = pipeline(
    Tasks.image_colorization,
    model='damo/cv_ddcolor_image-colorization',
    cache_dir='./models/ddcolor'
)


@app.post("/colorize")
async def colorize(file: UploadFile = File(...)):
    """
    Принимает изображение, возвращает раскрашенное
    """
    # Читаем входной файл
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Раскрашиваем
    temp_path = 'temp_colorize.jpg'
    cv2.imwrite(temp_path, img)
    result = _colorizer(temp_path)
    os.remove(temp_path)

    colorized_img = result[OutputKeys.OUTPUT_IMG]

    # Кодируем результат в JPEG
    _, encoded = cv2.imencode('.jpg', colorized_img)

    return StreamingResponse(
        io.BytesIO(encoded.tobytes()),
        media_type="image/jpeg"
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
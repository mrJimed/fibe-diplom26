import asyncio
import os
import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from config.app_config import UPLOAD_DIR, COLORIZATION_SERVICE_URL
from dependencies import get_db, get_current_user
from image_restorer import restore_image
from models import User, Image

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
image_router = APIRouter()


async def colorize_image(image_array: np.ndarray) -> np.ndarray:
    """
    Отправляет изображение в сервис колоризации и возвращает результат
    """
    # Кодируем numpy массив в JPEG
    _, encoded = cv2.imencode('.jpg', image_array)

    # Отправляем запрос к сервису колоризации
    try:
        response = await asyncio.to_thread(
            requests.post,
            f"{COLORIZATION_SERVICE_URL}/colorize",
            files={'file': encoded.tobytes()},
            timeout=60  # Колоризация может занимать время
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Ошибка сервиса колоризации")

        # Декодируем результат
        nparr = np.frombuffer(response.content, np.uint8)
        colorized_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        return colorized_img

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Сервис колоризации недоступен: {str(e)}")


@image_router.post("/upload", tags=["Images"])
async def upload_image(
        file: UploadFile = File(..., description="Фото для загрузки"),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Поддерживаются только: jpeg, png, webp, gif")

    safe_filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)

    # 1️⃣ Сохраняем оригинал
    content = await file.read()
    with open(filepath, "wb") as buffer:
        buffer.write(content)

    # 2️⃣ Восстанавливаем изображение (GFPGAN)
    print('начало реставрации')
    restored_array = restore_image(filepath)
    print('конец реставрации')
    if restored_array is None:
        raise HTTPException(status_code=400, detail="Лицо не обнаружено на изображении")

    # 3️⃣ Колоризируем восстановленное изображение (через сервис)
    print('начало колоризации')
    colorized_array = await colorize_image(restored_array)
    print('конец колоризации')
    # 4️⃣ Сохраняем колоризированное изображение
    colorized_filename = f"colorized_{safe_filename}"
    colorized_filepath = os.path.join(UPLOAD_DIR, colorized_filename)
    success = await asyncio.to_thread(cv2.imwrite, colorized_filepath, colorized_array)
    if not success:
        raise HTTPException(status_code=500, detail="Не удалось сохранить результат")

    # 5️⃣ Записываем в БД
    new_image = Image(
        orig_image=filepath,
        restore_image=colorized_filepath,  # Сохраняем колоризированную версию
        user_id=current_user.id,
        date=datetime.now(timezone.utc)
    )
    db.add(new_image)
    await db.commit()
    await db.refresh(new_image)

    # 6️⃣ Возвращаем колоризированное изображение
    with open(colorized_filepath, "rb") as f:
        colorized_content = f.read()

    return Response(
        content=colorized_content,
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f"inline; filename=\"{colorized_filename}\"",
            "X-Image-Id": str(new_image.id)
        }
    )
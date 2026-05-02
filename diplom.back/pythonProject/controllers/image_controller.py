import asyncio
import os
import uuid
from datetime import datetime, timezone

import cv2
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from config.app_config import UPLOAD_DIR
from dependencies import get_db, get_current_user
from image_restorer import restore_image
from models import User, Image

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
image_router = APIRouter()


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

    # 2️⃣ Восстанавливаем изображение
    restored_array = restore_image(filepath)
    if restored_array is None:
        raise HTTPException(status_code=400, detail="Лицо не обнаружено на изображении")

    # 3️⃣ Сохраняем восстановленное
    restored_filename = f"restored_{safe_filename}"
    restored_filepath = os.path.join(UPLOAD_DIR, restored_filename)
    success = await asyncio.to_thread(cv2.imwrite, restored_filepath, restored_array)
    if not success:
        raise HTTPException(status_code=500, detail="Не удалось сохранить результат")

    # 4️⃣ Записываем в БД
    new_image = Image(
        orig_image=filepath,
        restore_image=restored_filepath,
        user_id=current_user.id,
        date=datetime.now(timezone.utc)
    )
    db.add(new_image)
    await db.commit()
    await db.refresh(new_image)

    # 5️⃣ 🔥 Читаем и возвращаем ВОССТАНОВЛЕННОЕ изображение
    with open(restored_filepath, "rb") as f:
        restored_content = f.read()

    return Response(
        content=restored_content,  # ✅ Было: content (оригинал), стало: restored_content
        media_type="image/jpeg",  # cv2.imwrite сохраняет в JPEG по умолчанию
        headers={
            "Content-Disposition": f"inline; filename=\"{restored_filename}\"",
            "X-Image-Id": str(new_image.id)
        }
    )

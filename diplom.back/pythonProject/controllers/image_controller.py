import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from config.app_config import UPLOAD_DIR
from dependencies import get_db, get_current_user
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
    content = await file.read()
    with open(filepath, "wb") as buffer:
        buffer.write(content)

    new_image = Image(
        orig_image=filepath,
        restore_image=None,
        user_id=current_user.id,
        date=datetime.now(timezone.utc)
    )
    db.add(new_image)
    await db.commit()
    await db.refresh(new_image)

    return Response(
        content=content,
        media_type=file.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"inline; filename=\"{safe_filename}\"",
            "X-Image-Id": str(new_image.id)
        }
    )

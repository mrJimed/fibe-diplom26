import faulthandler

import torch.multiprocessing as mp
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.auth_controller import auth_router
from controllers.image_controller import image_router
from database import engine
from models import Base

mp.set_start_method('spawn', force=True)

app = FastAPI(
    title="Photo Restore API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Разрешаем только ваш фронтенд
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы (GET, POST, PUT, DELETE...)
    allow_headers=["*"],  # Разрешаем все заголовки
)


@app.on_event("startup")
async def startup():
    """Создание таблиц при запуске"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(auth_router, prefix="/api/auth")
app.include_router(image_router, prefix="/api/images")

if __name__ == "__main__":
    faulthandler.enable()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

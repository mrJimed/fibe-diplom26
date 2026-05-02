import cv2
from gfpgan import GFPGANer

_restorer = GFPGANer(
    model_path='models/GFPGANv1.3.pth',  # https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth
    upscale=2,  # коэффициент увеличения
    arch='clean',  # архитектура для v1.3
    channel_multiplier=2,  # множитель каналов
    bg_upsampler=None  # можно добавить RealESRGAN для фона
)


def restore_image(image_path: str):
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    _, _, restored_img = _restorer.enhance(
        img,
        has_aligned=False,  # если лицо уже выровнено
        only_center_face=False,  # восстанавливать все лица
        paste_back=True,  # вставить восстановленное лицо обратно
        weight=0.5  # баланс между оригиналом и восстановлением
    )
    return restored_img

import os

from dotenv import dotenv_values

path = os.path.join(os.path.dirname(__file__), '.env')
conf = dotenv_values(path)

SECRET_KEY: str = conf['SECRET_KEY']
ALGORITHM: str = conf['ALGORITHM']
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(conf['ACCESS_TOKEN_EXPIRE_MINUTES'])
UPLOAD_DIR: str = conf['UPLOAD_DIR']
DATABASE_URL: str = conf['DATABASE_URL']
COLORIZATION_SERVICE_URL:str=conf['COLORIZATION_SERVICE_URL']
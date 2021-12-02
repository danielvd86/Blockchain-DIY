from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import jwt
from passlib.hash import bcrypt
from sqlalchemy.sql.functions import mode
import models
from database import SessionLocal, engine
from sqlalchemy.orm import Session


app = FastAPI()
models.Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')

# move this to .env
JWT_SECRET = 'secret'


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterAccount(BaseModel):
    username: str
    password: str  # should be hashed in the near future
    name: str
    email: Optional[str] = None
    wallet: str


class LoginAccount(BaseModel):
    username: str
    password: str  # should be hashed in the near future


def authenticate_user(username: str, password: str, db):
    user_db = db.query(models.User).filter(
        models.User.username == username and bcrypt.verify(password, models.User.hashed_password)).first()

    if user_db is None:
        return False

    return user_db


@app.post('/api/token')
async def token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = authenticate_user(form_data.username, form_data.password, db)

    if user is False:
        return {'error': 'Input username or password was incorrect'}

    print(user.username)
    user_obj = {'username': user.username,
                'password_hash': user.hashed_password, 'name': user.name}
    token = jwt.encode(user_obj, JWT_SECRET)

    return {'access_token': token, 'token_type': 'bearer'}


@app.get('/')
async def index(token: str = Depends(oauth2_scheme)):
    return {'the_token': token}


@app.post('/api/register')
def register(account: RegisterAccount, db: Session = Depends(get_db)):

    # check if already in db
    checkDB = db.query(models.User).filter(
        models.User.username == account.username).first()
    if (checkDB == None):
        dbUser = models.User(
            username=account.username,
            hashed_password=bcrypt.hash(account.password),
            name=account.name,
            wallet=account.wallet,
            is_active=True
        )
        db.add(dbUser)
        db.commit()
        db.refresh(dbUser)

    print(dbUser)
    return dbUser


@app.put('/api/editAccount')
def edit(account: LoginAccount):

    # look if in db
    # select and edit it
    return {'message': f'successfully edited account {account.username}'}

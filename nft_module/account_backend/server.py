from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from starlette.status import HTTP_409_CONFLICT
from sqlalchemy.sql.functions import mode
from passlib.hash import bcrypt
import jwt
from typing import Optional
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi import FastAPI, Depends
import os


app = FastAPI()
models.Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/token')


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
    user_obj = {'id': user.id,
                'username': user.username,
                'name': user.name}
    token = jwt.encode(user_obj, os.JWT_SECRET)

    return {'access_token': token, 'token_type': 'bearer'}


@app.get('/')
async def index(token: str = Depends(oauth2_scheme)):
    return {'the_token': token}


@app.post('/api/register')
def register(account: RegisterAccount, db: Session = Depends(get_db)):

    # check if already in db
    checkDB = db.query(models.User).filter(
        models.User.username == account.username).first()

    if(checkDB != None):
        raise HTTPException(
            status_code=HTTP_409_CONFLICT,
            detail='User already registered'
        )

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

    return dbUser


@app.get('/api/user/me')
def get_me(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):

    try:
        print(token)
        payload = jwt.decode(token, os.getenv(
            'JWT_SECRET'), algorithms=['HS256'])
        user = db.query(models.User).get(payload.get('id'))

        return user
    except:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid username or password'
        )


@app.put('/api/editAccount')
def edit(account: LoginAccount):

    # look if in db
    # select and edit it
    return {'message': f'successfully edited account {account.username}'}

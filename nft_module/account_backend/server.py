from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import jwt
import os
from passlib.hash import bcrypt
from sqlalchemy.sql.functions import mode
from starlette.status import HTTP_409_CONFLICT
import models
from database import SessionLocal, engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv


app = FastAPI()
models.Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/token')

# move this to .env
JWT_SECRET = os.environ['JWT_SECRET']


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
    wallet: str


class EditAccount(BaseModel):
    password: str  # should be hashed in the near future
    name: str
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
    token = jwt.encode(user_obj, JWT_SECRET)

    return {'access_token': token, 'token_type': 'bearer'}


@app.get('/')
async def index():
    return {'message': 'Base endpoint for Account API'}


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
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = db.query(models.User).get(payload.get('id'))

        return user
    except:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid username or password'
        )


@app.put('/api/editAccount')
def edit(account: EditAccount, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):

    # look if in db

    payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    user = db.query(models.User).get(payload.get('id'))

    if user != None:
        user.name = account.name
        user.hashed_password = bcrypt.hash(account.password)
        user.wallet = account.wallet
        return {'message': f'User {user.name} was updated successfully!'}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )

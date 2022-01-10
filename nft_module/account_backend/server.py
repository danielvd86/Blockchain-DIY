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
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
models.Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/login')
origins = [
    "http://localhost:3000",
    "localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


JWT_SECRET = os.environ['JWT_SECRET']


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterAccount(BaseModel):
    username: str
    password: str
    name: str
    wallet: str
    role: str


class EditAccount(BaseModel):
    password: str
    name: str
    wallet: str


class CheckUsernameModel(BaseModel):
    username: str


def authenticate_user(username: str, password: str, db):
    user_db = db.query(models.User).filter(
        models.User.username == username and bcrypt.verify(password, models.User.hashed_password)).first()

    if user_db is None:
        return False

    return user_db


@app.get('/')
async def index():
    return {'message': 'Base endpoint for Account API'}


# Call this to login and create the OAuth2 Session
@app.post('/api/login')
async def token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = authenticate_user(form_data.username, form_data.password, db)

    if user is False:
        return {'error': 'Input username or password was incorrect'}

    print(user.username)
    user_obj = {'id': user.id,
                'username': user.username,
                'name': user.name,
                'role': user.role
                }
    token = jwt.encode(user_obj, JWT_SECRET)

    return {'access_token': token, 'token_type': 'bearer'}

# Call this to register the user and his linked wallet


@app.post('/api/register')
def register(account: RegisterAccount, db: Session = Depends(get_db)):

    # check if already in db
    checkDB = db.query(models.User).filter(
        models.User.username == account.username or models.User.wallet == account.wallet).first()

    if(checkDB != None):
        raise HTTPException(
            status_code=HTTP_409_CONFLICT,
            detail='User or wallet already registered'
        )

    roles = ['user', 'admin', 'organizer']
    if(roles.__contains__(account.role) == False):
        raise HTTPException(status_code=409,
                            detail='Sent role is not valid. Check the spelling and make sure it is either user, organizer or admin')

    if (checkDB == None):
        dbUser = models.User(
            username=account.username,
            hashed_password=bcrypt.hash(account.password),
            name=account.name,
            wallet=account.wallet,
            is_active=True,
            role=account.role
        )
        db.add(dbUser)
        db.commit()
        db.refresh(dbUser)

    return dbUser

# Returns user from the passed token


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

# Edit the user corresponding to the token passed


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


app.post('/api/checkUsername')


def checkUser(data: CheckUsernameModel, db: Depends(get_db)):

    user = db.query(models.User).filter(
        data.username == models.User.username).first()

    if user is None:
        raise HTTP_404_NOT_FOUND

    return user
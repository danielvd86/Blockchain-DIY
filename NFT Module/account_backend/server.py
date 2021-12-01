from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import models
from database import SessionLocal, engine
from sqlalchemy.orm import Session


app = FastAPI()
models.Base.metadata.create_all(bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl = 'token')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterAccount(BaseModel):
    username: str
    password: str #should be hashed in the near future
    name: str
    email: Optional[str] = None
    wallet: str

class LoginAccount(BaseModel):
    username: str
    password: str #should be hashed in the near future

@app.post('/api/token')
async def token(form_data: OAuth2PasswordRequestForm = Depends()):
    return {'access_token': form_data.username + 'token'}


@app.get('/')
async def index(token : str = Depends(oauth2_scheme)):
    return {'the_token': token}

@app.post('/api/register')
def register(account: RegisterAccount, db: Session = Depends(get_db)):

    #check if already in db
    checkDB = db.query(models.User).filter(models.User.username == account.username).first()
    if (checkDB == None):
        dbUser = models.User(
        username = account.username,
        password = account.password,
        name = account.name,
        wallet = account.wallet,
        isActive = True
        )
        db.add(dbUser)
        db.commit()
        db.refresh(dbUser)

    
    print(dbUser)
    return dbUser

@app.post('/api/login')
def login(account: LoginAccount, db: Session = Depends(get_db)):

    #check in db

    #generate token/ create authorization

    #return token
    return None

@app.put('/api/editAccount')
def edit(account: LoginAccount):

    #look if in db
    #select and edit it
    return {'message': f'successfully edited account {account.username}'}
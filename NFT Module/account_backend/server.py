from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl = 'token')

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
def register(account: RegisterAccount):

    print(account.username)
    return account

@app.post('/api/login')
def login(account: LoginAccount):

    #check in db

    #generate token/ create authorization

    #return token
    return None

@app.put('/api/editAccount')
def edit(account: LoginAccount)

    #look if in db
    #select and edit it
    return {'message': f'successfully edited account {account.username}'}
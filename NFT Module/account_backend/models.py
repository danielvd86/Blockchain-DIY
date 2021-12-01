from sqlalchemy import Boolean, Column, Integer, String

from database import Base

class User(Base):

    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    username = Column(String, unique=True)
    hashed_password = Column(String)
    wallet = Column(String, unique=True)
    is_active = Column(Boolean, default=True)




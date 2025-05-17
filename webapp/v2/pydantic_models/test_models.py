from pydantic import BaseModel

class TestResponse(BaseModel):
    id: int
    message: str 
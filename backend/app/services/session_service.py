from fastapi import APIRouter

router = APIRouter(
    prefix="/session",
    tags=["Session"]
)


@router.get("/")
async def get_sessions():

    return {
        "message": "Session endpoint working"
    }
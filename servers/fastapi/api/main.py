from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.lifespan import app_lifespan
from api.middlewares import UserConfigEnvUpdateMiddleware
from api.v1.ppt.router import API_V1_PPT_ROUTER
from utils.asset_directory_utils import get_exports_directory, get_images_directory, get_uploads_directory


app = FastAPI(lifespan=app_lifespan)


# Routers
app.include_router(API_V1_PPT_ROUTER)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount(
    "/app_data/images",
    StaticFiles(directory=get_images_directory()),
    name="app_data/images",
)
app.mount(
    "/app_data/exports",
    StaticFiles(directory=get_exports_directory()),
    name="app_data/exports",
)
app.mount(
    "/app_data/uploads",
    StaticFiles(directory=get_uploads_directory()),
    name="app_data/uploads",
)


# Middlewares
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(UserConfigEnvUpdateMiddleware)

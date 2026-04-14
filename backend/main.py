import os
import static_ffmpeg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes.auth_routes import router as auth_router
from routes.convert_routes import router as convert_router

# Initialize bundled ffmpeg
static_ffmpeg.add_paths()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FreeConvert API", description="FastAPI Backend for FreeConvert Replica")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(convert_router, prefix="/api/convert", tags=["Conversion"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FreeConvert API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)

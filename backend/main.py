from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

# Add FFmpeg to PATH (for local Windows dev)
ffmpeg_local_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ffmpeg", "bin"))
if os.path.exists(ffmpeg_local_path):
    os.environ["PATH"] = ffmpeg_local_path + os.pathsep + os.environ.get("PATH", "")

os.environ["TORCHAUDIO_BACKEND"] = "soundfile"

import torchaudio
try:
    torchaudio.set_audio_backend("soundfile")
except:
    pass

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "AI Mood Music Remix API is running"}

from remix import separate_audio
from generate import generate_track, load_model
import asyncio

@app.on_event("startup")
async def startup_event():
    # Pre-load the music generation model in the background
    # This prevents blocking the server startup
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, load_model_safe)

def load_model_safe():
    try:
        print("Starting pre-loading of MusicGen model...")
        load_model()
        print("MusicGen model loaded successfully.")
    except Exception as e:
        print(f"Error loading MusicGen model: {e}")

@app.get("/api/health")
def health_check():
    from generate import model
    return {
        "status": "online", 
        "model_loaded": model is not None,
        "ffmpeg": os.path.exists(os.path.join(ffmpeg_local_path, "ffmpeg.exe")) or shutil.which("ffmpeg") is not None
    }

tasks = {}

import uuid

@app.post("/api/remix")
async def remix_audio(file: UploadFile = File(...), fast_mode: bool = False, turbo_mode: bool = False):
    task_id = str(uuid.uuid4())
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    tasks[task_id] = {"status": "processing", "progress": 0, "result": None}
    
    # Run in background
    duration_limit = 60 if fast_mode else 360
    asyncio.create_task(run_separation_task(task_id, file_location, duration_limit, False, turbo_mode))
    
    return {"task_id": task_id, "status": "queued"}

async def run_separation_task(task_id, file_location, duration_limit, vocals_only=False, turbo_mode=False):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, separate_audio, file_location, PROCESSED_DIR, duration_limit, vocals_only, turbo_mode)
        tasks[task_id] = {"status": "completed", "progress": 100, "result": result}
    except Exception as e:
        tasks[task_id] = {"status": "error", "message": str(e)}

@app.get("/api/task-status/{task_id}")
async def get_task_status(task_id: str):
    return tasks.get(task_id, {"status": "not_found"})

@app.post("/api/generate")
async def generate_music(mood: str, genre: str, language: str):
    task_id = str(uuid.uuid4())
    prompt = f"{mood} {genre}"
    output_filename = f"generated_{mood}_{language}.wav"
    output_path = os.path.join(PROCESSED_DIR, output_filename)
    
    tasks[task_id] = {"status": "processing", "progress": 0, "result": None}
    
    # Run in background
    asyncio.create_task(run_generate_task(task_id, prompt, language, output_filename, output_path))
    
    return {"task_id": task_id, "status": "queued"}

async def run_generate_task(task_id, prompt, language, output_filename, output_path):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, generate_track, prompt, language, 15, output_path)
        tasks[task_id] = {"status": "completed", "file": output_filename, "result": result}
    except Exception as e:
        print(f"Generation error: {e}")
        tasks[task_id] = {"status": "error", "message": str(e)}

from mixer import mix_stems_with_volumes, mix_two_tracks
from fastapi.responses import FileResponse
from pydantic import BaseModel

class MixRequest(BaseModel):
    stems_dir: str
    volumes: dict
    mood: str = None
    genre: str = None

@app.post("/api/mix")
async def mix_stems(request: MixRequest):
    """Mix separated stems with volume levels and mood effects"""
    output_filename = f"mixed_{request.mood or 'custom'}.wav"
    output_path = os.path.join(PROCESSED_DIR, output_filename)
    
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, 
        mix_stems_with_volumes, 
        request.stems_dir, 
        request.volumes, 
        output_path, 
        request.mood,
        request.genre
    )
    
    if result["status"] == "success":
        return {"status": "success", "file": output_filename}
    return result

@app.post("/api/mix-two-files")
async def mix_two_files(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    blend_ratio: float = 0.5,
    mood: str = None
):
    """Mix two audio files together with blend ratio and mood effects"""
    # Save uploaded files
    file1_path = f"{UPLOAD_DIR}/{file1.filename}"
    file2_path = f"{UPLOAD_DIR}/{file2.filename}"
    
    with open(file1_path, "wb") as buffer:
        shutil.copyfileobj(file1.file, buffer)
    with open(file2_path, "wb") as buffer:
        shutil.copyfileobj(file2.file, buffer)
    
    output_filename = f"mixed_{mood or 'blend'}_{blend_ratio}.wav"
    output_path = os.path.join(PROCESSED_DIR, output_filename)
    
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        mix_two_tracks,
        file1_path,
        file2_path,
        blend_ratio,
        output_path,
        mood,
        None # genre will be added as a separate param if needed
    )
    
    if result["status"] == "success":
        return {"status": "success", "file": output_filename}
    return result

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Download a processed audio file"""
    file_path = os.path.join(PROCESSED_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path, 
            media_type="audio/wav",
            filename=filename
        )
    return {"status": "error", "message": "File not found"}

@app.post("/api/smart-mix")
async def smart_mix(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    mood: str = None,
    genre: str = None,
    fast_mode: bool = False,
    turbo_mode: bool = False
):
    """Vocals from file1 + Instrumental from file2"""
    task_id = str(uuid.uuid4())
    
    # Save uploaded files
    file1_path = f"{UPLOAD_DIR}/smart_{file1.filename}"
    file2_path = f"{UPLOAD_DIR}/smart_{file2.filename}"
    
    with open(file1_path, "wb") as buffer:
        shutil.copyfileobj(file1.file, buffer)
    with open(file2_path, "wb") as buffer:
        shutil.copyfileobj(file2.file, buffer)
    
    tasks[task_id] = {"status": "processing", "progress": 0, "result": None}
    
    # Run in background
    duration_limit = 60 if fast_mode else 360
    asyncio.create_task(run_smart_mix_task(task_id, file1_path, file2_path, mood, genre, duration_limit, turbo_mode))
    
    return {"task_id": task_id, "status": "queued"}

async def run_smart_mix_task(task_id, file1_path, file2_path, mood, genre, duration_limit, turbo_mode=False):
    try:
        loop = asyncio.get_event_loop()
        # For Smart Mix, we usually need Vocals from track 1 and Instrumental from track 2
        # Track 1: Vocals Only (High priority optimization)
        res1 = await loop.run_in_executor(None, separate_audio, file1_path, PROCESSED_DIR, duration_limit, True, turbo_mode)
        # Track 2: All stems
        res2 = await loop.run_in_executor(None, separate_audio, file2_path, PROCESSED_DIR, duration_limit, False, turbo_mode)
        
        if res1["status"] != "success" or res2["status"] != "success":
            m1 = res1.get('message', '')
            m2 = res2.get('message', '')
            tasks[task_id] = {"status": "error", "message": f"Separation failed: {m1} {m2}"}
            return
        
        # Vocals from 1
        vocal1 = os.path.join(res1["stems_dir"], "vocals.wav")
        # Instrumental from 2
        drum2 = os.path.join(res2["stems_dir"], "drums.wav")
        bass2 = os.path.join(res2["stems_dir"], "bass.wav")
        other2 = os.path.join(res2["stems_dir"], "other.wav")
        
        output_filename = f"smart_mix_{mood or 'remix'}_{genre or 'style'}.wav"
        output_path = os.path.join(PROCESSED_DIR, output_filename)
        
        inputs_arg = ["-i", vocal1, "-i", drum2, "-i", bass2, "-i", other2]
        filter_complex = "[0:a]volume=1.2[v];[1:a]volume=1.0[d];[2:a]volume=1.0[b];[3:a]volume=0.8[o];[v][d][b][o]amix=inputs=4:duration=longest"
        
        from mixer import get_mood_filter, get_genre_filter
        mood_f = get_mood_filter(mood)
        genre_f = get_genre_filter(genre)
        
        effects = ""
        if mood_f: effects += f",{mood_f}"
        if genre_f: effects += f",{genre_f}"
        filter_complex += f"{effects}[out]"
        
        import subprocess
        command = ["ffmpeg", "-y"]
        command.extend(inputs_arg)
        command.extend(["-filter_complex", filter_complex, "-map", "[out]", output_path])
        
        print(f"Running Smart Mix command: {' '.join(command)}")
        await loop.run_in_executor(None, lambda: subprocess.run(command, check=True, capture_output=True))
        tasks[task_id] = {"status": "completed", "file": output_filename}
    except Exception as e:
        tasks[task_id] = {"status": "error", "message": f"Smart mix failed: {str(e)}"}

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)

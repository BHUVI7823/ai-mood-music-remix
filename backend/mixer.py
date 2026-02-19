import subprocess
import os
import json
from typing import Dict, List

def mix_stems_with_volumes(stems_dir: str, volumes: Dict[str, float], output_path: str, mood: str = None, genre: str = None):
    """
    Mix separated stems with specified volume levels and optional mood/genre effects.
    """
    stem_files = {
        'vocals': os.path.join(stems_dir, 'vocals.wav'),
        'drums': os.path.join(stems_dir, 'drums.wav'),
        'bass': os.path.join(stems_dir, 'bass.wav'),
        'other': os.path.join(stems_dir, 'other.wav')
    }
    
    # Check which stems exist
    inputs = []
    filter_parts = []
    idx = 0
    for name, path in stem_files.items():
        if os.path.exists(path):
            volume = volumes.get(name, 1.0)
            inputs.extend(["-i", path])
            filter_parts.append(f"[{idx}:a]volume={volume}[a{idx}]")
            idx += 1
    
    if not inputs:
        return {"status": "error", "message": "No stem files found"}
    
    num_stems = len(inputs) // 2
    
    # Build filter complex
    all_inputs = "".join([f"[a{i}]" for i in range(num_stems)])
    
    # Mix and then apply effects
    mood_filter = get_mood_filter(mood)
    genre_filter = get_genre_filter(genre)
    
    effects = ""
    if mood_filter:
        effects += f",{mood_filter}"
    if genre_filter:
        effects += f",{genre_filter}"
    
    # amix requires at least 2 inputs. If only 1, just pass through to effects.
    if num_stems > 1:
        mix_part = f"{all_inputs}amix=inputs={num_stems}:duration=longest{effects}[out]"
    else:
        # If 1 input, the label is [a0]
        mix_part = f"[a0]anull{effects}[out]"
        
    filter_complex = ";".join(filter_parts) + f";{mix_part}"
    
    command = ["ffmpeg", "-y"]
    command.extend(inputs)
    command.extend(["-filter_complex", filter_complex, "-map", "[out]", output_path])
    
    try:
        print(f"Running FFmpeg command: {' '.join(command)}")
        result = subprocess.run(command, check=True, capture_output=True, text=True, encoding='utf-8')
        return {"status": "success", "file": output_path}
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg failed with exit code {e.returncode}")
        # Capture only the actual error lines, skipping the banner
        err_lines = (e.stderr or e.stdout).splitlines()
        error_msg = "\n".join([line for line in err_lines if "Error" in line or "Invalid" in line or "failed" in line][-3:])
        if not error_msg: error_msg = err_lines[-1]
        return {"status": "error", "message": f"Mixing failed: {error_msg}"}

def mix_two_tracks(file1_path: str, file2_path: str, blend_ratio: float, output_path: str, mood: str = None, genre: str = None):
    """
    Mix two complete audio tracks together with a blend ratio and effects.
    """
    volume1 = 1.0 - blend_ratio
    volume2 = blend_ratio
    
    mood_filter = get_mood_filter(mood)
    genre_filter = get_genre_filter(genre)
    
    effects = ""
    if mood_filter and genre_filter:
        effects = f",{mood_filter},{genre_filter}"
    elif mood_filter:
        effects = f",{mood_filter}"
    elif genre_filter:
        effects = f",{genre_filter}"
    
    filter_complex = f"[0:a]volume={volume1}[a0];[1:a]volume={volume2}[a1];[a0][a1]amix=inputs=2:duration=longest{effects}[out]"
    
    command = [
        'ffmpeg', '-y',
        '-i', file1_path,
        '-i', file2_path,
        '-filter_complex', filter_complex,
        '-map', '[out]',
        output_path
    ]
    
    try:
        print(f"Running FFmpeg command: {' '.join(command)}")
        result = subprocess.run(command, check=True, capture_output=True, text=True, encoding='utf-8')
        return {"status": "success", "file": output_path}
    except subprocess.CalledProcessError as e:
        err = e.stderr if e.stderr else e.stdout
        return {"status": "error", "message": f"Mixing failed: {err}"}

def get_mood_filter(mood: str) -> str:
    if not mood: return ""
    mood = mood.lower()
    filters = {
        'happy': 'equalizer=f=1000:width_type=h:width=200:g=2,equalizer=f=5000:width_type=h:width=500:g=3,aecho=0.8:0.88:60:0.4',
        'sad': 'equalizer=f=3000:width_type=h:width=1000:g=-6,lowpass=f=2000,aecho=0.8:0.9:1000:0.3',
        'energetic': 'compand=0.3 0.3:0.8 0.8:-70/-60 -20/-14:6:0:-90:0.2,equalizer=f=80:width_type=h:width=40:g=6,equalizer=f=12000:width_type=h:width=1000:g=3',
        'relaxed': 'lowpass=f=5000,aecho=0.8:0.9:1000:0.2,basstreble=bass=-2',
        'chill': 'lowpass=f=8000,aecho=0.8:0.88:60:0.2,equalizer=f=400:width_type=h:width=100:g=-3',
        'romantic': 'aecho=0.8:0.9:1000:0.4,equalizer=f=2000:width_type=h:width=500:g=2,aphaser=in_gain=0.4',
        'dark': 'lowpass=f=3000,equalizer=f=100:width_type=h:width=50:g=4,equalizer=f=2500:width_type=h:width=500:g=-5',
        'mysterious': 'aecho=0.8:0.9:1000:0.6,equalizer=f=4000:width_type=h:width=1000:g=-4,vibrato=f=4:d=0.3',
        'cinematic': 'aecho=0.8:0.9:1000:0.3,compand,equalizer=f=100:width_type=h:width=50:g=3,equalizer=f=10000:width_type=h:width=1000:g=2',
        'epic': 'compand,equalizer=f=80:width_type=h:width=40:g=5,equalizer=f=5000:width_type=h:width=500:g=3,aecho=0.8:0.88:40:0.5'
    }
    return filters.get(mood, "")

def get_genre_filter(genre: str) -> str:
    if not genre: return ""
    genre = genre.lower()
    filters = {
        'pop': 'equalizer=f=1000:width_type=h:width=500:g=2,equalizer=f=8000:width_type=h:width=1000:g=3',
        'rock': 'equalizer=f=400:width_type=h:width=200:g=3,equalizer=f=3000:width_type=h:width=500:g=4',
        'hip hop': 'equalizer=f=60:width_type=h:width=30:g=8,compand=0.3 0.3:0.8 0.8:-70/-60 -20/-14:6:0:-90:0.2',
        'jazz': 'equalizer=f=1000:width_type=h:width=500:g=-2,aecho=0.8:0.9:1000:0.2',
        'classical': 'compand,equalizer=f=5000:width_type=h:width=1000:g=2',
        'electronic': 'equalizer=f=60:width_type=h:width=30:g=5,equalizer=f=12000:width_type=h:width=1000:g=5,aphaser=in_gain=0.5',
        'lo-fi': 'lowpass=f=4000,highpass=f=200,aecho=0.8:0.9:1000:0.1',
        'ambient': 'lowpass=f=3000,aecho=0.8:0.9:2000:0.6',
        'folk': 'equalizer=f=3000:width_type=h:width=500:g=2,equalizer=f=100:width_type=h:width=50:g=-2',
        'reggae': 'equalizer=f=80:width_type=h:width=40:g=6,aecho=0.8:0.9:300:0.4'
    }
    return filters.get(genre, "")

import sys
import os
import subprocess

def separate_audio(input_file: str, output_dir: str, duration_limit: int = 360, vocals_only: bool = False, turbo_preview: bool = False):
    """
    Separates audio into stems using Demucs.
    If turbo_preview is True, it only processes the first 15 seconds for instant feedback.
    """
    if turbo_preview:
        duration_limit = 15
    # Create logs directory if it doesn't exist
    log_file = os.path.abspath(os.path.join(output_dir, "..", "separation_debug.log"))
    
    def log(msg):
        with open(log_file, "a") as f:
            f.write(f"{msg}\n")
        print(msg)

    os.makedirs(output_dir, exist_ok=True)
    
    # Truncate audio if it's over the requested limit
    trimmed_input = input_file
    try:
        # Get duration
        duration_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", input_file]
        duration = float(subprocess.check_output(duration_cmd).decode().strip())
        
        if duration > duration_limit:
            log(f"--- Trimming audio from {duration:.1f}s to {duration_limit}s ---")
            trimmed_input = os.path.join(os.path.dirname(input_file), f"trimmed_{duration_limit}_" + os.path.basename(input_file))
            if not os.path.exists(trimmed_input):
                trim_cmd = ["ffmpeg", "-y", "-i", input_file, "-t", str(duration_limit), "-c", "copy", trimmed_input]
                subprocess.run(trim_cmd, check=True, capture_output=True)
    except Exception as e:
        log(f"Warning: Could not trim audio: {e}")

    # Demucs creates a subdirectory with the track name
    track_name = os.path.splitext(os.path.basename(trimmed_input))[0]
    stems_dir = os.path.join(output_dir, "htdemucs", track_name)
    
    # Check if stems already exist (Caching)
    target_file = "vocals.wav" if vocals_only else "drums.wav"
    if os.path.exists(os.path.join(stems_dir, target_file)):
        log(f"--- Using cached stems for: {track_name} ---")
        return {"status": "success", "stems_dir": stems_dir}

    # Path to the patch script
    patch_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "patch_demucs.py"))
    
    # Command to run our patched Demucs
    command = [
        sys.executable, patch_script,
        "-n", "htdemucs", 
        "-o", output_dir,
        "--segment", "6",
        "--shifts", "0" if turbo_preview else "1", 
        "--overlap", "0.0" if turbo_preview else "0.1", 
        "--jobs", "1",
    ]
    
    if vocals_only:
        command.extend(["--two-stems", "vocals"])
        
    command.append(trimmed_input)
    
    try:
        log(f"--- Starting AI Separation (VocalsOnly={vocals_only}) for: {track_name} ---")
        log(f"Command: {' '.join(command)}")
        
        # Set environment for the subprocess to force soundfile backend
        env = os.environ.copy()
        env["TORCHAUDIO_BACKEND"] = "soundfile"
        
        # Run and capture output to a file instead of memory to prevent buffer issues
        with open(log_file, "a") as f:
            process = subprocess.run(command, stdout=f, stderr=f, text=True, env=env)
        
        # Check if the primary output file actually exists
        vocals_path = os.path.join(stems_dir, "vocals.wav")
        if os.path.exists(vocals_path):
            log(f"--- AI Audio Separation Complete for: {track_name} ---")
            return {"status": "success", "stems_dir": stems_dir}
        else:
            log(f"--- AI Audio Separation Failed: Output not found in {stems_dir} ---")
            return {"status": "error", "message": f"Demucs failed to produce output. Check logs."}
            
    except Exception as e:
        log(f"Unexpected error: {str(e)}")
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}

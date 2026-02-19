$env:Path = $env:Path + ";$PWD\ffmpeg\bin"
cd backend
.\venv\Scripts\activate
python main.py

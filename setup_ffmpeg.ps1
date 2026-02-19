$ErrorActionPreference = "Stop"

Write-Host "Downloading FFmpeg..."
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$outputFile = "ffmpeg.zip"

Invoke-WebRequest -Uri $ffmpegUrl -OutFile $outputFile

Write-Host "Extracting FFmpeg..."
Expand-Archive -Path $outputFile -DestinationPath . -Force

$extractedDir = Get-ChildItem -Directory | Where-Object { $_.Name -like "ffmpeg-*-essentials_build" } | Select-Object -First 1
if ($extractedDir) {
    Rename-Item -Path $extractedDir.FullName -NewName "ffmpeg"
    Write-Host "FFmpeg installed to $PWD\ffmpeg"
    
    # Add to current session path
    $env:Path = "$PWD\ffmpeg\bin;" + $env:Path
    
    # Verify
    ffmpeg -version
    Write-Host "FFmpeg setup complete! You can now run the backend."
} else {
    Write-Error "Could not find extracted FFmpeg directory."
}

Remove-Item $outputFile

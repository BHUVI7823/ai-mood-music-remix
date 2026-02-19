from transformers import AutoProcessor, MusicgenForConditionalGeneration
import scipy.io.wavfile
import torch
import os

# Initialize model (lazy loading or on startup)
processor = None
model = None

def load_model():
    global processor, model
    if model is None:
        processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
        model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
        # Move to GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)

def generate_track(prompt: str, language: str, duration: int = 15, output_path: str = "generated.wav"):
    """
    Generates music based on a text prompt and language style.
    """
    global processor, model
    load_model()
    
    # Map languages to descriptive musical styles
    language_styles = {
        "Tamil": "Tamil film song, Kollywood style, carnatic elements, heavy percussion",
        "Hindi": "Bollywood pop, Indian fusion, rich orchestration, tabla beats",
        "Malayalam": "Melodic Malayalam cinematic, lush strings, coastal folk",
        "Telugu": "Tollywood rhythm, high-energy masala dance track, percussive",
        "Kannada": "Sandalwood hit, traditional folk fusion, rhythmic theme",
        "English": "Billboard top 100 pop, modern production, high quality vocals style",
    }
    
    # Map genres to descriptive keywords
    genre_keywords = {
        "Pop": "catchy melody, commercial production, upbeat",
        "Rock": "distorted guitars, energetic drums, classic rock style",
        "Hip Hop": "booming bass, trap beat, rhythmic flow",
        "Jazz": "saxophone, swing rhythm, lounge atmosphere, piano",
        "Classical": "orchestral, grand symphony, strings and woodwinds",
        "Electronic": "synthesizers, digital beats, techno influence, rave",
        "Lo-fi": "chill beat, muffled sound, relaxed, vinyl crackle",
        "Ambient": "soothing, atmospheric, no heavy beats, ethereal",
        "Folk": "acoustic guitar, organic sound, traditional storytelling",
        "Reggae": "offbeat rhythm, deep bass, island vibe"
    }
    
    style_desc = language_styles.get(language, f"{language} regional music style")
    genre_desc = genre_keywords.get(prompt.split()[-1], "") # Assuming prompt ends with genre
    
    full_prompt = f"{prompt}, {genre_desc}, {style_desc}, high fidelity, 44.1khz, studio master"
    print(f"Generating with prompt: {full_prompt}")
    
    inputs = processor(
        text=[full_prompt],
        padding=True,
        return_tensors="pt",
    ).to(model.device)
    
    # Generate - 250 tokens is approx 5-6 seconds, faster than 400 for CPU
    # guidance_scale=3.0 provides good style matching without extra compute
    audio_values = model.generate(**inputs, max_new_tokens=250, guidance_scale=3.0)
    
    # Save to file
    sampling_rate = model.config.audio_encoder.sampling_rate
    import torch
    data = audio_values[0, 0].cpu().numpy()
    scipy.io.wavfile.write(output_path, rate=sampling_rate, data=data)
    
    return {"status": "success", "file": output_path}

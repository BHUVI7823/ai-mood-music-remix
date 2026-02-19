import torchaudio
import soundfile as sf
import torch
import os

def patched_save(uri, src, sample_rate, encoding=None, bits_per_sample=None, **kwargs):
    """
    A minimal replacement for torchaudio.save that uses soundfile.
    This bypasses the broken torchcodec requirement in torchaudio 2.10.x.
    """
    try:
        # Convert torch tensor (C, N) to numpy (N, C) for soundfile
        if isinstance(src, torch.Tensor):
            data = src.t().cpu().numpy()
        else:
            data = src
            
        subtype = None
        if bits_per_sample == 16:
            subtype = 'PCM_16'
        elif bits_per_sample == 24:
            subtype = 'PCM_24'
        elif bits_per_sample == 32:
            subtype = 'PCM_32'
            
        sf.write(uri, data, sample_rate, subtype=subtype)
        print(f"--- Patch: Successfully saved {uri} using soundfile ---")
    except Exception as e:
        print(f"--- Patch Error: Failed to save {uri}: {e} ---")
        # Fallback to original if something is weird, though it might fail
        # orig_save(uri, src, sample_rate, encoding=encoding, bits_per_sample=bits_per_sample, **kwargs)

# Apply the monkey patch
torchaudio.save = patched_save

# Now run demucs
from demucs.separate import main
if __name__ == "__main__":
    main()

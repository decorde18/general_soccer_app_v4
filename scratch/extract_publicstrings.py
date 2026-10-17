import os
from oletools.olevba import decompress_stream

blob_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62543_UPOOOHJYPZANMDZXLXLXIVEFNCSM.bin"
with open(blob_path, "rb") as f:
    blob = f.read()

decomp = decompress_stream(blob[2925:])
text = decomp.decode("latin1", errors="ignore")
out_path = "D:/Development/general_soccer_app_v4/scratch/extracted_vba/PublicStrings.vba"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Extracted PublicStrings ({len(text.splitlines())} lines) to {out_path}")

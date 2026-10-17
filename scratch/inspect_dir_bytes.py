from oletools.olevba import decompress_stream

dir_stream_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62571_dir.bin"
with open(dir_stream_path, "rb") as f:
    dir_compressed = f.read()

dir_bytes = decompress_stream(dir_compressed)
print("First 200 bytes hex:")
print(dir_bytes[:200].hex())

# Let's search for "PublicSubs" or "Form_CareerStats" in dir_bytes
for name in [b"PublicSubs", b"PublicStrings", b"Form_CareerStats", b"Form_GameStatsFormVersion3"]:
    idx = dir_bytes.find(name)
    print(f"Index of {name}: {idx}")
    if idx != -1:
        start = max(0, idx - 20)
        end = min(len(dir_bytes), idx + len(name) + 40)
        print("  Context hex:", dir_bytes[start:end].hex())
        print("  Context ascii:", dir_bytes[start:end])

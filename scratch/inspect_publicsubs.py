from oletools.olevba import decompress_stream

dir_stream_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62571_dir.bin"
with open(dir_stream_path, "rb") as f:
    dir_compressed = f.read()

dir_bytes = decompress_stream(dir_compressed)
idx = dir_bytes.find(b"PublicSubs")
chunk = dir_bytes[idx:idx+150]
print("Chunk hex:", chunk.hex())
print("Chunk bytes:", chunk)

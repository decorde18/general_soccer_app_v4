import struct
from oletools.olevba import decompress_stream

dir_stream_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62571_dir.bin"
with open(dir_stream_path, "rb") as f:
    dir_compressed = f.read()

dir_bytes = decompress_stream(dir_compressed)
idx = dir_bytes.find(b"PublicSubs")
offset_marker = dir_bytes.find(b"\x31\x00\x04\x00\x00\x00", idx)
offset_val = struct.unpack("<I", dir_bytes[offset_marker+6:offset_marker+10])[0]
print(f"PublicSubs offset: {offset_val}")

stream_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62537_VOVSNDMJOYEHEEENIEZOJUPFYIVK.bin"
with open(stream_path, "rb") as f:
    stream_data = f.read()

print(f"Stream data length: {len(stream_data)}")
decomp = decompress_stream(stream_data[offset_val:])
text = decomp.decode("latin1", errors="ignore")
print(f"Successfully decompressed PublicSubs! Code length: {len(text)} chars, lines: {len(text.splitlines())}")
print("First 30 lines of PublicSubs:")
for l in text.splitlines()[:30]:
    print("  ", l)

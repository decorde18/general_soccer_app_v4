import struct
import os
import re
from oletools.olevba import decompress_stream

dir_stream_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62571_dir.bin"
with open(dir_stream_path, "rb") as f:
    dir_compressed = f.read()

dir_bytes = decompress_stream(dir_compressed)
print(f"Decompressed dir length: {len(dir_bytes)}")

# Map of blob files: {stream_name_upper: file_path}
blobs_dir = "D:/Development/general_soccer_app_v4/scratch/vba_blobs"
blob_files = {}
for fname in os.listdir(blobs_dir):
    parts = fname.split("_", 1)
    if len(parts) == 2 and parts[1].endswith(".bin"):
        sname = parts[1][:-4]
        blob_files[sname.upper()] = os.path.join(blobs_dir, fname)

out_dir = "D:/Development/general_soccer_app_v4/scratch/extracted_vba"
os.makedirs(out_dir, exist_ok=True)

# Parse records properly
# In MS-OVBA, records in MODULE stream sequence:
# 0x0019: MODULENAME (2 bytes tag, 4 bytes len, string)
# ...
# 0x001A: MODULESTREAMNAME (2 bytes tag, 4 bytes len, string)
# ...
# 0x0031: MODULEOFFSET (2 bytes tag, 4 bytes len = 4, uint32 offset)
# ...
# 0x002B: MODULETERMINATOR (2 bytes tag, 4 bytes len = 0)

modules = []
pos = 0
while pos < len(dir_bytes) - 6:
    tag = struct.unpack("<H", dir_bytes[pos:pos+2])[0]
    size = struct.unpack("<I", dir_bytes[pos+2:pos+6])[0]
    
    if tag == 0x0019: # MODULENAME
        mod_name = dir_bytes[pos+6:pos+6+size].decode("latin1", errors="ignore")
        # search within next 600 bytes for 0x001A and 0x0031
        sub_chunk = dir_bytes[pos+6+size : pos+6+size+800]
        s_idx = sub_chunk.find(b"\x1a\x00")
        o_idx = sub_chunk.find(b"\x31\x00\x04\x00\x00\x00")
        
        if s_idx != -1 and o_idx != -1:
            ssize = struct.unpack("<I", sub_chunk[s_idx+2:s_idx+6])[0]
            stream_name = sub_chunk[s_idx+6:s_idx+6+ssize].decode("latin1", errors="ignore")
            offset = struct.unpack("<I", sub_chunk[o_idx+6:o_idx+10])[0]
            modules.append({
                "name": mod_name,
                "stream_name": stream_name,
                "offset": offset
            })
            pos = pos + 6 + size + max(s_idx, o_idx) + 10
            continue
    pos += 1

print(f"Found {len(modules)} modules to extract.")

extracted_count = 0
for m in modules:
    name = m["name"]
    stream_name = m["stream_name"]
    offset = m["offset"]
    
    blob_path = blob_files.get(stream_name.upper())
    if not blob_path:
        # print safely
        # print(f"  Missing blob for {name}")
        continue
    
    with open(blob_path, "rb") as f:
        blob_data = f.read()
    
    try:
        decomp = decompress_stream(blob_data[offset:])
        code = decomp.decode("latin1", errors="ignore")
        clean_name = re.sub(r'[\\/*?:"<>|]', '_', name)
        out_file = os.path.join(out_dir, f"{clean_name}.vba")
        with open(out_file, "w", encoding="utf-8") as out_f:
            out_f.write(code)
        print(f"  Extracted {clean_name} ({len(code.splitlines())} lines)")
        extracted_count += 1
    except Exception as e:
        # If exact offset failed, scan around offset for 0x01
        found = False
        for o in range(max(0, offset - 128), min(len(blob_data), offset + 128)):
            if blob_data[o] == 0x01:
                try:
                    decomp = decompress_stream(blob_data[o:])
                    code = decomp.decode("latin1", errors="ignore")
                    clean_name = re.sub(r'[\\/*?:"<>|]', '_', name)
                    out_file = os.path.join(out_dir, f"{clean_name}.vba")
                    with open(out_file, "w", encoding="utf-8") as out_f:
                        out_f.write(code)
                    print(f"  Extracted {clean_name} via search @ {o} ({len(code.splitlines())} lines)")
                    extracted_count += 1
                    found = True
                    break
                except Exception:
                    pass
        if not found:
            print(f"  Failed: {name} ({stream_name} @ {offset}): {e}")

print(f"\nDone: Extracted {extracted_count} / {len(modules)} VBA modules into {out_dir}")

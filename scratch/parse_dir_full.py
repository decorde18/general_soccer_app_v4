import struct
import os
from oletools.olevba import decompress_stream

dir_stream_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62571_dir.bin"
with open(dir_stream_path, "rb") as f:
    dir_compressed = f.read()

dir_bytes = decompress_stream(dir_compressed)
print(f"Decompressed dir length: {len(dir_bytes)}")

# Parse records from decompressed dir stream
pos = 0
modules = []
current_module = {}

while pos < len(dir_bytes):
    if pos + 6 > len(dir_bytes):
        break
    tag = struct.unpack("<H", dir_bytes[pos:pos+2])[0]
    size = struct.unpack("<I", dir_bytes[pos+2:pos+6])[0]
    pos += 6
    if pos + size > len(dir_bytes):
        data = dir_bytes[pos:]
        pos = len(dir_bytes)
    else:
        data = dir_bytes[pos:pos+size]
        pos += size

    # Tags:
    # 0x0009: PROJECTSYSKIND
    # 0x0019: MODULENAME
    # 0x001A: MODULESTREAMNAME
    # 0x0031: MODULEOFFSET
    # 0x002B: MODULEEND
    if tag == 0x0019: # MODULENAME
        mod_name = data.decode("latin1", errors="ignore")
        if current_module and "name" in current_module:
            modules.append(current_module)
        current_module = {"name": mod_name}
    elif tag == 0x001A: # MODULESTREAMNAME
        stream_name = data.decode("latin1", errors="ignore")
        current_module["stream_name"] = stream_name
    elif tag == 0x0032: # MODULESTREAMNAME (Unicode)
        stream_name_u = data.decode("utf-16le", errors="ignore")
        current_module["stream_name_u"] = stream_name_u
    elif tag == 0x0031: # MODULEOFFSET
        if len(data) >= 4:
            offset = struct.unpack("<I", data[:4])[0]
            current_module["offset"] = offset
    elif tag == 0x002B: # MODULEEND
        if current_module and "name" in current_module:
            modules.append(current_module)
        current_module = {}

if current_module and "name" in current_module:
    modules.append(current_module)

print(f"Found {len(modules)} modules in dir stream:")
out_dir = "D:/Development/general_soccer_app_v4/scratch/extracted_vba"
os.makedirs(out_dir, exist_ok=True)

# Build a lookup of available blob files by stream name
blob_files = {}
for fname in os.listdir("D:/Development/general_soccer_app_v4/scratch/vba_blobs"):
    # filename format: {id}_{stream_name}.bin
    parts = fname.split("_", 1)
    if len(parts) == 2 and parts[1].endswith(".bin"):
        sname = parts[1][:-4]
        blob_files[sname] = os.path.join("D:/Development/general_soccer_app_v4/scratch/vba_blobs", fname)

success_count = 0
for m in modules:
    name = m.get("name")
    stream_name = m.get("stream_name", "")
    offset = m.get("offset", 0)
    
    # Try finding the blob file
    target_file = blob_files.get(stream_name)
    if not target_file:
        # try case insensitive match
        for sn, path in blob_files.items():
            if sn.lower() == stream_name.lower():
                target_file = path
                break
    
    if target_file and os.path.exists(target_file):
        with open(target_file, "rb") as f:
            blob = f.read()
        
        # Decompress from offset
        decomp = None
        # Try exact offset
        try:
            decomp = decompress_stream(blob[offset:])
        except Exception:
            # If exact offset failed, scan around offset
            for o in range(max(0, offset - 100), min(len(blob), offset + 100)):
                if blob[o] == 0x01:
                    try:
                        decomp = decompress_stream(blob[o:])
                        break
                    except Exception:
                        pass
        
        if decomp:
            text = decomp.decode("latin1", errors="ignore")
            out_file = os.path.join(out_dir, f"{name}.vba")
            with open(out_file, "w", encoding="utf-8") as out_f:
                out_f.write(text)
            print(f"  [OK] {name} (Stream: {stream_name}, Offset: {offset}, Lines: {len(text.splitlines())})")
            success_count += 1
        else:
            print(f"  [FAIL] {name} (Stream: {stream_name}, Offset: {offset}, FileSize: {len(blob)})")
    else:
        print(f"  [MISSING STREAM] {name} (Stream: {stream_name})")

print(f"\nExtracted {success_count} / {len(modules)} modules successfully!")

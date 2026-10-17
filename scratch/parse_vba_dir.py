import os
import glob
from oletools.olevba import decompress_stream

dir_stream_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62571_dir.bin"
with open(dir_stream_path, "rb") as f:
    dir_data = f.read()

print(f"dir_data len: {len(dir_data)}")

# Try decompressing dir stream
try:
    decompressed_dir = decompress_stream(dir_data)
    print(f"Decompressed dir len: {len(decompressed_dir)}")
except Exception as e:
    print(f"Dir stream decompress error: {e}")
    decompressed_dir = dir_data

# Let's inspect bytes in decompressed dir or search for module names
# Let's see what PROJECT file has:
project_path = "D:/Development/general_soccer_app_v4/scratch/vba_blobs/62573_PROJECT.bin"
if os.path.exists(project_path):
    with open(project_path, "r", errors="ignore") as f:
        proj_lines = f.readlines()
    print("Project items:")
    for line in proj_lines:
        line = line.strip()
        if line.startswith("DocClass=") or line.startswith("Module=") or line.startswith("Class="):
            print("  ", line)

# Let's test decompressing every stream in vba_blobs
out_dir = "D:/Development/general_soccer_app_v4/scratch/extracted_vba"
os.makedirs(out_dir, exist_ok=True)

bin_files = glob.glob("D:/Development/general_soccer_app_v4/scratch/vba_blobs/*.bin")
print(f"\nProcessing {len(bin_files)} binary streams...")

decompressed_count = 0
for bf in bin_files:
    fname = os.path.basename(bf)
    if fname.startswith("62571_dir") or fname.startswith("62573_PROJECT") or fname.startswith("62572_PROJECTwm"):
        continue
    with open(bf, "rb") as f:
        data = f.read()
    if len(data) < 10:
        continue
    
    # In MS-OVBA, module streams begin with performance cache or headers,
    # followed by compressed source code. Let's find where the compressed source code begins
    # (starts with 0x01 or magic byte, or we try offsets).
    # Or let's test offsets 0, 1, 2, ... or scan for 0x01
    success = False
    for offset in range(0, min(1000, len(data))):
        if data[offset] == 0x01: # standard MS-OVBA compression header flag
            try:
                code = decompress_stream(data[offset:])
                if b"Attribute VB_Name" in code or b"Sub " in code or b"Function " in code or b"Option Compare" in code or b"Dim " in code:
                    text = code.decode("latin1", errors="ignore")
                    # Try to extract module name from text
                    mod_name = fname
                    for line in text.splitlines()[:15]:
                        if "Attribute VB_Name" in line:
                            mod_name = line.split('"')[1]
                            break
                    out_path = os.path.join(out_dir, f"{mod_name}.vba")
                    with open(out_path, "w", encoding="utf-8") as out_f:
                        out_f.write(text)
                    print(f"Extracted {mod_name} from {fname} (offset {offset}, code len {len(text)})")
                    decompressed_count += 1
                    success = True
                    break
            except Exception:
                pass

print(f"\nSuccessfully decompressed {decompressed_count} VBA modules/forms into {out_dir}!")

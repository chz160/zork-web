#!/usr/bin/env python3
"""
Zork dtextc.dat Text Extractor (CORRECT ALGORITHM)

This script extracts and decrypts text from the Zork/Dungeon dtextc.dat file.
The encryption algorithm was found in dsub.c:

    i ^= zkey[x & 0xf] ^ (x & 0xff);

Where:
- zkey = "IanLanceTaylorJr" (16 characters)
- x is the position counter starting from the byte offset
- Each encrypted byte is XORed with BOTH the key character AND the position

Based on the actual source code from dsub.c
"""

import struct
import sys
import os


def read_int16_be(f):
    """Read a 16-bit big-endian signed integer"""
    bytes_data = f.read(2)
    if len(bytes_data) < 2:
        return None
    value = struct.unpack('>h', bytes_data)[0]
    return value


def read_multiple_ints(f, count):
    """Read multiple 16-bit integers"""
    values = []
    for _ in range(count):
        val = read_int16_be(f)
        if val is None:
            break
        values.append(val)
    return values


def read_partial_ints(f, max_count):
    """Read sparse array (index-value pairs) until terminator"""
    values = {}
    
    while True:
        if max_count < 255:
            index_byte = f.read(1)
            if not index_byte:
                break
            index = ord(index_byte)
            if index == 255:
                break
        else:
            index = read_int16_be(f)
            if index is None or index == -1:
                break
        
        value = read_int16_be(f)
        if value is not None:
            values[index] = value
    
    return values


def read_flags(f, count):
    """Read single-byte boolean flags"""
    flags = []
    for _ in range(count):
        byte = f.read(1)
        if not byte:
            break
        flags.append(ord(byte) != 0)
    return flags


def decrypt_text(data, start_offset):
    """
    Decrypt text using the actual algorithm from dsub.c
    
    From the source code:
        const char *zkey = "IanLanceTaylorJr";
        i ^= zkey[x & 0xf] ^ (x & 0xff);
    
    Where x is the byte position counter
    """
    zkey = b"IanLanceTaylorJr"
    decrypted = bytearray()
    
    x = start_offset
    for encrypted_byte in data:
        # Apply the decryption formula from dsub.c line 99
        key_char = zkey[x & 0xf]
        position_xor = x & 0xff
        decrypted_byte = encrypted_byte ^ key_char ^ position_xor
        decrypted.append(decrypted_byte)
        x += 1
    
    return bytes(decrypted)


def skip_metadata(f):
    """
    Skip all metadata and return text start position
    """
    print("Reading dtextc.dat metadata...")
    
    # Read version header (3 integers)
    vmaj = read_int16_be(f)
    vmin = read_int16_be(f)
    vedit = read_int16_be(f)
    print(f"Version: {vmaj}.{vmin}{chr(vedit) if vedit < 128 else ''}")
    
    # Read game parameters (3 integers)
    mxscor = read_int16_be(f)
    strbit = read_int16_be(f)
    egmxsc = read_int16_be(f)
    print(f"Max Score: {mxscor}, STRBIT: {strbit} (0x{strbit:04x}), Endgame Max: {egmxsc}")
    
    # Rooms data
    rlnt = read_int16_be(f)
    print(f"Reading {rlnt} rooms...")
    read_multiple_ints(f, rlnt)  # rdesc1
    read_multiple_ints(f, rlnt)  # rdesc2
    read_multiple_ints(f, rlnt)  # rexit
    read_partial_ints(f, rlnt)   # ractio
    read_partial_ints(f, rlnt)   # rval
    read_multiple_ints(f, rlnt)  # rflag
    
    # Exits/Travel data
    xlnt = read_int16_be(f)
    print(f"Reading {xlnt} exits...")
    read_multiple_ints(f, xlnt)  # travel
    
    # Objects data
    olnt = read_int16_be(f)
    print(f"Reading {olnt} objects...")
    read_multiple_ints(f, olnt)  # odesc1
    read_multiple_ints(f, olnt)  # odesc2
    read_partial_ints(f, olnt)   # odesco
    read_partial_ints(f, olnt)   # oactio
    read_multiple_ints(f, olnt)  # oflag1
    read_partial_ints(f, olnt)   # oflag2
    read_partial_ints(f, olnt)   # ofval
    read_partial_ints(f, olnt)   # otval
    read_multiple_ints(f, olnt)  # osize
    read_partial_ints(f, olnt)   # ocapac
    read_multiple_ints(f, olnt)  # oroom
    read_partial_ints(f, olnt)   # oadv
    read_partial_ints(f, olnt)   # ocan
    read_partial_ints(f, olnt)   # oread
    
    # Secondary room data
    r2lnt = read_int16_be(f)
    print(f"Reading {r2lnt} room2 entries...")
    read_multiple_ints(f, r2lnt)  # oroom2
    read_multiple_ints(f, r2lnt)  # rroom2
    
    # Clock events
    clnt = read_int16_be(f)
    print(f"Reading {clnt} clock events...")
    read_multiple_ints(f, clnt)  # ctick
    read_multiple_ints(f, clnt)  # cactio
    read_flags(f, clnt)           # cflag
    
    # Villains
    vlnt = read_int16_be(f)
    print(f"Reading {vlnt} villains...")
    read_multiple_ints(f, vlnt)  # villns
    read_partial_ints(f, vlnt)   # vprob
    read_partial_ints(f, vlnt)   # vopps
    read_multiple_ints(f, vlnt)  # vbest
    read_multiple_ints(f, vlnt)  # vmelee
    
    # Adventurers
    alnt = read_int16_be(f)
    print(f"Reading {alnt} adventurers...")
    read_multiple_ints(f, alnt)  # aroom
    read_partial_ints(f, alnt)   # ascore
    read_partial_ints(f, alnt)   # avehic
    read_multiple_ints(f, alnt)  # aobj
    read_multiple_ints(f, alnt)  # aactio
    read_multiple_ints(f, alnt)  # astren
    read_partial_ints(f, alnt)   # aflag
    
    # Message metadata
    mbase = read_int16_be(f)
    mlnt = read_int16_be(f)
    print(f"Reading {mlnt} message indices (mbase={mbase})...")
    message_indices = read_multiple_ints(f, mlnt)
    
    # Current position is where text starts!
    text_start_pos = f.tell()
    print(f"\nText data starts at byte offset: {text_start_pos}")
    
    return text_start_pos, message_indices


def extract_messages(f, start_pos, message_indices):
    """
    Extract and decrypt all messages from the file
    """
    f.seek(start_pos)
    encrypted_data = f.read()
    
    print(f"\nDecrypting {len(encrypted_data)} bytes using IanLanceTaylorJr algorithm...")
    
    # Decrypt the entire text section
    # The position counter x starts at 0 for the text section
    decrypted_data = decrypt_text(encrypted_data, 0)
    
    # Check decryption quality
    printable_count = sum(1 for b in decrypted_data if 32 <= b <= 126 or b in (9, 10, 13, 0))
    quality = printable_count / len(decrypted_data) if len(decrypted_data) > 0 else 0
    print(f"Decryption quality: {quality*100:.1f}% printable characters")
    
    # Extract individual messages
    # Messages are stored in 8-byte records
    messages = []
    for i in range(0, len(decrypted_data), 8):
        chunk = decrypted_data[i:i+8]
        
        # Find null terminator
        null_pos = chunk.find(b'\0')
        if null_pos != -1:
            chunk = chunk[:null_pos]
        
        if len(chunk) > 0:
            try:
                text = chunk.decode('ascii', errors='replace')
                # Filter out non-printable junk
                if any(c.isprintable() or c in '\n\r\t' for c in text):
                    messages.append(text)
            except:
                pass
    
    # Also try extracting as continuous null-terminated strings
    continuous_messages = []
    current_string = bytearray()
    
    for byte in decrypted_data:
        if byte == 0:  # Null terminator
            if len(current_string) > 2:
                try:
                    text = current_string.decode('ascii', errors='replace')
                    if sum(c.isprintable() or c in '\n\r\t' for c in text) / len(text) > 0.7:
                        continuous_messages.append(text)
                except:
                    pass
            current_string = bytearray()
        elif 32 <= byte <= 126 or byte in (9, 10, 13):
            current_string.append(byte)
        else:
            if len(current_string) > 2:
                try:
                    text = current_string.decode('ascii', errors='replace')
                    continuous_messages.append(text)
                except:
                    pass
            current_string = bytearray()
    
    # Use whichever extraction method gives more/better results
    if len(continuous_messages) > len(messages):
        messages = continuous_messages
    
    return messages, quality


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_zork_final.py <dtextc.dat> [output.txt]")
        print("\nThis script uses the ACTUAL decryption algorithm from dsub.c:")
        print("  Key: 'IanLanceTaylorJr'")
        print("  Algorithm: byte ^= zkey[pos & 0xf] ^ (pos & 0xff)")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "zork_text_DECRYPTED.txt"
    
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found!")
        sys.exit(1)
    
    print("=" * 70)
    print("ZORK TEXT DECRYPTOR")
    print("Using actual algorithm from dsub.c source code")
    print("=" * 70)
    print(f"\nInput:  {input_file}")
    print(f"Output: {output_file}\n")
    
    try:
        with open(input_file, 'rb') as f:
            # Read metadata and get text start position
            text_start, message_indices = skip_metadata(f)
            
            # Extract and decrypt messages
            messages, quality = extract_messages(f, text_start, message_indices)
            
            print(f"\n{'='*70}")
            print(f"✓ Successfully extracted {len(messages)} text strings!")
            print(f"{'='*70}")
            
            # Write to output file
            with open(output_file, 'w', encoding='utf-8') as out:
                out.write("=" * 70 + "\n")
                out.write("ZORK/DUNGEON TEXT EXTRACTION\n")
                out.write(f"From file: {input_file}\n")
                out.write(f"Decryption: IanLanceTaylorJr algorithm\n")
                out.write(f"Quality: {quality*100:.1f}% printable\n")
                out.write("=" * 70 + "\n\n")
                
                for i, msg in enumerate(messages, 1):
                    out.write(f"[{i}] ")
                    out.write(msg)
                    out.write("\n")
                    # out.write("-" * 70 + "\n")
            
            print(f"\n✓ Text saved to: {output_file}")
            
            # Show preview
            if messages and quality > 0.8:
                #print("\n" + "="*70)
                print("PREVIEW - First 5 messages:")
                print("="*70)
                for i, msg in enumerate(messages[:5], 1):
                    print(f"\n[{i}]")
                    preview = msg[:200].replace('\n', ' ')
                    print(preview + ("..." if len(msg) > 200 else ""))
            
            if quality < 0.8:
                print("\n⚠ Note: Decryption quality is lower than expected.")
                print("The messages may still be partially encoded.")
    
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
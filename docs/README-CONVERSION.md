# Zork Data Conversion Documentation

This directory contains comprehensive documentation for converting original Zork source code and data files to the JSON format used by the Angular implementation.

## 📚 Documentation Overview

### C Source Analysis (NEW)

**For converting from the C implementation and dtextc.dat binary format:**

1. **[C-SOURCE-TEXT-ANALYSIS.md](./C-SOURCE-TEXT-ANALYSIS.md)** (29KB)
   - **Purpose**: Deep technical analysis of how the C implementation stores and assembles text
   - **Audience**: Developers who need to understand the binary format and text encryption
   - **Contains**:
     - Text storage architecture (8-byte chunks, encryption)
     - Data structure analysis (rooms, objects, verbs)
     - Message assembly mechanism (rspeak, rspsub, rspsb2)
     - Complete technical reference with C code examples
   - **Use when**: You need to understand how dtextc.dat works or convert from C source

2. **[CONVERSION-GUIDE.md](./CONVERSION-GUIDE.md)** (11KB)
   - **Purpose**: Practical quick-start guide with Python templates
   - **Audience**: Developers ready to do the conversion work
   - **Contains**:
     - Step-by-step conversion process
     - Python code templates for parsing dtextc.dat
     - JSON conversion examples
     - Validation checklist
   - **Use when**: You're actively converting C data to JSON

### ZIL Source Analysis (EXISTING)

**For converting from the 1980 ZIL (MDL) source code:**

3. **[DATA-CONVERSION-ANALYSIS.md](./DATA-CONVERSION-ANALYSIS.md)** (7.6KB)
   - Status of ZIL-to-JSON conversion (✅ 100% complete)
   - Analysis of what entities exist in different versions
   - Validation issues and how they were resolved

4. **[CONVERSION-EXAMPLE.md](./CONVERSION-EXAMPLE.md)** (3.8KB)
   - Example ZIL → JSON conversion
   - Shows input/output format
   - Demonstrates the conversion tool usage

5. **[DATA-CONVERSION-STATUS.md](./DATA-CONVERSION-STATUS.md)** (4.8KB)
   - Current status of data conversion efforts
   - What's complete and what's remaining

## 🎯 Which Documents Should You Use?

### Scenario 1: Converting from C Source Files

**You have**: `/docs/original-src-c/` with C files and `dtextc.dat`

**Read these documents in order**:
1. Start with **CONVERSION-GUIDE.md** for practical steps
2. Reference **C-SOURCE-TEXT-ANALYSIS.md** when you need technical details
3. Use the existing `decode.py` to decrypt `dtextc.dat` → `dtextc.txt`
4. Write Python scripts to parse binary data and generate JSON

**Why use C source?**
- Most accurate game text (from the official release)
- Includes all game messages and responses
- Binary format is authoritative

### Scenario 2: Converting from ZIL Source Files

**You have**: `/docs/original-src-1980/` with ZIL (`.zil`) files

**Read these documents in order**:
1. Check **DATA-CONVERSION-STATUS.md** to see what's done
2. Use **CONVERSION-EXAMPLE.md** to understand the process
3. Run the existing conversion tool: `npm run convert`
4. Review **DATA-CONVERSION-ANALYSIS.md** for validation issues

**Why use ZIL source?**
- Human-readable source code
- Easier to understand game logic
- Good for understanding design decisions

### Scenario 3: Understanding Both Formats

**You want to**: Compare implementations or verify accuracy

**Read both sets of documents**:
1. **C-SOURCE-TEXT-ANALYSIS.md** - Understand the C implementation
2. **DATA-CONVERSION-ANALYSIS.md** - Understand the ZIL implementation
3. Compare room/object definitions between formats
4. Identify discrepancies or version differences

## 🔄 Conversion Workflow Comparison

### From C Source (dtextc.dat)

```
dtextc.dat (binary)
    ↓ [decode.py]
dtextc.txt (decoded text chunks)
    ↓ [parse arrays from dtextc.dat]
Room/Object indices → Message indices
    ↓ [assemble multi-chunk messages]
Complete text strings
    ↓ [Python conversion script]
rooms.json + objects.json
```

**Pros**:
- Official release version
- Complete game text
- All messages and responses

**Cons**:
- Requires binary parsing
- Text is chunked (8-byte records)
- Encryption must be handled

### From ZIL Source (.zil files)

```
*.zil files (ZIL/MDL source)
    ↓ [npm run convert]
rooms.json + objects.json
```

**Pros**:
- Human-readable source
- Direct conversion
- Easier to understand

**Cons**:
- May differ from final C release
- Some messages might be missing
- Requires ZIL parser

## 📂 Related Resources

### Source Code Locations

- **C Source**: `/docs/original-src-c/` (C implementation, dtextc.dat)
- **1980 ZIL Source**: `/docs/original-src-1980/` (ZIL files)
- **1977 MDL Source**: `/docs/original-src-1977/` (Original MIT MDL)

### Output Locations

- **Rooms JSON**: `/src/app/data/rooms.json`
- **Objects JSON**: `/src/app/data/objects.json`
- **Schemas**: `/docs/schemas/` (validation schemas)

### Tools

- **Text Decoder**: `/docs/original-src-c/decode.py`
- **ZIL Converter**: `npm run convert` (existing tool)

## 🚀 Quick Start

### Option A: Use Existing Data

The repository already has converted data from ZIL source:
- ✅ 110 rooms in `rooms.json`
- ✅ 120 objects in `objects.json`

**No conversion needed!** Just use the existing JSON files.

### Option B: Convert from C Source

If you need to extract from the C implementation:

1. Navigate to C source:
   ```bash
   cd docs/original-src-c
   ```

2. Decode text file (if not done):
   ```bash
   python3 decode.py dtextc.dat dtextc.txt
   ```

3. Follow the **CONVERSION-GUIDE.md** to write a parser

### Option C: Re-convert from ZIL Source

If you want to re-run the ZIL conversion:

1. Check the existing tool:
   ```bash
   npm run convert -- --help
   ```

2. Convert specific files:
   ```bash
   npm run convert -- --source docs/original-src-1980/1dungeon.zil
   ```

## 🧪 Validation

All JSON output should validate against schemas:

- **Room Schema**: `/docs/schemas/room.schema.json`
- **Object Schema**: `/docs/schemas/game-object.schema.json`
- **Verb Schema**: `/docs/schemas/verb.schema.json`

Use a JSON validator or the built-in Angular validation.

## 🤝 Contributing

When adding new conversion documentation:

1. **Be specific about the source format** (C, ZIL, MDL)
2. **Include practical examples** with code
3. **Document edge cases** and special handling
4. **Provide validation steps** to verify accuracy
5. **Cross-reference** other related documents

## 📖 Additional Documentation

- **Entity Mapping**: `/docs/entity-mapping.md` (catalog of all game entities)
- **Architecture**: `/docs/architecture.md` (game engine design)
- **Walkthroughs**: `/docs/walkthrough*.md` (full game transcripts)

## 💡 Key Insights

### From C Source Analysis

1. **Text is stored in 8-byte encrypted chunks** in dtextc.dat
2. **Messages use substitution markers** ('#') for dynamic text
3. **Rooms and objects store message indices**, not text directly
4. **Three-tier assembly**: Index → Offset → Chunks → Complete String

### From ZIL Source Analysis

1. **ZIL is human-readable** but differs slightly from C release
2. **Conversion is mostly automated** with existing tools
3. **100% of ZIL entities successfully converted**
4. **Some validation issues** required manual fixes

## 🎓 Learning Path

**For new contributors**:

1. Read **CONVERSION-GUIDE.md** (easiest, most practical)
2. Explore existing JSON files (`rooms.json`, `objects.json`)
3. Read **C-SOURCE-TEXT-ANALYSIS.md** (if interested in technical details)
4. Review **entity-mapping.md** (comprehensive catalog)
5. Study C source or ZIL source (for deep understanding)

**For implementing game features**:

1. Start with **entity-mapping.md** (what entities exist)
2. Check JSON files (current data structure)
3. Reference C source (for complex behavior logic)
4. Use walkthroughs (for testing/verification)

---

**Last Updated**: October 2025  
**Maintainers**: See repository contributors

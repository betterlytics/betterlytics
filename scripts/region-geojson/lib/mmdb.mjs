import fs from 'node:fs';

const METADATA_MARKER = Buffer.from([0xab, 0xcd, 0xef, ...Buffer.from('MaxMind.com')]);
const DATA_SECTION_SEPARATOR = 16;

export function openMmdb(file) {
  const buf = fs.readFileSync(file);

  function decode(base, offset) {
    const control = buf[offset++];
    let type = control >> 5;
    if (type === 1) {
      const sizeBits = (control >> 3) & 3;
      const low = control & 7;
      let pointer;
      if (sizeBits === 0) {
        pointer = (low << 8) | buf[offset];
        offset += 1;
      } else if (sizeBits === 1) {
        pointer = ((low << 16) | buf.readUInt16BE(offset)) + 2048;
        offset += 2;
      } else if (sizeBits === 2) {
        pointer = ((low << 24) | buf.readUIntBE(offset, 3)) + 526336;
        offset += 3;
      } else {
        pointer = buf.readUInt32BE(offset);
        offset += 4;
      }
      const [value] = decode(base, base + pointer);
      return [value, offset];
    }
    if (type === 0) type = 7 + buf[offset++];
    let size = control & 0x1f;
    if (size === 29) size = 29 + buf[offset++];
    else if (size === 30) {
      size = 285 + buf.readUInt16BE(offset);
      offset += 2;
    } else if (size === 31) {
      size = 65821 + buf.readUIntBE(offset, 3);
      offset += 3;
    }
    switch (type) {
      case 2:
        return [buf.toString('utf8', offset, offset + size), offset + size];
      case 3:
        return [buf.readDoubleBE(offset), offset + 8];
      case 4:
        return [buf.subarray(offset, offset + size), offset + size];
      case 5:
      case 6:
      case 8:
      case 9:
      case 10: {
        let value = 0;
        for (let i = 0; i < size; i++) value = value * 256 + buf[offset + i];
        return [value, offset + size];
      }
      case 7: {
        const map = {};
        for (let i = 0; i < size; i++) {
          let key, value;
          [key, offset] = decode(base, offset);
          [value, offset] = decode(base, offset);
          map[key] = value;
        }
        return [map, offset];
      }
      case 11: {
        const list = [];
        for (let i = 0; i < size; i++) {
          let value;
          [value, offset] = decode(base, offset);
          list.push(value);
        }
        return [list, offset];
      }
      case 14:
        return [size !== 0, offset];
      case 15:
        return [buf.readFloatBE(offset), offset + 4];
      default:
        throw new Error(`unsupported mmdb type ${type}`);
    }
  }

  const metadataStart = buf.lastIndexOf(METADATA_MARKER) + METADATA_MARKER.length;
  const [metadata] = decode(metadataStart, metadataStart);
  const { node_count: nodeCount, record_size: recordSize } = metadata;
  const nodeBytes = (recordSize * 2) / 8;
  const dataBase = nodeBytes * nodeCount + DATA_SECTION_SEPARATOR;

  function record(node, bit) {
    const offset = node * nodeBytes;
    if (recordSize === 24) return bit ? buf.readUIntBE(offset + 3, 3) : buf.readUIntBE(offset, 3);
    if (recordSize === 28) {
      return bit
        ? ((buf[offset + 3] & 0x0f) << 24) | buf.readUIntBE(offset + 4, 3)
        : ((buf[offset + 3] & 0xf0) << 20) | buf.readUIntBE(offset, 3);
    }
    return bit ? buf.readUInt32BE(offset + 4) : buf.readUInt32BE(offset);
  }

  function forEachRecord(visit) {
    const visited = new Uint8Array(nodeCount);
    const seenPointers = new Set();
    const stack = [0];
    while (stack.length > 0) {
      const node = stack.pop();
      if (visited[node]) continue;
      visited[node] = 1;
      for (const bit of [0, 1]) {
        const next = record(node, bit);
        if (next < nodeCount) {
          stack.push(next);
          continue;
        }
        if (next === nodeCount) continue;
        const pointer = next - nodeCount - DATA_SECTION_SEPARATOR;
        if (seenPointers.has(pointer)) continue;
        seenPointers.add(pointer);
        visit(decode(dataBase, dataBase + pointer)[0]);
      }
    }
    return seenPointers.size;
  }

  return { metadata, forEachRecord };
}

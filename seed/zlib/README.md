# zlib

The crc32 and adler32 checksums from the zlib C library. `vex.toml` names `z` under `[link]`, so
every program that uses this package links `libz` with no flags of its own.

```vx
import zlib::checksums;

fn main() -> i32 {
  print(crc32_of("123456789", 9u32));   // 3421780262
  return 0;
}
```

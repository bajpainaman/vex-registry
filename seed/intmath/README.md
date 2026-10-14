# intmath

Integer math for Vx: `gcd`, `lcm`, `ipow`, `isqrt` and `is_prime`.

```vx
import intmath::divisors;
import intmath::powers;

fn main() -> i32 {
  print(gcd(12i64, 18i64));   // 6
  print(ipow(2i64, 10i64));   // 1024
  return 0;
}
```

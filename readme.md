# Gen

This library provides a class `Gen<T>` that wraps an async generator and offers a LINQ-like interface for handling asynchronous data streams.

```ts
import { Gen } from "@jsoldi/gen";

const gen = Gen.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .flatMap(a => a % 2 === 0 ? [a, a] : [])
    .take(6);

for await (let item of gen)
    console.log(item); // 2, 2, 4, 4, 6, 6
```
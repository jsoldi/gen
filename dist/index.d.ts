declare type GenLike<T> = Gen<T> | T[] | AsyncGenerator<T, void, undefined> | (() => AsyncGenerator<T, void, undefined>);
declare type Awaitable<T> = Promise<T> | T;
export declare class Gen<T> implements AsyncIterable<T> {
    private readonly gen;
    constructor(gen: AsyncGenerator<T, void, undefined>);
    [Symbol.asyncIterator](): AsyncGenerator<T, void, undefined>;
    pipe<R>(map: (gen: AsyncGenerator<T, void, undefined>) => AsyncGenerator<R, void, undefined>): Gen<R>;
    take(count: number): Gen<Awaited<T>>;
    do(action: (item: T) => unknown): Gen<Awaited<T>>;
    toArray(): Promise<T[]>;
    map<R>(map: (item: T) => Awaitable<R>): Gen<Awaited<R>>;
    flatMap<R>(map: (item: T) => Awaitable<GenLike<R>>): Gen<R>;
    filter(pred: (item: T) => Awaitable<unknown>): Gen<Awaited<T>>;
    takeWhile(pred: (item: T) => Awaitable<unknown>): Gen<Awaited<T>>;
    skipWhile(pred: (item: T) => Awaitable<unknown>): Gen<Awaited<T>>;
    distinctBy(key: (item: T) => Awaitable<string>): Gen<Awaited<T>>;
    reduce<R>(reducer: (acc: R, item: T) => Awaitable<R>, initial: R): Promise<R>;
    reduce<R>(reducer: (acc: R | undefined, item: T) => Awaitable<R | undefined>): Promise<R | undefined>;
    static from<T>(genLike: GenLike<T>): Gen<T>;
    static recur<T>(func: (prev?: T) => Awaitable<T | undefined>): Gen<Awaited<T>>;
}
export {};

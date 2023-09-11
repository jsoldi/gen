declare type GenLike<T> = Gen<T> | T[] | AsyncGenerator<T, void, undefined> | (() => AsyncGenerator<T, void, undefined>);
declare type PromiseLike<T> = Promise<T> | T;
export declare class Gen<T> implements AsyncIterable<T> {
    private readonly gen;
    constructor(gen: AsyncGenerator<T, void, undefined>);
    [Symbol.asyncIterator](): AsyncGenerator<T, void, undefined>;
    pipe<R>(map: (gen: AsyncGenerator<T, void, undefined>) => AsyncGenerator<R, void, undefined>): Gen<R>;
    take(count: number): Gen<Awaited<T>>;
    toArray(): Promise<T[]>;
    map<R>(map: (item: T) => PromiseLike<R>): Gen<Awaited<R>>;
    flatMap<R>(map: (item: T) => PromiseLike<GenLike<R>>): Gen<R>;
    filter(pred: (item: T) => PromiseLike<unknown>): Gen<Awaited<T>>;
    takeWhile(pred: (item: T) => PromiseLike<unknown>): Gen<Awaited<T>>;
    skipWhile(pred: (item: T) => PromiseLike<unknown>): Gen<Awaited<T>>;
    distinctBy<K>(key: (item: T) => PromiseLike<K>): Gen<Awaited<T>>;
    static from<T>(genLike: GenLike<T>): Gen<T>;
    static recur<T>(func: (prev?: T) => PromiseLike<T | undefined>): Gen<Awaited<T>>;
}
export {};

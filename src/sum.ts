export function sum(a?: number, b?: number) : number {
    if (a && b){
        return a + b;
    }
    return 0;
}
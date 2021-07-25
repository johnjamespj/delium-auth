export function generateRandomString(length: number) : string {
    if (length < 0){
        throw new RangeError("ERROR: Length should be greater than 0");
    }

    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export function generateRandomEmail() : string {
    return generateRandomString(15) + "@" + generateRandomString(5) + "." + generateRandomString(3);
}

type ArrayCallBack<T> = (index: number) => T;  

export function createArrayFromFunc<T>(length: number, fn: ArrayCallBack<T>) : T[] {
    return new Array(length).fill(0).map<T>((x, i) => fn(i));
}

export function generateRandomNumberFromRange(start: number, end: number) : number{
    return 0;
}

export const emailRegex = /^\S+@\S+$/;
export const uuidRegex = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/;
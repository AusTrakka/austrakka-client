
export function getEnumByValue<T extends {[index:string]:string}>(myEnum:T, enumValue:string):keyof T|null {
    let keys = Object.keys(myEnum).filter(x => myEnum[x] == enumValue);
    const enumStr = keys.length > 0 ? keys[0] : null;
    if (!enumStr) {
      return null
    }
    const enumKey = myEnum[enumStr as keyof typeof myEnum];
    if (!enumKey) {
      return null
    }
    return enumKey
}

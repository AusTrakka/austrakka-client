export function isoDateLocalDate(datetime: any) {
    let isoDate = new Date(datetime.getValue())
    let localDate = isoDate.toLocaleDateString()
    return localDate
};
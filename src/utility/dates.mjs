export function convertDateStringToTimestamp(dateString) {
    const [month, day, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    return date.getTime();
}

export function convertTimestampToDateString(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}
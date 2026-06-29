function removeDuplicates1(arr) {
    return [...new Set(arr)];
}
const inputArr = [1, 2, 3, 6, 4, 3, 7, 4, 2, 6, 8, 2, 5, 9, 0, 1];
console.log(removeDuplicates1(inputArr));


function removeDuplicates2(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}
console.log(removeDuplicates2(inputArr));





function printPattern2(n) {
    for (let i = 1; i <= n; i++) {
        // Create an array of length i, fill it, map to descending numbers, and join
        let row = Array.from({ length: i }, (_, index) => i - index).join("");
        console.log(row);
    }
}
printPattern2(4);
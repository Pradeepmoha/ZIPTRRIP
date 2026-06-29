function printPattern1(n) {
    for (let i = 1; i <= n; i++) {
        let row = "";
        for (let j = i; j >= 1; j--) {
            row += j;
        }
        console.log(row);
    }
}
printPattern1(4);
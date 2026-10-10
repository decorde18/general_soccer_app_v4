const { parseGameDatesAndTimesUTC } = require("../src/lib/utils/dateTimeUtils");

console.log("Current output for 'Saturday, October 10, 2026' and '8:30 AM':");
console.log(parseGameDatesAndTimesUTC("Saturday, October 10, 2026", "8:30 AM"));

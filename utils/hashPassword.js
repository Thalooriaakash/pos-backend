const bcrypt = require("bcrypt");

(async () => {
    const hashedPassword = await bcrypt.hash("1234", 10);
    console.log(hashedPassword);
})();